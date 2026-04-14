import AdminClientWrapper from '@/components/AdminClientWrapper';
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';

export const metadata = {
  title: 'Admin Dashboard | Truyen24h.vn',
  description: 'Hệ thống quản trị Truyen24h.vn',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary/30 antialiased flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full mix-blend-screen opacity-50 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 px-4 md:px-8 py-4 backdrop-blur-xl border-b border-accent/10">
          <TopNavBarClientWrapper />
        </header>

        <main className="flex-grow flex flex-col">
          <AdminClientWrapper />
        </main>
      </div>
    </div>
  );
}
