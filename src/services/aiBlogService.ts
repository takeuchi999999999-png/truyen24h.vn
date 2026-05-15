/**
 * AI Blog Post Generation Service.
 *
 * Generates SEO-optimized blog posts in Vietnamese. Two flavors:
 *   1. "review" — write a review of a specific novel on the site, with
 *      internal anchor link back to /truyen/{slug}.
 *   2. "listicle" — write a Top 10 / round-up post for a given genre,
 *      pulling real novel titles from Firestore so the article links
 *      back into the catalog.
 *
 * Output is structured Markdown the blog detail page can render directly.
 */
import { GoogleGenAI, Type } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const MODEL = 'gemini-2.5-flash';

export interface GeneratedBlogPost {
  title: string;
  excerpt: string;          // 1-line teaser, 140-160 chars (perfect for meta description)
  contentMarkdown: string;  // full body in Markdown
  tags: string[];           // SEO long-tail tags
  coverPrompt: string;      // English-language image prompt for Pollinations
  estimatedReadMinutes: number;
}

function ensureAi(): GoogleGenAI {
  if (!ai) throw new Error('Gemini API key chưa được cấu hình.');
  return ai;
}

/* ---------------- Review one novel ---------------- */

export async function generateNovelReviewPost(opts: {
  novelTitle: string;
  novelSlug: string;
  novelDescription: string;
  genres: string[];
  author: string;
}): Promise<GeneratedBlogPost> {
  ensureAi();
  const prompt = `Bạn là cây bút review truyện chữ tiếng Việt nổi tiếng trên Spiderum / blog cá nhân.
Hãy viết 1 bài review chi tiết, hấp dẫn cho bộ truyện sau:

Tiêu đề: "${opts.novelTitle}"
Tác giả: ${opts.author}
Thể loại: ${opts.genres.join(', ')}
Mô tả: ${opts.novelDescription}

YÊU CẦU bài viết:
- Độ dài 800–1200 chữ, văn phong gen Z thân thiện.
- Mở bài: hook bằng câu hỏi cảm xúc hoặc trải nghiệm.
- Thân bài có ít nhất 4 đoạn, mỗi đoạn có heading H2 (vd "Cốt truyện hấp dẫn ở đâu?", "Nhân vật để lại ấn tượng gì?", "Có nên đọc không?"). Dùng Markdown.
- Có đoạn dẫn link nội bộ: "[Đọc miễn phí 2 chương đầu tại đây](/truyen/${opts.novelSlug})".
- Kết bài có 1 câu CTA mời đọc tiếp + 1 câu hỏi mở cho comment.
- KHÔNG spoiler twist cuối; chỉ teaser nhẹ.
- Nhồi tự nhiên 2-3 keyword: "truyện ${opts.genres[0]?.toLowerCase() || 'hay'}", "đọc truyện online", "review ${opts.novelTitle}".

Trả JSON với:
- title: tiêu đề bài blog (50-65 ký tự, có chứa tên truyện)
- excerpt: 140-160 ký tự, mô tả hấp dẫn cho meta description
- contentMarkdown: toàn bộ bài viết markdown
- tags: 5-7 long-tail keyword tiếng Việt
- coverPrompt: 1 đoạn tiếng Anh mô tả ảnh cover blog (digital art style)
- estimatedReadMinutes: số phút đọc (ước tính theo word count)`;

  const response = await ai!.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          contentMarkdown: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          coverPrompt: { type: Type.STRING },
          estimatedReadMinutes: { type: Type.NUMBER },
        },
        required: ['title', 'excerpt', 'contentMarkdown', 'tags', 'coverPrompt', 'estimatedReadMinutes'],
      },
    },
  });
  return JSON.parse(response.text || '{}') as GeneratedBlogPost;
}

/* ---------------- Listicle / round-up ---------------- */

export async function generateListiclePost(opts: {
  genre: string;
  novels: Array<{ title: string; slug: string; description?: string }>;
  monthLabel?: string;        // vd "tháng 5/2026"
}): Promise<GeneratedBlogPost> {
  ensureAi();
  const monthLabel = opts.monthLabel || new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const novelLines = opts.novels
    .map((n, i) => `${i + 1}. ${n.title} — /truyen/${n.slug}${n.description ? `: ${n.description.slice(0, 120)}` : ''}`)
    .join('\n');

  const prompt = `Bạn là biên tập viên trang đọc truyện chữ tiếng Việt.
Hãy viết 1 bài blog kiểu listicle "Top ${opts.novels.length} truyện ${opts.genre} hay nhất ${monthLabel}".

Danh sách truyện cần đưa vào (đúng thứ tự, không đổi):
${novelLines}

YÊU CẦU:
- Tổng độ dài 900-1400 chữ, văn phong báo mạng giải trí, dễ chia sẻ.
- Mở bài 1 đoạn giới thiệu lý do bài này hữu ích cho người đọc bận rộn.
- Mỗi truyện: 1 heading H2 dạng "{số}. {tên truyện}", 2-3 đoạn nội dung gồm: (a) hook plot, (b) điểm hấp dẫn nhất, (c) link đọc thử "[Đọc miễn phí tại đây](/truyen/{slug})".
- Đoạn kết: tổng kết + mời comment + dẫn link /tim-kiem để tìm thêm.
- KHÔNG fabricate plot — chỉ dựa vào mô tả em đưa, nếu mô tả ngắn thì viết chung chung.
- Markdown chuẩn (## cho H2, **bold**, [text](url)).

Trả JSON với fields giống review post.`;

  const response = await ai!.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          contentMarkdown: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          coverPrompt: { type: Type.STRING },
          estimatedReadMinutes: { type: Type.NUMBER },
        },
        required: ['title', 'excerpt', 'contentMarkdown', 'tags', 'coverPrompt', 'estimatedReadMinutes'],
      },
    },
  });
  return JSON.parse(response.text || '{}') as GeneratedBlogPost;
}
