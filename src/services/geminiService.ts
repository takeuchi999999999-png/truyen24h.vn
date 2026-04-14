import { GoogleGenAI, Type } from "@google/genai";
import { Novel } from "../types";
import { NOVELS } from "../constants";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export async function getAIRecommendations(currentNovel: Novel): Promise<Novel[]> {
  const fallback = NOVELS.filter(n => 
    n.id !== currentNovel.id && 
    (n.genres || []).some(g => (currentNovel.genres || []).includes(g))
  ).slice(0, 3);

  if (!ai || !GEMINI_API_KEY) return fallback;

  try {
    const prompt = `Dựa trên bộ truyện "${currentNovel.title}" (Thể loại: ${currentNovel.genres.join(', ')}, Tác giả: ${currentNovel.author}), hãy gợi ý 3 bộ truyện tương tự từ danh sách sau:
    ${NOVELS.map(n => `- ${n.title} (ID: ${n.id}, Thể loại: ${n.genres.join(', ')})`).join('\n')}
    
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
    
    return NOVELS.filter(n => recommendedIds.includes(n.id) && n.id !== currentNovel.id).slice(0, 3);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback to genre-based matching if AI fails
    return NOVELS.filter(n => 
      n.id !== currentNovel.id && 
      n.genres.some(g => currentNovel.genres.includes(g))
    ).slice(0, 3);
  }
}

export async function getDailyGreeting(userName: string): Promise<string> {
  const fallback = `Chào mừng trở lại, ${userName}! Chúc bạn đọc truyện vui vẻ.`;
  if (!ai || !GEMINI_API_KEY) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Hãy viết một lời chào buổi sáng ngắn gọn, truyền cảm hứng và thân thiện cho người dùng tên là "${userName}" đang truy cập ứng dụng đọc truyện Truyen24h.vn. Tối đa 15 từ.`,
    });
    return (response.text || "").trim();
  } catch (error) {
    return `Chào mừng trở lại, ${userName}! Chúc bạn đọc truyện vui vẻ.`;
  }
}

export async function getNovelSummary(novel: Novel): Promise<string> {
  const fallback = novel.description.slice(0, 150) + "...";
  if (!ai || !GEMINI_API_KEY) return fallback;

  try {
    const prompt = `Hãy tóm tắt ngắn gọn nội dung của bộ truyện "${novel.title}" (Thể loại: ${novel.genres.join(', ')}). 
    Tóm tắt này dành cho người dùng bận rộn, cần nắm bắt nhanh cốt truyện và điểm hấp dẫn nhất của truyện. 
    Độ dài khoảng 2-3 câu, văn phong lôi cuốn.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return (response.text || "").trim();
  } catch (error) {
    console.error("Summary Error:", error);
    return novel.description.slice(0, 150) + "...";
  }
}
