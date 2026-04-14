"use client";
import { Search, ChevronDown, Menu, BookMarked, LogIn, LogOut, Sun, Moon, User as UserIcon, Coins, Sparkles, Trophy, Zap, Crown, BookPlus, Bell } from 'lucide-react';
import { GENRES } from '../constants';
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import ProfileEditModal from './ProfileEditModal';
import CheckInModal from './CheckInModal';
import Link from 'next/link';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

interface TopNavBarProps {
  activeTab: 'discover' | 'bookshelf' | 'leaderboard' | 'creator-studio';
  onTabChange: (tab: 'discover' | 'bookshelf' | 'leaderboard' | 'creator-studio') => void;
  onGenreSelect: (genre: string) => void;
  onSearch: (term: string) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function TopNavBar({ 
  activeTab, 
  onTabChange, 
  onGenreSelect, 
  onSearch, 
  user, 
  onLogin, 
  onLogout,
  isDarkMode,
  onToggleDarkMode
}: TopNavBarProps) {
  const [showGenres, setShowGenres] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        let profile = doc.data() as UserProfile;
        if (user.email === 'phamanhtung.jp@gmail.com' || user.email === 'truyen24hvnn@gmail.com') {
          profile = {
            ...profile,
            coins: 99999999, // Setup Admin Testing Coins
            badges: Array.from(new Set([...(profile.badges || []), 'VIP', 'Admin']))
          };
        }
        setUserProfile(profile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-accent/10 shadow-sm">
      <div className="flex items-center justify-between w-full max-w-[1200px] px-4 lg:px-8 py-3 mx-auto">
        <div className="flex items-center gap-4 lg:gap-10">
          <Link href="/" onClick={() => onTabChange('discover')} className="flex items-center gap-2 text-primary cursor-pointer shrink-0">
            <div className="size-9 md:size-11 overflow-hidden rounded-full shadow-lg shadow-primary/20 border-2 border-primary/20 bg-white flex items-center justify-center">
              <img src="/logo.jpg" alt="Truyen24h.vn Logo" className="size-9 md:size-11 object-cover" />
            </div>
            <h2 className="text-text-main text-xl md:text-2xl font-display font-black leading-tight tracking-tighter hidden sm:block">Truyen24h.vn</h2>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            <button 
              onClick={() => onTabChange('discover')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer flex items-center hover:-translate-y-0.5 hover:shadow-sm ${activeTab === 'discover' ? 'bg-primary/20 text-primary shadow-sm' : 'text-text-main hover:bg-primary/10 hover:text-primary'}`}
            >
              Khám phá
            </button>
            
            <div className="relative">
              <button 
                onMouseEnter={() => setShowGenres(true)}
                onMouseLeave={() => setShowGenres(false)}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold text-text-main transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:bg-primary/10 hover:text-primary hover:shadow-sm"
              >
                Thể loại <ChevronDown className="size-4 opacity-50" />
              </button>
              
              {showGenres && (
                <div 
                  onMouseEnter={() => setShowGenres(true)}
                  onMouseLeave={() => setShowGenres(false)}
                  className="absolute top-full left-0 w-[850px] bg-surface shadow-2xl rounded-2xl p-6 grid grid-cols-4 gap-y-2 gap-x-4 border border-accent/10 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {GENRES.map(genre => (
                    <button 
                      key={genre} 
                      onClick={() => {
                        onGenreSelect(genre);
                        setShowGenres(false);
                      }}
                      className="text-left px-3 py-2 rounded-lg hover:bg-primary/10 text-sm font-semibold text-text-main hover:text-primary hover:translate-x-1 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-primary text-[10px]">▶</span> {genre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => onTabChange('bookshelf')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer flex items-center hover:-translate-y-0.5 hover:shadow-sm ${activeTab === 'bookshelf' ? 'bg-primary/20 text-primary shadow-sm' : 'text-text-main hover:bg-primary/10 hover:text-primary'}`}
            >
              Tủ sách
            </button>

            <button 
              onClick={() => onTabChange('leaderboard')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer flex items-center hover:-translate-y-0.5 hover:shadow-sm ${activeTab === 'leaderboard' ? 'bg-primary/20 text-primary shadow-sm' : 'text-text-main hover:bg-primary/10 hover:text-primary'}`}
            >
              Bảng xếp hạng
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-background-light rounded-full px-4 py-2 border border-accent/10 focus-within:border-primary/50 focus-within:bg-surface transition-all w-72 group">
            <Search className="size-4 text-muted group-focus-within:text-primary mr-2" />
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tìm truyện, tác giả..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted"
            />
          </form>
          
          <div className="h-8 w-[1px] bg-accent/10 mx-2 hidden md:block"></div>

          <button 
            onClick={onToggleDarkMode}
            className="p-2 md:p-2.5 rounded-full bg-background-light text-text-main hover:bg-primary/10 hover:text-primary transition-all shadow-sm border border-accent/10 shrink-0"
            title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            {isDarkMode ? <Sun className="size-4 md:size-5" /> : <Moon className="size-4 md:size-5" />}
          </button>

          <div className="relative shrink-0">
            {user ? (
              <div className="flex items-center gap-2 md:gap-4">
                <button 
                  onClick={() => setShowCheckInModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black hover:bg-primary hover:text-white transition-all group"
                  title="Điểm danh nhận quà"
                >
                  <Sparkles className="size-4 group-hover:animate-spin" />
                  <span className="hidden lg:inline">Điểm danh</span>
                </button>

                <button 
                  onClick={() => onTabChange('creator-studio')}
                  className="hidden md:flex items-center gap-2 px-6 py-2 bg-transparent text-primary border-2 border-primary rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-[0_0_15px_rgba(232,165,165,0.3)] hover:shadow-[0_0_25px_rgba(232,165,165,0.6)]"
                >
                  <BookPlus className="size-4" />
                  <span>Viết Truyện</span>
                </button>

                <button 
                  className="relative p-2 rounded-full bg-background-light text-text-main hover:bg-primary/10 hover:text-primary transition-all border border-accent/10"
                >
                  <Bell className="size-4 md:size-5" />
                  <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                </button>

                <Link
                  href="/vip"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-background-light hover:bg-primary/5 cursor-pointer rounded-full border border-accent/10 transition-colors group"
                >
                  <Coins className="size-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black text-text-main">{userProfile?.coins || 0}</span>
                </Link>

                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="size-8 md:size-10 shrink-0 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary transition-all relative"
                >
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    alt={user.displayName || ''} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                  {userProfile?.badges?.includes('VIP') && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 shadow-sm">
                       <Crown className="size-2 md:size-3" />
                    </div>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-surface rounded-2xl shadow-2xl border border-accent/10 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-accent/5 mb-2">
                      <p className="text-xs font-black text-text-main truncate">{user.displayName}</p>
                      <p className="text-[10px] text-muted truncate">{user.email}</p>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary/10 to-transparent rounded-xl mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="size-3 text-primary fill-primary" />
                        <span className="text-xs font-black text-primary">Cấp {userProfile?.level || 1}</span>
                      </div>
                      <div className="text-[10px] text-muted font-bold">EXP: {userProfile?.exp || 0}</div>
                    </div>
                    
                    {/* Mobile Only Quick Actions in Dropdown */}
                    <div className="flex flex-col gap-1 mb-2 pb-2 border-b border-accent/5 sm:hidden">
                       <Link href="/vip" className="w-full flex items-center justify-between px-4 py-2 hover:bg-background-light rounded-xl">
                          <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm">
                             <Coins className="size-4" /> Nạp Xu
                          </div>
                          <span className="text-xs font-black">{userProfile?.coins || 0}</span>
                       </Link>
                       <button onClick={() => {setShowCheckInModal(true); setShowUserMenu(false)}} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-background-light rounded-xl text-primary font-bold text-sm">
                          <Sparkles className="size-4" /> Điểm danh
                       </button>
                    </div>

                    <button 
                      onClick={() => {
                        onTabChange('creator-studio');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-all mb-1"
                    >
                      <BookPlus className="size-4" />
                      Creator Studio
                    </button>
                    {(user.email === 'phamanhtung.jp@gmail.com' || user.email === 'truyen24hvnn@gmail.com') && (
                      <button 
                        onClick={() => {
                          window.location.href = '/admin';
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all mb-1 uppercase tracking-widest"
                      >
                        <Crown className="size-4" />
                        Admin Panel
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-text-main hover:bg-background-light transition-all mb-1"
                    >
                      <UserIcon className="size-4" />
                      Chỉnh sửa hồ sơ
                    </button>
                    <button 
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="size-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-primary text-white rounded-full text-xs md:text-sm font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all shrink-0"
              >
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden relative shrink-0">
             <button 
               onClick={() => setShowGenres(!showGenres)}
               className="p-2 text-text-main bg-background-light hover:bg-accent/10 rounded-full transition-colors border border-accent/10"
             >
               <Menu className="size-5 md:size-6" />
             </button>
             
             {showGenres && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface rounded-2xl shadow-2xl border border-accent/10 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                   <div className="flex flex-col gap-1 pb-2 border-b border-accent/5 mb-2">
                     <button onClick={() => {onTabChange('discover'); setShowGenres(false)}} className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'discover' ? 'bg-primary/10 text-primary' : 'text-text-main'}`}>Khám phá</button>
                     <button onClick={() => {onTabChange('bookshelf'); setShowGenres(false)}} className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'bookshelf' ? 'bg-primary/10 text-primary' : 'text-text-main'}`}>Tủ sách</button>
                     <button onClick={() => {onTabChange('leaderboard'); setShowGenres(false)}} className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-primary/10 text-primary' : 'text-text-main'}`}>Bảng xếp hạng</button>
                   </div>
                   <div className="px-4 py-2 text-xs font-black text-muted uppercase tracking-widest">Thể loại</div>
                   <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-64 no-scrollbar">
                     {GENRES.map(genre => (
                       <button 
                         key={genre} 
                         onClick={() => {
                           onGenreSelect(genre);
                           setShowGenres(false);
                         }}
                         className="text-left px-3 py-2 rounded-lg hover:bg-primary/10 text-[11px] font-semibold text-text-main hover:text-primary transition-all"
                       >
                         {genre}
                       </button>
                     ))}
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
      {showProfileModal && user && (
        <ProfileEditModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
          onUpdate={() => {}}
        />
      )}
      {showCheckInModal && user && (
        <CheckInModal 
          user={user} 
          onClose={() => setShowCheckInModal(false)} 
        />
      )}
    </header>
  );
}
