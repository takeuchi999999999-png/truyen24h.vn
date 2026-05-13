import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, writeBatch, collection, serverTimestamp, increment } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/**
 * POST /api/unlock-chapter
 * Server-side endpoint for unlocking VIP chapters
 * This prevents client-side coin manipulation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyerId, novelId, chapterId, chapterPrice, authorId } = body;

    // Validate required fields
    if (!buyerId || !novelId || !chapterId || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const price = Number(chapterPrice) || 50;

    // 1. Verify buyer exists and has enough coins
    const buyerDoc = await getDoc(doc(db, 'users', buyerId));
    if (!buyerDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const buyerData = buyerDoc.data();
    const currentCoins = buyerData.coins || 0;

    if (currentCoins < price) {
      return NextResponse.json({ error: 'Insufficient coins', currentCoins, required: price }, { status: 400 });
    }

    // 2. Check if already unlocked
    const unlockedChapters: string[] = buyerData.unlockedChapters || [];
    if (unlockedChapters.includes(chapterId)) {
      return NextResponse.json({ error: 'Chapter already unlocked' }, { status: 400 });
    }

    // 3. Execute atomic batch write
    const batch = writeBatch(db);

    // Deduct coins from buyer + add chapter to unlockedChapters
    const buyerRef = doc(db, 'users', buyerId);
    batch.update(buyerRef, {
      coins: increment(-price),
      unlockedChapters: [...unlockedChapters, chapterId],
    });

    // Calculate revenue split: 60% author, 40% platform
    const authorShare = Math.floor(price * 0.6);
    const platformFee = price - authorShare;

    // Credit author (only if buyer != author)
    if (authorId !== buyerId) {
      const authorRef = doc(db, 'users', authorId);
      batch.update(authorRef, {
        coins: increment(authorShare),
      });
    }

    // Log transaction
    const txRef = doc(collection(db, 'transactions'));
    batch.set(txRef, {
      type: 'UNLOCK_CHAPTER',
      chapterId,
      novelId,
      buyerId,
      authorId,
      price,
      authorShare,
      platformFee,
      createdAt: serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Chapter unlocked successfully',
      deducted: price,
      authorShare,
    });
  } catch (error: any) {
    console.error('Unlock chapter error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
