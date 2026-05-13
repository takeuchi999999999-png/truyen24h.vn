import { getDoc, doc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase-backend';
import ReaderClient from './ReaderClient';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { ChapterJsonLd } from '@/components/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ slug: string, chapter_id: string }> }) {
  const { slug, chapter_id } = await params;
  const novelRef = doc(db, 'novels', slug);
  const novelSnap = await getDoc(novelRef);
  const chapterRef = doc(db, `novels/${slug}/chapters`, chapter_id);
  const chapterSnap = await getDoc(chapterRef);

  if (!chapterSnap.exists() || !novelSnap.exists()) return { title: 'Đọc truyện' };

  const novelData = novelSnap.data();
  const chapterData = chapterSnap.data();
  const coverUrl = novelData.coverUrl || `https://picsum.photos/seed/novel-${slug}/400/600`;

  const pageTitle = `Chương ${chapterData.chapterNumber}: ${chapterData.title} - ${novelData.title}`;
  const pageDesc = `Đọc Chương ${chapterData.chapterNumber} của bộ truyện ${novelData.title} trên Truyen24h.`;
  const canonical = absoluteUrl(`/doc/${slug}/${chapter_id}`);

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: { canonical },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: canonical,
      siteName: SITE_NAME,
      images: [
        {
          url: coverUrl,
          width: 800,
          height: 600,
          alt: `Bìa truyện ${novelData.title}`,
        },
      ],
      locale: 'vi_VN',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: [coverUrl],
    },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string, chapter_id: string }> }) {
  const { slug, chapter_id } = await params;
  const novelRef = doc(db, 'novels', slug);
  const novelSnap = await getDoc(novelRef);
  
  const chapterRef = doc(db, `novels/${slug}/chapters`, chapter_id);
  const chapterSnap = await getDoc(chapterRef);

  if (!novelSnap.exists() || !chapterSnap.exists()) {
    return <div className="p-20 text-center text-white">Chương nội dung không tồn tại hoặc đã phân quyền.</div>;
  }

  const chaptersRef = collection(db, `novels/${slug}/chapters`);
  const q = query(chaptersRef, orderBy('chapterNumber', 'asc'));
  const chaptersSnap = await getDocs(q);
  const chaptersData = chaptersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const novelData = { id: novelSnap.id, ...novelSnap.data(), chapters: chaptersData } as any;
  const chapterData = { id: chapterSnap.id, ...chapterSnap.data() } as any;

  return (
    <>
      <ChapterJsonLd novel={novelData} chapter={chapterData} />
      <ReaderClient novel={novelData} chapter={chapterData} />
    </>
  );
}
