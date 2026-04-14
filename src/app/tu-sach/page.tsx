"use client";

import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import BookshelfView from '@/components/BookshelfView';
import { useState, useEffect } from 'react';
import { auth, loginWithGoogle } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function BookshelfPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <>
      <TopNavBarClientWrapper />
      <BookshelfView 
        user={user} 
        onLogin={loginWithGoogle} 
        onNovelSelect={(novel) => router.push(`/truyen/${novel.id}`)} 
      />
    </>
  );
}
