"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import NovelDetailView from '@/components/NovelDetailView';
import { auth, loginWithGoogle } from '@/firebase';

export default function NovelDetailClient({ novel }: { novel: any }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <NovelDetailView 
      novel={novel}
      user={user || null}
      onLogin={loginWithGoogle}
      onChapterSelect={(chapter) => {
        router.push(`/doc/${novel.id}/${chapter.id}`);
      }}
      onNovelSelect={(n) => {
        router.push(`/truyen/${n.id}`);
      }}
    />
  );
}
