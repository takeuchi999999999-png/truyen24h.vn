/**
 * Lightweight CRUD interface for novels.
 * Lists every novel, lets the admin toggle the `isHot` and `isFull` flags,
 * and shows latest chapter / origin (AI-assisted vs CTV).
 *
 * Heavy editing (chapter content, cover upload) still happens in /creator-studio.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase';
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc,
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, Loader2, AlertCircle, Flame, BookCheck, Trash2,
  Sparkles, ExternalLink, Library,
} from 'lucide-react';

interface NovelRow {
  id: string; title: string; author: string;
  genres?: string[]; isHot?: boolean; isFull?: boolean;
  latestChapterNumber?: number; aiAssisted?: boolean;
  updatedAt?: any; status?: string;
}

export default function NovelsManagerClient() {
  const { isAdminUser } = useAuth();
  const [rows, setRows] = useState<NovelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ai' | 'human' | 'hot'>('all');

  useEffect(() => {
    const q = query(collection(db, 'novels'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NovelRow[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'ai' && !r.aiAssisted) return false;
      if (filter === 'human' && r.aiAssisted) return false;
      if (filter === 'hot' && !r.isHot) return false;
      if (!s) return true;
      return (r.title || '').toLowerCase().includes(s)
        || (r.author || '').toLowerCase().includes(s)
        || r.id.toLowerCase().includes(s);
    });
  }, [rows, search, filter]);

  async function toggle(id: string, field: 'isHot' | 'isFull', value: boolean) {
    await updateDoc(doc(db, 'novels', id), { [field]: value });
  }
  async function remove(id: string) {
    if (!confirm(`Xoá truyện "${id}"? Chương con sẽ ở lại (cần xoá tay nếu cần).`)) return;
    await deleteDoc(doc(db, 'novels', id));
  }

  if (!isAdminUser) {
    return (
      <div className="p-12 rounded-2xl bg-surface border border-accent/20 text-center">
        <AlertCircle className="size-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold mb-2">Cần quyền Admin</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black flex items-center gap-3">
        <Library className="text-primary" /> Quản lý Truyện <span className="text-sm font-normal text-muted">({rows.length})</span>
      </h1>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, tác giả, slug..."
            className="w-full pl-10 pr-3 py-2.5 bg-surface rounded-xl border border-accent/20 text-sm"
          />
        </div>
        {(['all', 'ai', 'human', 'hot'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
              filter === f ? 'bg-primary text-white' : 'bg-surface text-muted border border-accent/10'
            }`}>
            {f === 'all' ? 'Tất cả' : f === 'ai' ? 'AI' : f === 'human' ? 'CTV' : 'Hot'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto size-8" /></div>
      ) : (
        <div className="rounded-2xl border border-accent/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left p-3">Truyện</th>
                <th className="text-left p-3 hidden md:table-cell">Thể loại</th>
                <th className="text-center p-3 w-16">Chương</th>
                <th className="text-center p-3 w-20">Loại</th>
                <th className="text-center p-3 w-20">Hot</th>
                <th className="text-center p-3 w-20">Full</th>
                <th className="text-right p-3 w-32">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-accent/10 hover:bg-surface/50">
                  <td className="p-3">
                    <div className="font-bold">{r.title}</div>
                    <div className="text-xs text-muted">{r.author} · <code className="text-[10px]">{r.id}</code></div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-xs text-muted">
                    {(r.genres || []).slice(0, 3).join(', ')}
                  </td>
                  <td className="p-3 text-center font-bold">{r.latestChapterNumber || 0}</td>
                  <td className="p-3 text-center">
                    {r.aiAssisted ? (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                        <Sparkles className="size-3" /> AI
                      </span>
                    ) : (
                      <span className="text-xs text-muted">CTV</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggle(r.id, 'isHot', !r.isHot)}
                      className={`size-7 rounded-full mx-auto flex items-center justify-center ${
                        r.isHot ? 'bg-red-500/20 text-red-400' : 'text-muted hover:bg-surface'
                      }`}>
                      <Flame className="size-4" />
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggle(r.id, 'isFull', !r.isFull)}
                      className={`size-7 rounded-full mx-auto flex items-center justify-center ${
                        r.isFull ? 'bg-green-500/20 text-green-400' : 'text-muted hover:bg-surface'
                      }`}>
                      <BookCheck className="size-4" />
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <a href={`/truyen/${r.id}`} target="_blank"
                        className="size-8 inline-flex items-center justify-center rounded-lg bg-surface hover:bg-primary/20 hover:text-primary">
                        <ExternalLink className="size-4" />
                      </a>
                      <button onClick={() => remove(r.id)}
                        className="size-8 inline-flex items-center justify-center rounded-lg bg-surface hover:bg-red-500/20 hover:text-red-400">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted">Không có truyện nào khớp filter.</div>
          )}
        </div>
      )}
    </div>
  );
}
