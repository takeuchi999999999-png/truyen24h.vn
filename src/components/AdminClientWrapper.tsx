'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle } from '../firebase';
import AdminDashboard from './AdminDashboard';
import { Loader2, ShieldAlert, Sparkles, BarChart3, Library, Wallet, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/admin';

const CARDS = [
  {
    href: '/admin/ai-studio',
    label: 'AI Studio',
    desc: 'Sinh & đăng truyện AI hằng ngày',
    icon: Sparkles,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    href: '/admin/revenue',
    label: 'Doanh thu',
    desc: 'Thống kê platform share + xu',
    icon: BarChart3,
    color: 'from-green-500 to-emerald-500',
  },
  {
    href: '/admin/novels',
    label: 'Quản lý truyện',
    desc: 'List, search, toggle hot/full',
    icon: Library,
    color: 'from-primary to-pink-500',
  },
  {
    href: '/admin/blog',
    label: 'Blog & Review',
    desc: 'Sinh review + listicle bằng AI',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
  },
];

export default function AdminClientWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="size-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
        <div className="size-24 rounded-full bg-accent/10 flex items-center justify-center mb-6">
          <ShieldAlert className="size-10 text-accent" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-text-main">Hệ Thống Quản Trị</h2>
        <p className="text-muted font-medium max-w-md mx-auto mb-8">Bạn cần đăng nhập bằng tài khoản Administrator để truy cập khu vực này.</p>
        <button
          onClick={loginWithGoogle}
          className="px-10 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
        >
          Đăng nhập Google
        </button>
      </div>
    );
  }

  if (!isAdmin(user.email)) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
        <div className="size-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldAlert className="size-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-text-main">Truy cập bị từ chối</h2>
        <p className="text-muted font-medium max-w-md mx-auto mb-8">
          Tài khoản <strong>{user.email}</strong> không có quyền truy cập trang Quản Trị.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-10 py-4 bg-background-light text-text-main rounded-full font-black text-xs uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
        >
          Quay lại Trang Chủ
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="text-muted mt-1">Trung tâm vận hành Truyen24h.vn — chọn tool bên dưới hoặc xử lý rút tiền.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative overflow-hidden rounded-2xl bg-surface border border-accent/10 p-6 hover:border-primary/40 transition-all"
          >
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${c.color} opacity-20 blur-2xl rounded-full`} />
            <c.icon className="size-8 mb-3 text-primary" />
            <h3 className="font-black text-lg mb-1">{c.label}</h3>
            <p className="text-xs text-muted">{c.desc}</p>
            <div className="text-xs mt-3 text-primary font-bold opacity-0 group-hover:opacity-100 transition">Mở →</div>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-primary" />
          <h2 className="text-2xl font-black tracking-tight">Yêu cầu rút tiền</h2>
        </div>
        <AdminDashboard />
      </section>
    </div>
  );
}
