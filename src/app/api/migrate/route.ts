import { NextResponse } from 'next/server';
import { db } from '@/firebase-backend';
import { NOVELS } from '@/constants';
import { doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    let novelCount = 0;
    
    // Push novels and chapters
    for (const novel of NOVELS) {
      // Clean up chapters from novel document to save document size if needed, 
      // but for simplicity we can store the whole structure as is for now,
      // or we can store NOVEL doc without chapters, and CHAPTER docs separate.
      // Firestore has 1MB limit. Let's separate them.
      
      const { chapters, ...novelData } = novel;
      
      await setDoc(doc(db, 'novels', novel.id), novelData);
      novelCount++;
      
      // Store chapters in a subcollection or separate collection
      if (chapters) {
        for (const chap of chapters) {
          await setDoc(doc(db, `novels/${novel.id}/chapters`, chap.id), chap);
        }
      }
    }

    return NextResponse.json({ message: `Đã Migrate thành công ${novelCount} bộ truyện!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
