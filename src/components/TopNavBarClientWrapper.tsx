"use client";

import TopNavBar from './TopNavBar';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, loginWithGoogle, logout } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function TopNavBarClientWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // Mặc định dark, đọc preference từ localStorage nếu user đã từng đổi
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Khởi tạo: đọc từ localStorage, nếu chưa có gì thì mặc định dark
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved !== 'light'; // dark là default
    setIsDarkMode(prefersDark);
  }, []);

  // Áp dụng class dark và lưu vào localStorage mỗi khi đổi
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const activeTab = pathname.startsWith('/bang-xep-hang') ? 'leaderboard' : 
                    pathname.startsWith('/tu-sach') ? 'bookshelf' :
                    pathname.startsWith('/creator-studio') ? 'creator-studio' : 'discover';

  const handleTabChange = (tab: 'discover' | 'bookshelf' | 'leaderboard' | 'creator-studio') => {
    switch(tab) {
      case 'discover': router.push('/'); break;
      case 'bookshelf': router.push('/tu-sach'); break;
      case 'leaderboard': router.push('/bang-xep-hang'); break;
      case 'creator-studio': router.push('/creator-studio'); break;
    }
  };

  return (
    <TopNavBar 
      activeTab={activeTab as any}
      onTabChange={handleTabChange}
      onGenreSelect={(genre) => router.push(`/tim-kiem?genre=${encodeURIComponent(genre)}`)}
      onChapterFilterSelect={(filter) => router.push(`/tim-kiem?chapters=${encodeURIComponent(filter)}`)}
      onSearch={(term) => router.push(`/tim-kiem?q=${encodeURIComponent(term)}`)}
      user={user}
      onLogin={loginWithGoogle}
      onLogout={logout}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
    />
  );
}
