/**
 * Admin AI Studio — client component.
 *
 * Three flows:
 *   1. Brainstorm trending topics (one click).
 *   2. Generate a full novel outline from a topic (preview before publish).
 *   3. One-click "Daily Run" — fully automated batch (new novels + continuation).
 *
 * All API calls are gated by NEXT_PUBLIC_ADMIN_EMAILS via the x-admin-email
 * header, so a user who isn't whitelisted gets a 401 from the server.
 */
'use client';

import { useState } from 'react';
import { Sparkles, Loader2, BookPlus, Zap, Rocket, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { buildCoverUrl } from '@/services/aiCoverService';

interface TrendingTopic { topic: string; reasoning: string; suggestedGenres: string[]; }
interface GeneratedNovel {
  title: string; author: string; description: string; genres: string[];
  status: string; hook: string; tags: string[]; coverPrompt: string;
}

export default function AiStudioClient() {
  const { user, isAdminUser } = useAuth();
  const adminEmail = user?.email || '';

  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [novel, setNovel] = useState<GeneratedNovel | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [dailySummary, setDailySummary] = useState<any | null>(null);

  function flash(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 5000);
  }

  async function callApi(path: string, body: any) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  }

  async function brainstorm() {
    setBusy('topics');
    try {
      const data = await callApi('/api/ai/generate-novel', { autoTopic: true });
      // Re-use the single-topic structure but we want a fresh batch — request
      // through novel discovery via a side-quest call.
      const r = await fetch('/api/ai/generate-novel', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-email': adminEmail },
        body: JSON.stringify({ autoTopic: true }),
      });
      const json = await r.json();
      if (json.topic) {
        setTopics([{ topic: json.topic, reasoning: json.topicReasoning || '', suggestedGenres: json.novel?.genres || [] }]);
        setNovel(json.novel);
        setSelectedTopic(json.topic);
      }
      flash('ok', 'Đã sinh ý tưởng + outline!');
    } catch (e: any) {
      flash('err', e.message);
    } finally {
      setBusy(null);
    }
  }

  async function generateFromTopic() {
    if (!selectedTopic) return flash('err', 'Nhập 1 topic trước');
    setBusy('novel');
    try {
      const data = await callApi('/api/ai/generate-novel', { topic: selectedTopic });
      setNovel(data.novel);
      flash('ok', 'Đã tạo outline truyện');
    } catch (e: any) {
      flash('err', e.message);
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!novel) return;
    setBusy('publish');
    try {
      // Pass the full outline including coverPrompt + hook so the server
      // can auto-generate the cover URL via aiCoverService.
      const data = await callApi('/api/admin/publish-novel', {
        title: novel.title,
        author: novel.author,
        description: novel.description,
        genres: novel.genres,
        tags: novel.tags,
        hook: novel.hook,
        coverPrompt: novel.coverPrompt,
        aiAssisted: true,
        isHot: true,
      });
      flash('ok', `Đã đăng: ${data.slug}`);
      // Auto-generate chapter 1 + 2
      let previousSummary = '';
      for (const n of [1, 2]) {
        const chap = await callApi('/api/ai/generate-chapter', {
          novelTitle: novel.title,
          novelDescription: novel.description,
          genres: novel.genres,
          chapterNumber: n,
          previousSummary,
          targetWordCount: 1700,
        });
        previousSummary = chap.chapter.cliffhanger;
        await callApi('/api/admin/publish-chapter', {
          novelId: data.slug,
          title: chap.chapter.title,
          content: chap.chapter.content,
          chapterNumber: n,
          isVip: false,
        });
      }
      flash('ok', `Đăng ${data.slug} + 2 chương đầu xong!`);
      setNovel(null);
      setSelectedTopic('');
    } catch (e: any) {
      flash('err', e.message);
    } finally {
      setBusy(null);
    }
  }

  async function runDailyJob() {
    // Smaller default load so it fits within Vercel Hobby's 60s function limit.
    // Heavy daily quota happens via the scheduled cron route which has 300s budget.
    if (!confirm('Chạy daily pipeline? Sẽ sinh 1 truyện mới + 3 chương tiếp (tổng ~ 40s).')) return;
    setBusy('daily');
    setDailySummary(null);
    try {
      const data = await callApi('/api/admin/daily-run', { newNovels: 1, continueNovels: 3 });
      setDailySummary(data);
      flash('ok', `Done: +${data.newNovelsCreated.length} truyện, +${data.chaptersContinued.length} chương`);
    } catch (e: any) {
      flash('err', e.message);
    } finally {
      setBusy(null);
    }
  }

  if (!isAdminUser) {
    return (
      <div className="p-12 rounded-2xl bg-surface border border-accent/20 text-center">
        <AlertCircle className="size-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold mb-2">Cần quyền Admin</h2>
        <p className="text-muted">
          Tài khoản của bạn không nằm trong danh sách <code>NEXT_PUBLIC_ADMIN_EMAILS</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Sparkles className="text-primary" /> AI Studio
          </h1>
          <p className="text-muted text-sm mt-1">Sinh truyện trending bằng AI rồi đăng thẳng lên site.</p>
        </div>
        <button
          onClick={runDailyJob}
          disabled={!!busy}
          className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {busy === 'daily' ? <Loader2 className="animate-spin size-5" /> : <Rocket className="size-5" />}
          Chạy Daily Pipeline
        </button>
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

      {/* Topic input */}
      <section className="p-6 rounded-2xl bg-surface border border-accent/10">
        <h2 className="font-bold mb-3 flex items-center gap-2"><Zap className="size-4 text-yellow-500" /> Bước 1 — Topic</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            placeholder="vd: Cô vợ phế vật trùng sinh báo thù chồng cũ"
            className="flex-1 min-w-[280px] px-4 py-3 bg-background rounded-xl border border-accent/20 text-sm"
          />
          <button onClick={brainstorm} disabled={!!busy}
            className="px-4 py-3 bg-yellow-500/10 text-yellow-500 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            {busy === 'topics' ? <Loader2 className="animate-spin size-4" /> : <RefreshCw className="size-4" />}
            Gợi ý hot từ trend
          </button>
          <button onClick={generateFromTopic} disabled={!!busy || !selectedTopic}
            className="px-4 py-3 bg-primary/10 text-primary rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            {busy === 'novel' ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4" />}
            Sinh outline
          </button>
        </div>
        {topics.length > 0 && (
          <div className="mt-4 text-xs text-muted bg-background/40 rounded-lg p-3">
            <strong>Lý do hot:</strong> {topics[0].reasoning}
          </div>
        )}
      </section>

      {/* Novel preview */}
      {novel && (
        <section className="p-6 rounded-2xl bg-surface border border-primary/30">
          <h2 className="font-bold mb-4 flex items-center gap-2"><BookPlus className="size-4 text-primary" /> Bước 2 — Outline & Publish</h2>
          <div className="grid md:grid-cols-[180px_1fr] gap-4">
            <div>
              {/* Live cover preview — same URL the server will store */}
              <img
                src={buildCoverUrl(novel.coverPrompt)}
                alt={`Bìa ${novel.title}`}
                className="w-full aspect-[2/3] rounded-xl object-cover border border-accent/10 bg-background"
                loading="lazy"
              />
              <p className="text-[10px] text-muted mt-2 text-center">Cover AI · Pollinations</p>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div><span className="text-muted">Tiêu đề:</span> <span className="font-bold">{novel.title}</span></div>
              <div><span className="text-muted">Tác giả:</span> {novel.author}</div>
              <div><span className="text-muted">Mô tả:</span> {novel.description}</div>
              <div><span className="text-muted">Thể loại:</span> {novel.genres.join(', ')}</div>
              <div><span className="text-muted">Hook social:</span> "{novel.hook}"</div>
              <div><span className="text-muted">SEO tags:</span> {novel.tags.join(' · ')}</div>
              <div className="text-xs text-muted bg-background/40 rounded p-2">
                <strong>Cover prompt:</strong> {novel.coverPrompt}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={publish} disabled={!!busy}
              className="px-5 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
              {busy === 'publish' ? <Loader2 className="animate-spin size-4" /> : <CheckCircle2 className="size-4" />}
              Đăng + 2 chương đầu
            </button>
            <button onClick={() => setNovel(null)} className="px-5 py-3 bg-background border border-accent/20 rounded-xl text-sm">
              Bỏ
            </button>
          </div>
        </section>
      )}

      {/* Daily summary */}
      {dailySummary && (
        <section className="p-6 rounded-2xl bg-surface border border-green-500/30">
          <h2 className="font-bold mb-3">Daily run summary</h2>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <Stat label="Truyện mới" value={dailySummary.newNovelsCreated.length} color="text-green-400" />
            <Stat label="Chương cập nhật" value={dailySummary.chaptersContinued.length} color="text-blue-400" />
            <Stat label="Lỗi" value={dailySummary.errors.length} color={dailySummary.errors.length ? 'text-red-400' : 'text-muted'} />
          </div>
          <details>
            <summary className="cursor-pointer text-xs text-muted">Xem JSON chi tiết</summary>
            <pre className="text-xs mt-2 p-3 bg-background/40 rounded overflow-auto max-h-80">{JSON.stringify(dailySummary, null, 2)}</pre>
          </details>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 bg-background/40 rounded-xl">
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}
