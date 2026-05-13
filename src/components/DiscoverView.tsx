import { ArrowRight, ChevronRight, Trophy, Flame, BookOpen, Clock, Star, Eye, Loader2 } from 'lucide-react';
import { NOVELS } from '../constants';
import { Novel } from '../types';
import { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface DiscoverViewProps {
  onNovelSelect: (novel: Novel) => void;
}

const UPDATES_PER_PAGE = 5;

import BannerSlider from './BannerSlider';

export default function DiscoverView({ onNovelSelect }: DiscoverViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [recommendationPage, setRecommendationPage] = useState(0); // For Đề Cử carousel
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'TRUYỆN' | 'ĐẠI GIA' | 'TÁC GIẢ'>('TRUYỆN');
  const [visibleLimit, setVisibleLimit] = useState(20);
  const [dynamicNovels, setDynamicNovels] = useState<Novel[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always order by updatedAt desc so freshly-published AI novels surface
    // on the homepage instead of being skipped by `limit()` document-id order.
    const qNovels = query(
      collection(db, 'novels'),
      orderBy('updatedAt', 'desc'),
      limit(visibleLimit)
    );
    const unsubscribeNovels = onSnapshot(qNovels, (snapshot) => {
      const fetchedNovels = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Novel[];
      setDynamicNovels(fetchedNovels);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'novels');
      setLoading(false);
    });

    const qUsers = query(collection(db, 'users'), orderBy('coins', 'desc'), limit(10));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopUsers(users);
    });

    return () => {
      unsubscribeNovels();
      unsubscribeUsers();
    };
  }, [visibleLimit]);

  const allNovels = dynamicNovels;

  const featuredNovel = allNovels[0] || null;
  const hotNovels = allNovels.filter(n => n.isHot).slice(0, 10);
  const fullNovels = allNovels.filter(n => n.isFull || n.status === 'Hoàn thành').slice(0, 8);
  const latestUpdates = allNovels;

  if (loading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-primary size-12" /></div>;
  if (allNovels.length === 0) return <div className="h-screen flex justify-center items-center text-white">Không có truyện nào.</div>;

  const totalPages = Math.ceil(latestUpdates.length / UPDATES_PER_PAGE);
  const paginatedUpdates = latestUpdates.slice(
    (currentPage - 1) * UPDATES_PER_PAGE,
    currentPage * UPDATES_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the latest updates section
    const element = document.getElementById('latest-updates');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCoverUrl = (url: string | undefined, id: string) => {
    return url || `https://picsum.photos/seed/novel-${id}/400/600`;
  };

  return (
    <main className="w-full max-w-[1200px] px-4 md:px-8 pb-20 flex flex-col gap-16 mx-auto pt-4 md:pt-8">
      {/* Banner Carousel To Nhất */}
      <BannerSlider novels={allNovels} />

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        {/* Main Content Column */}
        <div className="flex-1 flex flex-col gap-16 overflow-hidden">
          
          {/* Đề Cử Hôm Nay */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                <Star className="size-6 fill-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-black text-text-main tracking-tighter uppercase relative inline-block">
                  Đề cử hôm nay
                  <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full"></div>
                </h2>
              </div>
            </div>
            
            <div className="bg-surface border border-accent/10 rounded-[32px] p-6 md:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              {/* Pagination Dots for Recommendation */}
              <div className="absolute top-8 right-8 flex gap-2">
                 {[0, 1, 2].map(idx => (
                   <button 
                     key={idx}
                     onClick={() => setRecommendationPage(idx)}
                     className={`size-2.5 rounded-full transition-all ${recommendationPage === idx ? 'bg-primary scale-125' : 'bg-muted/30 hover:bg-muted/50'}`}
                   />
                 ))}
              </div>

              {allNovels.slice(recommendationPage * 3, recommendationPage * 3 + 3).map((novel, index) => (
                <div 
                  key={novel.id || index}
                  onClick={() => onNovelSelect(novel)}
                  className="flex gap-6 group cursor-pointer relative z-10"
                >
                  <div className="w-24 md:w-32 aspect-[3/4.5] shrink-0 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                    <img 
                      src={getCoverUrl(novel.coverUrl, novel.id)} 
                      alt={novel.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    <h3 className="font-bold text-lg md:text-xl text-text-main line-clamp-1 group-hover:text-primary transition-colors">{novel.title}</h3>
                    <p className="text-sm text-muted font-medium line-clamp-2 leading-relaxed max-w-2xl">{novel.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <div className="size-6 bg-accent/20 rounded-full flex items-center justify-center">
                          <Eye className="size-3 text-accent" />
                       </div>
                       <span className="text-xs text-muted font-bold">{novel.author}</span>
                       <span className="text-xs text-muted/50 px-2">•</span>
                       <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">{novel.genres[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Hot Novels Section */}
          <section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 shadow-inner">
                  <Flame className="size-6 fill-red-500" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-text-main tracking-tighter uppercase">Truyện Hot Tháng Này</h2>
                  <p className="text-sm text-muted font-medium">Những bộ truyện đang làm mưa làm gió</p>
                </div>
              </div>
              <button className="group text-sm font-bold text-primary hover:text-primary/80 transition-all flex items-center gap-1 bg-primary/5 px-4 py-2 rounded-full">
                Xem tất cả <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {hotNovels.map((novel) => (
                <div 
                  key={novel.id}
                  onClick={() => onNovelSelect(novel)}
                  className="flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                    <img 
                      src={getCoverUrl(novel.coverUrl, novel.id)} 
                      alt={novel.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black rounded-xl uppercase shadow-xl shadow-red-500/40 animate-in fade-in zoom-in duration-500">
                        <Flame className="size-3 fill-white" />
                        <span>Hot</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                       <div className="flex items-center gap-4 text-white animate-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center gap-1.5">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-black text-sm">{novel.rating}</span>
                          </div>
                          <div className="w-[1px] h-3 bg-white/20"></div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="size-4 text-white/80" />
                            <span className="font-bold text-sm">{novel.views}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="flex flex-col px-1">
                    <h3 className="font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors leading-tight text-base mb-1">{novel.title}</h3>
                    <p className="text-xs text-muted font-medium truncate">{novel.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Latest Updates List */}
          <section id="latest-updates">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent shadow-inner">
                  <Clock className="size-7" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-text-main tracking-tighter uppercase">Mới cập nhật</h2>
                  <p className="text-sm text-muted font-medium">Đừng bỏ lỡ chương mới nhất</p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-[32px] border border-accent/10 overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 divide-y divide-accent/5">
                {paginatedUpdates.map((novel) => (
                  <div 
                    key={novel.id}
                    onClick={() => onNovelSelect(novel)}
                    className="flex items-center gap-5 p-6 hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <div className="w-24 md:w-32 aspect-[3/4.5] rounded-xl overflow-hidden shrink-0 shadow-xl group-hover:scale-105 transition-transform">
                      <img 
                        src={getCoverUrl(novel.coverUrl, novel.id)} 
                        alt={novel.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-text-main text-lg truncate group-hover:text-primary transition-colors">{novel.title}</h4>
                        {novel.isHot && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black rounded-lg uppercase shadow-lg shadow-red-500/20">
                            <Flame className="size-2.5 fill-white" />
                            Hot
                          </span>
                        )}
                        {(novel as any).aiAssisted && (
                          <span
                            title="Tác phẩm có hỗ trợ của AI"
                            className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/15 text-yellow-500 text-[9px] font-black rounded-lg uppercase border border-yellow-500/30"
                          >
                            AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted font-medium truncate max-w-[150px]">{novel.author}</span>
                        <div className="flex items-center gap-2 text-primary font-bold bg-primary/5 px-3 py-1 rounded-full text-xs">
                          <BookOpen className="size-3" />
                          <span>Chương {novel.latestChapterNumber || novel.chapters?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end shrink-0 gap-1">
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded">{novel.translationGroup}</span>
                      <span className="text-[11px] text-muted font-medium">{novel.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />

            <div className="flex justify-center mt-8">
              <button 
                onClick={() => setVisibleLimit(prev => prev + 20)}
                className="px-8 py-3 bg-surface border border-accent/10 hover:border-primary/50 text-muted hover:text-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md"
              >
                Tải thêm truyện
              </button>
            </div>
          </section>

          {/* Full Novels Section */}
          <section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-2xl text-green-600 shadow-inner">
                  <BookOpen className="size-7" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-text-main tracking-tighter uppercase">Truyện Đã Hoàn Thành</h2>
                  <p className="text-sm text-muted font-medium">Đọc một lèo không cần chờ đợi</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {fullNovels.map((novel) => (
                <div 
                  key={novel.id}
                  onClick={() => onNovelSelect(novel)}
                  className="flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-green-500/20 transition-all duration-500">
                    <img 
                      src={getCoverUrl(novel.coverUrl, novel.id)} 
                      alt={novel.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute top-0 right-0">
                      <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-bl-xl uppercase shadow-lg">Full</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-text-main line-clamp-1 group-hover:text-primary transition-colors leading-tight text-base">{novel.title}</h3>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="bg-surface rounded-[40px] p-6 lg:p-10 shadow-2xl sticky top-24 border border-accent/10">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex items-center justify-between pb-6 border-b border-background-light">
                <h2 className="font-display text-2xl font-black text-text-main uppercase tracking-tighter">Xếp Hạng</h2>
                <Trophy className="text-primary size-7" />
              </div>
              <div className="flex bg-background-light rounded-2xl p-1 relative">
                <button 
                  onClick={() => setActiveLeaderboardTab('TRUYỆN')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${activeLeaderboardTab === 'TRUYỆN' ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-text-main'}`}
                >Truyện</button>
                <button 
                  onClick={() => setActiveLeaderboardTab('ĐẠI GIA')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${activeLeaderboardTab === 'ĐẠI GIA' ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-text-main'}`}
                >Đại Gia</button>
                <button 
                  onClick={() => setActiveLeaderboardTab('TÁC GIẢ')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${activeLeaderboardTab === 'TÁC GIẢ' ? 'bg-primary text-white shadow-md' : 'text-muted hover:text-text-main'}`}
                >Tác Giả</button>
              </div>
            </div>

            <ul className="flex flex-col gap-8">
              {activeLeaderboardTab === 'TRUYỆN' && allNovels.slice(0, 10).map((novel, index) => (
                <li 
                  key={novel.id || index}
                  onClick={() => onNovelSelect(novel)}
                  className="flex items-center gap-5 group cursor-pointer"
                >
                  <span className={`font-display text-3xl font-black w-10 text-center italic transition-all group-hover:scale-110 ${index === 0 ? 'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : index === 1 ? 'text-[#C0C0C0]' : index === 2 ? 'text-[#CD7F32]' : 'text-muted/20'}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text-main truncate group-hover:text-primary transition-colors text-sm mb-1">{novel.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted uppercase font-black tracking-widest bg-background-light px-2 py-0.5 rounded">{novel.genres[0] || 'Khác'}</span>
                      <span className="text-[10px] text-muted/60 font-bold">{novel.views} view</span>
                    </div>
                  </div>
                </li>
              ))}

              {activeLeaderboardTab === 'ĐẠI GIA' && topUsers.slice(0, 10).map((user, index) => (
                <li 
                  key={user.uid || index}
                  className="flex items-center gap-4 group cursor-pointer"
                >
                  <span className={`font-display text-3xl font-black w-8 text-center italic transition-all group-hover:scale-110 ${index === 0 ? 'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : index === 1 ? 'text-[#C0C0C0]' : index === 2 ? 'text-[#CD7F32]' : 'text-muted/20'}`}>
                    {index + 1}
                  </span>
                  <div className="size-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
                     <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} alt={user.displayName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text-main truncate group-hover:text-primary transition-colors text-sm mb-1">{user.displayName || 'Vô danh'}</h4>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">{user.coins || 0} Điểm</span>
                    </div>
                  </div>
                </li>
              ))}

              {activeLeaderboardTab === 'TÁC GIẢ' && allNovels.slice(0, 10).map((novel, index) => (
                 <li 
                 key={'author_' + (novel.id || index)}
                 className="flex items-center gap-4 group cursor-pointer"
               >
                 <span className={`font-display text-3xl font-black w-8 text-center italic transition-all group-hover:scale-110 ${index === 0 ? 'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : index === 1 ? 'text-[#C0C0C0]' : index === 2 ? 'text-[#CD7F32]' : 'text-muted/20'}`}>
                   {index + 1}
                 </span>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-text-main truncate group-hover:text-primary transition-colors text-sm mb-1">{novel.author}</h4>
                   <div className="flex items-center gap-1">
                     <span className="text-[10px] text-primary uppercase font-black bg-primary/10 px-2 py-0.5 rounded">