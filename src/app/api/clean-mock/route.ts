import { NextResponse } from 'next/server';
import { db } from '@/firebase-backend';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const novelsRef = collection(db, 'novels');
    const snapshot = await getDocs(novelsRef);
    let count = 0;
    
    // Xóa tất cả các truyện mà title khác "Dạ Vô Cương"
    for (const novelDoc of snapshot.docs) {
      const data = novelDoc.data();
      if (data.title !== 'Dạ Vô Cương') {
        const chaptersRef = collection(db, `novels/${novelDoc.id}/chapters`);
        const chaptersSnapshot = await getDocs(chaptersRef);
        for (const chap of chaptersSnapshot.docs) {
           await deleteDoc(chap.ref);
        }
        await deleteDoc(novelDoc.ref);
        count++;
      }
    }

    return NextResponse.json({ message: `Đã dọn dẹp thành công ${count} bộ truyện!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
