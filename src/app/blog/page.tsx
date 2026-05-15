/**
 * /blog — list of all AI-curated blog posts (reviews + listicles).
 *
 * Server component using Firebase Admin SDK so it works in Vercel
 * serverless functions (the client SDK relies on gRPC streams that
 * don't initialize reliably in short-lived invocations).
 */
import Link from 'next/link';
import { adminDb } from '@/lib/firebaseAdmin';
import { serializeFirestore } from '@/lib/serialize';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Blog & Review Truyện',
  description:
    'Đọc review truyện chữ tiếng Việt mới nhất, top truyện hot theo thể loại, mẹo chọn truyện hay tại Truyen24h.vn.',
  alternates: { canonical: absoluteUrl('/blog') },
  openGraph: {
    title: `Blog & Review Truyện | ${SITE_NAME}`,
    description: 'Review, listicle và mẹo đọc truyện chữ tiếng Việt mới nhất.',
    url: absoluteUrl('/blog'),
    siteName: SITE_NAME,
    locale: 'vi_VN',
    type: 'website',
  },
};

interface BlogRow {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl?: string;
  tags?: string[];
  estimatedReadMinutes?: number;
  kind?: 'review' | 'listicle';
  createdAt?: number;
}

async function fetchPosts(): Promise<BlogRow[]> {
  try {
    const snap = await adminDb()
      .collection('blog_posts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    return snap.docs.map((d: any) => serializeFirestore({ slug: d.id, ...d.data() })) as BlogRow[];
  } catch {
    return [];
  }
}

export default async function BlogIndexPage() {
  const posts = await fetchPosts();
  return (
    <>
      <TopNavBarClientWrapper />
      <main className="w-full bg-background text-text-main min-h-screen">
        <section className="max-w-5xl mx-auto px-4 pt-32 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 mb-4">
            Blog · Review
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
            Review & Top truyện <span className="text-primary">hot nhất</span>
          </h1>
          <p className="text-muted max-w-2xl">
            Bài review chi tiết, listicle thể loại, mẹo đọc truyện chữ tiếng Việt — cập nhật liên tục.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-24">
          {posts.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface border border-accent/10 text-center text-muted">
              Chưa có bài blog nào. Quay lại sau nhé!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group bg-surface rounded-2xl border border-accent/10 overflow-hidden hover:border-primary/40 transition-all"
                >
                  {p.coverUrl && (
                    <div className="aspect-[16/9] overflow-hidden bg-background">
                      <img
                        src={p.coverUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {p.kind === 'review' ? (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-pink-500/15 text-pink-400">
                          Review
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">
                          Top list
                        </span>
                      )}
                      {p.estimatedReadMinutes && (
                        <span className="text-[10px] text-muted">{p.estimatedReadMinutes} phút đọc</span>
                      )}
                    </div>
                    <h2 className="font-black text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {p.title}
                    </h2>
                    <p className="text-sm text-muted line-clamp-3">{p.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
