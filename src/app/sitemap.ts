/**
 * Sitemap — emitted on every request (Next.js calls this in a server context).
 *
 * Uses Firebase Admin SDK so it works reliably in Vercel serverless. The
 * Firebase client SDK relies on long-lived gRPC streams that frequently
 * fail to initialize inside short-lived serverless invocations.
 */
import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'always', priority: 1.0 },
    { url: `${baseUrl}/bang-xep-hang`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/tim-kiem`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/tac-gia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/gioi-thieu`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/vip`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/chinh-sach-bao-mat`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/dieu-khoan-su-dung`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const snap = await adminDb().collection('novels').get();
    const novelUrls: MetadataRoute.Sitemap = snap.docs.map((d: any) => {
      const data = d.data() as any;
      const ms = data.updatedAt?.toMillis?.() ?? Date.now();
      return {
        url: `${baseUrl}/truyen/${d.id}`,
        lastModified: new Date(ms),
        changeFrequency: 'daily',
        priority: 0.8,
      };
    });
    // Blog posts
    let blogUrls: MetadataRoute.Sitemap = [];
    try {
      const blogSnap = await adminDb().collection('blog_posts').get();
      blogUrls = blogSnap.docs.map((d: any) => {
        const data = d.data() as any;
        const ms = data.updatedAt?.toMillis?.() ?? data.createdAt?.toMillis?.() ?? Date.now();
        return {
          url: `${baseUrl}/blog/${d.id}`,
          lastModified: new Date(ms),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });
    } catch {
      // Blog collection might not exist yet — that's fine.
    }

    return [...staticPages, ...novelUrls, ...blogUrls];
  } catch (err) {
    // Fall back to static-only if admin creds aren't configured yet.
    return staticPages