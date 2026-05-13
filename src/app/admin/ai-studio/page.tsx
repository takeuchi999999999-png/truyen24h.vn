/**
 * Admin AI Studio — page where the operator (Cowork agent or human admin)
 * generates trending novels with one click, reviews them, and publishes
 * to Firestore.
 *
 * Server component only renders the chrome — heavy lifting in
 * AiStudioClient (client component).
 */
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import AiStudioClient from '@/components/AiStudioClient';

export const metadata = {
  title: 'AI Studio | Admin',
  description: 'Sinh truyện AI và đăng tự động',
  robots: { index: false, follow: false },
};

export default function AiStudioPage() {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col">
      <header className="sticky top-0 z-50 px-4 md:px-8 py-4 backdrop-blur-xl border-b border-accent/10">
        <TopNavBarClientWrapper />
      </header>
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        <AiStudioClient />
      </main>
    </div>
  );
}
