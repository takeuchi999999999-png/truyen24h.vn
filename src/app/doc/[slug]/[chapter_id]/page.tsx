/**
 * Server component for a single chapter page.
 *
 * Uses Firebase Admin SDK (HTTP REST) instead of the client SDK (gRPC)
 * because gRPC streams don't reliably initialize inside Vercel's
 * short-lived serverless functions. See /truyen/[slug]/page.tsx for the
 * full rationale.
 */
import ReaderClient from './ReaderClient';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { ChapterJsonLd } from '@/components/JsonLd';
import { adminDb } from '@/lib/firebaseAdmin';
import { serializeFirestore } from '@/lib/serialize';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function fetchNovelAndChapter(slug: string, chapterId: string) {
  const db = adminDb();
  const novelSnap = await db.collection('novels').doc(slug).get();
  if (!novelSnap.exists) return null;

  const chapterSnap = await db.doc(`novels/${slug}/chapters/${chapterId}`).get();
  if (!chapterSnap.exists) return { novel: novelSnap, chapter: null };

  // Sibling chapters for the in-reader chapter list.
  const chaptersSnap = await db
    .collection(`novels/${slug}/chapters`)
    .orderBy('chapterNumber', 'asc')
    .get();
  const chaptersData = chaptersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    novel: serializeFirestore({ id: novelSnap.id, ...novelSnap.data(), chapters: chaptersData }) as any,
    chapter: serializeFirestore({ id: chapterSnap.id, ...chapterSnap.data() }) as any,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string, chapter_id: string }> }) {
  const { slug, chapter_id } = await params;
  const result = await fetchNovelAndChapter(slug, chapter_id);
  if (!result || !result.chapter) return { title: 'Đọc truyện' };

  const { novel, chapter } = result as any;
  const coverUrl = novel.coverUrl || `https://picsum.photos/seed/novel-${slug}/400/600`;
  const pageTitle = `Chương ${chapter.chapterNumber}: ${chapter.title} - ${novel.title}`;
  const pageDesc = `Đọc Chương ${chapter.chapterNumber} của bộ truyện ${novel.title} trên Truyen24h.`;
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
      images: [{ url: coverUrl, width: 800, height: 600, alt: `Bìa truyện ${novel.title}` }],
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
  const result = await fetchNovelAndChapter(slug, chapter_id);

  if (!result || !result.chapter) {
    return <div className="p-20 text-center text-white">Chương nội dung không tồn tại ho�