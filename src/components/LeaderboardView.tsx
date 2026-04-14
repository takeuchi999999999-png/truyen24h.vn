import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, Zap, MessageSquare, Coins, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

export default function LeaderboardView() {
  const [activeTab, setActiveTab] = useState<'exp' | 'coins' | 'reviews'>('exp');
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q;
    if (activeTab === 'exp') {
      q = query(collection(db, 'users'), orderBy('exp', 'desc'), limit(10));
    } else if (activeTab === 'coins') {
      q = query(collection(db, 'users'), orderBy('contributionScore', 'desc'), limit(10));
    } else {
      // For reviews, we would ideally have a reviewCount field on user profile
      q = query(collection(db, 'users'), orderBy('level', 'desc'), limit(10));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeaders = snapshot.docs.map(doc => doc.data() as UserProfile);
      setLeaders(fetchedLeaders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="size-6 text-yellow-500" />;
      case 1: return <Medal className="size-6 text-slate-400" />;
      case 2: return <Medal className="size-6 text-amber-600" />;
      default: return <span className="text-lg font-black text-muted">{index + 1}</span>;
    }
  };

  return (
    <main className="w-full max-w-[1000px] px-8 pb-32 mx-auto pt-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Trophy className="size-6" />
            </div>
            <span className="text-xs font-black text-primary uppercase tracking-widest">Vinh danh</span>
          </div>
          <h1 className="font-display text-5xl font-black text-text-main tracking-tighter uppercase mb-4">Bảng xếp hạng</h1>
          <p className="text-muted font-medium">Nơi tôn vinh những độc giả nhiệt huyết nhất Truyen24h.vn</p>
        </div>

        <div className="flex bg-surface p-1.5 rounded-2xl border border-accent/10 shadow-xl">
          <button 
            onClick={() => setActiveTab('exp')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'exp' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text-main'}`}
          >
            <Zap className="size-4" />
            <span>Fan cứng</span>
          </button>
          <button 
            onClick={() => setActiveTab('coins')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'coins' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text-main'}`}
          >
            <Coins className="size-4" />
            <span>Đại gia</span>
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'reviews' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-text-main'}`}
          >
            <MessageSquare className="size-4" />
            <span>Reviewer</span>
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-[40px] border border-accent/10 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : leaders.length > 0 ? (
          <div className="divide-y divide-accent/5">
            {leaders.map((leader, index) => (
              <div 
                key={leader.uid} 
                className={`flex items-center gap-6 p-6 transition-all hover:bg-background-light group ${index < 3 ? 'bg-primary/5' : ''}`}
              >
                <div className="w-12 flex items-center justify-center shrink-0">
                  {getRankIcon(index)}
                </div>
                
                <div className="size-14 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0">
                  <img 
                    src={leader.photoURL || `https://ui-avatars.com/api/?name=${leader.displayName}`} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-black text-text-main group-hover:text-primary transition-colors">{leader.displayName}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="size-3 text-primary fill-primary" />
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Cấp {leader.level || 1}</span>
                    </div>
                    {leader.badges && leader.badges.length > 0 && (
                      <div className="flex gap-1">
                        {leader.badges.slice(0, 2).map(badge => (
                          <span key={badge} className="px-2 py-0.5 bg-accent/10 rounded text-[8px] font-black text-accent uppercase tracking-tighter">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {activeTab === 'exp' ? (
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-text-main">{leader.exp || 0}</span>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Kinh nghiệm</span>
                    </div>
                  ) : activeTab === 'coins' ? (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <Coins className="size-4 text-yellow-500" />
                        <span className="text-lg font-black text-text-main">{(leader as any).contributionScore || 0}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Xu Đã Tặng</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-text-main">{leader.level || 1}</span>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Uy tín</span>
                    </div>
                  )}
                </div>
                
                <div className="w-10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="size-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <p className="text-muted font-medium">Chưa có dữ liệu xếp hạng.</p>
          </div>
        )}
      </div>

      {/* Legend / Info */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-surface rounded-3xl border border-accent/10 shadow-sm">
          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
            <Zap className="size-5" />
          </div>
          <h4 className="font-black text-text-main uppercase tracking-tight mb-2">Fan cứng</h4>
          <p className="text-xs text-muted leading-relaxed">Tích lũy kinh nghiệm thông qua việc đọc truyện, bình luận và điểm danh hàng ngày.</p>
        </div>
        <div className="p-6 bg-surface rounded-3xl border border-accent/10 shadow-sm">
          <div className="size-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
            <Coins className="size-5" />
          </div>
          <h4 className="font-black text-text-main uppercase tracking-tight mb-2">Đại gia</h4>
          <p className="text-xs text-muted leading-relaxed">Những người ủng hộ nhiệt tình nhất cho các tác giả và nhóm dịch thông qua hệ thống tặng quà.</p>
        </div>
        <div className="p-6 bg-surface rounded-3xl border border-accent/10 shadow-sm">
          <div className="size-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-4">
            <MessageSquare className="size-5" />
          </div>
          <h4 className="font-black text-text-main uppercase tracking-tight mb-2">Reviewer</h4>
          <p className="text-xs text-muted leading-relaxed">Những độc giả có những bài đánh giá chất lượng, giúp cộng đồng tìm được những bộ truyện hay.</p>
        </div>
      </div>
    </main>
  );
}
