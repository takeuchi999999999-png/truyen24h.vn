import { MetadataRoute } from 'next';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/firebase-backend';

// Sitemap sẽ được sinh lúc Deploy (build tĩnh) hoặc SSR
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://truyen24h.vn'; // Cập nhật tên miền mới của anh

  // Lấy danh sách ID toàn bộ truyện
  const novelsCol = collection(db, 'novels');
  const novelDocs = await getDocs(query(novelsCol));

  const novelUrls: MetadataRoute.Sitemap = novelDocs.docs.map((doc) => ({
    url: `${baseUrl}/truyen/${doc.id}`,
    lastModified: new Date(doc.data().updatedAt?.toMillis() || Date.now()),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Thêm trang chủ và các trang tĩnh
  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    ...novelUrls,
  ];
}
