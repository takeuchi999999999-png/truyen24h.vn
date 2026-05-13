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
 * POST /api/donate
 * Server-side endpoint for donating coins to an author
 * This prevents client-side coin manipulation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donorId, authorId, amount } = body;

    // Validate
    if (!donorId || !authorId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const donateAmount = Number(amount);
    if (donateAmount <= 0 || donateAmount > 100000) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (donorId === authorId) {
      return NextResponse.json({ error: 'Cannot donate to yourself' }, { status: 400 });
    }

    // Verify donor has enough coins
    const donorDoc = await getDoc(doc(db, 'users', donorId));
    if (!donorDoc.exists()) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
    }

    const donorData = donorDoc.data();
    if ((donorData.coins || 0) < donateAmount) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Execute batch
    const batch = writeBatch(db);

    // Deduct from donor
    batch.update(doc(db, 'users', donorId), {
      coins: increment(-donateAmount),
      contributionScore: increment(donateAmount),
    });

    // Credit author
    batch.update(doc(db, 'users', authorId), {
      coins: increment(donateAmount),
    });

    // Log transaction
    const txRef = doc(collection(db, 'transactions'));
    batch.set(txRef, {
      type: 'DONATE',
      donorId,
      authorId,
      buyerId: donorId,
      amount: donateAmount,
      createdAt: serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Donated ${donateAmount} coins successfully`,
    });
  } catch (error: any) {
    console.error('Donate error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
