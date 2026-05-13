"use client";

import TopNavBar from './TopNavBar';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function TopNavBarClientWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, login, logout, isDarkMode, toggleDarkMode } = useAuth();

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
      onLogin={login}
      onLogout={logout}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
    />
  );
}
