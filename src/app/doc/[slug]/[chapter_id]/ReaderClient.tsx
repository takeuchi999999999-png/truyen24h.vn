"use client";

import { useRouter } from 'next/navigation';
import ReaderView from '@/components/ReaderView';
import { loginWithGoogle } from '@/firebase';

export default function ReaderClient({ novel, chapter }: { novel: any, chapter: any }) {
  const router = useRouter();

  return (
    <ReaderView 
      novel={novel}
      chapter={chapter}
      onBack={() => router.push(`/truyen/${novel.id}`)}
      onLogin={loginWithGoogle}
      onChapterChange={(ch) => {
         router.push(`/doc/${novel.id}/${ch.id}`);
      }}
    />
  );
}
