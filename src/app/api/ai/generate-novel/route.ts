/**
 * POST /api/ai/generate-novel
 *
 * Generates a complete novel outline (title, author persona, description,
 * genres, SEO tags, cover prompt). Does NOT write to Firestore — the admin
 * UI / cron job reviews the output first and then calls /api/admin/publish.
 *
 * Body: { topic?: string, genres?: string[], toneHints?: string, autoTopic?: boolean }
 *
 * Auth: admin only (x-admin-token or x-admin-email).
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/apiAuth';
import { discoverTrendingTopics, generateNovelOutline } from '@/services/aiStoryService';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    let { topic, genres, toneHints, autoTopic } = body as {
      topic?: string;
      genres?: string[];
      toneHints?: string;
      autoTopic?: boolean;
    };

    let topicMeta: { reasoning?: string } = {};
    if (autoTopic || !topic) {
      const topics = await discoverTrendingTopics({ count: 1 });
      if (topics.length === 0) {
        return NextResponse.json({ error: 'Không tạo được trending topic' }, { status: 502 });
      }
      topic = topics[0].topic;
      topicMeta.reasoning = topics[0].reasoning;
      if (!genres) genres = topics[0].suggestedGenres;
    }

    const novel = await generateNovelOutline({ topic: topic!, genres, toneHints });

    return NextResponse.json({
      ok: true,
      topic,
      topicReasoning: topicMeta.reasoning,
      novel,
    });
  } catch (err: any) {
    console.error('[ai/generate-novel] error', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
