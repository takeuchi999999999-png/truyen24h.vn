import { MetadataRoute } from 'next';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/firebase-backend';
import { getSiteUrl } from '@/lib/site';

// Sitemap sẽ được sinh lúc Deploy (build tĩnh) hoặc SSR
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Static pages — đăng ký với Search Console để index nhanh
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'always', priority: 1.0 },
    { url: `${baseUrl}/bang-xep-hang`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/tim-kiem`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/tac-gia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/gioi-thieu`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/vip`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/chinh-sach-bao-mat`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/dieu-khoan-su-dung`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Lấy danh sách ID toàn bộ truyện
  try {
    const novelsCol = collection(db, 'novels');
    const novelDocs = await getDocs(query(novelsCol));

    const novelUrls: MetadataRoute.Sitemap = novelDocs.docs.map((doc) => ({
      url: `${baseUrl}/truyen/${doc.id}`,
      lastModified: new Date(doc.data().updatedAt?.toMillis?.() || Date.now()),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...staticPages, ...novelUrls];
  } catch {
    // Khi build chưa có Firebase credentials, fall back về static only.
    return staticPages;
  }
}
