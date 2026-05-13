import { NextResponse } from 'next/server';
import { db } from '@/firebase-backend';
import { collection, getDocs, doc, updateDoc, getCountFromServer } from 'firebase/firestore';

export async function GET() {
  try {
    const novelsRef = collection(db, 'novels');
    const snapshot = await getDocs(novelsRef);
    let count = 0;

    for (const novelDoc of snapshot.docs) {
      const data = novelDoc.data();
      if (data.latestChapterNumber === undefined) {
        // Query the chapters subcollection
        const chaptersRef = collection(db, `novels/${novelDoc.id}/chapters`);
        const chaptersSnapshot = await getDocs(chaptersRef);
        let maxChapterNumber = 0;
        
        chaptersSnapshot.forEach(chap => {
          const chapRef = chap.data();
          if (chapRef.chapterNumber > maxChapterNumber) {
            maxChapterNumber = chapRef.chapterNumber;
          }
        });

        if (chaptersSnapshot.size > 0) {
          await updateDoc(doc(db, 'novels', novelDoc.id), {
            latestChapterNumber: maxChapterNumber
          });
          count++;
        }
      }
    }

    return NextResponse.json({ message: `Đã fix thành công ${count} bộ truyện bị thiếu số chương!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
