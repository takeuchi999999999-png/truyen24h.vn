/**
 * POST /api/admin/generate-blog-post
 *
 * Generates an AI blog post and writes it to Firestore collection
 * blog_posts. Two modes:
 *   - body.kind = 'review'   - pick a random AI novel and review it
 *   - body.kind = 'listicle' - "Top N truyen {genre} hay nhat thang X"
 *
 * Body (all optional except kind):
 *   { kind, genre?, novelSlug?, count? }
 *
 * Auth: admin only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/apiAuth';
import { adminDb, serverTimestamp } from '@/lib/firebaseAdmin';
import { generateNovelReviewPost, generateListiclePost } from '@/services/aiBlogService';
import { buildCoverUrl } from '@/services/aiCoverService';
import { slugifyWithSuffix } from '@/lib/slug';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const kind = (body.kind || 'review') as 'review' | 'listicle';
    const db = adminDb();

    let post: any;

    if (kind === 'review') {
      // Pick novel: explicit slug from body, or a random recent AI novel
      let novel: any = null;
      if (body.novelSlug) {
        const s = await db.collection('novels').doc(body.novelSlug).get();
        if (s.exists) novel = { id: s.id, ...s.data() };
      } else {
        const snap = await db.collection('novels')
          .where('aiAssisted', '==', true)
          .orderBy('updatedAt', 'desc')
          .limit(5)
          .get();
        if (!snap.empty) {
          const docs = snap.docs;
          const pick = docs[Math.floor(Math.random() * docs.length)];
          novel = { id: pick.id, ...pick.data() };
        }
      }
      if (!novel) {
        return NextResponse.json({ error: 'Khong tim thay truyen AI nao de review' }, { status: 404 });
      }
      const generated = await generateNovelReviewPost({
        novelTitle: novel.title,
        novelSlug: novel.id,
        novelDescription: novel.description,
        genres: novel.genres || [],
        author: novel.author || 'Tac gia an danh',
      });
      post = { ...generated, kind: 'review', relatedNovelSlug: novel.id };
    } else {
      // Listicle for a genre
      const genre = body.genre || 'Ngon Tinh';
      const count = Math.min(Math.max(Number(body.count) || 10, 3), 15);
      const snap = await db.collection('novels')
        .where('genres', 'array-contains', genre)
        .orderBy('updatedAt', 'desc')
        .limit(count)
        .get();
      const novels = snap.docs.map((d: any) => {
        const data = d.data() as any;
        return { title: data.title, slug: d.id, description: data.description };
      });
      if (novels.length < 3) {
        return NextResponse.json(
          { error: 'Can it nhat 3 truyen the loai "' + genre + '" de lam listicle. Hien co ' + novels.length + '.' },
          { status: 400 }
        );
      }
      const generated = await generateListiclePost({ genre, novels });
      post = { ...generated, kind: 'listicle', genre };
    }

    const slug = slugifyWithSuffix(post.title);
    const coverUrl = buildCoverUrl(post.coverPrompt, { width: 1200, height: 630 });

    const doc = {
      slug,
      title: post.title,
      excerpt: post.excerpt,
      contentMarkdown: post.contentMarkdown,
      tags: post.tags,
      coverUrl,
      coverPrompt: post.coverPrompt,
      estimatedReadMinutes: post.estimatedReadMinutes,
      kind: post.kind,
      relatedNovelSlug: post.relatedNovelSlug || null,
      genre: post.genre || null,
      aiAssisted: true,
      publishedBy: auth.email || 'system',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await db.collection('blog_posts').doc(slug).set(doc);
    return NextResponse.json({ ok: true, slug, post: doc });
  } catch (err: any) {
    console.error('[admin/generate-blog-post] error', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
