import { ArrowLeft, ArrowRight, Settings, Menu, X, ChevronLeft, ChevronRight, List, AlertTriangle, Volume2, Loader2, Play, Pause, Crown, Lock, Unlock, MessageSquare, Send } from 'lucide-react';
import { useRef } from 'react';
import { Novel, Chapter, UserProfile, InlineComment } from '../types';
import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, auth, storage } from '../firebase';
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc, collection, query, orderBy, addDoc } from 'firebase/firestore';

interface ReaderViewProps {
  novel: Novel;
  chapter: Chapter;
  onBack: () => void;
  onChapterChange: (chapter: Chapter) => void;
  onLogin?: () => void;
}

export default function ReaderView({ novel, chapter, onBack, onChapterChange, onLogin }: ReaderViewProps) {
  const [fontSize, setFontSize] = useState(22);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // ZHIHU INLINE COMMENTS STATE
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
  const [selectedParagraph, setSelectedParagraph] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false);
  const [showCommentInputModal, setShowCommentInputModal] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0 });
  const [showSidebarThread, setShowSidebarThread] = useState<number | null>(null);

  // Load inline comments
  useEffect(() => {
    if (!novel.id || !chapter.id) return;
    const q = query(
      collection(db, `novels/${novel.id}/chapters/${chapter.id}/inline_comments`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, snap => {
      const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InlineComment[];
      setInlineComments(comments);
    });
    return () => unsubscribe();
  }, [novel.id, chapter.id]);

  const handleSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
         if (!showCommentInputModal) {
            setShowHighlightToolbar(false);
         }
         return;
      }
      const parentP = selection.anchorNode?.parentElement?.closest('[data-paragraph-index]');
      if (parentP) {
        const index = parseInt(parentP.getAttribute('data-paragraph-index') || '0', 10);
        const text = selection.toString().trim();
        if (text.length > 5) {
          setSelectedParagraph(index);
          setSelectedText(text);
          const range = selection.getRangeAt(0).getBoundingClientRect();
          setHighlightPosition({
            top: range.top + window.scrollY - 50,
            left: range.left + (range.width / 2)
          });
          setShowHighlightToolbar(true);
        }
      } else {
        setShowHighlightToolbar(false);
      }
    }, 10);
  };

  const handleInlineCommentSubmit = async () => {
    if (!auth.currentUser || !userProfile) {
      if (onLogin) onLogin();
      else alert('Vui lòng đăng nhập!');
      return;
    }
    if (!commentDraft.trim()) return;
    if (selectedParagraph === null) return;

    try {
      await addDoc(collection(db, `novels/${novel.id}/chapters/${chapter.id}/inline_comments`), {
        paragraphIndex: selectedParagraph,
        selectedText: selectedText,
        content: commentDraft,
        userId: auth.currentUser.uid,
        userName: userProfile.displayName,
        userAvatar: userProfile.photoURL,
        likes: 0,
        createdAt: serverTimestamp()
      });
      setCommentDraft('');
      setShowCommentInputModal(false);
      setShowHighlightToolbar(false);
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi đăng bình luận!');
    }
  };

  const groupedComments = inlineComments.reduce((acc, curr) => {
    if (!acc[curr.paragraphIndex]) acc[curr.paragraphIndex] = [];
    acc[curr.paragraphIndex].push(curr);
    return acc;
  }, {} as Record<number, InlineComment[]>);

  useEffect(() => {
    // Only listen to auth state to get userProfile
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      const unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfile);
      });
      return () => unsubscribeDoc();
    });
    return () => unsubscribeAuth();
  }, []);

  const handleUnlockChapter = async () => {
    if (!auth.currentUser || !userProfile) {
      if (onLogin) return onLogin();
      return alert('Vui lòng đăng nhập!');
    }
    const price = chapter.price || 50; // mặc định 50 Xu
    if ((userProfile.coins || 0) < price) {
      return alert('Bạn không đủ Xu. Vui lòng nạp thêm Xu để tiếp tục!');
    }
    
    setIsUnlocking(true);
    try {
      const { writeBatch, increment } = await import('firebase/firestore');
      const batch = writeBatch(db);

      // 1. Trừ tiền Độc giả & Cập nhật danh sách chương đã mở
      const buyerRef = doc(db, 'users', auth.currentUser.uid);
      batch.set(buyerRef, {
        coins: userProfile.coins - price,
        unlockedChapters: [...(userProfile.unlockedChapters || []), chapter.id]
      }, { merge: true });

      // 2. Chuyển 60% Xu cho Tác giả truyện (Nếu người mua ko phải chính tác giả)
      if (novel.authorId && novel.authorId !== auth.currentUser.uid) {
        const authorShare = Math.floor(price * 0.6); // Khúc này là 60%
        const platformFee = price - authorShare;

        const authorRef = doc(db, 'users', novel.authorId);
        batch.set(authorRef, {
          coins: increment(authorShare)
        }, { merge: true });

        // 3. Ghi vào Sổ Kế Toán (transactions log)
        const logRef = doc(collection(db, 'transactions'));
        batch.set(logRef, {
          type: 'UNLOCK_CHAPTER',
          chapterId: chapter.id,
          novelId: novel.id,
          buyerId: auth.currentUser.uid,
          authorId: novel.authorId,
          price: price,
          authorShare: authorShare,
          platformFee: platformFee,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
    } catch (e) {
      console.error(e);
      alert('Có lỗi khi mở khóa. Quý khách vui lòng thử lại.');
    }
    setIsUnlocking(false);
  };

  const isChapterLocked = chapter.isVip && (!userProfile || !(userProfile.unlockedChapters || []).includes(chapter.id));

  const [audioQueue, setAudioQueue] = useState<string[]>([]);

  useEffect(() => {
    // Cleanup any native speech just in case
    window.speechSynthesis.cancel();
    return () => {
      setIsPlaying(false);
      setAudioQueue([]);
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [chapter.id]);

  const toggleAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.paused && audioSrc) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Lần đầu nhấn Play: Phá vỡ text thành từng đoạn ngắn (Split by sentences or punctuation)
    setIsAudioLoading(true);
    const fullText = chapter.title + ". " + chapter.content;
    const sentences = fullText.match(/[^.!?\n]+[.!?\n]+/g) || [fullText];
    
    // Ghép các câu quá ngắn lại với nhau để API tối ưu hơn (khoảng 300-400 ký tự mỗi chunk)
    const chunks: string[] = [];
    let currentChunk = '';
    for (const s of sentences) {
      if ((currentChunk + s).length > 300) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = s;
      } else {
        currentChunk += ' ' + s;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    setAudioQueue(chunks);

    // Chạy Chunk đầu tiên
    await playNextChunk(chunks);
  };

  const playNextChunk = async (currentChunks: string[] = audioQueue) => {
    if (currentChunks.length === 0) {
      setIsPlaying(false);
      setIsAudioLoading(false);
      return;
    }

    const chunkToPlay = currentChunks[0];
    const remainingChunks = currentChunks.slice(1);
    setAudioQueue(remainingChunks);

    if (currentChunks === audioQueue) {
       setIsAudioLoading(true); // Chỉ show loading ở đoạn đầu hoặc khi mạng lag gắt
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunkToPlay })
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        
        if (audioSrc) URL.revokeObjectURL(audioSrc); // Dọn RAM chunk cũ
        setAudioSrc(url);
        
        setIsAudioLoading(false);
        setIsPlaying(true);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            // Assign handler for end
            audioRef.current.onended = () => {
               playNextChunk(remainingChunks);
            };
          }
        }, 50);
      } else {
        alert("Có lỗi kết nối máy chủ giọng đọc AI. Thử lại sau!");
        setIsAudioLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsAudioLoading(false);
    }
  };

  // Auto-hide controls on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsControlsVisible(false);
        setShowSettings(false);
      } else if (currentScrollY < lastScrollY) {
        setIsControlsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleControls = () => {
    setIsControlsVisible(!isControlsVisible);
  };

  // Save progress when chapter changes
  useEffect(() => {
    const saveProgress = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const chapters = novel.chapters || [];
      const currentIndex = chapters.findIndex(c => c.id === chapter.id);
      const totalChapters = novel.latestChapterNumber || chapters.length || 1;
      const progress = Math.floor(((currentIndex > -1 ? currentIndex + 1 : chapter.chapterNumber) / totalChapters) * 100);
      const path = `users/${user.uid}/bookshelf/${novel.id}`;

      try {
        await setDoc(doc(db, path), {
          novelId: novel.id,
          lastChapterId: chapter.id,
          lastChapterNumber: chapter.chapterNumber,
          progress: progress,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    };

    saveProgress();
  }, [chapter, novel, auth.currentUser]);

  const themes = {
    light: 'bg-[#FFFFFF] text-[#1A1A1A] border-accent/10',
    sepia: 'bg-[#F4ECD8] text-[#5B4636] border-[#DBCFB0]',
    dark: 'bg-[#121212] text-[#A0A0A0] border-[#2A2A2A]',
  };

  const fonts = {
    serif: 'font-serif',
    sans: 'font-sans',
  };

  const chapters = novel.chapters || [];
  const currentIndex = chapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div 
      className={`min-h-screen transition-colors duration-500 ${themes[theme]} ${fonts[fontFamily]}`}
      onClick={(e) => {
        // Only toggle if clicking on the main content area, not on buttons/panels
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.z-50')) return;
        toggleControls();
      }}
    >
      {/* Reader Header */}
      <header className={`fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 z-50 backdrop-blur-md bg-opacity-90 border-b ${themes[theme]} transition-transform duration-500 ${isControlsVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black truncate max-w-[180px] md:max-w-md uppercase tracking-tighter">{novel.title}</h2>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Chương {chapter.chapterNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <audio ref={audioRef} src={audioSrc || undefined} onEnded={() => setIsPlaying(false)} className="hidden" />
          <button 
            onClick={toggleAudio}
            className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2"
            title="Nghe truyện AI"
          >
            {isAudioLoading ? <Loader2 className="size-5 animate-spin" /> : isPlaying ? <Pause className="size-5 text-primary" /> : <Volume2 className="size-5" />}
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <Settings className="size-5" />
          </button>
          <button 
            onClick={() => setShowChapterList(!showChapterList)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <List className="size-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-20 right-6 w-80 bg-surface rounded-[32px] shadow-2xl p-8 z-50 border border-accent/10 text-text-main animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black uppercase tracking-widest text-sm">Cài đặt trình đọc</h3>
            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-background-light rounded-full transition-colors">
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-8">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Màu nền</label>
              <div className="flex gap-3">
                <button onClick={() => setTheme('light')} className={`flex-1 h-12 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary ring-4 ring-primary/10' : 'border-background-light'} bg-[#FFFFFF]`}></button>
                <button onClick={() => setTheme('sepia')} className={`flex-1 h-12 rounded-2xl border-2 transition-all ${theme === 'sepia' ? 'border-primary ring-4 ring-primary/10' : 'border-background-light'} bg-[#F4ECD8]`}></button>
                <button onClick={() => setTheme('dark')} className={`flex-1 h-12 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary ring-4 ring-primary/10' : 'border-background-light'} bg-[#121212]`}></button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Kiểu chữ</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFontFamily('serif')} 
                  className={`flex-1 py-3 rounded-2xl border-2 font-serif font-bold transition-all ${fontFamily === 'serif' ? 'border-primary bg-primary/5 text-primary' : 'border-background-light text-muted'}`}
                >
                  Serif
                </button>
                <button 
                  onClick={() => setFontFamily('sans')} 
                  className={`flex-1 py-3 rounded-2xl border-2 font-sans font-bold transition-all ${fontFamily === 'sans' ? 'border-primary bg-primary/5 text-primary' : 'border-background-light text-muted'}`}
                >
                  Sans
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Cỡ chữ</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setFontSize(Math.max(16, fontSize - 2))} className="flex-1 py-3 bg-background-light rounded-2xl font-black hover:bg-primary hover:text-white transition-all">A-</button>
                <span className="font-black w-10 text-center text-lg">{fontSize}</span>
                <button onClick={() => setFontSize(Math.min(40, fontSize + 2))} className="flex-1 py-3 bg-background-light rounded-2xl font-black hover:bg-primary hover:text-white transition-all">A+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List Sidebar/Overlay */}
      {showChapterList && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChapterList(false)}></div>
          <div className="relative w-full max-w-sm bg-surface h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black uppercase tracking-widest text-sm text-text-main">Danh sách chương</h3>
              <button onClick={() => setShowChapterList(false)} className="p-2 hover:bg-background-light rounded-full transition-colors text-text-main">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {novel.chapters.map((c) => (
                <button 
                  key={c.id}
                  onClick={() => {
                    onChapterChange(c);
                    setShowChapterList(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${c.id === chapter.id ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-text-main hover:bg-background-light'}`}
                >
                  <span className="text-xs opacity-60 block mb-1">Chương {c.chapterNumber}</span>
                  <span className="line-clamp-1">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reader Footer Bar (Fixed) */}
      <footer className={`fixed bottom-0 inset-x-0 h-16 flex items-center justify-between px-6 z-50 backdrop-blur-md bg-opacity-90 border-t ${themes[theme]} transition-transform duration-500 ${isControlsVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <button 
          disabled={!prevChapter}
          onClick={() => prevChapter && onChapterChange(prevChapter)}
          className={`flex items-center gap-2 p-2 rounded-xl transition-all ${!prevChapter ? 'opacity-20' : 'hover:bg-black/5'}`}
        >
          <ChevronLeft className="size-5" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Chương trước</span>
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowChapterList(true)}
            className="p-3 rounded-full hover:bg-black/5 transition-all"
          >
            <List className="size-5" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full hover:bg-black/5 transition-all"
          >
            <Settings className="size-5" />
          </button>
          <button 
            onClick={() => setShowReportModal(true)}
            className="p-3 rounded-full hover:bg-black/5 text-red-500/70 hover:text-red-500 transition-all"
            title="Báo lỗi chương"
          >
            <AlertTriangle className="size-5" />
          </button>
        </div>

        <button 
          disabled={!nextChapter}
          onClick={() => nextChapter && onChapterChange(nextChapter)}
          className={`flex items-center gap-2 p-2 rounded-xl transition-all ${!nextChapter ? 'opacity-20' : 'hover:bg-black/5'}`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Chương sau</span>
          <ChevronRight className="size-5" />
        </button>
      </footer>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}></div>
          <div className="relative w-full max-w-md bg-surface rounded-[32px] shadow-2xl border border-accent/10 p-8 animate-in zoom-in-95 duration-300 text-text-main">
            <h3 className="font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Báo lỗi chương
            </h3>
            <p className="text-sm text-muted mb-6">Bạn đang báo lỗi cho <strong>Chương {chapter.chapterNumber}</strong> của bộ truyện <strong>{novel.title}</strong>.</p>
            
            <div className="space-y-4 mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted block">Loại lỗi</label>
              <select className="w-full h-12 px-4 bg-background-light rounded-xl border-none outline-none font-bold text-sm text-text-main">
                <option>Lỗi nội dung (sai chữ, thiếu đoạn)</option>
                <option>Lỗi ảnh/định dạng</option>
                <option>Chương trùng lặp</option>
                <option>Lỗi khác</option>
              </select>
              <textarea 
                placeholder="Mô tả chi tiết lỗi (không bắt buộc)..."
                className="w-full h-32 p-4 bg-background-light rounded-xl border-none outline-none font-medium text-sm text-text-main resize-none"
              ></textarea>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 rounded-full border-2 border-accent/10 font-black text-[10px] uppercase tracking-widest text-muted hover:bg-background-light transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  alert('Cảm ơn bạn đã báo lỗi! Chúng mình sẽ kiểm tra sớm nhất có thể.');
                  setShowReportModal(false);
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:opacity-90 transition-all"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <main 
         className="max-w-3xl mx-auto px-4 sm:px-8 pt-24 md:pt-32 pb-48"
         onCopy={(e) => { e.preventDefault(); alert('Cảnh báo: Nội dung này đã được đăng ký bảo hộ bản quyền số DMCA. Nghiêm cấm sao chép dưới mọi hình thức!'); }}
         onContextMenu={(e) => e.preventDefault()}
      >
        <div className="mb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <span>Chương {chapter.chapterNumber}</span>
            {chapter.isVip ? <Crown className="size-3" /> : null}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tighter">
            {chapter.title}
          </h1>
          <div className="w-20 h-1 bg-primary/20 mx-auto rounded-full"></div>
        </div>

        {isChapterLocked ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface border-2 border-yellow-500/20 rounded-[40px] shadow-2xl max-w-lg mx-auto text-center">
            <Lock className="size-16 text-yellow-500 mb-6" />
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-text-main">Chương VIP</h3>
            <p className="text-muted font-medium mb-8">
              Chương này thuộc quyền sở hữu đặc biệt. Bạn cần thanh toán <span className="text-primary font-black text-lg">{chapter.price || 50} Xu</span> để mở khóa.
            </p>
            <button 
              onClick={handleUnlockChapter}
              disabled={isUnlocking}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {isUnlocking ? <Loader2 className="size-5 animate-spin" /> : <Unlock className="size-5" />}
              <span>{isUnlocking ? 'Đang giao dịch...' : 'Mở khóa ngay'}</span>
            </button>
            <p className="text-[10px] text-muted mt-6 font-bold uppercase tracking-widest opacity-50">Secure by PayOS</p>
          </div>
        ) : (
          <div 
            className="leading-[1.8] space-y-10 text-justify relative"
            style={{ fontSize: `${fontSize}px` }}
            onMouseUp={handleSelection}
            onTouchEnd={handleSelection}
          >
            {chapter.content.split('\n\n').map((para, i) => {
              const paragraphComments = groupedComments[i] || [];
              return (
                <div key={i} className="relative group">
                  <p 
                    data-paragraph-index={i}
                    className="first-letter:pl-8 selection:bg-primary/30"
                  >
                    {para}
                  </p>
                  
                  {/* Inline Comment Badge */}
                  {paragraphComments.length > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSidebarThread(i); }}
                      className="absolute top-1 -right-16 md:-right-20 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full font-bold text-xs transition-colors cursor-pointer group/badge opacity-60 hover:opacity-100"
                    >
                      <MessageSquare className="size-3.5 fill-current" />
                      <span>{paragraphComments.length}</span>
                    </button>
                  )}
                  {/* Plus button to add comment if none exists */}
                  {paragraphComments.length === 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSidebarThread(i); }}
                      className="absolute top-1 -right-16 md:-right-20 p-2 text-muted opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-primary transition-all md:flex hidden"
                    >
                      <MessageSquare className="size-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-32 pt-16 border-t border-accent/10 flex flex-col md:flex-row items-center justify-between gap-10">
          <button 
            disabled={!prevChapter}
            onClick={() => prevChapter && onChapterChange(prevChapter)}
            className={`flex items-center gap-4 px-10 py-4 rounded-full border-2 transition-all group ${!prevChapter ? 'opacity-30 cursor-not-allowed' : 'border-accent/10 hover:border-primary hover:text-primary'}`}
          >
            <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-black uppercase tracking-widest text-xs">Chương trước</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowChapterList(true)}
              className="p-4 rounded-full bg-background-light hover:bg-primary hover:text-white transition-all"
            >
              <List className="size-6" />
            </button>
          </div>

          <button 
            disabled={!nextChapter}
            onClick={() => nextChapter && onChapterChange(nextChapter)}
            className={`flex items-center gap-4 px-12 py-5 rounded-full bg-primary text-white font-black tracking-widest uppercase text-xs shadow-2xl shadow-primary/30 hover:opacity-90 transition-all group ${!nextChapter ? 'opacity-30 cursor-not-allowed' : 'transform hover:-translate-y-1'}`}
          >
            <span>Chương sau</span>
            <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* HIGHLIGHT TOOLBAR */}
        {showHighlightToolbar && !showCommentInputModal && (
          <div 
            className="absolute z-50 flex gap-2 p-2 bg-text-main text-background-light rounded-xl shadow-2xl animate-in zoom-in duration-200"
            style={{ top: highlightPosition.top, left: highlightPosition.left, transform: 'translateX(-50%)' }}
            onClick={(e) => {
              e.stopPropagation();
              setShowCommentInputModal(true);
            }}
          >
            <button className="flex items-center gap-2 px-3 py-1 font-bold text-xs hover:bg-white/20 rounded-md transition-colors">
              <MessageSquare className="size-4" />
              Bình luận đoạn này
            </button>
            {/* Tam giác lộn ngược */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-solid border-t-text-main border-t-8 border-x-transparent border-x-8 border-b-0"></div>
          </div>
        )}

        {/* INLINE COMMENT INPUT MODAL */}
        {showCommentInputModal && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
            onClick={() => {
              setShowCommentInputModal(false);
              setShowHighlightToolbar(false);
              if (window.getSelection) window.getSelection()?.removeAllRanges();
            }}
          >
            <div 
              className="w-full max-w-lg bg-surface rounded-[24px] shadow-2xl p-6 border border-accent/10 animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-text-main">Viết bình luận dòng</h3>
                <button onClick={() => { setShowCommentInputModal(false); setShowHighlightToolbar(false); }} className="text-muted hover:text-text-main"><X className="size-5" /></button>
              </div>
              
              <div className="p-4 mb-4 bg-primary/5 border border-primary/20 rounded-xl relative">
                <span className="absolute -top-3 -left-2 text-4xl text-primary/30 font-serif">“</span>
                <p className="text-sm font-medium italic text-text-main/80 line-clamp-3">...{selectedText}...</p>
              </div>

              <textarea 
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Nêu cảm nghĩ của bạn về câu văn này..."
                className="w-full h-24 p-4 bg-background-light rounded-xl border-none outline-none font-medium text-sm text-text-main resize-none mb-4"
                autoFocus
              ></textarea>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { setShowCommentInputModal(false); setShowHighlightToolbar(false); }}
                  className="px-6 py-2 rounded-full font-bold text-xs text-muted hover:bg-background-light transition-colors uppercase tracking-widest"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleInlineCommentSubmit}
                  disabled={!commentDraft.trim()}
                  className="px-6 py-2 bg-primary text-white rounded-full font-bold text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  <Send className="size-4" />
                  Đăng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR COMMENT THREAD */}
        {showSidebarThread !== null && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={() => setShowSidebarThread(null)}></div>
            <div className="relative w-full max-w-sm bg-surface h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300 border-l border-accent/10">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-accent/10">
                <h3 className="font-black text-sm uppercase tracking-widest text-text-main flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  Bình luận đoạn văn
                </h3>
                <button onClick={() => setShowSidebarThread(null)} className="text-muted hover:text-text-main"><X className="size-5" /></button>
              </div>

              <div className="p-4 mb-4 bg-background-light rounded-xl text-xs font-medium italic text-text-main/70 line-clamp-4 leading-relaxed border-l-4 border-primary">
                {chapter.content.split('\n\n')[showSidebarThread]}
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 shrink-0 custom-scrollbar pr-2 mb-4">
                {(groupedComments[showSidebarThread] || []).length === 0 ? (
                  <div className="text-center text-muted text-sm py-10">Chưa có bình luận nào cho đoạn này. Bôi đen chữ để khơi mào nhé!</div>
                ) : (
                  (groupedComments[showSidebarThread] || []).map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <img src={comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} alt={comment.userName} className="size-8 rounded-full bg-background-light object-cover shrink-0" />
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-sm text-text-main">{comment.userName}</span>
                          <span className="text-[10px] text-muted">{new Date(comment.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        </div>
                        {comment.selectedText && (
                          <span className="text-xs italic text-primary mt-1 select-none">"{comment.selectedText}"</span>
                        )}
                        <p className="text-sm mt-1 text-text-main/90 leading-relaxed font-medium">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Input in Sidebar */}
              <div className="mt-auto border-t border-accent/10 pt-4">
                <div className="flex bg-background-light rounded-full p-1 border border-accent/10 group focus-within:border-primary/50 transition-colors">
                  <input 
                    type="text" 
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium text-text-main disabled:opacity-50"
                    disabled={!userProfile}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSelectedParagraph(showSidebarThread);
                        setSelectedText('');
                        handleInlineCommentSubmit();
                      }
                    }}
                  />
                  {!userProfile ? (
                    <button onClick={onLogin} className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase whitespace-nowrap">Đăng nhập</button>
                  ) : (
                    <button 
                      onClick={() => {
                        setSelectedParagraph(showSidebarThread);
                        setSelectedText('');
                        handleInlineCommentSubmit();
                      }}
                      disabled={!commentDraft.trim()} 
                      className="size-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50"
                    >
                      <Send className="size-4 -ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
