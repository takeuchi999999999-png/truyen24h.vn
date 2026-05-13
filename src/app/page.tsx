import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import DiscoverClient from './DiscoverClient';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const metadata = {
  title: 'Truyen24h.vn - Đọc Truyện VIP, Nền Tảng Sáng Tác Hiện Đại',
  description: 'Nền tảng đọc truyện online và sáng tác truyện Việt Nam. Đọc truyện miễn phí, truyện VIP bản quyền nhanh nhất, chất lượng tốt nhất với trải nghiệm vượt trội.',
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: 'Truyen24h.vn - Đọc Truyện VIP',
    description: 'Nền tảng đọc truyện, tiểu thuyết online chất lượng cao.',
    url: getSiteUrl(),
    siteName: SITE_NAME,
    images: [
      {
        url: '/logo.jpg',
        width: 512,
        height: 512,
        alt: 'Truyen24h Banner',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Truyen24h - Đọc Truyện VIP',
    description: 'Nền tảng đọc truyện online phong phú.',
  },
};

export default function App() {
  return (
    <>
      <TopNavBarClientWrapper />
      <DiscoverClient />
    </>
  );
}
