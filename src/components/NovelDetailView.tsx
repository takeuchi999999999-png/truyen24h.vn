import { Star, BookmarkPlus, Users, Eye, BookOpen, ChevronRight, Share2, MessageSquare, Clock, Flame, Sparkles, Check, BrainCircuit, Heart, Search, ArrowUpDown, ArrowUp, ArrowDown, List } from 'lucide-react';
import { Novel, Chapter } from '../types';
import { useState, useMemo, useEffect } from 'react';
import CommentSection from './CommentSection';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp, getDoc, updateDoc, increment } from 'firebase/firestore';
import { getAIRecommendations, getNovelSummary } from '../services/geminiService';

// ─── Chapter List Panel (scrollable, fixed-height) ─────────────────────────
function ChapterListPanel({ allChapters, onChapterSelect }: { allChapters: Chapter[]; onChapterSelect: (c: Chapter) => void }) {
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let list = allChapters.filter(c =>
      `${c.chapterNumber} ${c.title}`.toLowerCase().includes(search.toLowerCase())
    );
    return sortAsc ? list : [...list].reverse();
  }, [allChapters, search, sortAsc]);

  return (
    <div className="mb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <List className="size-6" />
          </div>
          <h3 className="font-display text-3xl font-black text-text-main uppercase tracking-tighter">
            Danh sách chương
            <span className="ml-3 text-base font-bold text-muted normal-case tracking-normal">({allChapters.length} chương)</span>
          </h3>
        </div>
        {/* Sort toggle */}
        <button
          onClick={() => setSortAsc(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-accent/10 text-xs font-black uppercase tracking-widest text-muted hover:text-primary hover:border-primary/40 transition-all shadow-sm"
        >
          {sortAsc ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {sortAsc ? 'Cũ trước' : 'Mới trước'}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted" />
        <input
          type="text"
          placeholder="Tìm chương... (VD: 701, Hồi Sinh...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-surface border border-accent/10 rounded-2xl text-sm text-text-main placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text-main transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Scrollable chapter list - fixed height */}
      <div
        className="h-[600px] overflow-y-auto rounded-[28px] border border-accent/5 bg-surface shadow-2xl"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(var(--primary-rgb, 200,80,80),0.3) transparent' }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
            <Search className="size-10 opacity-30" />
            <p className="font-bold text-sm">Không tìm thấy chương nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {filtered.map((chapter, idx) => (
              <div
                key={chapter.id}
                onClick={() => onChapterSelect(chapter)}
                className="flex items-center justify-between px-6 py-4 hover:bg-primary/5 cursor-pointer transition-all border-b border-accent/5 last:border-b-0 group"
              >
                <div className="flex flex-col min-w-0 flex-1 mr-3">
                  <span className="font-bold text-sm text-text-main group-hover:text-primary transition-colors truncate">
                    Chương {chapter.chapterNumber}: {chapter.title}
                  </span>
                  <span className="text-[11px] text-muted mt-1 flex items-center gap-1.5">
                    <Clock className="size-3 shrink-0" />
                    {chapter.publishDate}
                  </span>
                </div>
                <div className="p-2 bg-background-light rounded-full group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                  <ChevronRight className="size-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface NovelDetailViewProps {
  novel: Novel;
  onChapterSelect: (chapter: Chapter) => void;
  onNovelSelect: (novel: Novel) => void;
  user: User | null;
  onLogin: () => void;
}

export default function NovelDetailView({ novel, onChapterSelect, onNovelSelect, user, onLogin }: NovelDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'chapters' | 'comments'>('info');
  const [isShared, setIsShared] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<Novel[]>([]);
  const [loadingAI, setLoadingAI] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [dynamicChapters, setDynamicChapters] = useState<Chapter[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [donateAmount, setDonateAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [allNovelsData, setAllNovelsData] = useState<Novel[]>([]);

  useEffect(() => {
    const qNovels = query(collection(db, 'novels'));
    const unsubscribe = onSnapshot(qNovels, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel));
      setAllNovelsData(fetched);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = `novels/${novel.id}/chapters`;
    const q = query(collection(db, path), orderBy('chapterNumber', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChapters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];
      setDynamicChapters(fetchedChapters);
    }, (error) => {
      console.log('No dynamic chapters found or error:', error.message);
    });

    return () => unsubscribe();
  }, [novel.id]);

  const allChapters = useMemo(() => {
    const combined = [...(novel.chapters || []), ...dynamicChapters];
    return combined.sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [novel.chapters, dynamicChapters]);

  useEffect(() => {
    if (allNovelsData.length === 0) return;
    const fetchAI = async () => {
      setLoadingAI(true);
      const recs = await getAIRecommendations(novel, allNovelsData);
      setAiRecommendations(recs);
      setLoadingAI(false);
    };
    fetchAI();
  }, [novel, allNovelsData]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.email === 'phamanhtung.jp@gmail.com' || data.email === 'truyen24hvnn@gmail.com') {
           data.coins = 99999999;
        }
        setUserProfile(data);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleDonate = async (amount: number) => {
    if (!user || !userProfile) {
      onLogin();
      return;
    }
    if (userProfile.coins < amount) {
      alert("Số dư Xu không đủ. Vui lòng nạp thêm Xu!");
      return;
    }
    
    setIsProcessing(true);
    try {
      if (!novel.authorId) {
        alert("Không tìm thấy thông tin tác giả.");
        return;
      }
      
      // Deduct from reader and increment contributionScore
      await updateDoc(doc(db, 'users', user.uid), { 
        coins: increment(-amount),
        contributionScore: increment(amount) 
      });
      
      // Add to author
      await updateDoc(doc(db, 'users', novel.authorId), { coins: increment(amount) });
      
      alert(`Gửi tặng tác giả ${amount.toLocaleString()} Xu thành công! Đại gia thật hào phóng!`);
      setShowDonateModal(false);
    } catch(e) {
      console.error(e);
      alert("Lỗi giao dịch.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchSummary = async () => {
    if (summary) return;
    setLoadingSummary(true);
    const s = await getNovelSummary(novel);
    setSummary(s);
    setLoadingSummary(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };



  const similarNovels = useMemo(() => {
    return allNovelsData.filter(n => 
      n.id !== novel.id && (
        n.author === novel.author || 
        (n.genres && n.genres.some(g => novel.genres.includes(g)))
      )
    ).slice(0, 5);
  }, [allNovelsData, novel]);

  const getCoverUrl = (url: string | undefined, id: string) => {
    return url || `https://picsum.photos/seed/novel-${id}/400/600`;
  };

  const coverUrl = getCoverUrl(novel.coverUrl, novel.id);
  const bannerUrl = novel.bannerUrl || coverUrl;

  return (
    <div className="w-full bg-background-light min-h-screen">
      <div className="relative w-full h-[580px] overflow-hidden bg-background-dark">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110" 
          style={{ backgroundImage: `url('${bannerUrl}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background-light via-background-light/40 to-transparent"></div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 h-full flex items-end pb-12 md:pb-20">
          <div className="w-[320px] shrink-0 mr-16 hidden lg:block"></div>
          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 md:mb-8 mt-20 md:mt-0">
              <span className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl ${novel.status === 'Hoàn thành' ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                {novel.status}
              </span>
              {novel.isHot && (
                <span className="flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/30">
                  <Flame className="size-3 fill-white" />
                  Hot
                </span>
              )}
              {novel.genres.map(genre => (
                <span key={genre} className="px-4 py-1.5 md:px-5 md:py-2 bg-surface/90 backdrop-blur-md border border-black/5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-text-main/70 shadow-sm">{genre}</span>
              ))}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black leading-tight md:leading-none mb-6 md:mb-8 text-text-main tracking-tighter drop-shadow-2xl break-words whitespace-normal">{novel.title}</h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-10 text-text-main/60 mb-8 md:mb-12">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl hidden sm:block">
                  <Users className="size-5 text-primary" />
                </div>
                <span className="font-bold text-xs md:text-sm">Tác giả: <span className="text-text-main ml-1">{novel.author}</span></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl hidden sm:block">
                  <Users className="size-5 text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs md:text-sm">Nhóm dịch: <span className="text-text-main ml-1">{novel.translationGroup}</span></span>
                  <button 
                    onClick={() => alert(`Đã theo dõi nhóm ${novel.translationGroup}!`)}
                    className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest text-left hover:underline"
                  >
                    + Theo dõi nhóm
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setShowDonateModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-pink-500/10 text-pink-500 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all transform hover:scale-105"
              >
                <Heart className="size-3 md:size-4" />
                Nạp Vàng Cứu Trợ
              </button>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 md:gap-6">
              <button 
                onClick={() => allChapters[0] && onChapterSelect(allChapters[0])}
                className="flex items-center justify-center h-12 px-6 md:h-16 md:px-12 bg-primary text-white rounded-full font-black text-xs md:text-sm tracking-widest uppercase hover:opacity-90 transition-all shadow-2xl shadow-primary/30 transform hover:-translate-y-1 w-full sm:w-auto"
              >
                Bắt đầu đọc
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <button 
                  onClick={async () => {
                    if (!user) {
                      onLogin();
                      return;
                    }
                    const path = `users/${user.uid}/bookshelf/${novel.id}`;
                    try {
                      await setDoc(doc(db, path), {
                        novelId: novel.id,
                        isFollowing: true,
                        updatedAt: serverTimestamp()
                      }, { merge: true });
                      alert('Đã thêm vào tủ sách!');
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, path);
                    }
                  }}
                  className="flex items-center justify-center h-12 px-6 md:h-16 md:px-12 bg-surface border-2 border-accent/10 text-text-main rounded-full font-black text-xs md:text-sm tracking-widest uppercase hover:border-primary/40 transition-all gap-2 md:gap-3 shadow-xl flex-1"
                >
                  <BookmarkPlus className="size-4 md:size-6" />
                  <span className="hidden sm:inline">Thêm vào tủ sách</span>
                  <span className="sm:hidden">Lưu</span>
                </button>
                <button 
                  onClick={handleShare}
                  className={`flex-none h-12 w-12 md:h-[64px] md:w-[64px] flex items-center justify-center bg-surface rounded-full border-2 transition-all shadow-xl ${isShared ? 'border-green-500 text-green-500' : 'border-accent/10 text-muted hover:text-primary hover:border-primary/40'}`}
                >
                  {isShared ? <Check className="size-4 md:size-6" /> : <Share2 className="size-4 md:size-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative pb-32">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">
          <div className="w-full lg:w-[320px] shrink-0 relative -mt-32 lg:-mt-[320px] z-20 hidden lg:block">
            <div className="relative group">
              <img 
                src={coverUrl} 
                alt={novel.title} 
                referrerPolicy="no-referrer"
                className="w-full h-[480px] object-cover rounded-[40px] shadow-2xl ring-8 ring-white/50 backdrop-blur-sm transition-transform duration-500 group-hover:scale-[1.02]" 
              />
              {novel.isFull && (
                <div className="absolute top-6 right-6 bg-green-500 text-white px-5 py-1.5 rounded-full text-xs font-black uppercase shadow-2xl tracking-widest">Full</div>
              )}
            </div>
            <div className="mt-12 flex flex-col gap-8 bg-surface p-10 rounded-[40px] border border-accent/10 shadow-2xl">
              <div className="flex justify-between items-center border-b border-accent/5 pb-6">
                <div className="flex items-center gap-4">
                  <BookOpen className="size-6 text-muted" />
                  <span className="text-muted text-sm font-bold uppercase tracking-widest">Số chương</span>
                </div>
                <span className="font-black text-text-main font-display text-2xl">{allChapters.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-accent/5 pb-6">
                <div className="flex items-center gap-4">
                  <Eye className="size-6 text-muted" />
                  <span className="text-muted text-sm font-bold uppercase tracking-widest">Lượt xem</span>
                </div>
                <span className="font-black text-text-main font-display text-2xl">{novel.views}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Star className="size-6 text-muted" />
                  <span className="text-muted text-sm font-bold uppercase tracking-widest">Đánh giá</span>
                </div>
                <span className="font-black text-text-main font-display text-2xl flex items-center gap-2">
                  {novel.rating} <Star className="size-5 text-primary fill-primary" />
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 pt-6 lg:pt-16">
            <div className="flex gap-5 md:gap-16 border-b border-accent/10 mb-10 md:mb-16 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('info')}
                className={`pb-4 md:pb-8 font-display font-black text-lg md:text-3xl transition-all relative shrink-0 -mb-[4px] uppercase tracking-tighter ${activeTab === 'info' ? 'text-text-main border-b-4 border-primary' : 'text-muted hover:text-text-main'}`}
              >
                Giới thiệu
              </button>
              <button 
                onClick={() => setActiveTab('chapters')}
                className={`pb-4 md:pb-8 font-display font-black text-lg md:text-3xl transition-all relative shrink-0 -mb-[4px] uppercase tracking-tighter ${activeTab === 'chapters' ? 'text-text-main border-b-4 border-primary' : 'text-muted hover:text-text-main'}`}
              >
                Danh sách chương
              </button>
              <button 
                onClick={() => setActiveTab('comments')}
                className={`pb-4 md:pb-8 font-display font-black text-lg md:text-3xl transition-all relative shrink-0 -mb-[4px] uppercase tracking-tighter flex items-center gap-3 ${activeTab === 'comments' ? 'text-text-main border-b-4 border-primary' : 'text-muted hover:text-text-main'}`}
              >
                Bình luận
              </button>
            </div>
            
            {activeTab === 'info' && (
              <>
                <div className="bg-surface p-12 rounded-[40px] border border-accent/5 shadow-2xl mb-12">
                  <div className="prose prose-2xl dark:prose-invert max-w-none text-text-main/80 font-medium leading-relaxed">
                    <p className="first-letter:text-7xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left">{novel.description}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-[40px] p-12 border border-primary/10 mb-20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <BrainCircuit className="size-32 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                          <BrainCircuit className="size-6" />
                        </div>
                        <h4 className="font-display text-3xl font-black text-text-main uppercase tracking-tighter">AI Tóm tắt nhanh</h4>
                      </div>
                      {!summary && !loadingSummary && (
                        <button 
                          onClick={fetchSummary}
                          className="px-6 py-3 bg-white border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          Phân tích cốt truyện
                        </button>
                      )}
                    </div>
                    
                    {loadingSummary ? (
                      <div className="flex items-center gap-4 text-muted py-4">
                        <div className="flex gap-1">
                          <div className="size-2.5 bg-primary rounded-full animate-bounce"></div>
                          <div className="size-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="size-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest ml-2">Gemini đang đọc và tóm tắt...</span>
                      </div>
                    ) : summary ? (
                      <div className="relative">
                        <span className="absolute -top-4 -left-4 text-6xl text-primary/20 font-serif">“</span>
                        <p className="text-2xl text-text-main font-medium italic leading-relaxed pl-4">
                          {summary}
                        </p>
                        <span className="absolute -bottom-12 -right-4 text-6xl text-primary/20 font-serif">”</span>
                      </div>
                    ) : (
                      <p className="text-muted text-lg font-medium">Bạn quá bận rộn? Hãy để AI giúp bạn tóm tắt những ý chính nhất của bộ truyện này chỉ trong vài giây.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'chapters' && (
              <ChapterListPanel
                allChapters={allChapters}
                onChapterSelect={onChapterSelect}
              />
            )}

            {activeTab === 'comments' && (
              <CommentSection novelId={novel.id} user={user} onLogin={onLogin} />
            )}

            <div className="mt-32 pt-20 border-t border-accent/10">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <BrainCircuit className="size-7" />
                  </div>
                  <h3 className="font-display text-4xl font-black text-text-main uppercase tracking-tighter">AI Gợi ý cho bạn</h3>
                </div>
                {loadingAI && <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>}
              </div>
              
              <div className="flex gap-8 overflow-x-auto pb-8 -mx-4 px-4 hide-scrollbar snap-x">
                {(loadingAI ? [1, 2, 3, 4, 5] : aiRecommendations).map((sn, idx) => {
                  if (typeof sn === 'number') {
                    return <div key={idx} className="w-[180px] shrink-0 aspect-[3/4.5] bg-background-light animate-pulse rounded-[24px]"></div>;
                  }
                  return (
                    <div 
                      key={sn.id}
                      onClick={() => onNovelSelect(sn)}
                      className="w-[180px] shrink-0 flex flex-col gap-4 group cursor-pointer animate-in fade-in duration-500 snap-start"
                    >
                      <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                        <img 
                          src={getCoverUrl(sn.coverUrl, sn.id)} 
                          alt={sn.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                           <div className="flex items-center gap-2 text-white text-[10px] font-bold">
                              <Star className="size-3 fill-yellow-400 text-yellow-400" />
                              <span>{sn.rating}</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col px-1">
                        <h4 className="font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors leading-tight text-sm mb-1">{sn.title}</h4>
                        <p className="text-[10px] text-muted font-medium truncate uppercase tracking-widest">{sn.author}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {similarNovels.length > 0 && (
              <div className="mt-20 pt-20 border-t border-accent/10">
                <div className="flex items-center gap-4 mb-12">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Sparkles className="size-7" />
                  </div>
                  <h3 className="font-display text-4xl font-black text-text-main uppercase tracking-tighter">Truyện tương tự</h3>
                </div>
                <div className="flex gap-8 overflow-x-auto pb-8 -mx-4 px-4 hide-scrollbar snap-x">
                  {similarNovels.map((sn) => (
                    <div 
                      key={sn.id}
                      onClick={() => onNovelSelect(sn)}
                      className="w-[180px] shrink-0 flex flex-col gap-4 group cursor-pointer snap-start"
                    >
                      <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                        <img 
                          src={getCoverUrl(sn.coverUrl, sn.id)} 
                          alt={sn.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                           <div className="flex items-center gap-2 text-white text-[10px] font-bold">
                              <Star className="size-3 fill-yellow-400 text-yellow-400" />
                              <span>{sn.rating}</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col px-1">
                        <h4 className="font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors leading-tight text-sm mb-1">{sn.title}</h4>
                        <p className="text-[10px] text-muted font-medium truncate uppercase tracking-widest">{sn.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDonateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isProcessing && setShowDonateModal(false)}></div>
          <div className="relative w-full max-w-sm bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 animate-in zoom-in-95 duration-300">
            <button onClick={() => !isProcessing && setShowDonateModal(false)} className="absolute top-6 right-6 p-2 bg-background-light rounded-full text-muted hover:text-text-main transition-colors">
              <ChevronRight className="size-6 rotate-180" />
            </button>
            <div className="size-16 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Heart className="size-8" />
            </div>
            <h2 className="text-2xl text-center font-black text-text-main mb-2 uppercase tracking-tighter">Đại Gia Tặng Quà</h2>
            <p className="text-muted text-center text-sm mb-6">Tặng Xu cho tác giả để thăng hạng Đóng Góp trên bảng xếp hạng.</p>
            
            <div className="bg-background-light rounded-2xl p-4 mb-6 text-center">
               <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Số dư Xu của bạn</p>
               <p className="text-2xl font-black text-primary">{(userProfile?.coins || 0).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
               {[100, 500, 1000, 5000].map(amt => (
                 <button 
                   key={amt}
                   onClick={() => setDonateAmount(amt)}
                   className={`p-3 rounded-xl font-black text-xs transition-all ${donateAmount === amt ? 'bg-primary text-white shadow-lg' : 'bg-surface border border-accent/10 text-text-main hover:border-primary/50'}`}
                 >
                   {amt.toLocaleString()} XU
                 </button>
               ))}
            </div>
            
            <button 
               onClick={() => handleDonate(donateAmount)}
               disabled={isProcessing}
               className="w-full py-4 bg-gradient-to-r from-pink-500 to-primary text-white rounded-full font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
            >
               {isProcessing ? 'Đang tiến hành...' : `Tặng ${donateAmount.toLocaleString()} Xu ngay`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
