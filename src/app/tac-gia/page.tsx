"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BookPlus, Crown, Zap, DollarSign, Rocket, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import Footer from '@/components/Footer';

export default function AuthorLandingPage() {
  const [activeTab, setActiveTab] = useState<'benefits' | 'how-it-works' | 'policy'>('benefits');

  return (
    <>
      <TopNavBarClientWrapper />
      
      <main className="w-full flex-1 bg-background text-text-main">
        {/* HERO SECTION */}
        <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-black text-xs uppercase tracking-widest border border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SparklesIcon className="size-4" /> Nền tảng Thế Hệ Mới
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black font-display tracking-tighter leading-tight mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Trở Thành Tác Giả <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-500">
                 Nhận Ngay 60% Doanh Thu
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Biết bao nhiêu công sức sáng tác, đã đến lúc bạn nhận được những gì xứng đáng. Truyen24h mang đến bộ công cụ AI tối tân giúp bạn kiếm tiền từ từng con chữ.
            </p>

            <Link href="/creator-studio" className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-primary to-[#ff4b4b] text-white rounded-full font-black text-sm md:text-base uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(232,165,165,0.4)] hover:shadow-[0_0_60px_rgba(232,165,165,0.6)] animate-in zoom-in duration-1000">
              <BookPlus className="size-5" />
              Mở Căn Phòng Sáng Tác
            </Link>
          </div>
        </div>

        {/* METRICS / STATS */}
        <div className="border-y border-accent/10 bg-surface">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-black text-primary mb-2 tracking-tighter">60%</p>
                <p className="text-xs uppercase tracking-widest text-muted font-bold">Lợi Nhuận Cho Bạn</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black text-yellow-500 mb-2 tracking-tighter">5s</p>
                <p className="text-xs uppercase tracking-widest text-muted font-bold">Rút Tiền Tự Động</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black text-blue-500 mb-2 tracking-tighter">100%</p>
                <p className="text-xs uppercase tracking-widest text-muted font-bold">AI Quản Lý Tự Động</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black text-green-500 mb-2 tracking-tighter">0đ</p>
                <p className="text-xs uppercase tracking-widest text-muted font-bold">Chi Phí Khởi Tạo</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex flex-wrap justify-center gap-2 mb-16">
             <button onClick={() => setActiveTab('benefits')} className={`px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'benefits' ? 'bg-primary text-white shadow-xl' : 'bg-surface text-muted hover:text-text-main border border-accent/10'}`}>Quyền Lợi</button>
             <button onClick={() => setActiveTab('how-it-works')} className={`px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'how-it-works' ? 'bg-primary text-white shadow-xl' : 'bg-surface text-muted hover:text-text-main border border-accent/10'}`}>Cách Hoạt Động</button>
             <button onClick={() => setActiveTab('policy')} className={`px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'policy' ? 'bg-primary text-white shadow-xl' : 'bg-surface text-muted hover:text-text-main border border-accent/10'}`}>Chính Sách DMCA</button>
          </div>

          <div className="bg-surface rounded-[40px] p-8 md:p-16 border border-accent/10 shadow-2xl relative overflow-hidden">
             
             {/* BENEFITS TAB */}
             {activeTab === 'benefits' && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                  <h2 className="text-3xl font-black mb-12 tracking-tighter">Đặc Quyền Dành Cho Tác Giả & Dịch Giả</h2>
                  <div className="grid md:grid-cols-2 gap-12">
                     <div className="flex gap-6">
                        <div className="size-16 shrink-0 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center"><DollarSign className="size-8" /></div>
                        <div>
                           <h3 className="text-xl font-black mb-3">Doanh Thu Vượt Trội 60/40</h3>
                           <p className="text-muted leading-relaxed text-sm">Chúng tôi trả cho bạn <strong className="text-primary">60%</strong> tổng số tiền mà độc giả bỏ ra để mua chuơng VIP của bạn. Mức chia sẻ cao nhất thị trường hiện nay, thanh toán minh bạch qua SePay.</p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                        <div className="size-16 shrink-0 bg-primary/10 text-primary rounded-2xl flex items-center justify-center"><Rocket className="size-8" /></div>
                        <div>
                           <h3 className="text-xl font-black mb-3">Siêu Bot Nhập Liệu Tự Động</h3>
                           <p className="text-muted leading-relaxed text-sm">Không cần copy/paste bằng tay. Chỉ cần 1 file TXT duy nhất, AutoBot sẽ tự động bóc tách, chia chương, lên lịch đăng trọn bộ cho bạn chỉ trong 30 giây.</p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                        <div className="size-16 shrink-0 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center"><Zap className="size-8" /></div>
                        <div>
                           <h3 className="text-xl font-black mb-3">Dịch Thuật Tiếng Trung AI</h3>
                           <p className="text-muted leading-relaxed text-sm">Convert truyện Trung Quốc 100% tự động bằng Trí tuệ Nhân tạo. Gemini Core mạnht mẽ sẽ xử lý hàng chục vạn chữ mượt mà như văn bản mẹ đẻ.</p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                        <div className="size-16 shrink-0 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center"><ShieldCheck className="size-8" /></div>
                        <div>
                           <h3 className="text-xl font-black mb-3">Quản Lý Độc Quyền Bản Quyền</h3>
                           <p className="text-muted leading-relaxed text-sm">Bộ đếm View & Doanh thu Real-time. Chức năng chặn chuột phải, chặn bôi đen, tích hợp ổ khóa VIP bảo mật nhiều lớp an toàn nhất.</p>
                        </div>
                     </div>
                  </div>
                </div>
             )}

             {/* HOW IT WORKS TAB */}
             {activeTab === 'how-it-works' && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                  <h2 className="text-3xl font-black mb-12 tracking-tighter">Bắt Đầu Kiếm Tiền Như Thế Nào?</h2>
                  <div className="relative border-l-4 border-primary/20 ml-6 pl-10 space-y-16">
                     <div className="relative">
                        <div className="absolute -left-[60px] size-12 bg-surface border-4 border-primary rounded-full flex items-center justify-center font-black text-xl">1</div>
                        <h3 className="text-2xl font-black mb-4">Tạo Phòng Sáng Tác</h3>
                        <p className="text-muted mb-4 max-w-2xl">Bấm vào nút <strong>Viết Truyện</strong> trên thanh điều hướng. Tại Creator Studio, tạo Truyện Nháp mới: đặt tên, chọn ảnh nền, viết mô tả ngắn gọn và ấn Lưu Dữ Liệu.</p>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[60px] size-12 bg-surface border-4 border-primary rounded-full flex items-center justify-center font-black text-xl">2</div>
                        <h3 className="text-2xl font-black mb-4">Cắm Bot Tải Truyện Hàng Loạt</h3>
                        <p className="text-muted mb-4 max-w-2xl">Bấm vào biểu tượng <strong>Bot Tải Chiến</strong> màu xanh dưới gốc màn hình. Tải file `.txt` truyện của bạn lên (Yêu cầu phải có chữ <em>Chương X</em> để Bot hiểu cách ngắt chương). Nếu là truyện Tàu, bật chế độ "Dịch Sang Tiếng Việt".</p>
                        <div className="inline-flex bg-background-light p-4 rounded-xl border border-accent/10">
                           <ul className="text-sm font-medium space-y-2 text-muted">
                             <li className="flex gap-2"><CheckCircle2 className="size-5 text-primary" /> Có thể khóa VIP từ chương bất kỳ để thu phí (Vd: Thiết lập 50, từ chương 50 trở đi Khách phải mua bằng Xu).</li>
                           </ul>
                        </div>
                     </div>
                     <div className="relative">
                        <div className="absolute -left-[60px] size-12 bg-surface border-4 border-primary rounded-full flex items-center justify-center font-black text-xl">3</div>
                        <h3 className="text-2xl font-black mb-4">Nhận Tiền Lại Lãi</h3>
                        <p className="text-muted mb-4 max-w-2xl">Theo dõi doanh thu liên tục ở <strong>Creator Studio</strong>. Khi số Xu dôi dư, bấm nút <strong>Yêu Cầu Rút Tiền</strong>, điền STK Ngân Hàng, hệ thống kiểm toán tự động xử lý và bắn lúa ngay lập tức.</p>
                     </div>
                  </div>
                </div>
             )}

             {/* POLICY TAB */}
             {activeTab === 'policy' && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                  <h2 className="text-3xl font-black mb-8 tracking-tighter">Miễn Trừ Trách Nhiệm DMCA & Chính Sách</h2>
                  <div className="prose prose-invert max-w-none text-muted">
                    <p>Truyen24h là một nền tảng mở cung cấp dịch vụ xuất bản văn học trực tuyến (User-Generated Content). Chúng tôi tôn trọng quyền sở hữu trí tuệ của người khác và yêu cầu Thành viên/Tác giả tham gia cũng phải tuân thủ điều tương tự.</p>
                    
                    <h3 className="text-white font-black mt-8 mb-4">1. Trách nhiệm của Người đăng tải</h3>
                    <p>Tác giả / Dịch giả / Người dùng tự chịu mọi trách nhiệm về tính pháp lý (Bản quyền tác phẩm, quyền tác giả, tính luân lý) đối với bất kỳ toàn bộ hoặc một phần văn bản, hình ảnh tải lên máy chủ của Truyen24h.</p>
                    
                    <h3 className="text-white font-black mt-8 mb-4">2. Báo cáo Tôn trọng bản quyền (DMCA Takedown)</h3>
                    <p>Truyen24h sẽ xem xét, phản hồi và vô hiệu hóa / gỡ bỏ các tài liệu bị cáo buộc vi phạm nhãn hiệu, luật sở hữu theo tiêu chuẩn DMCA. Nếu bạn là chủ sở hữu hợp pháp của bất kỳ tác phẩm nào đang tồn tại trên website một cách trái phép, vui lòng gửi phản hồi về hòm thư:</p>
                    <div className="bg-background-light p-4 rounded-xl border border-accent/10 my-6 font-mono text-primary font-bold">
                       truyen24hvnn@gmail.com
                    </div>
                    
                    <h3 className="text-white font-black mt-8 mb-4">3. Chế tài Xử Phạm</h3>
                    <p>Mọi tài khoản vi phạm sẽ bị đình chỉ Vĩnh Viễn, tịch thu toàn bộ doanh thu (số Xu) chưa quyết toán trong tài khoản để phục vụ cho các khoản bồi thường thiệt hại bên thứ ba nếu có.</p>
                  </div>
                </div>
             )}
          </div>
        </div>
      </main>
    </>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
