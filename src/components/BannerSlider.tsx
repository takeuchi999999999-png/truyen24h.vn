import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Novel } from '../types';

interface BannerSliderProps {
  novels: Novel[];
}

export default function BannerSlider({ novels }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Lọc ra các truyện Hot hoặc ngẫu nhiên làm Banner
  const bannerNovels = novels.filter(n => n.isHot).slice(0, 5);

  useEffect(() => {
    if (bannerNovels.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerNovels.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [bannerNovels.length]);

  if (bannerNovels.length === 0) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % bannerNovels.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + bannerNovels.length) % bannerNovels.length);

  return (
    <div className="relative w-full h-[250px] md:h-[400px] mb-8 md:mb-12 rounded-[32px] overflow-hidden group shadow-2xl">
      {bannerNovels.map((novel, index) => (
        <div 
          key={novel.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* Background Blur Image */}
          <div className="absolute inset-0 bg-black">
             <img 
               src={novel.coverUrl || `https://picsum.photos/seed/novel-${novel.id}/1200/600`}
               alt={novel.title}
               className="w-full h-full object-cover opacity-50 blur-lg scale-110"
             />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          
          {/* Content layer */}
          <div className="absolute inset-0 z-20 flex items-center p-6 md:p-12 gap-8">
            <div className="hidden md:block w-[180px] h-[260px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-white/10 shrink-0 transform -rotate-2 hover:rotate-0 transition-all duration-500">
               <img 
                 src={novel.coverUrl || `https://picsum.photos/seed/novel-${novel.id}/400/600`}
                 alt={novel.title}
                 className="w-full h-full object-cover"
               />
               {novel.isHot && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-md">HOT</div>
               )}
            </div>

            <div className="flex-1 text-left max-w-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
               <div className="inline-block px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-4">
                 Siêu Phẩm Đề Cử
               </div>
               <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight font-display drop-shadow-md">
                 {novel.title}
               </h2>
               <p className="text-sm md:text-base text-gray-300 line-clamp-2 md:line-clamp-3 mb-8 w-full max-w-xl hidden sm:block">
                 {novel.description || 'Truyện chữ Việt Nam đỉnh cao, hãy khám phá ngay nội dung hấp dẫn đang chờ bạn...'}
               </p>
               
               <Link href={`/truyen/${novel.id}`} className="px-8 py-3.5 bg-primary text-white rounded-full font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 inline-flex items-center gap-2">
                 Đọc Ngay
               </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-black/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-primary border border-white/10"
      >
        <ChevronLeft className="size-5 md:size-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-black/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-primary border border-white/10"
      >
        <ChevronRight className="size-5 md:size-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {bannerNovels.map((_, idx) => (
           <button 
             key={idx} 
             onClick={() => setCurrentIndex(idx)}
             className={`h-1.5 transition-all rounded-full ${idx === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-white/30 hover:bg-white/60'}`}
           />
        ))}
      </div>
    </div>
  );
}
