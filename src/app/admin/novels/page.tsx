/**
 * Admin Novels manager — list, search, toggle hot/full, delete.
 * For deep edits authors use the existing /creator-studio.
 */
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import NovelsManagerClient from '@/components/NovelsManagerClient';

export const metadata = {
  title: 'Quản lý truyện | Admin',
  robots: { index: false, follow: false },
};

export default function NovelsManagerPage() {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col">
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4 backdrop-blur-xl border-b border-accent/10">
        <TopNavBarClientWrapper />
      </header>
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        <NovelsManagerClient />
      </main>
    </div>
  );
}
