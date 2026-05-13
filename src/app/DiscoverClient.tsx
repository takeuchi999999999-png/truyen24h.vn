"use client";

import { useRouter } from 'next/navigation';
import DiscoverView from '@/components/DiscoverView';

export default function DiscoverClient() {
  const router = useRouter();

  return (
    <DiscoverView 
      onNovelSelect={(novel) => {
        router.push(`/truyen/${novel.id}`);
      }}
    />
  );
}
