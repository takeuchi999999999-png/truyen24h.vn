import { GoogleGenAI, Type } from "@google/genai";
import { Novel } from "../types";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const recCache = new Map<string, string[]>();
const summaryCache = new Map<string, string>();
const greetingCache = new Map<string, string>();

export async function getAIRecommendations(currentNovel: Novel, allNovels: Novel[] = []): Promise<Novel[]> {
  const fallback = allNovels.filter(n => 
    n.id !== currentNovel.id && 
    (n.genres || []).some(g => (currentNovel.genres || []).includes(g))
  ).slice(0, 3);
  
  if (recCache.has(currentNovel.id)) {
      const ids = recCache.get(currentNovel.id) || [];
      return allNovels.filter(n => ids.includes(n.id));
  }

  if (!ai || !GEMINI_API_KEY || allNovels.length === 0) return fallback;

  try {
    const prompt = `Dựa trên bộ truyện "${currentNovel.title}" (Thể loại: ${currentNovel.genres.join(', ')}, Tác giả: ${currentNovel.author}), hãy gợi ý 3 bộ truyện tương tự từ danh sách sau:
    ${allNovels.map(n => `- ${n.title} (ID: ${n.id}, Thể loại: ${n.genres.join(', ')})`).join('\n')}
    
    Chỉ trả về danh sách ID của các bộ truyện được gợi ý.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["recommendedIds"]
        }
      }
    });

    const textResp = response.text || "{}";
    const data = JSON.parse(textResp);
    const recommendedIds = data.recommendedIds as string[];
    
    recCache.set(currentNovel.id, recommendedIds);
    return allNovels.filter(n => recommendedIds.includes(n.id) && n.id !== currentNovel.id).slice(0, 3);
  } catch (error) {
    console.error("Gemini Error:", error);
    return fallback;
  }
}

export async function getDailyGreeting(userName: string): Promise<string> {
  const fallback = `Chào mừng trở lại, ${userName}! Chúc bạn đọc truyện vui vẻ.`;
  if (greetingCache.has(userName)) return greetingCache.get(userName)!;
  if (!ai || !GEMINI_API_KEY) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Hãy viết một lời chào buổi sáng ngắn gọn, truyền cảm hứng và thân thiện cho người dùng tên là "${userName}" đang truy cập ứng dụng đọc truyện Truyen24h.vn. Tối đa 15 từ.`,
    });
    const result = (response.text || "").trim();
    greetingCache.set(userName, result);
    return result;
  } catch (error) {
    return fallback;
  }
}

export async function getNovelSummary(novel: Novel): Promise<string> {
  const fallback = novel.description.slice(0, 150) + "...";
  if (summaryCache.has(novel.id)) return summaryCache.get(novel.id)!;
  if (!ai || !GEMINI_API_KEY) return fallback;

  try {
    const prompt = `Hãy tóm tắt ngắn gọn nội dung của bộ truyện "${novel.title}" (Thể loại: ${novel.genres.join(', ')}). 
    Tóm tắt này dành cho người dùng bận rộn, cần nắm bắt nhanh cốt truyện và điểm hấp dẫn nhất của truyện. 
    Độ dài khoảng 2-3 câu, văn phong lôi cuốn.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const result = (response.text || "").trim();
    summaryCache.set(novel.id, result);
    return result;
  } catch (error) {
    console.error("Summary Error:", error);
    return fallback;
  }
}
