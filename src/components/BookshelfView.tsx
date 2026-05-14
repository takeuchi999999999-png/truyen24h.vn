import { BookMarked, History, Trash2, BookOpen, LogIn, Clock, Sparkles, AlertCircle, X, Gift, CalendarCheck, Trophy, Flame } from 'lucide-react';
import { Novel, UserProfile } from '../types';
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, deleteDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDailyGreeting } from '../services/geminiService';

interface BookshelfViewProps {
  // getDailyGreeting moved to /api/ai/greeting server route
  user: User | null;
  onLogin: () => void;
}

interface BookshelfItem {
  novelId: string;
  progress: number;
  lastChapterNumber: number;
  isFollowing: boolean;
  isReadLater?: boolean;
}

export default function BookshelfView({ onNovelSelect, user, onLogin }: BookshelfViewProps) {
  const [activeTab, setActiveTab] = useState<'following' | 'history' | 'readLater'>('following');
  const [items, setItems] = useState<BookshelfItem[]>([]);
  const [novelsMap, setNovelsMap] = useState<Record<string, Novel>>({});
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [novelToDelete, setNovelToDelete] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);

  useEffect(() => {
    if (user) {
              fetch('/api/ai/greeting', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({userName: user.displayName || 'Bạn'}) }).then(r => r.ok ? r.json() : null).then(d => d?.greeting && setGreeting(d.greeting));
      checkCheckInStatus();
    }
  }, [user]);

  const checkCheckInStatus = async () => {
    if (!user) return;
    const path = `users/${user.uid}/profile/stats`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastCheckIn = data.lastCheckIn?.toDate();
        const today = new Date();
        
        if (lastCheckIn && 
            lastCheckIn.getDate() === today.getDate() && 
            lastCheckIn.getMonth() === today.getMonth() && 
            lastCheckIn.getFullYear() === today.getFullYear()) {
          setHasCheckedIn(true);
        }
        setCheckInStreak(data.streak || 0);
      }
    } catch (error) {
      console.error("Check-in status error:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || hasCheckedIn) return;
    const path = `users/${user.uid}/profile/stats`;
    try {
      const today = new Date();
      const newStreak = checkInStreak + 1;
      
      await setDoc(doc(db, path), {
        lastCheckIn: serverTimestamp(),
        streak: newStreak,
        points: (newStreak * 10) + 50 // Example points
      }, { merge: true });
      
      setHasCheckedIn(true);
      setCheckInStreak(newStreak);
      setShowCheckInSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const path = `users/${user.uid}/bookshelf`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => doc.data() as BookshelfItem);
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const missingIds = items.map(i => i.novelId).filter(id => !novelsMap[id]);
    if (missingIds.length === 0) return;
    
    const fetchNovels = async () => {
      const newMap = { ...novelsMap };
      await Promise.all(missingIds.map(async (id) => {
        try {
          const docSnap = await getDoc(doc(db, 'novels', id));
          if (docSnap.exists()) {
            newMap[id] = { id: docSnap.id, ...docSnap.data() } as Novel;
          }
        } catch (e) {
          console.error("Failed to fetch novel", id, e);
        }
      }));
      setNovelsMap(newMap);
    };
    
    fetchNovels();
  }, [items, novelsMap]);

  const handleDelete = (e: React.MouseEvent, novelId: string) => {
    e.stopPropagation();
    setNovelToDelete(novelId);
  };

  const confirmDelete = async () => {
    if (!user || !novelToDelete) return;
    const path = `users/${user.uid}/bookshelf/${novelToDelete}`;
    try {
      await deleteDoc(doc(db, path));
      setNovelToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'following') return item.isFollowing;
    if (activeTab === 'readLater') return item.isReadLater;
    return !item.isFollowing && !item.isReadLater; // History
  });

  const getCoverUrl = (url: string | undefined, id: string) => {
    return url || `https://picsum.photos/seed/novel-${id}/400/600`;
  };

  const renderNovelGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
      {filteredItems.map((item) => {
        const novel = novelsMap[item.novelId];
        if (!novel) return null;

        return (
          <div 
            key={novel.id}
            onClick={() => onNovelSelect(novel)}
            className="flex flex-col gap-4 group cursor-pointer animate-in fade-in duration-500"
          >
            <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
              <img 
                src={getCoverUrl(novel.coverUrl, novel.id)} 
                alt={novel.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="bg-white p-3 rounded-full text-primary transform scale-50 group-hover:scale-100 transition-transform">
                    <BookOpen className="size-6" />
                 </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/20">
                 <div className="h-full bg-primary shadow-[0_0_10px_rgba(232,165,165,0.8)]" style={{ width: `${item.progress || 0}%` }}></div>
              </div>
            </div>
            <div className="flex flex-col px-1">
              <h3 className="font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors leading-tight text-base mb-1">{novel.title}</h3>
              <div className="flex items-center justify-between mt-1">
                 <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Chương {item.lastChapterNumber || 0}/{novel?.latestChapterNumber || novel?.chapters?.length || 0}</span>
                 <button 
                  onClick={(e) => handleDelete(e, novel.id)}
                  className="p-1 text-muted hover:text-red-500 transition-colors"
                 >
                    <Trash2 className="size-3" />
                 </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!user) {
    return (
      <main className="w-full max-w-[1200px] px-4 md:px-8 pb-32 mx-auto pt-6 md:pt-12">
        <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-[40px] border border-dashed border-accent/20">
          <div className="p-6 bg-background-light rounded-full text-muted mb-6">
            <LogIn className="size-12" />
          </div>
          <h3 className="text-xl font-bold text-text-main mb-2">Vui lòng đăng nhập</h3>
          <p className="text-muted mb-8">Đăng nhập để xem tủ sách và lịch sử đọc của bạn.</p>
          <button 
            onClick={onLogin}
            className="bg-primary text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
          >
            Đăng nhập ngay
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="w-full max-w-[1200px] px-4 md:px-8 pb-32 mx-auto pt-6 md:pt-12">
      {greeting && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 p-8 bg-gradient-to-r from-primary/10 via-surface to-surface rounded-[32px] border border-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="size-24 text-primary" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-text-main tracking-tight mb-2">
                Chào mừng trở lại, <span className="text-primary">{user?.displayName}</span>!
              </h2>
              <p className="text-muted font-medium italic">"{greeting}"</p>
            </div>
          </div>

          {/* Daily Check-in Card */}
          <div className="bg-surface p-8 rounded-[32px] border border-accent/10 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Trophy className="size-32 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <CalendarCheck className="size-5" />
                  </div>
                  <span className="font-black text-text-main uppercase tracking-tighter">Điểm danh</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-full">
                  <Flame className="size-3 text-orange-500 fill-orange-500" />
                  <span className="text-[10px] font-black text-primary">{checkInStreak} ngày</span>
                </div>
              </div>
              
              <p className="text-xs text-muted font-medium mb-6">Điểm danh hàng ngày để nhận Ngọc và thăng cấp Fan cứng!</p>
              
              <button 
                onClick={handleCheckIn}
                disabled={hasCheckedIn}
                className={`w-full py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${hasCheckedIn ? 'bg-background-light text-muted cursor-default' : 'bg-primary text-white shadow-primary/20 hover:opacity-90'}`}
              >
                {hasCheckedIn ? 'Đã điểm danh hôm nay' : 'Điểm danh nhận quà'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Success Modal */}
      {showCheckInSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckInSuccess(false)}></div>
          <div className="relative w-full max-w-sm bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Gift className="size-12 text-primary animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-text-main uppercase tracking-tighter mb-4">Tuyệt vời!</h3>
            <p className="text-muted font-medium mb-8">
              Bạn đã nhận được <span className="text-primary font-bold">+50 Ngọc</span> và duy trì chuỗi <span className="text-primary font-bold">{checkInStreak} ngày</span>.
            </p>
            <button 
              onClick={() => setShowCheckInSuccess(false)}
              className="w-full py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
            >
              Nhận ngay
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="font-display text-5xl font-black text-text-main tracking-tighter uppercase mb-4">Tủ sách của tôi</h1>
          <p className="text-muted font-medium">Nơi lưu giữ những hành trình kỳ diệu của bạn</p>
        </div>
        
        <div className="flex flex-wrap bg-surface p-1.5 rounded-2xl border border-accent/10 shadow-xl">
          <button 
            onClick={() => setActiveTab('following')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'following' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text-main'}`}
          >
            <BookMarked className="size-4" />
            <span>Đang theo dõi</span>
          </button>
          <button 
            onClick={() => setActiveTab('readLater')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'readLater' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text-main'}`}
          >
            <Clock className="size-4" />
            <span>Đọc sau</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text-main'}`}
          >
            <History className="size-4" />
            <span>Lịch sử đọc</span>
          </button>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        renderNovelGrid()
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-surface rounded-[40px] border border-dashed border-accent/20">
          <div className="p-6 bg-background-light rounded-full text-muted mb-6">
            {activeTab === 'following' ? <BookMarked className="size-12" /> : activeTab === 'readLater' ? <Clock className="size-12" /> : <History className="size-12" />}
          </div>
          <h3 className="text-xl font-bold text-text-main mb-2">
            {activeTab === 'following' ? 'Chưa có truyện theo dõi' : activeTab === 'readLater' ? 'Danh sách đọc sau trống' : 'Lịch sử trống'}
          </h3>
          <p className="text-muted mb-8">
            {activeTab === 'following' ? 'Hãy khám phá và thêm truyện vào tủ sách nhé!' : activeTab === 'readLater' ? 'Bạn chưa thêm truyện nào vào danh sách đọc sau.' : 'Bạn chưa đọc bộ truyện nào gần đây.'}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {novelToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNovelToDelete(null)}></div>
          <div className="relative w-full max-w-md bg-surface rounded-[32px] shadow-2xl border border-accent/10 p-8 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setNovelToDelete(null)}
              className="absolute top-6 right-6 p-2 hover:bg-background-light rounded-full text-muted transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="size-8 text-red-500" />
              </div>
              
              <h3 className="text-xl font-black text-text-main uppercase tracking-tight mb-3">Xác nhận xóa?</h3>
              <p className="text-sm text-muted font-medium mb-8">
                Bạn có chắc chắn muốn xóa bộ truyện này khỏi <strong>{activeTab === 'following' ? 'danh sách theo dõi' : activeTab === 'readLater' ? 'danh sách đọc sau' : 'lịch sử đọc'}</strong> không? Hành động này không thể hoàn tác.
              </p>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setNovelToDelete(null)}
                  className="flex-1 py-4 rounded-full border-2 border-accent/10 font-black text-[10px] uppercase tracking-widest text-muted hover:bg-background-light transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:opacity-90 transition-all"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
