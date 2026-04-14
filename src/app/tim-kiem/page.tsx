"use client";

import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import FilterView from '@/components/FilterView';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const genre = searchParams.get('genre') || undefined;
  const q = searchParams.get('q') || undefined;

  return (
    <>
      <TopNavBarClientWrapper />
      <FilterView 
        initialGenre={genre} 
        initialSearch={q} 
        onNovelSelect={(novel) => router.push(`/truyen/${novel.id}`)} 
      />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
