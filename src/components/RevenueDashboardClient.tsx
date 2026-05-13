/**
 * Revenue Dashboard — aggregates the platform's share of UNLOCK_CHAPTER
 * and DONATE transactions across today / 7-day / 30-day windows.
 *
 * Read-only. Uses an onSnapshot listener so numbers update live as users
 * unlock chapters in real time — useful when running TikTok pushes.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase';
import { collection, onSnapshot, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, TrendingUp, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

interface Tx {
  id: string;
  type: 'UNLOCK_CHAPTER' | 'DONATE';
  price?: number;
  amount?: number;
  authorShare?: number;
  platformFee?: number;
  createdAt?: any;
}

function tsToDate(ts: any): Date {
  if (!ts) return new Date(0);
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts?.toDate === 'function') return ts.toDate();
  if (typeof ts === 'number') return new Date(ts);
  return new Date(ts);
}

export default function RevenueDashboardClient() {
  const { isAdminUser } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch the last 30 days to keep this cheap
    const cutoff = Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'transactions'),
      where('createdAt', '>=', cutoff),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTxs(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Tx[]);
        setLoading(false);
      },
      (err) => {
        console.error('revenue listener failed', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const T = (d: number) => now - d * 24 * 60 * 60 * 1000;
    const buckets = { today: 0, week: 0, month: 0, unlocks: 0, donates: 0, platformXu: 0, authorXu: 0 };
    const byDay: Record<string, number> = {};

    for (const tx of txs) {
      const dt = tsToDate(tx.createdAt);
      const ms = dt.getTime();
      const xuMoved = tx.type === 'UNLOCK_CHAPTER' ? (tx.price || 0) : (tx.amount || 0);
      const platformShare = tx.type === 'UNLOCK_CHAPTER' ? (tx.platformFee || 0) : 0;
      const authorShare = tx.type === 'UNLOCK_CHAPTER' ? (tx.authorShare || 0) : (tx.amount || 0);

      buckets.platformXu += platformShare;
      buckets.authorXu += authorShare;
      if (tx.type === 'UNLOCK_CHAPTER') buckets.unlocks++;
      if (tx.type === 'DONATE') buckets.donates++;

      if (ms >= T(0) && dt.toDateString() === new Date(now).toDateString()) buckets.today += platformShare;
      if (ms >= T(7)) buckets.week += platformShare;
      buckets.month += platformShare;

      const dayKey = dt.toISOString().slice(0, 10);
      byDay[dayKey] = (byDay[dayKey] || 0) + platformShare;
    }
    return { ...buckets, byDay };
  }, [txs]);

  // 1 xu ≈ 100 VND from current package math (10k VND = 100 xu)
  const xuToVnd = (x: number) => x * 100;
  const days = Object.entries(stats.byDay).sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(1, ...days.map(([, v]) => v));

  if (!isAdminUser) {
    return (
      <div className="p-12 rounded-2xl bg-surface border border-accent/20 text-center">
        <AlertCircle className="size-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold mb-2">Cần quyền Admin</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-3">
        <BarChart3 className="text-primary" /> Doanh thu Platform
      </h1>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto size-8" /></div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card label="Hôm nay" xu={stats.today} vnd={xuToVnd(stats.today)} accent="text-green-400" />
            <Card label="7 ngày" xu={stats.week} vnd={xuToVnd(stats.week)} accent="text-blue-400" />
            <Card label="30 ngày" xu={stats.month} vnd={xuToVnd(stats.month)} accent="text-primary" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card label="Lượt mở khoá chương" xu={stats.unlocks} vnd={0} hideVnd accent="text-yellow-500" icon={<Coins className="size-5" />} />
            <Card label="Lượt donate" xu={stats.donates} vnd={0} hideVnd accent="text-pink-400" icon={<TrendingUp className="size-5" />} />
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-accent/10">
            <h2 className="font-bold mb-4">Platform share theo ngày (30d)</h2>
            <div className="flex items-end gap-1 h-40">
              {days.map(([d, v]) => (
                <div key={d} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-primary/70 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${(v / maxDay) * 100}%` }}
                    title={`${d}: ${v} xu (~${xuToVnd(v).toLocaleString('vi-VN')} đ)`}
                  />
                  <span className="text-[9px] text-muted mt-1">{d.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-accent/10">
            <h2 className="font-bold mb-4">Tổng quan 30 ngày</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Kv k="Author earnings (60%)" v={`${stats.authorXu.toLocaleString('vi-VN')} xu`} />
              <Kv k="Platform earnings (40%)" v={`${stats.platformXu.toLocaleString('vi-VN')} xu`} />
              <Kv k="Doanh thu quy đổi" v={`${xuToVnd(stats.platformXu).toLocaleString('vi-VN')} đ`} />
              <Kv k="Số giao dịch" v={`${txs.length.toLocaleString('vi-VN')}`} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({
  label, xu, vnd, accent, hideVnd, icon,
}: { label: string; xu: number; vnd: number; accent: string; hideVnd?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-surface border border-accent/10">
      <div className="text-muted text-xs uppercase tracking-wider mb-1 flex items-center gap-2">{icon}{label}</div>
      <div className={`text-3xl font-black ${accent}`}>{xu.toLocaleString('vi-VN')}</div>
      {!hideVnd && <div className="text-xs text-muted mt-1">≈ {vnd.toLocaleString('vi-VN')} đ</div>}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-accent/10 pb-2">
      <span className="text-muted">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}
