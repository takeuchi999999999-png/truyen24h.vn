/**
 * Admin revenue dashboard — read-only summary of platform earnings.
 *
 * Data source: `transactions` collection (logged by /api/unlock-chapter
 * and /api/donate). Aggregates today / 7d / 30d in the client so admins
 * can audit the live state without a backend pipeline.
 */
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import RevenueDashboardClient from '@/components/RevenueDashboardClient';

export const metadata = {
  title: 'Doanh thu | Admin',
  robots: { index: false, follow: false },
};

export default function RevenuePage() {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col">
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4 backdrop-blur-xl border-b border-accent/10">
        <TopNavBarClientWrapper />
      </header>
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        <RevenueDashboardClient />
      </main>
    </div>
  );
}
