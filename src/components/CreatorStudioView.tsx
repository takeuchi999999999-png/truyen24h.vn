import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookPlus, FileText, Settings, Plus, ChevronRight, Edit3, Trash2, Eye, MessageSquare, Save, X, Image as ImageIcon, Loader2, Wallet, ArrowRightLeft, Zap, Bot } from 'lucide-react';
import { User } from 'firebase/auth';
import { Novel, Chapter, UserProfile } from '../types';
import WithdrawModal from './WithdrawModal';
import AutoBotImport from './AutoBotImport';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, getDoc, writeBatch, increment } from 'firebase/firestore';
import { GENRES } from '../constants';

interface CreatorStudioViewProps {
  user: User | null;
  onLogin: () => void;
}

export default function CreatorStudioView({ user, onLogin }: CreatorStudioViewProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showAutoBot, setShowAutoBot] = useState(false);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [selectedNovelForChapters, setSelectedNovelForChapters] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // Form states for Novel
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [status, setStatus] = useState<'Đang ra' | 'Hoàn thành'>('Đang ra');
  const [translationGroup, setTranslationGroup] = useState('');
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh quá lớn, vui lòng chọn ảnh dưới 5MB!");
      return;
    }

    setIsUploading(true);
    try {
      // Nén ảnh bằng Canvas để lọt mượt mà vào Firestore (giới hạn 1MB)
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // Giảm độ phân giải để ảnh siêu nhẹ
      const MAX_HEIGHT = 1200;
      let width = imageBitmap.width;
      let height = imageBitmap.height;

      if (width > MAX_WIDTH) {
        height = Math.floor(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }
      if (height > MAX_HEIGHT) {
        width = Math.floor(width * (MAX_HEIGHT / height));
        height = MAX_HEIGHT;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageBitmap, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // Nén 70% chất lượng
        setCoverUrl(compressedBase64);
      }
    } catch (error) {
      console.error("Lỗi nén ảnh:", error);
      alert("Gặp lỗi xử lý ảnh trên máy của bạn. Thử ảnh khác nhé!");
    } finally {
      setIsUploading(false);
    }
  };

  // Form states for Chapter
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [isVip, setIsVip] = useState(false);
  const [price, setPrice] = useState(50);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'novels'), where('authorId', '==', user.uid));
    const unsubscribeNovels = onSnapshot(q, (snapshot) => {
      const fetchedNovels = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Novel[];
      setNovels(fetchedNovels);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'novels');
    });

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfile);
    });

    return () => {
      unsubscribeNovels();
      unsubscribeProfile();
    };
  }, [user]);

  useEffect(() => {
    if (!selectedNovelForChapters) {
      setChapters([]);
      return;
    }

    const path = `novels/${selectedNovelForChapters.id}/chapters`;
    const q = query(collection(db, path), orderBy('chapterNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChapters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];
      setChapters(fetchedChapters);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [selectedNovelForChapters]);

  const [isSubmittingNovel, setIsSubmittingNovel] = useState(false);

  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmittingNovel(true);

    const novelData = {
      title,
      author: user.displayName || 'Tác giả',
      authorId: user.uid,
      description,
      coverUrl: coverUrl || `https://picsum.photos/seed/${Date.now()}/400/600`,
      bannerUrl: '',
      genres: selectedGenres,
      status,
      views: '0',
      rating: 5.0,
      translationGroup: translationGroup || 'Cá nhân',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      chapters: [] // For Firestore, we store chapters in a subcollection
    };

    try {
      if (editingNovel) {
        await updateDoc(doc(db, 'novels', editingNovel.id), {
          title: novelData.title,
          description: novelData.description,
          coverUrl: novelData.coverUrl,
          genres: novelData.genres,
          status: novelData.status,
          translationGroup: novelData.translationGroup,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'novels'), novelData);
      }
      resetNovelForm();
      alert("Lưu truyện thành công!");
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'novels');
      alert(`Lỗi đăng truyện: ${error.message || 'Thiếu quyền Firestore hoặc lỗi kết nối. Vui lòng kiểm tra tab Console (F12) để xem chi tiết mã lỗi.'}`);
    } finally {
      setIsSubmittingNovel(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovelForChapters) return;

    const path = `novels/${selectedNovelForChapters.id}/chapters`;
    const chapterData = {
      novelId: selectedNovelForChapters.id,
      title: chapterTitle,
      content: chapterContent,
      chapterNumber: Number(chapterNumber),
      isVip: isVip,
      price: isVip ? Number(price) : 0,
      publishDate: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), chapterData);
      // Update novel's metadata
      await updateDoc(doc(db, 'novels', selectedNovelForChapters.id), {
        updatedAt: serverTimestamp(),
        lastUpdated: 'Vừa xong',
        latestChapterNumber: Number(chapterNumber)
      });
      resetChapterForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const resetNovelForm = () => {
    setTitle('');
    setDescription('');
    setCoverUrl('');
    setSelectedGenres([]);
    setStatus('Đang ra');
    setTranslationGroup('');
    setIsCreating(false);
    setEditingNovel(null);
  };

  const resetChapterForm = () => {
    setChapterTitle('');
    setChapterContent('');
    setChapterNumber(chapters.length + 1);
    setIsVip(false);
    setPrice(50);
    setIsAddingChapter(false);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleWithdrawClick = () => {
    if (!user || !userProfile) return;
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async (bankName: string, accountName: string, accountNumber: string) => {
    if (!user || !userProfile) return;
    const currentCoins = userProfile.coins || 0;
    
    try {
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, { coins: 0 }, { merge: true });

      const reqRef = doc(collection(db, 'withdraw_requests'));
      batch.set(reqRef, {
        userId: user.uid,
        userName: userProfile.displayName || 'Khuyết danh',
        userEmail: userProfile.email || '',
        amountXu: currentCoins,
        amountVND: currentCoins * 100,
        bankName,
        accountName,
        accountNumber,
        status: 'PENDING',
        createdAt: serverTimestamp()
      });

      await batch.commit();
      setShowWithdrawModal(false);
      alert('Gửi yêu cầu rút tiền thành công!');
    } catch (e) {
      console.error(e);
      alert('Lỗi hệ thống khi tạo lệnh rút tiền.');
    }
  };



  if (!user) {
    return (
      <main className="w-full max-w-[1200px] px-8 pb-32 mx-auto pt-12 text-center">
        <div className="py-32 bg-surface rounded-[40px] border border-dashed border-accent/20">
          <BookPlus className="size-16 text-muted mx-auto mb-6" />
          <h2 className="text-2xl font-black text-text-main mb-4 uppercase tracking-tighter">Chào mừng đến với Creator Studio</h2>
          <p className="text-muted mb-8 max-w-md mx-auto">Đăng nhập để bắt đầu sáng tác và chia sẻ những câu chuyện tuyệt vời của bạn với cộng đồng Truyen24h.vn.</p>
          <button onClick={onLogin} className="px-10 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Đăng nhập ngay</button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1200px] px-8 pb-32 mx-auto pt-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <LayoutDashboard className="size-6" />
            </div>
            <span className="text-xs font-black text-primary uppercase tracking-widest">Creator Studio</span>
          </div>
          <h1 className="font-display text-5xl font-black text-text-main tracking-tighter uppercase mb-4">Quản lý sáng tác</h1>
          <p className="text-muted font-medium">Nơi chắp cánh cho những ý tưởng của bạn</p>
        </div>

        <div className="flex gap-3">
          {user?.email && ['phamanhtung.jp@gmail.com', 'truyen24hvnn@gmail.com'].includes(user.email) && (
            <button 
              onClick={() => setShowAutoBot(true)}
              className="flex items-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:opacity-90 transition-all"
            >
              <Bot className="size-5" />
              <span className="hidden sm:inline">Bot Tải Đăng (TXT)</span>
            </button>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-3 px-6 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
          >
            <Plus className="size-5" />
            <span>Đăng truyện mới</span>
          </button>
        </div>
      </div>

      {userProfile && (
        <div className="mb-12 p-8 bg-surface border border-accent/10 rounded-[32px] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="size-8" />
            </div>
            <div>
              <p className="text-sm font-black text-muted uppercase tracking-widest mb-1">Số dư Ví Xu (Doanh Thu)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-primary tracking-tighter">{(userProfile.coins || 0).toLocaleString()} <span className="text-lg">Xu</span></span>
                <span className="text-sm font-bold text-muted">~ {((userProfile.coins || 0) * 100).toLocaleString()} VNĐ</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {user?.email && ['phamanhtung.jp@gmail.com', 'truyen24hvnn@gmail.com'].includes(user.email) && (
              <button 
                onClick={() => updateDoc(doc(db, 'users', user.uid), { coins: increment(500) })}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-orange-500/10 text-orange-500 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-orange-500 hover:text-white transition-all"
              >
                <Zap className="size-4" />
                <span>Bơm 500 Xu (Test Admin)</span>
              </button>
            )}

            <button 
              onClick={handleWithdrawClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-background-light text-text-main border-2 border-accent/10 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:border-primary hover:text-primary transition-all"
            >
              <ArrowRightLeft className="size-4" />
              <span>Yêu cầu rút tiền</span>
            </button>
          </div>
        </div>
      )}

      {showWithdrawModal && userProfile && (
        <WithdrawModal 
          userProfile={userProfile} 
          onClose={() => setShowWithdrawModal(false)}
          onConfirm={handleConfirmWithdraw}
        />
      )}

      {showAutoBot && (
        <AutoBotImport 
          user={user} 
          novels={novels} 
          onClose={() => setShowAutoBot(false)} 
        />
      )}

      {loading ? (
        <div className="py-32 flex items-center justify-center">
          <Loader2 className="size-12 text-primary animate-spin" />
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {novels.map(novel => (
            <div key={novel.id} className="bg-surface rounded-[32px] p-6 border border-accent/10 shadow-xl flex flex-col md:flex-row gap-8 group hover:border-primary/20 transition-all">
              <div className="w-32 h-48 rounded-2xl overflow-hidden shadow-lg shrink-0">
                <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${novel.status === 'Hoàn thành' ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                      {novel.status}
                    </span>
                    <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{novel.genres.join(', ')}</span>
                  </div>
                  <h3 className="text-2xl font-black text-text-main mb-2 group-hover:text-primary transition-colors">{novel.title}</h3>
                  <p className="text-sm text-muted line-clamp-2 mb-4">{novel.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-muted">
                    <Eye className="size-4" />
                    <span className="text-xs font-bold">{novel.views} lượt xem</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <MessageSquare className="size-4" />
                    <span className="text-xs font-bold">24 bình luận</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <FileText className="size-4" />
                    <span className="text-xs font-bold">12 chương</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col justify-center gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedNovelForChapters(novel)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-background-light rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-primary hover:text-white transition-all"
                >
                  <FileText className="size-4" />
                  <span>Quản lý chương</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingNovel(novel);
                    setTitle(novel.title);
                    setDescription(novel.description);
                    setCoverUrl(novel.coverUrl);
                    setSelectedGenres(novel.genres);
                    setStatus(novel.status);
                    setTranslationGroup(novel.translationGroup || '');
                    setIsCreating(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-background-light rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-accent hover:text-white transition-all"
                >
                  <Edit3 className="size-4" />
                  <span>Sửa thông tin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 bg-surface rounded-[40px] border border-dashed border-accent/20 text-center">
          <BookPlus className="size-12 text-muted mx-auto mb-6 opacity-20" />
          <h3 className="text-xl font-bold text-text-main mb-2">Bạn chưa đăng truyện nào</h3>
          <p className="text-muted mb-8">Hãy bắt đầu hành trình sáng tác của bạn ngay hôm nay!</p>
          <button onClick={() => setIsCreating(true)} className="px-8 py-3 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Đăng truyện đầu tiên</button>
        </div>
      )}

      {/* Create/Edit Novel Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetNovelForm}></div>
          <div className="relative w-full max-w-5xl bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={resetNovelForm} className="absolute top-8 right-8 p-2 hover:bg-background-light rounded-full text-muted transition-colors">
              <X className="size-6" />
            </button>

            <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter mb-8">{editingNovel ? 'Sửa thông tin truyện' : 'Đăng truyện mới'}</h2>
            
            <form onSubmit={handleCreateNovel} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Tên truyện</label>
                    <input 
                      type="text" required value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Ảnh bìa (400x600)</label>
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-accent/20 bg-background-light hover:border-primary/50 transition-all text-center">
                      {coverUrl ? (
                        <div className="relative aspect-[3/4.5] w-full max-w-[160px] mx-auto overflow-hidden rounded-xl shadow-md my-4">
                          <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                            <Edit3 className="size-6 text-white mb-2" />
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Đổi ảnh</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center py-10 cursor-pointer text-muted hover:text-primary transition-colors">
                          {isUploading ? (
                            <Loader2 className="size-10 font-light mb-4 animate-spin text-primary" />
                          ) : (
                            <ImageIcon className="size-10 font-light mb-4 opacity-50" />
                          )}
                          <span className="text-sm font-bold block mb-1">
                            {isUploading ? 'ĐANG XỬ LÝ...' : 'TẢI ẢNH LÊN'}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest opacity-60">PNG, JPG tối đa 5MB</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Nhóm dịch / Tác giả</label>
                    <input 
                      type="text" value={translationGroup} onChange={e => setTranslationGroup(e.target.value)}
                      className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Trạng thái</label>
                    <select 
                      value={status} onChange={e => setStatus(e.target.value as any)}
                      className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="Đang ra">Đang ra</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Thể loại</label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(genre => (
                        <button 
                          key={genre} type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGenres.includes(genre) ? 'bg-primary text-white' : 'bg-background-light text-muted hover:text-text-main'}`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Tóm tắt / Giới thiệu truyện</label>
                <textarea 
                  required value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Viết vài dòng giới thiệu hấp dẫn về bộ truyện của bạn..."
                  className="w-full h-40 px-6 py-4 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingNovel}
                className="w-full h-16 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingNovel ? 'Đang xử lý...' : (editingNovel ? 'Cập nhật truyện' : 'Đăng truyện ngay')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Chapters Modal */}
      {selectedNovelForChapters && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNovelForChapters(null)}></div>
          <div className="relative w-full max-w-4xl bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedNovelForChapters(null)} className="absolute top-8 right-8 p-2 hover:bg-background-light rounded-full text-muted transition-colors">
              <X className="size-6" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="size-16 rounded-xl overflow-hidden shadow-md">
                <img src={selectedNovelForChapters.coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter">Quản lý chương</h2>
                <p className="text-muted font-medium">{selectedNovelForChapters.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 border-r border-accent/5 pr-10">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Danh sách chương</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {chapters.map(chapter => (
                    <div key={chapter.id} className="p-4 bg-background-light rounded-xl flex items-center justify-between group hover:bg-primary/5 transition-all">
                      <div>
                        <span className="text-[10px] font-black text-primary block mb-1">Chương {chapter.chapterNumber}</span>
                        <span className="text-sm font-bold text-text-main line-clamp-1">{chapter.title}</span>
                      </div>
                      <button className="p-2 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  {chapters.length === 0 && (
                    <p className="text-center py-10 text-muted text-sm italic">Chưa có chương nào.</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Thêm chương mới</h3>
                <form onSubmit={handleAddChapter} className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Số chương</label>
                      <input 
                        type="number" required value={chapterNumber} onChange={e => setChapterNumber(Number(e.target.value))}
                        className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Tiêu đề chương</label>
                      <input 
                        type="text" required value={chapterTitle} onChange={e => setChapterTitle(e.target.value)}
                        className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="vip-toggle"
                        checked={isVip}
                        onChange={e => setIsVip(e.target.checked)}
                        className="size-5 rounded border-primary/20 text-primary focus:ring-primary/20 accent-primary"
                      />
                      <label htmlFor="vip-toggle" className="text-sm font-black text-primary uppercase tracking-widest cursor-pointer">Bật chương Thu Phí (VIP)</label>
                    </div>
                    <div>
                      {isVip && (
                        <select 
                          value={price}
                          onChange={e => setPrice(Number(e.target.value))}
                          className="w-full h-12 px-4 bg-surface rounded-xl border border-primary/20 outline-none font-bold text-text-main text-sm"
                        >
                          <option value={10}>10 Xu (1.000đ)</option>
                          <option value={20}>20 Xu (2.000đ)</option>
                          <option value={30}>30 Xu (3.000đ)</option>
                          <option value={50}>50 Xu (5.000đ)</option>
                          <option value={100}>100 Xu (10.000đ)</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Nội dung chương</label>
                    <textarea 
                      required value={chapterContent} onChange={e => setChapterContent(e.target.value)}
                      className="w-full h-80 px-6 py-4 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="Nhập nội dung chương truyện tại đây..."
                    />
                  </div>
                  <button type="submit" className="w-full h-16 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all">
                    Đăng chương ngay
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
