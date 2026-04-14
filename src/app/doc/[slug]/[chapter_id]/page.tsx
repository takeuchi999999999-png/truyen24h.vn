import { getDoc, doc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase-backend';
import ReaderClient from './ReaderClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string, chapter_id: string }> }) {
  const { slug, chapter_id } = await params;
  const chapterRef = doc(db, `novels/${slug}/chapters`, chapter_id);
  const chapterSnap = await getDoc(chapterRef);
  
  if (!chapterSnap.exists()) return { title: 'Đọc truyện' };
  
  return {
    title: `Chương ${chapterSnap.data().chapterNumber}: ${chapterSnap.data().title} - Đọc Truyện VIP`,
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
    <ReaderClient novel={novelData} chapter={chapterData} />
  );
}
