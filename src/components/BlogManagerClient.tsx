/**
 * Admin Blog Manager — UI for generating AI blog posts.
 *
 * Two buttons:
 *   1. Sinh review truyện ngẫu nhiên — picks a random AI novel and
 *      generates a review post.
 *   2. Sinh listicle — generates "Top N truyện {genre}" round-up.
 *
 * Lists existing posts below so admin can verify what's been published.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/firebase';
import { collection, onSnapshot, orderBy, query, limit, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { GENRES } from '@/constants';
import {
  Sparkles, BookOpen, Loader2, CheckCircle2, AlertCircle, Trash2,
  ExternalLink, ListOrdered, RefreshCw,
} from 'lucide-react';

interface BlogRow {
  slug: string;
  title: string;
  excerpt?: string;
  kind?: string;
  createdAt?: any;
  coverUrl?: string;
}

export default function BlogManagerClient() {
  const { user, isAdminUser } = useAuth();
  const adminEmail = user?.email || '';

  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [listGenre, setListGenre] = useState<string>('Ngôn Tình');

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'), limit(30));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ slug: d.id, ...d.data() })) as BlogRow[]);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  function flash(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 6000);
  }

  async function callApi(body: any) {
    const r = await fetch('/api/admin/generate-blog-post', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  }

  async function genReview() {
    setBusy('review');
    try {
      const data = await callApi({ kind: 'review' });
      flash('ok', `Đã đăng review: ${data.post.title}`);
    } catch (e: any) {
      flash('err', e.message);
    } finally {
      setBusy(null);
    }
  }

  async function genListicle() {
    setBusy('list');
    try {
      const data = await callApi({ kind: 'listicle', genre: listGenre, count: 10 });
      flash('ok', `Đã đăng listicle: ${data.post.title}`);
    } catch (e: any) {
      flash('err', e.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(slug: string) {
    if (!confirm(`Xoá bài "${slug}"?`)) return;
    await deleteDoc(doc(db, 'blog_posts', slug));
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <BookOpen className="text-primary" /> Blog Manager
        </h1>
        <p className="text-muted text-sm mt-1">Sinh review & listicle bằng AI rồi đăng thẳng /blog.</p>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          toast.kind === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/30'
          : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {toast.kind === 'ok' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
          <span className="text-sm">{toast.text}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <section className="p-6 rounded-2xl bg-surface border border-accent/10">
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-yellow-500" /> Review truyện ngẫu nhiên
          </h2>
          <p className="text-xs text-muted mb-4">Chọn random 1 truyện AI mới nhất, viết review 800–1200 chữ + link nội bộ.</p>
          <button
            onClick={genReview}
            disabled={!!busy}
            className="w-full px-5 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy === 'review' ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4" />}
            Sinh & đăng review
          </button>
        </section>

        <section className="p-6 rounded-2xl bg-surface border border-accent/10">
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <ListOrdered className="size-4 text-blue-500" /> Listicle theo thể loại
          </h2>
          <p className="text-xs text-muted mb-4">"Top 10 truyện {listGenre.toLowerCase()} hay nhất tháng này".</p>
          <div className="flex gap-2">
            <select
              value={listGenre}
              onChange={(e) => setListGenre(e.target.value)}
              className="flex-1 px-3 py-3 rounded-xl bg-background border border-accent/20 text-sm"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <button
              onClick={genListicle}
              disabled={!!busy}
              className="px-5 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {busy === 'list' ? <Loader2 className="animate-spin size-4" /> : <RefreshCw className="size-4" />}
              Sinh
            </button>
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-accent/10 overflow-hidden">
        <div className="p-4 border-b border-accent/10 flex items-center justify-between">
          <h3 className="font-bold">Bài đã đăng <span className="text-sm font-normal text-muted">({posts.length})</span></h3>
        </div>
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto size-6 text-muted" /></div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">Chưa có bài blog nào. Bấm 1 trong 2 nút trên để sinh.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left p-3">Tiêu đề</th>
                <th className="text-left p-3 w-32">Loại</th>
                <th className="text-right p-3 w-28">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.slug} className="border-t border-accent/10 hover:bg-surface/50">
                  <td className="p-3">
                    <div className="font-bold line-clamp-1">{p.title}</div>
                    <div className="text-xs text-muted line-clamp-1">{p.excerpt}</div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                      p.kind === 'review' ? 'bg-pink-500/15 text-pink-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {p.kind || 'post'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <Link href={`/blog/${p.slug}`} target="_blank"
                        className="size-8 inline-flex items-center justify-center rounded-lg bg-surface hover:bg-primary/20 hover:text-primary">
                        <ExternalLink className="size-4" />
                      </Link>
                      <button onClick={() => remove(p.slug)}
                        className="size-8 inline-flex items-center justify-center rounded-lg bg-surface hover:bg-red-500/20 hover:text-red-400">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
