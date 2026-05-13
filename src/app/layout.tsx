import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Truyen24h.vn - Thế Giới Truyện Đọc",
    template: "%s | Truyen24h.vn",
  },
  description: "Nền tảng đọc truyện online và sáng tác truyện hàng đầu Việt Nam. Đọc truyện miễn phí, truyện VIP bản quyền, ngôn tình, tiên hiệp, đam mỹ, trọng sinh với trải nghiệm vượt trội và AI tóm tắt thông minh.",
  keywords: ["đọc truyện online", "truyen24h", "truyện hay", "ngôn tình", "tiên hiệp", "đam mỹ", "trọng sinh", "truyện VIP", "sáng tác truyện"],
  authors: [{ name: "Truyen24h.vn" }],
  creator: "Truyen24h.vn",
  publisher: "Truyen24h.vn",
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
  metadataBase: new URL('https://truyen24h.vn'),
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://truyen24h.vn',
    siteName: 'Truyen24h.vn',
    title: 'Truyen24h.vn - Thế Giới Truyện Đọc',
    description: 'Nền tảng đọc truyện online và sáng tác truyện hàng đầu Việt Nam.',
    images: [
      {
        url: '/logo.jpg',
        width: 512,
        height: 512,
        alt: 'Truyen24h.vn Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Truyen24h.vn - Thế Giới Truyện Đọc',
    description: 'Nền tảng đọc truyện online phong phú.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

import CommunityWidget from "@/components/CommunityWidget";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/JsonLd";
import Analytics from "@/components/Analytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Script chặn để tránh flash trắng khi load — chạy trước khi render */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  // Nếu chưa có preference hoặc là 'dark' -> thêm class dark
                  if (theme !== 'light') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Footer />
          <CommunityWidget />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
