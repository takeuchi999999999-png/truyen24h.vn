/**
 * Server component for a single novel page.
 *
 * Why Admin SDK instead of the client SDK we used before:
 *   The Firebase client SDK relies on long-lived gRPC streams. On Vercel's
 *   short-lived serverless functions those streams often fail to handshake
 *   in time, producing "Failed to get document because the client is offline"
 *   errors visible in Vercel function logs. Admin SDK uses plain HTTP and
 *   works reliably from any serverless environment.
 *
 *   Bonus: Admin SDK bypasses Firestore Rules, so server reads never get
 *   accidentally throttled by stricter rules in the future.
 */
import { notFound } from 'next/navigation';
import NovelDetailClient from './NovelDetailClient';
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { NovelJsonLd } from '@/components/JsonLd';
import { adminDb } from '@/lib/firebaseAdmin';
import { serializeFirestore } from '@/lib/serialize';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // ISR-style refresh hint, in case Next caches

async function fetchNovel(slug: string) {
  const snap = await adminDb().collection('novels').doc(slug).get();
  if (!snap.exists) return null;
  return serializeFirestore({ id: snap.id, ...snap.data() }) as any;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchNovel(slug);
  if (!data) return { title: 'Truyện không tồn tại' };

  const coverUrl = data.coverUrl || `https://picsum.photos/seed/novel-${slug}/400/600`;
  const canonical = absoluteUrl(`/truyen/${slug}`);

  return {
    title: `${data.title} - Đọc Truyện VIP`,
    description: (data.description || '').slice(0, 150) + '...',
    alternates: { canonical },
    openGraph: {
      title: `${data.title} - ${SITE_NAME}`,
      description: (data.description || '').slice(0, 150) + '...',
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: coverUrl, width: 800, height: 600, alt: `Bìa truyện ${data.title}` }],
      locale: 'vi_VN',
      t