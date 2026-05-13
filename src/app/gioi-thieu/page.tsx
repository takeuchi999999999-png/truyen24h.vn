/**
 * About page (Vietnamese: Giới thiệu).
 *
 * Required by Google AdSense and the EAT signal for content sites:
 * a clear human-readable description of who we are, what we publish,
 * how AI is involved, and how to reach us.
 *
 * Also indexable for branded search ("truyen24h.vn là gì").
 */
import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import {
  BookOpen, Sparkles, ShieldCheck, Users, Mail,
  Headphones, Globe, Heart,
} from 'lucide-react';

export const metadata = {
  title: 'Giới thiệu Truyen24h.vn',
  description:
    'Truyen24h.vn — nền tảng đọc truyện chữ tiếng Việt thế hệ mới. Đa dạng thể loại, có TTS đọc truyện tiếng Việt, AI gợi ý thông minh, hệ thống VIP minh bạch, chia sẻ 60% doanh thu cho tác giả.',
  alternates: { canonical: absoluteUrl('/gioi-thieu') },
};

const VALUES = [
  {
    icon: BookOpen,
    title: 'Chất lượng đặt lên đầu',
    body: 'Mỗi tác phẩm trên Truyen24h.vn — dù do tác giả viết hay được AI hỗ trợ — đều được biên tập rà soát trước khi xuất bản. Chúng tôi từ chối nội dung sao chép, kích động, hay vi phạm bản quyền.',
  },
  {
    icon: Sparkles,
    title: 'AI là công cụ, không phải mục đích',
    body: 'Chúng tôi minh bạch về các tác phẩm có hỗ trợ AI bằng nhãn "AI-assisted" trên trang truyện. Người đọc luôn được biết mình đang đọc gì và do ai sáng tác.',
  },
  {
    icon: ShieldCheck,
    title: 'Minh bạch tài chính',
    body: 'Mọi giao dịch xu/VIP được ghi log không thể chỉnh sửa. Tác giả nhận 60% giá mỗi chương VIP — chia sẻ thuộc nhóm cao nhất thị trường Việt Nam.',
  },
  {
    icon: Heart,
    title: 'Tôn trọng người đọc',
    body: 'Không pop-up giật mình, không tự động phát âm thanh, không lừa nhấn. UX sạch, mobile-first, có chế độ tối/sáng và TTS đọc chương tiếng Việt giọng tự nhiên.',
  },
];

const FAQS = [
  {
    q: 'Truyen24h.vn là gì?',
    a: 'Truyen24h.vn là một nền tảng đọc truyện chữ trực tuyến tiếng Việt, ra mắt năm 2026. Chúng tôi tổng hợp truyện do tác giả Việt sáng tác, truyện dịch bản quyền, và một số tác phẩm có hỗ trợ AI ở khâu phác thảo cốt truyện.',
  },
  {
    q: 'Đọc trên Truyen24h.vn có mất phí không?',
    a: 'Phần lớn nội dung là miễn phí. Một số chương được đánh dấu "VIP" yêu cầu mở khoá bằng xu (50–100 xu/chương). Xu có thể nạp bằng gói thanh toán PayOS từ 5.000đ trở lên.',
  },
  {
    q: 'AI được sử dụng như thế nào trên Truyen24h.vn?',
    a: 'AI (Google Gemini) được sử dụng để (a) phác thảo cốt truyện ban đầu theo trend đọc, (b) viết bản nháp chương, (c) gợi ý truyện tương tự. Mọi tác phẩm có sự tham gia của AI đều mang nhãn "AI-assisted" và "Author: AI Studio" để người đọc nhận diện dễ dàng.',
  },
  {
    q: 'Tôi có thể trở thành tác giả trên Truyen24h.vn không?',
    a: 'Có. Vào /tac-gia để đăng ký Creator Studio. Tác giả/Dịch giả tự đăng truyện, tự đặt giá chương VIP, và nhận 60% doanh thu mỗi chương được mở khoá.',
  },
  {
    q: 'Làm sao báo cáo nội dung vi phạm bản quyền?',
    a: 'Gửi email tới truyen24hvnn@gmail.com kèm: (a) tên tác phẩm, (b) đường dẫn vi phạm trên Truyen24h.vn, (c) bằng chứng quyền sở hữu hợp pháp. Chúng tôi xử lý trong vòng 48 giờ theo quy trình DMCA.',
  },
  {
    q: 'Tôi không nghe được giọng đọc TTS, phải làm sao?',
    a: 'TTS yêu cầu trình duyệt hỗ trợ HTML5 Audio và đường truyền ổn định. Bấm vào biểu tượng tai nghe trong giao diện đọc → đợi 3–5 giây xử lý → bấm Play. Nếu vẫn lỗi, thử Chrome/Edge phiên bản mới nhất.',
  },
];

const STATS = [
  { label: 'Thể loại truyện', value: '60+' },
  { label: 'Chia sẻ doanh thu', value: '60/40' },
  { label: 'Giọng đọc TTS', value: 'vi-VN' },
  { label: 'Hỗ trợ thiết bị', value: 'Mọi nền' },
];

export default function AboutPage() {
  return (
    <>
      <TopNavBarClientWrapper />
      <main className="w-full bg-background text-text-main">
        {/* HERO */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden px-4">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-black text-xs uppercase tracking-widest border border-primary/20 mb-6">
              <Globe className="size-4" /> Giới thiệu
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight leading-tight mb-6">
              {SITE_NAME} — <span className="text-primary">Thế giới truyện trong tầm tay</span>
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              Một nền tảng đọc truyện chữ tiếng Việt, do người Việt làm cho người Việt — với
              giao diện sạch, AI gợi ý thông minh, TTS giọng đọc tự nhiên, và mô hình doanh
              thu công bằng dành cho tác giả.
            </p>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-accent/10 bg-surface">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-3xl md:text-5xl font-black text-primary mb-2 tracking-tight">{s.value}</p>
                  <p className="text-xs uppercase tracking-widest text-muted font-bold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-black mb-6 tracking-tight">Câu chuyện của chúng tôi</h2>
          <div className="prose prose-invert max-w-none text-muted leading-relaxed space-y-4">
            <p>
              Truyen24h.vn ra đời từ một sự bực mình rất quen thuộc: bạn vào một trang đọc truyện
              chữ phổ thông ở Việt Nam và lập tức bị tấn công bởi 4 pop-up quảng cáo, một banner
              che mất ba dòng đầu chương, và giao diện trông không khác gì năm 2008. Chúng tôi
              tin rằng người đọc Việt xứng đáng có một nơi tốt hơn.
            </p>
            <p>
              Chúng tôi xây Truyen24h.vn dựa trên ba nguyên tắc: <strong>đọc phải sạch</strong>,{' '}
              <strong>tác giả phải được trả công xứng đáng</strong>, và <strong>công nghệ phải
              phục vụ trải nghiệm, không phải ngược lại</strong>. Đó là lý do bạn thấy ở đây
              một bộ reader tối giản, một hệ thống chia sẻ doanh thu 60/40 (cao nhất thị trường),
              và một số tính năng AI được lựa chọn cẩn thận — chỉ ở nơi nó thật sự giúp ích.
            </p>
            <p>
              Đội ngũ chúng tôi nhỏ và làm việc trực tiếp với độc giả. Mọi góp ý gửi đến hộp thư
              dưới đây đều được đọc và trả lời.
            </p>
          </div>
        </section>

        {/* VALUES */}
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <h2 className="text-3xl font-black mb-12 tracking-tight text-center">Bốn nguyên tắc cốt lõi</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="p-6 rounded-2xl bg-surface border border-accent/10">
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <v.icon className="size-6" />
                </div>
                <h3 className="text-xl font-black mb-2">{v.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI DISCLOSURE */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/30">
            <div className="flex items-start gap-4">
              <div className="size-14 rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0">
                <Sparkles className="size-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-3">Minh bạch về việc sử dụng AI</h2>
                <p className="text-muted leading-relaxed mb-3">
                  Một phần nội dung trên Truyen24h.vn được tạo ra với sự hỗ trợ của trí tuệ
                  nhân tạo (Google Gemini). Các tác phẩm như vậy:
                </p>
                <ul className="text-sm text-muted leading-relaxed space-y-2 ml-4 list-disc">
                  <li>Luôn được gắn nhãn <strong className="text-yellow-500">"AI-assisted"</strong> ở trang chi tiết truyện.</li>
                  <li>Tác giả được ghi rõ là <strong>"AI Studio"</strong> hoặc bút danh đi kèm dấu sao (*).</li>
                  <li>Đều có sự rà soát của con người trước khi xuất bản.</li>
                  <li>Được dán watermark trong metadata cho công cụ phát hiện của Google/OpenAI.</li>
                </ul>
                <p className="text-sm text-muted leading-relaxed mt-3">
                  Việc minh bạch này tuân thủ chính sách AI Content của Google Publisher (2025)
                  và phù hợp tinh thần Khoản 13 Luật Sở hữu Trí tuệ Việt Nam.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <h2 className="text-3xl font-black mb-8 tracking-tight">Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="group p-5 rounded-2xl bg-surface border border-accent/10 open:border-primary/30"
              >
                <summary className="cursor-pointer font-bold text-lg flex items-center justify-between">
                  <span>{f.q}</span>
                  <span className="text-primary group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="text-sm text-muted leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section className="max-w-4xl mx-auto px-4 pb-24">
          <div className="p-10 rounded-3xl bg-surface border border-accent/10 text-center">
            <Mail className="size-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">Liên hệ với chúng tôi</h2>
            <p className="text-muted mb-6">Mọi góp ý, báo cáo bản quyền, hợp tác quảng cáo:</p>
            <a
              href="mailto:truyen24hvnn@gmail.com"
              className="inline-block font-mono font-bold text-primary text-lg hover:underline"
            >
              truyen24hvnn@gmail.com
            </a>
            <p className="text-xs text-muted mt-4">
              Thường phản hồi trong vòng 48 giờ làm việc.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
