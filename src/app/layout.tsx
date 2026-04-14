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
  title: "Truyen24h.vn - Thế Giới Truyện Đọc",
  description: "Bản quyền truyện online.",
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

import CommunityWidget from "@/components/CommunityWidget";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
      </head>
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        {children}
        <Footer />
        <CommunityWidget />
      </body>
    </html>
  );
}
