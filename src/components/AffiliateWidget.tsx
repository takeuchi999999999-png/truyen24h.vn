/**
 * Affiliate widget — placed alongside chapter content / novel detail.
 *
 * Phase 1 (this commit): static, genre-keyed picks pointing at Shopee
 * search results — generates clicks even without a Shopee Affiliate API key.
 * Anh chỉ cần đăng ký Shopee Affiliate, lấy AFF ID, sau đó set
 * NEXT_PUBLIC_SHOPEE_AFF_ID — module sẽ tự nhúng vào link.
 *
 * Phase 2 (future): swap to live Shopee Affiliate Open API once we have
 * a partner contract.
 */
'use client';

interface Pick { keyword: string; emoji: string; }

const PICKS_BY_GENRE: Record<string, Pick[]> = {
  'Ngôn Tình': [
    { keyword: 'sổ tay đọc truyện hồng', emoji: '📓' },
    { keyword: 'gối ôm chibi nam thần', emoji: '🐻' },
    { keyword: 'son môi cam đào', emoji: '💄' },
  ],
  'Tiên Hiệp': [
    { keyword: 'tranh treo phong cảnh tiên hiệp', emoji: '🏯' },
    { keyword: 'kiếm gỗ trang trí', emoji: '🗡️' },
    { keyword: 'tinh dầu xông phòng thiền', emoji: '🕯️' },
  ],
  'Đam Mỹ': [
    { keyword: 'poster danh mỹ in', emoji: '🖼️' },
    { keyword: 'sticker đam mỹ', emoji: '✨' },
  ],
  'Trinh Thám': [
    { keyword: 'sách trinh thám hay', emoji: '🔍' },
    { keyword: 'đèn đọc sách nhỏ gọn', emoji: '💡' },
  ],
  default: [
    { keyword: 'sách bản quyền giảm giá', emoji: '📚' },
    { keyword: 'đèn ngủ đọc sách', emoji: '💡' },
    { keyword: 'tai nghe bluetooth pin lâu', emoji: '🎧' },
  ],
};

function pickFor(genres: string[]): Pick[] {
  for (const g of genres) {
    const found = PICKS_BY_GENRE[g];
    if (found) return found;
  }
  return PICKS_BY_GENRE.default;
}

function buildShopeeUrl(keyword: string): string {
  const affId = process.env.NEXT_PUBLIC_SHOPEE_AFF_ID;
  const q = encodeURIComponent(keyword);
  const base = `https://shopee.vn/search?keyword=${q}`;
  return affId ? `${base}&af_id=${affId}` : base;
}

export default function AffiliateWidget({ genres = [] as string[] }: { genres?: string[] }) {
  const picks = pickFor(genres);
  return (
    <aside className="my-8 p-5 rounded-2xl border border-accent/10 bg-surface/60">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold tracking-wider uppercase text-muted">Gợi ý cho fan thể loại này</h3>
        <span className="text-[10px] text-muted/60">Tài trợ · Shopee</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {picks.map((p) => (
          <a
            key={p.keyword}
            href={buildShopeeUrl(p.keyword)}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-primary/5 border border-transparent hover:border-primary/30 transition"
          >
            <span className="text-2xl">{p.emoji}</span>
            <span className="text-xs font-medium line-clamp-2">{p.keyword}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
