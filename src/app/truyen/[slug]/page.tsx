import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase-backend';
import NovelDetailClient from './NovelDetailClient';
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { NovelJsonLd } from '@/components/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novelRef = doc(db, 'novels', slug);
  const novelSnap = await getDoc(novelRef);

  if (!novelSnap.exists()) return { title: 'Truyện không tồn tại' };

  const data = novelSnap.data();
  const coverUrl = data.coverUrl || `https://picsum.photos/seed/novel-${slug}/400/600`;
  const canonical = absoluteUrl(`/truyen/${slug}`);

  return {
    title: `${data.title} - Đọc Truyện VIP`,
    description: data.description?.slice(0, 150) + '...',
    alternates: { canonical },
    openGraph: {
      title: `${data.title} - ${SITE_NAME}`,
      description: data.description?.slice(0, 150) + '...',
      url: canonical,
      siteName: SITE_NAME,
      images: [
        {
          url: coverUrl,
          width: 800,
          height: 600,
          alt: `Bìa truyện ${data.title}`,
        },
      ],
      locale: 'vi_VN',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description?.slice(0, 150) + '...',
      images: [coverUrl],
    },
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
      <NovelJsonLd novel={novelData} />
      <NovelDetailClient novel={novelData} />
    </>
  );
}
