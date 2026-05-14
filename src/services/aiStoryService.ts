/**
 * AI Story Generation Service
 *
 * Powers the "daily admin" pipeline: brainstorm story ideas, generate full
 * novel metadata, write chapters that hook readers, and produce SEO-friendly
 * summaries. Designed to run on Vercel server routes (Node runtime).
 *
  * SERVER-ONLY: All functions use process.env.GEMINI_API_KEY (never NEXT_PUBLIC_).
 * so the rest of the site keeps working during the credential-setup window.
 */
import { GoogleGenAI, Type } from '@google/genai';
import { GENRES } from '../constants';

// ✅ SERVER-ONLY — never exposed to the browser bundle
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const MODEL = 'gemini-2.5-flash';

export interface GeneratedNovel {
  title: string;
  author: string; // "AI Studio" or persona name
  description: string;
  genres: string[];
  status: 'Đang ra' | 'Hoàn thành';
  hook: string; // 1-line marketing hook for social
  tags: string[]; // long-tail SEO tags
  coverPrompt: string; // image prompt for cover gen
}

export interface GeneratedChapter {
  title: string;
  content: string;
  wordCount: number;
  cliffhanger: string;
}

export interface TrendingTopic {
  topic: string;
  reasoning: string;
  suggestedGenres: string[];
}

function ensureAi(): GoogleGenAI {
  if (!ai) {
    throw new Error(
      'Gemini API key chưa được cấu hình. Hãy thêm GEMINI_API_KEY vào .env.local'
    );
  }
  return ai;
}

/* ---------------- 1. Topic discovery ---------------- */

/**
 * Brainstorm 3-5 hot fiction topics that resonate with Vietnamese readers
 * right now. Useful as input to generateNovelOutline.
 */
export async function discoverTrendingTopics(opts: {
  count?: number;
  excludeRecent?: string[];
}): Promise<TrendingTopic[]> {
  const { count = 5, excludeRecent = [] } = opts;
  ensureAi();

  const prompt = `Bạn là chuyên gia content cho 1 trang đọc truyện chữ tiếng Việt
(audience: nữ 18-35, đọc trên di động, thích trùng sinh / ngôn tình / hệ thống / đô thị).
Hãy đề xuất ${count} chủ đề truyện đang HOT trong tháng này theo TikTok và Google Trends VN.

Các chủ đề KHÔNG được trùng với danh sách đã có:
${excludeRecent.map((t) => `- ${t}`).join('\n') || '(không có)'}

Yêu cầu mỗi chủ đề:
- Tiêu đề ý tưởng đặc sắc 1 dòng
- Lý do hot (vì sao reader muốn đọc lúc này)
- 2-3 thể loại phù hợp từ list: ${GENRES.slice(0, 30).join(', ')}...
Tránh các chủ đề chung chung; ưu tiên hook cảm xúc mạnh (ngược tâm, báo thù, sủng ngọt, cẩu huyết).`;

  const response = await ai!.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                suggestedGenres: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['topic', 'reasoning', 'suggestedGenres'],
            },
          },
        },
        required: ['topics'],
      },
    },
  });

  const data = JSON.parse(response.text || '{"topics":[]}');
  return data.topics as TrendingTopic[];
}

/* ---------------- 2. Novel outline ---------------- */

export async function generateNovelOutline(opts: {
  topic: string;
  genres?: string[];
  toneHints?: string;
}): Promise<GeneratedNovel> {
  ensureAi();
  const { topic, genres = [], toneHints = 'sủng ngọt, có twist ngược nhẹ' } = opts;

  const prompt = `Bạn là tác giả truyện chữ tiếng Việt cực ăn khách trên các nền tảng như MetruyenChu.
Hãy phát triển ý tưởng sau thành 1 bộ truyện mới có thể đăng dài 50-100 chương:

Ý tưởng: ${topic}
Thể loại gợi ý: ${genres.join(', ') || '(tự chọn)'}
Tone: ${toneHints}

YÊU CẦU đầu ra (JSON):
- title: tiêu đề cuốn hút, 5-12 chữ, dễ Google.
- author: tên bút danh nghe Việt (vd "Nguyệt Cầm", "Phong Linh"). KHÔNG dùng "AI" trong tên.
- description: mô tả 4-6 câu, hook ở câu đầu, kết bằng câu mời gọi đọc tiếp.
- genres: 2-4 thể loại từ thư viện chuẩn site VN.
- status: "Đang ra".
- hook: 1 câu < 25 chữ cho social media TikTok/Facebook.
- tags: 5-7 long-tail keyword tiếng Việt (vd: "truyện trùng sinh báo thù chồng cũ").
- coverPrompt: 1 đoạn ngắn tiếng Anh tả ảnh cover style anime / digital painting, mood, color palette.`;

  const response = await ai!.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          description: { type: Type.STRING },
          genres: { type: Type.ARRAY, items: { type: Type.STRING } },
          status: { type: Type.STRING },
          hook: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          coverPrompt: { type: Type.STRING },
        },
        required: ['title', 'author', 'description', 'genres', 'status', 'hook', 'tags', 'coverPrompt'],
      },
    },
  });

  const out = JSON.parse(response.text || '{}') as GeneratedNovel;
  // Normalize: keep only known genres so frontend filters work
  out.genres = (out.genres || []).filter((g) => GENRES.includes(g));
  if (out.genres.length === 0 && genres.length) out.genres = genres.slice(0, 3);
  out.status = 'Đang ra';
  return out;
}

/* ---------------- 3. Chapter generation ---------------- */

export async function generateChapter(opts: {
  novelTitle: string;
  novelDescription: string;
  genres: string[];
  chapterNumber: number;
  previousSummary?: string;
  targetWordCount?: number;
}): Promise<GeneratedChapter> {
  ensureAi();
  const {
    novelTitle,
    novelDescription,
    genres,
    chapterNumber,
    previousSummary = '',
    targetWordCount = 1800,
  } = opts;

  const prompt = `Bạn là tác giả truyện chữ tiếng Việt chuyên nghiệp.
Bộ truyện: "${novelTitle}"
Thể loại: ${genres.join(', ')}
Tóm tắt: ${novelDescription}
${previousSummary ? `Tóm tắt diễn biến trước:\n${previousSummary}\n` : ''}

Hãy viết Chương ${chapterNumber}, độ dài KHOẢNG ${targetWordCount} chữ tiếng Việt.

Quy tắc bắt buộc:
1. Viết 100% tiếng Việt tự nhiên, văn phong mượt, KHÔNG dùng từ Trung không chuyển ngữ.
2. Chia đoạn dày, mỗi đoạn 2-5 câu. KHÔNG khối văn dài 20 câu.
3. Bắt đầu bằng hook giữa hành động hoặc đối thoại, không miêu tả lê thê.
4. Kết chương bằng 1 CLIFFHANGER kích thích đọc tiếp (twist nhỏ, câu hỏi treo, lựa chọn đột ngột).
5. KHÔNG nhắc tên người dùng/AI/Gemini.
6. KHÔNG xen chú thích.

Trả JSON với:
- title: tiêu đề chương (5-10 chữ, không cần "Chương X" prefix)
- content: toàn bộ nội dung chương (string, dùng \\n\\n giữa các đoạn)
- cliffhanger: 1 câu tóm tắt cliffhanger cuối chương để dùng cho chương kế`;

  const response = await ai!.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          cliffhanger: { type: Type.STRING },
        },
        required: ['title', 'content', 'cliffhanger'],
      },
    },
  });

  const out = JSON.parse(response.text || '{}') as Omit<GeneratedChapter, 'wordCount'>;
  const wordCount = out.content ? out.content.trim().split(/\s+/).length : 0;
  return { ...out, wordCount };
}

/* ---------------- 4. SEO blog snippet ---------------- */

export async function generateSeoBlurb(opts: { novelTitle: string; genres: string[]; description: string }): Promise<string> {
  ensureAi();
  const prompt = `Viết đoạn giới thiệu SEO 80-120 từ cho truyện "${opts.novelTitle}" thể loại ${opts.genres.join(', ')}.
Đoạn này dùng ở đầu trang truyện. Nhồi tự nhiên 2-3 keyword chính (vd: "đọc truyện ${opts.genres[0]?.toLowerCase()} hay 2026").
Văn phong nói thẳng, không sáo rỗng, có 1 câu CTA cuối kêu gọi đọc miễn phí.

Mô tả truyện: ${opts.description}`;

  const response = await ai!.models.generateContent({ model: MODEL, contents: prompt });
  return (response.text || '').trim();
}

/* ---------------- 5. Cover image prompt (used by /api/ai/generate-cover) ---------------- */

export function buildCoverImagePrompt(novel: GeneratedNovel): string {
  return [
    novel.coverPrompt,
    'high quality book cover illustration',
    'centered composition, soft lighting',
    'no text, no watermark, no logos',
    `mood inspired by genres: ${novel.genres.join(', ')}`,
  ].join(', ');
}

export const AI_SERVICE_READY = !!ai;
