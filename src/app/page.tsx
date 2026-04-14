import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import DiscoverClient from './DiscoverClient';

export const metadata = {
  title: 'Truyen24h - Đọc Truyện VIP, Nền Tảng Sáng Tác Hiện Đại',
  description: 'Nền tảng đọc truyện online và sáng tác truyện Việt Nam. Đọc truyện miễn phí, truyện VIP bản quyền nhanh nhất, chất lượng tốt nhất với trải nghiệm vượt trội.',
  openGraph: {
    title: 'Truyen24h - Đọc Truyện VIP',
    description: 'Nền tảng đọc truyện, tiểu thuyết online chất lượng cao.',
    url: 'https://truyen24h.com',
    siteName: 'Truyen24h',
    images: [
      {
        url: 'https://picsum.photos/seed/truyen24h/1200/630', // temporary placeholder banner
        width: 1200,
        height: 630,
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
