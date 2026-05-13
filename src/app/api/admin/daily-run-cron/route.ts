/**
 * GET /api/admin/daily-run-cron
 *
 * Thin wrapper around POST /api/admin/daily-run designed for Vercel Cron.
 *
 * How Vercel Cron auth works:
 *   - When Vercel triggers a cron job, it sends `Authorization: Bearer <CRON_SECRET>`
 *     where `CRON_SECRET` is auto-set on Vercel projects with cron config.
 *   - We just compare against that env var. Manual hits without it get 401.
 *
 * Defaults: 2 new novels + 5 chapter continuations per run.
 * Override with query params: `?newNovels=3&continueNovels=10`.
 */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, getDocs, query, where, orderBy, limit,
  doc, setDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
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
export const maxDuration = 300;

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

export async function GET(req: NextRequest) {
  // Vercel sets Authorization: Bearer CRON_SECRET automatically for cron.
  // Accept either CRON_SECRET (Vercel-managed) or our own ADMIN_API_TOKEN
  // so external cron services (cron-job.org, GitHub Actions) work too.
  const authHeader = req.headers.get('authorization') || '';
  const provided = authHeader.replace(/^Bearer\s+/i, '').trim();
  const cronSecret = process.env.CRON_SECRET;
  const adminToken = process.env.ADMIN_API_TOKEN;
  const ok =
    (cronSecret && provided === cronSecret) ||
    (adminToken && provided === adminToken);
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const newNovels = Math.min(Math.max(Number(searchParams.get('newNovels')) || 2, 0), 5);
  const continueNovels = Math.min(Math.max(Number(searchParams.get('continueNovels')) || 5, 0), 20);

  const startedAt = new Date().toISOString();
  const summary = {
    startedAt,
    finishedAt: '',
    newNovelsCreated: [] as Array<{ slug: string; title: string; chapters: number }>,
    chaptersContinued: [] as Array<{ slug: string; chapterNumber: number }>,
    errors: [] as Array<{ stage: string; message: string }>,
  };

  try {
    if (newNovels > 0) {
      const topics = await discoverTrendingTopics({ count: newNovels });
      for (const t of topics) {
        try {
          const outline = await generateNovelOutline({ topic: t.topic, genres: t.suggestedGenres });
          const slug = `${slugify(outline.title)}-${Date.now().toString(36).slice(-4)}`;
          const coverUrl = buildCoverUrl(outline.coverPrompt);
          const bannerUrl = buildBannerUrl(outline.coverPrompt, outline.title);

          await setDoc(doc(db, 'novels', slug), {
            id: slug, title: outline.title, author: outline.author,
            authorId: 'system-ai', description: outline.description,
            coverUrl, bannerUrl,
            genres: outline.genres, tags: outline.tags,
            status: 'Đang ra', views: '0', rating: 0,
            isHot: true, isFull: false, latestChapterNumber: 0,
            aiAssisted: true, publishedBy: 'cron',
            hook: outline.hook, coverPrompt: outline.coverPrompt,
            createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
          });

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
            const batch = writeBatch(db);
            batch.set(doc(db, `novels/${slug}/chapters`, `c${n}`), {
              id: `c${n}`, title: chapter.title, content: chapter.content,
              chapterNumber: n, isVip: false, price: 0,
              publishDate: serverTimestamp(), aiAssisted: true,
            });
            batch.update(doc(db, 'novels', slug), {
              latestChapterNumber: n, updatedAt: serverTimestamp(),
              lastUpdated: new Date().toISOString(),
              lastCliffhanger: chapter.cliffhanger,
            });
            await batch.commit();
            chaptersWritten++;
          }
          summary.newNovelsCreated.push({ slug, title: outline.title, chapters: chaptersWritten });
        } catch (e: any) {
          summary.errors.push({ stage: `new-novel:${t.topic}`, message: e.message });
        }
      }
    }

    if (continueNovels > 0) {
      const novelsQuery = query(
        collection(db, 'novels'),
        where('aiAssisted', '==', true),
        where('status', '==', 'Đang ra'),
        orderBy('updatedAt', 'asc'),
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
          const batch = writeBatch(db);
          batch.set(doc(db, `novels/${docSnap.id}/chapters`, `c${nextNum}`), {
            id: `c${nextNum}`, title: chapter.title, content: chapter.content,
            chapterNumber: nextNum, isVip, price,
            publishDate: serverTimestamp(), aiAssisted: true,
          });
          batch.update(doc(db, 'novels', docSnap.id), {
            latestChapterNumber: nextNum,
            updatedAt: serverTimestamp(),
            lastUpdated: new Date().toISOString(),
            lastCliffhanger: chapter.cliffhanger,
          });
          await batch.commit();
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
