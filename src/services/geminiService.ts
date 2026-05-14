/**
 * geminiService.ts — SERVER-ONLY
 *
 * ⚠️  This file MUST only be imported from:
 *   - Next.js API routes  (src/app/api/**/route.ts)
 *   - Server Components   (no "use client" directive)
 *   - Server Actions
 *
    * It uses GEMINI_API_KEY (server-only env var).
    * NEVER use NEXT_PUBLIC_GEMINI_API_KEY — that exposes the key to the browser.
    */
   import "server-only";
import { GoogleGenAI } from "@google/genai";
import { Novel } from "../types";

// ✅ Server-only env var — never exposed to the browser bundle
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function getAiClient(): GoogleGenAI {
    if (!GEMINI_API_KEY) {
          throw new Error(
                  "[geminiService] GEMINI_API_KEY is not set. Add it to Vercel env vars (server-only, no NEXT_PUBLIC_ prefix)."
                );
    }
    return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ─── In-memory caches ────────────────────────────────────────────────────────
const recCache = new Map<string, string[]>();
const summaryCache = new Map<string, string>();
const greetingCache = new Map<string, string>();

// ─── Simple server-side rate limiter ─────────────────────────────────────────
const _rateBucket: number[] = [];
const RATE_LIMIT = 30;           // max calls per window
const RATE_WINDOW_MS = 60_000;   // 1 minute

function isRateLimited(): boolean {
    const now = Date.now();
    while (_rateBucket.length && _rateBucket[0] < now - RATE_WINDOW_MS) {
          _rateBucket.shift();
    }
    if (_rateBucket.length >= RATE_LIMIT) return true;
    _rateBucket.push(now);
    return false;
}

// ─── Retry + Timeout wrapper ──────────────────────────────────────────────────
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
                  return await Promise.race([
                            fn(),
                            new Promise<never>((_, reject) =>
                                        setTimeout(() => reject(new Error("Gemini timeout")), TIMEOUT_MS)
                                                       ),
                          ]);
          } catch (err: any) {
                  if (attempt === MAX_RETRIES) throw err;
                  const backoff = 1000 * Math.pow(2, attempt);
                  console.warn(`[geminiService] attempt ${attempt + 1} failed, retrying in ${backoff}ms:`, err?.message);
                  await new Promise((r) => setTimeout(r, backoff));
          }
    }
    throw new Error("Max retries exceeded");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAIRecommendations(
    currentNovel: Novel,
    allNovels: Novel[] = []
  ): Promise<Novel[]> {
    const fallback = allNovels
      .filter(
              (n) =>
                        n.id !== currentNovel.id &&
                        (n.genres || []).some((g) => (currentNovel.genres || []).includes(g))
            )
      .slice(0, 3);

  if (recCache.has(currentNovel.id)) {
        const ids = recCache.get(currentNovel.id) || [];
        return allNovels.filter((n) => ids.includes(n.id));
  }

  if (!GEMINI_API_KEY || allNovels.length === 0) return fallback;
    if (isRateLimited()) {
          console.warn("[geminiService] rate limit hit — returning fallback recommendations");
          return fallback;
    }

  try {
        const ai = getAiClient();
        const novelList = allNovels.slice(0, 50);
        const prompt = `Dựa trên bộ truyện "${currentNovel.title}" (Thể loại: ${(currentNovel.genres || []).join(", ")}, Tác giả: ${currentNovel.author}), hãy gợi ý 3 bộ truyện tương tự từ danh sách sau:\n${novelList.map((n) => `- ${n.title} (ID: ${n.id}, Thể loại: ${(n.genres || []).join(", ")})`).join("\n")}\nChỉ trả về JSON: {"recommendedIds": ["id1","id2","id3"]}`;

      const response = await callWithRetry(() =>
              ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: prompt,
                        config: { maxOutputTokens: 256, temperature: 0.3 },
              })
                                               );

      const text = response.text || "{}";
        const data = JSON.parse(text);
        const recommendedIds: string[] = data.recommendedIds || [];
        recCache.set(currentNovel.id, recommendedIds);
        console.log(`[geminiService] getAIRecommendations ok — novel=${currentNovel.id} ids=${recommendedIds}`);
        return allNovels
          .filter((n) => recommendedIds.includes(n.id) && n.id !== currentNovel.id)
          .slice(0, 3);
  } catch (error: any) {
        console.error("[geminiService] getAIRecommendations error:", error?.message);
        return fallback;
  }
}

export async function getDailyGreeting(userName: string): Promise<string> {
    const fallback = `Chào mừng trở lại, ${userName}! Chúc bạn đọc truyện vui vẻ.`;

  if (greetingCache.has(userName)) return greetingCache.get(userName)!;
    if (!GEMINI_API_KEY) return fallback;
    if (isRateLimited()) {
          console.warn("[geminiService] rate limit hit — returning fallback greeting");
          return fallback;
    }

  try {
        const ai = getAiClient();
        const safeName = userName.replace(/[<>"']/g, "").slice(0, 50);
        const response = await callWithRetry(() =>
                ai.models.generateContent({
                          model: "gemini-2.5-flash",
                          contents: `Hãy viết một lời chào buổi sáng ngắn gọn, truyền cảm hứng và thân thiện cho người dùng tên là "${safeName}" đang truy cập ứng dụng đọc truyện Truyen24h.vn. Tối đa 15 từ.`,
                          config: { maxOutputTokens: 64, temperature: 0.7 },
                })
                                                 );

      const result = (response.text || "").trim();
        if (result) greetingCache.set(userName, result);
        console.log(`[geminiService] getDailyGreeting ok — user=${safeName}`);
        return result || fallback;
  } catch (error: any) {
        console.error("[geminiService] getDailyGreeting error:", error?.message);
        return fallback;
  }
}

export async function getNovelSummary(novel: Novel): Promise<string> {
    const fallback = novel.description || "Chưa có tóm tắt.";

  if (summaryCache.has(novel.id)) return summaryCache.get(novel.id)!;
    if (!GEMINI_API_KEY) return fallback;
    if (isRateLimited()) {
          console.warn("[geminiService] rate limit hit — returning fallback summary");
          return fallback;
    }

  try {
        const ai = getAiClient();
        const response = await callWithRetry(() =>
                ai.models.generateContent({
                          model: "gemini-2.5-flash",
                          contents: `Tóm tắt ngắn gọn (50-80 từ) bộ truyện: "${String(novel.title).slice(0, 200)}" — ${String(novel.description || "").slice(0, 500)}`,
                          config: { maxOutputTokens: 256, temperature: 0.5 },
                })
                                                 );

      const result = (response.text || "").trim();
        if (result) summaryCache.set(novel.id, result);
        console.log(`[geminiService] getNovelSummary ok — novel=${novel.id}`);
        return result || fallback;
  } catch (error: any) {
        console.error("[geminiService] getNovelSummary error:", error?.message);
        return fallback;
  }
}
