import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase-backend';
import NovelDetailClient from './NovelDetailClient';
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';

// SSR Fetching
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novelRef = doc(db, 'novels', slug);
  const novelSnap = await getDoc(novelRef);
  
  if (!novelSnap.exists()) return { title: 'Truyện không tồn tại' };
  
  const data = novelSnap.data();
  return {
    title: `${data.title} - Đọc Truyện VIP`,
    description: data.description?.slice(0, 150) + '...',
  };
}

export default async function NovelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novelRef = doc(db, 'novels', slug);
  const novelSnap = await getDoc(novelRef);

  if (!novelSnap.exists()) {
    return <div className="p-20 text-center text-white">Truyện không tồn tại hoặc đã bị xóa.</div>;
  }

  const novelData = { id: novelSnap.id, ...novelSnap.data() } as any;

  return (
    <>
      <TopNavBarClientWrapper />
      <NovelDetailClient novel={novelData} />
    </>
  );
}
