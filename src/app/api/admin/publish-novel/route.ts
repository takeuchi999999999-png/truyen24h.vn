/**
 * POST /api/admin/publish-novel
 *
 * Writes an AI-generated (or manually drafted) novel into Firestore.
 * Idempotent: re-running with the same slug overwrites the doc.
 *
 * Body: {
 *   slug?: string,            // optional - auto-generated from title if omitted
 *   title, author, description, genres,
 *   coverUrl?, bannerUrl?,
 *   tags?: string[],
 *   isHot?: boolean,
 *   aiAssisted?: boolean      // defaults true when called from AI pipeline
 * }
 *
 * Auth: admin only (x-admin-token or x-admin-email).
 */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { authorizeAdmin } from '@/lib/apiAuth';
import { buildCoverUrl, buildBannerUrl } from '@/services/aiCoverService';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Convert a Vietnamese title into a URL-safe slug.
 * Removes diacritics, replaces non-alphanumeric with dashes, collapses runs.
 */
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });

  try {
    const body = await req.json();
    const {
      slug: explicitSlug,
      title,
      author,
      description,
      genres = [],
      coverUrl: explicitCover,
      bannerUrl: explicitBanner,
      tags = [],
      isHot = true,
      aiAssisted = true,
      authorId = 'system-ai',
      coverPrompt,
      hook,
    } = body;

    if (!title || !description || !author) {
      return NextResponse.json({ error: 'Missing title / description / author' }, { status: 400 });
    }

    const slug = (explicitSlug || slugify(title)) + (explicitSlug ? '' : `-${Date.now().toString(36)}`);

    // Auto-generate cover/banner from the AI prompt when the caller didn't
    // supply explicit URLs. This way every AI-generated novel ships with
    // a unique cover without an extra API round-trip.
    const promptForImage = coverPrompt || `${title} — ${genres.join(', ')}`;
    const coverUrl = explicitCover || buildCoverUrl(promptForImage);
    const bannerUrl = explicitBanner || buildBannerUrl(promptForImage, title);

    const novelDoc = {
      id: slug,
      title,
      author,
      authorId,
      description,
      coverUrl,
      bannerUrl,
      genres,
      status: 'Đang ra' as const,
      views: '0',
      rating: 0,
      isHot,
      isFull: false,
      lastUpdated: new Date().toISOString(),
      latestChapterNumber: 0,
      tags,
      aiAssisted,
      hook: hook || '',
      coverPrompt: coverPrompt || '',
      publishedBy: auth.email || 'system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'novels', slug), novelDoc, { merge: true });

    return NextResponse.json({ ok: true, slug, novel: novelDoc });
  } catch (err: any) {
    console.error('[admin/publish-novel] error', err);
    return NextResponse.json({ error: err.message || 'Publish failed' }, { status: 500 });
  }
}
