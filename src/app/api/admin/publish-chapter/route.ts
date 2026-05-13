/**
 * POST /api/admin/publish-chapter
 *
 * Adds a new chapter to an existing novel and bumps the novel's
 * latestChapterNumber + updatedAt for sitemap freshness.
 *
 * Body: {
 *   novelId, title, content, chapterNumber,
 *   isVip?: boolean (default false for chapter 1-2, true otherwise),
 *   price?: number (default 50 if VIP),
 *   aiAssisted?: boolean
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, doc, setDoc, updateDoc, serverTimestamp, writeBatch, getDoc
} from 'firebase/firestore';
import { authorizeAdmin } from '@/lib/apiAuth';

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

export async function POST(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });

  try {
    const body = await req.json();
    const {
      novelId,
      title,
      content,
      chapterNumber,
      isVip,
      price,
      aiAssisted = true,
    } = body;

    if (!novelId || !title || !content || !chapterNumber) {
      return NextResponse.json(
        { error: 'Missing novelId / title / content / chapterNumber' },
        { status: 400 }
      );
    }

    const num = Number(chapterNumber);
    // Default policy: chapters 1-3 are free, 4+ are VIP at 50 coins
    const finalIsVip = typeof isVip === 'boolean' ? isVip : num >= 4;
    const finalPrice = finalIsVip ? Number(price) || 50 : 0;

    const chapterId = `c${num}`;
    const chapterDoc = {
      id: chapterId,
      title,
      content,
      chapterNumber: num,
      isVip: finalIsVip,
      price: finalPrice,
      publishDate: serverTimestamp(),
      aiAssisted,
    };

    // Single batch: write chapter + bump novel meta
    const batch = writeBatch(db);
    batch.set(doc(db, `novels/${novelId}/chapters`, chapterId), chapterDoc);
    batch.update(doc(db, 'novels', novelId), {
      latestChapterNumber: num,
      updatedAt: serverTimestamp(),
      lastUpdated: new Date().toISOString(),
    });

    await batch.commit();

    return NextResponse.json({ ok: true, chapterId, isVip: finalIsVip, price: finalPrice });
  } catch (err: any) {
    console.error('[admin/publish-chapter] error', err);
    return NextResponse.json({ error: err.message || 'Publish failed' }, { status: 500 });
  }
}
