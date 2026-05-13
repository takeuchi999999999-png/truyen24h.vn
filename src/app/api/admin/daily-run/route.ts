/**
 * POST /api/admin/daily-run
 *
 * The "daily admin" pipeline. One call:
 *   1. Discover N trending topics
 *   2. Generate N new novels (outline + first 2 chapters each)
 *   3. Pick M existing AI novels and write +1 chapter for each
 *   4. Write everything to Firestore
 *
 * Typically wired to a scheduled task running ~8am Asia/Ho_Chi_Minh.
 *
 * Body (all optional):
 *   { newNovels?: number, continueNovels?: number, dryRun?: boolean }
 *
 * Auth: admin only.
 *
 * Returns a summary suitable for posting back in chat / Slack.
 */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, getDocs, query, where, orderBy, limit,
  doc, setDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { authorizeAdmin } from '@/lib/apiAuth';
import {
  discoverTrendingTopics,
  generateNovelOutline,
  generateChapter,
} from '@/services/aiStoryService';
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
export const maxDuration = 300; // long because we call Gemini multiple times

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const newNovels = Math.min(Math.max(Number(body.newNovels) || 2, 0), 5);
  const continueNovels = Math.min(Math.max(Number(body.continueNovels) || 5, 0), 20);
  const dryRun = !!body.dryRun;

  const startedAt = new Date().toISOString();
  const summary = {
    startedAt,
    finishedAt: '',
    newNovelsCreated: [] as Array<{ slug: string; title: string; chapters: number }>,
    chaptersContinued: [] as Array<{ slug: string; chapterNumber: number }>,
    errors: [] as Array<{ stage: string; message: string }>,
    dryRun,
  };

  try {
    /* ---------- 1. NEW NOVELS ---------- */
    if (newNovels > 0) {
      const topics = await discoverTrendingTopics({ count: newNovels });
      for (const t of topics) {
        try {
          const outline = await generateNovelOutline({
            topic: t.topic,
            genres: t.suggestedGenres,
          });
          const slug = `${slugify(outline.title)}-${Date.now().toString(36).slice(-4)}`;

          const coverUrl = buildCoverUrl(outline.coverPrompt, { seed: undefined });
          const bannerUrl = buildBannerUrl(outline.coverPrompt, outline.title);

          if (!dryRun) {
            await setDoc(doc(db, 'novels', slug), {
              id: slug,
              title: outline.title,
              author: outline.author,
              authorId: 'system-ai',
              description: outline.description,
              coverUrl,
              bannerUrl,
              genres: outline.genres,
              tags: outline.tags,
              status: 'Đang ra',
              views: '0',
              rating: 0,
              isHot: true,
              isFull: false,
              latestChapterNumber: 0,
              aiAssisted: true,
              publishedBy: auth.email || 'system',
              hook: outline.hook,
              coverPrompt: outline.coverPrompt,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          // 2 chapters for fresh momentum
          let previousSummary = '';
          let chaptersWritten = 0;
          for (let n = 1; n <= 2; n++) {
            const chapter = await generateChapter({
              novelTitle: outline.title,
              novelDescription: outline.description,
              genres: outline.genres,
              chapterNumber: n,
              previousSummary,
              targetWordCount: 1700,
            });
            previousSummary = chapter.cliffhanger;

            if (!dryRun) {
              const batch = writeBatch(db);
              batch.set(doc(db, `novels/${slug}/chapters`, `c${n}`), {
                id: `c${n}`,
                title: chapter.title,
                content: chapter.content,
                chapterNumber: n,
                isVip: false, // first 2 chapters always free
                price: 0,
                publishDate: serverTimestamp(),
                aiAssisted: true,
              });
              batch.update(doc(db, 'novels', slug), {
                latestChapterNumber: n,
                updatedAt: serverTimestamp(),
                lastUpdated: new Date().toISOString(),
              });
              await batch.commit();
            }
            chaptersWritten++;
          }

          summary.newNovelsCreated.push({ slug, title: outline.title, chapters: chaptersWritten });
        } catch (e: any) {
          summary.errors.push({ stage: `new-novel:${t.topic}`, message: e.message });
        }
      }
    }

    /* ---------- 2. CONTINUE EXISTING ---------- */
    if (continueNovels > 0) {
      const novelsQuery = query(
        collection(db, 'novels'),
        where('aiAssisted', '==', true),
        where('status', '==', 'Đang ra'),
        orderBy('updatedAt', 'asc'), // oldest first to keep all alive
        limit(continueNovels)
      );
      const snap = await getDocs(novelsQuery);
      for (const docSnap of snap.docs) {
        try {
          const data = docSnap.data() as any;
          const nextNum = (data.latestChapterNumber || 0) + 1;
          const chapter = await generateChapter({
            novelTitle: data.title,
            novelDescription: data.description,
            genres: data.genres || [],
            chapterNumber: nextNum,
            previousSummary: data.lastCliffhanger || '',
            targetWordCount: 1800,
          });

          const isVip = nextNum >= 4;
          const price = isVip ? 50 : 0;

          if (!dryRun) {
            const batch = writeBatch(db);
            batch.set(doc(db, `novels/${docSnap.id}/chapters`, `c${nextNum}`), {
              id: `c${nextNum}`,
              title: chapter.title,
              content: chapter.content,
              chapterNumber: nextNum,
              isVip,
              price,
              publishDate: serverTimestamp(),
              aiAssisted: true,
            });
            batch.update(doc(db, 'novels', docSnap.id), {
              latestChapterNumber: nextNum,
              updatedAt: serverTimestamp(),
              lastUpdated: new Date().toISOString(),
              lastCliffhanger: chapter.cliffhanger,
            });
            await batch.commit();
          }

          summary.chaptersContinued.push({ slug: docSnap.id, chapterNumber: nextNum });
        } catch (e: any) {
          summary.errors.push({ stage: `continue:${docSnap.id}`, message: e.message });
        }
      }
    }
  } catch (err: any) {
    summary.errors.push({ stage: 'top-level', message: err.message });
  }

  summary.finishedAt = new Date().toISOString();
  return NextResponse.json(summary);
}
