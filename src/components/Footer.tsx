import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Shield, FileText, ChevronRight, Info, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-accent/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand & Intro */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-black text-primary tracking-tighter mb-4">
              Truyen24h
            </h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Truyen24h là nền tảng đọc và sáng tác tiểu thuyết hàng đầu với hệ thống AI hỗ trợ tác giả vượt trội, chia sẻ doanh thu minh bạch và trải nghiệm tuyệt đỉnh cho độc giả.
            </p>
            <div className="flex bg-background-light p-1 rounded-full items-center max-w-max border border-accent/10">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-3"></span>
               <span className="text-[10px] font-bold uppercase tracking-widest text-text-main px-3 py-1">Hệ thống ổn định</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main mb-6">Liên Kết Nhanh</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 group">
                  <ChevronRight className="size-3 text-accent group-hover:text-primary transition-colors" /> Home
                </Link>
              </li>
              <li>
                <Link href="/tac-gia" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 group">
                  <ChevronRight className="size-3 text-accent group-hover:text-primary transition-colors" /> Dành Cho Tác Giả (Nhận 60% Doanh Thu)
                </Link>
              </li>
              <li>
                <Link href="/bang-xep-hang" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 group">
                  <ChevronRight className="size-3 text-accent group-hover:text-primary transition-colors" /> Bảng Xếp Hạng
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 group">
                  <ChevronRight className="size-3 text-accent group-hover:text-primary transition-colors" /> Blog & Review
                </Link>
              </li>
              <li>
                <Link href="/gioi-thieu" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 group">
                  <ChevronRight className="size-3 text-accent group-hover:text-primary transition-colors" /> Giới Thiệu
                </Link>
              </li>
            </ul>
          </div>

          {/* Policy & Terms */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main mb-6">Chính Sách & Quy Định</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/dieu-khoan-su-dung" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="size-4" /> Điều khoản Sử dụng
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-bao-mat" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2">
                  <Shield className="size-4" /> Chính sách Bảo mật
                </Link>
              </li>
              <li className="pt-4 border-t border-accent/10 mt-4 text-xs leading-relaxed text-muted/70 italic">
                Disclaimer: Truyen24h là nền tảng chia sẻ User-Generated Content. Chúng tôi không chịu trách nhiệm đối với bất kỳ nội dung nào do người dùng đăng tải. Nếu có vi phạm bản quyền (DMCA), vui lòng liên hệ ngay để gỡ xuống.
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main mb-6">Liên Hệ</h3>
            <ul className="space-y-4">
              <li>
                <a href="mailto:truyen24hvnn@gmail.com" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="size-4" /> truyen24hvnn@gmail.com
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2">
                  <MessageCircle className="size-4" /> Hỗ trợ trực tuyến (Fanpage)
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* AI Content Disclosure — bắt buộc cho AdSense + tuân thủ minh bạch */}
        <div className="mt-10 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-3">
          <Sparkles className="size-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            <strong className="text-yellow-500">Minh bạch AI:</strong> Một phần nội dung trên
            Truyen24h.vn được sinh ra với sự hỗ trợ của trí tuệ nhân tạo (Google Gemini).
            Các tác phẩm như vậy luôn được gắn nhãn <em className="text-yellow-500 not-italic">"AI-assisted"</em>
            {' '}tại trang chi tiết.{' '}
            <Link href="/gioi-thieu" className="text-primary hover:underline">Tìm hiểu thêm</Link>.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-accent/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted font-medium">
            &copy; {new Date().getFullYear()} Truyen24h.vn. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
             <Link href="/gioi-thieu" className="text-[10px] uppercase font-black tracking-widest text-muted/50 hover:text-primary flex items-center gap-1.5">
               <Info className="size-3" /> About
             </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
