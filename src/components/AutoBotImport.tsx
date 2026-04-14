import React, { useState, useRef } from 'react';
import { Bot, Upload, Play, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Novel } from '../types';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AutoBotImportProps {
  user: any;
  novels: Novel[];
  onClose: () => void;
}

export default function AutoBotImport({ user, novels, onClose }: AutoBotImportProps) {
  const [selectedNovelId, setSelectedNovelId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [needTranslation, setNeedTranslation] = useState(false);
  const [vipThreshold, setVipThreshold] = useState<number>(0);
  const [vipPrice, setVipPrice] = useState<number>(50);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!f.name.endsWith('.txt')) {
        alert('Bot hiện tại chỉ hỗ trợ định dạng file .TXT thôi anh nhé! Nếu là PDF hãy vứt qua web chuyển đổi sang TXT 1s là xong ạ.');
        return;
      }
      setFile(f);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg].slice(-50)); // Giữ 50 log gần nhất
  };

  const runGeminiTranslation = async (text: string) => {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) throw new Error("Thiếu GEMINI API KEY");
    
    const prompt = `Dịch đoạn truyện chữ Trung Quốc sau sang Tiếng Việt. Giữ nguyên định dạng đoạn văn, văn phong trôi chảy tự nhiên, chuẩn phong cách web truyện tiên hiệp/huyền huyễn:\n\n${text.slice(0, 30000)}`;
    
    // Using standard fetch to bypass sdk limitations dynamically
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Lỗi gọi AI');
    return data.candidates?.[0]?.content?.parts?.[0]?.text || text;
  };

  const startBot = async () => {
    if (!selectedNovelId) return alert('Vui lòng chọn Truyện cần nạp chương!');
    if (!file) return alert('Vui lòng chọn file .txt!');
    
    setIsRunning(true);
    setLogs([]);
    addLog(`Đang khởi động Bot... Bắt đầu đọc file ${file.name}`);
    
    try {
      const text = await file.text();
      // Thuật toán bẻ chương siêu đơn giản dựa trên "Chương" và dọn dẹp kí tự trắng
      const chapterChunks = text.split(/(?=Chương\s+\d+|Thứ\s+\d+\s+Chương|第\s*\d+\s*[章|節|节])/i).filter(c => c.trim().length > 50);
      
      setTotalChapters(chapterChunks.length);
      addLog(`🔍 Phát hiện phân tách được ${chapterChunks.length} chương truyện!`);

      if (chapterChunks.length === 0) {
        throw new Error("Không nhận diện được Chapter nào! Đảm bảo cấu trúc file CÓ chứa chữ Tựa đề như 'Chương 1... '");
      }

      for (let i = 0; i < chapterChunks.length; i++) {
        let chunk = chapterChunks[i].trim();
        let titleLine = chunk.split('\n')[0].trim();
        let contentBody = chunk.substring(titleLine.length).trim();
        
        let finalTitle = titleLine;
        let finalContent = contentBody;

        if (needTranslation) {
          addLog(`🤖 [AI] Đang dịch chương ${i + 1}/${chapterChunks.length}...`);
          try {
             const translatedCh = await runGeminiTranslation(chunk);
             const lines = translatedCh.split('\n');
             finalTitle = lines[0].trim();
             finalContent = lines.slice(1).join('\n').trim();
             addLog(`✅ Dịch đoạn ${i + 1} hoàn tất!`);
          } catch (e: any) {
             addLog(`❌ Lỗi AI ở chương ${i+1}: ${e.message}`);
             finalContent = chunk; // Fallback to raw
          }
        }

        // Lọc title rác
        if (finalTitle.length > 100) finalTitle = `Chương ${i+1}`;

        // Bơm lên Firestore
        addLog(`⬆️ Đẩy dữ liệu Chương ${i + 1} lên máy chủ Firebase...`);
        const novelRef = doc(db, 'novels', selectedNovelId);
        const chapterRef = doc(collection(novelRef, 'chapters'));
        
        const isChapterVip = vipThreshold > 0 && (i + 1) >= vipThreshold;

        await setDoc(chapterRef, {
          id: chapterRef.id,
          title: finalTitle,
          content: finalContent,
          chapterNumber: i + 1,
          publishDate: new Date().toISOString(),
          isVip: isChapterVip,
          price: isChapterVip ? vipPrice : 0,
        });
        
        setProgress(i + 1);
        
        // Thở xíu để ko chết API
        if (needTranslation) await new Promise(r => setTimeout(r, 2000));
      }

      addLog(`🎉 HOÀN TẤT TẢI LÊN TOÀN BỘ ${chapterChunks.length} CHƯƠNG!`);
      // Update số chương trong Novels document
      await setDoc(doc(db, 'novels', selectedNovelId), {
         latestChapterNumber: chapterChunks.length,
         status: 'Đang ra'
      }, { merge: true });

    } catch (err: any) {
      addLog(`❌ BOT LỖI: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface rounded-[32px] shadow-2xl p-8 border border-accent/10 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-accent/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Bot className="size-6" />
            </div>
            <div>
              <h2 className="font-black text-xl text-text-main flex items-center gap-2">
                SUPER CRAWLER BOT
              </h2>
              <p className="text-xs text-muted font-bold uppercase tracking-widest">Nạp TXT Tự Động & AI Translate</p>
            </div>
          </div>
          {!isRunning && (
            <button onClick={onClose} className="p-2 text-muted hover:text-text-main bg-background-light rounded-full">
              <X className="size-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted block">1. Nhập vào bộ truyện nào?</label>
            <select 
              value={selectedNovelId}
              onChange={(e) => setSelectedNovelId(e.target.value)}
              disabled={isRunning}
              className="w-full h-14 px-4 bg-background-light text-text-main border-none outline-none rounded-2xl font-bold text-sm"
            >
              <option value="">-- Chọn truyện đang quản lý --</option>
              {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted block">2. Nguồn File Text Đầu Vào (Chỉ .TXT)</label>
            <div 
              onClick={() => !isRunning && fileInputRef.current?.click()}
              className={`w-full h-32 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-primary bg-primary/5 text-primary' : 'border-accent/20 text-muted hover:bg-background-light'}`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleFileChange} />
              {file ? (
                <>
                  <CheckCircle className="size-8 mb-2" />
                  <span className="font-black text-sm">{file.name}</span>
                  <span className="text-xs opacity-60">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </>
              ) : (
                <>
                  <Upload className="size-8 mb-2 opacity-50" />
                  <span className="font-bold text-sm">Nhấp để chọn tải lên File .TXT</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-background-light p-4 rounded-2xl">
            <input 
              type="checkbox" 
              id="ai-mode" 
              checked={needTranslation}
              onChange={(e) => setNeedTranslation(e.target.checked)}
              disabled={isRunning}
              className="size-5 rounded cursor-pointer accent-primary" 
            />
            <label htmlFor="ai-mode" className="flex-1 cursor-pointer">
              <span className="block font-black text-sm text-text-main mb-1">Đây là Raw Tiếng Trung (Cần Dịch)</span>
              <span className="block text-xs text-muted font-medium">Bot sẽ tự động gọi AI Gemini siêu cấp để dịch mượt như con người. Thời gian lâu hơn bình thường! Nếu file chữ Tiếng Việt, hãy BỎ TÍCH.</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-accent/10 rounded-2xl">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted block mb-2">Tự động Khóa VIP từ chương</label>
              <input 
                type="number" 
                value={vipThreshold === 0 ? '' : vipThreshold}
                onChange={(e) => setVipThreshold(Number(e.target.value) || 0)}
                placeholder="VD: 50 (để trống: Không khóa)"
                disabled={isRunning}
                className="w-full bg-transparent text-text-main border-none outline-none font-bold text-sm"
              />
            </div>
            <div className="p-4 border border-accent/10 rounded-2xl">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted block mb-2">Giá mở khóa (Xu/Chương)</label>
              <input 
                type="number" 
                value={vipPrice}
                onChange={(e) => setVipPrice(Number(e.target.value) || 0)}
                disabled={isRunning}
                className="w-full bg-transparent text-text-main border-none outline-none font-bold text-sm"
              />
            </div>
          </div>

          {totalChapters > 0 && (
            <div className="bg-text-main text-background-light p-6 rounded-[24px] space-y-4">
              <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                <span>Tiến Độ Bơm Data</span>
                <span className="text-primary">{progress} / {totalChapters}</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300" 
                  style={{ width: `${(progress / totalChapters) * 100}%` }}
                />
              </div>
              
              <div className="h-32 bg-black/50 rounded-xl p-3 overflow-y-auto font-mono text-[10px] text-green-400 space-y-1">
                {logs.map((L, i) => (
                  <div key={i}>{'>_'} {L}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 pt-6 mt-2 border-t border-accent/10">
          <button 
            onClick={startBot}
            disabled={isRunning || !file || !selectedNovelId}
            className="w-full py-5 bg-gradient-to-r from-primary to-orange-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                ĐANG CHẠY BẦU TRỜI DATA...
              </>
            ) : (
              <>
                <Play className="size-5 fill-current" />
                KÍCH HOẠT QUÁI VẬT CÀO TRUYỆN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
