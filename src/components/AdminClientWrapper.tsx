'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle } from '../firebase';
import AdminDashboard from './AdminDashboard';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAILS = ['phamanhtung.jp@gmail.com', 'truyen24hvnn@gmail.com'];

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

  if (!ADMIN_EMAILS.includes(user.email || '')) {
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

  return <AdminDashboard />;
}
