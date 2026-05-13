# Truyen24h.vn — Sprint 1 setup guide

Hướng dẫn anh paste credentials và kích hoạt các tính năng mới em vừa code.
Đọc theo thứ tự, mỗi bước < 5 phút.

---

## 0. Tổng quan thay đổi

Sprint 1 này em đã thêm/đổi:

- `src/lib/site.ts` — helper `getSiteUrl()` và `absoluteUrl()` thay cho hardcode.
- `src/lib/apiAuth.ts` — gate `/api/admin/*` bằng `x-admin-email` hoặc `x-admin-token`.
- `src/components/JsonLd.tsx` — Schema.org `Organization`, `WebSite`, `Book`, `Chapter`, `BreadcrumbList`.
- `src/components/Analytics.tsx` — GA4 + Microsoft Clarity + AdSense, env-driven.
- `src/components/AdSlot.tsx` — slot AdSense gọn để chèn giữa chương.
- `src/components/AffiliateWidget.tsx` — widget Shopee theo thể loại.
- `src/services/aiStoryService.ts` — Gemini wrapper: discover topic, sinh outline, sinh chapter.
- `src/app/api/ai/generate-novel/route.ts`
- `src/app/api/ai/generate-chapter/route.ts`
- `src/app/api/admin/publish-novel/route.ts`
- `src/app/api/admin/publish-chapter/route.ts`
- `src/app/api/admin/daily-run/route.ts` — pipeline daily 1-click.
- `src/app/admin/ai-studio/page.tsx` + `src/components/AiStudioClient.tsx`
- `src/app/admin/revenue/page.tsx` + `src/components/RevenueDashboardClient.tsx`
- `src/app/admin/novels/page.tsx` + `src/components/NovelsManagerClient.tsx`
- `src/components/AdminClientWrapper.tsx` — dashboard có cards link tới các tool mới.
- Sửa: PayOS route, sitemap, page metadata, /tac-gia icon.
- Thêm gói VIP "Combo Tháng" 99k vào /vip.

---

## 1. Cập nhật env (5 phút)

Mở `.env.local` (file gốc của anh) và append/sửa các biến sau. File mẫu đầy đủ ở `.env.local.example`.

```env
NEXT_PUBLIC_SITE_URL=https://truyen24h.vn

# PayOS — đăng ký tại https://my.payos.vn → Settings → API Keys
PAYOS_CLIENT_ID=<paste>
PAYOS_API_KEY=<paste>
PAYOS_CHECKSUM_KEY=<paste>

# Gemini — https://aistudio.google.com/app/apikey (free tier OK để bắt đầu)
GEMINI_API_KEY=<paste>
NEXT_PUBLIC_GEMINI_API_KEY=<cùng key trên, dùng cho client recommendations>

# Admin whitelist — email của anh + email công ty
NEXT_PUBLIC_ADMIN_EMAILS=tonypham.automation@gmail.com,truyen24hvnn@gmail.com

# Token bí mật cho cron — tạo bằng: openssl rand -hex 32
ADMIN_API_TOKEN=<paste random 64 ký tự>

# Analytics — bật ngay khi có ID (đều free)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_ID=abcd1234ef

# AdSense — chờ duyệt khi traffic > 1k/ngày
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX

# Affiliate
NEXT_PUBLIC_SHOPEE_AFF_ID=<ID Shopee Affiliate khi anh đăng ký>
```

Quan trọng: trên Vercel, vào **Project → Settings → Environment Variables** paste y hệt (cho cả Production + Preview). Sau đó **Redeploy**.

---

## 2. Lấy các credentials

### 2.1 PayOS Production keys
1. Vào https://my.payos.vn
2. Login → **Cài đặt API** → **Tạo key mới**
3. Copy 3 giá trị: `Client ID`, `API Key`, `Checksum Key`
4. Trong PayOS dashboard set **Webhook URL** = `https://truyen24h.vn/api/webhooks/payos`

### 2.2 Gemini API key
1. Vào https://aistudio.google.com/app/apikey
2. **Create API key** → chọn project Firebase đang dùng
3. Copy key, paste vào cả `GEMINI_API_KEY` lẫn `NEXT_PUBLIC_GEMINI_API_KEY`
4. Free tier: 15 req/phút — quá đủ cho daily run

### 2.3 Google Analytics 4
1. https://analytics.google.com → **Admin** → **Create property**
2. Tên: `Truyen24h.vn`, múi giờ Asia/Ho_Chi_Minh, VND
3. Tạo **Data Stream** → Web → URL `https://truyen24h.vn`
4. Copy **Measurement ID** (dạng `G-XXXXXXXXXX`)

### 2.4 Microsoft Clarity
1. https://clarity.microsoft.com → **New project**
2. Site name `truyen24h.vn`, category Entertainment
3. Copy **Project ID** từ phần install (dạng `abcd1234ef`)

### 2.5 Shopee Affiliate (chờ — ưu tiên thấp)
1. https://affiliate.shopee.vn → đăng ký, đợi duyệt 1–3 ngày
2. Sau khi duyệt, copy **Affiliate ID**

### 2.6 AdSense (chờ — sau khi có traffic)
1. https://adsense.google.com — chỉ apply khi web đã có ~30 bài/truyện, traffic > 500 visitor/ngày
2. Đợi duyệt 1–3 tuần

---

## 3. Test smoke (5 phút)

Sau khi paste env và deploy:

1. Mở `https://truyen24h.vn` — view source, search `"@type":"Organization"` → phải thấy JSON-LD.
2. Mở `https://truyen24h.vn/sitemap.xml` — phải liệt kê static pages + truyện.
3. Mở `https://truyen24h.vn/admin` — login bằng email trong whitelist → phải thấy 3 cards mới (AI Studio, Doanh thu, Quản lý truyện).
4. Vào `/admin/ai-studio` → click **Sinh outline** → nếu Gemini key OK sẽ thấy preview.
5. Click **Đăng + 2 chương đầu** → 30–60s sau truyện mới xuất hiện ở trang chủ.
6. Test PayOS bằng gói 5k → redirect đúng về `/vip?payment=success` (không còn localhost).

---

## 4. Bật Daily Pipeline tự động (10 phút)

Cron Vercel — file `vercel.json` ở root (em sẽ thêm khi anh OK):

```json
{
  "crons": [
    { "path": "/api/admin/daily-run?token=ENV_ADMIN_API_TOKEN", "schedule": "0 1 * * *" }
  ]
}
```

> Lưu ý: Vercel cron giới hạn Hobby plan. Nếu vẫn dùng Hobby, có thể:
> - Dùng GitHub Actions (workflow `.github/workflows/daily.yml`) gọi endpoint qua curl với `x-admin-token`.
> - Hoặc dùng external cron như cron-job.org (free).

Em có thể viết workflow này khi anh bảo.

---

## 5. Checklist anh cần làm ngay

- [ ] Paste 7 credentials vào `.env.local` + Vercel env
- [ ] Set Webhook URL trong PayOS dashboard
- [ ] Submit `sitemap.xml` vào Google Search Console
- [ ] Submit `sitemap.xml` vào Bing Webmaster Tools
- [ ] Tạo GA4 + Clarity → paste ID
- [ ] Duyệt vận hành: cho phép em chạy `/api/admin/daily-run` 1 lần/ngày
- [ ] Quyết định ngân sách tháng 1 cho ads + CTV dịch

Khi xong checklist này, em sẽ có thể vận hành thực sự — đăng truyện mới mỗi ngày, theo dõi doanh thu, marketing.

---

## 6. Liên hệ giữa các tính năng

```
Anh (Tony) ─── duyệt credentials ──┐
                                    ▼
┌─────────────────────────────────────────────────────────┐
│  /admin/ai-studio    /admin/revenue    /admin/novels    │
│        │                  │                 │           │
│        ▼                  ▼                 ▼           │
│   AI sinh truyện     Theo dõi xu      Toggle hot/full   │
│        │                                                │
│        ▼                                                │
│   /api/admin/daily-run  ←─ cron 8h sáng ──┐             │
│        │                                   │            │
│        ▼                                   │            │
│   Firestore (novels, chapters, transactions)            │
│        │                                                │
│        ▼                                                │
│   Site public: SEO JSON-LD, sitemap, OG cho TikTok      │
│        │                                                │
│        ▼                                                │
│   User đọc → unlock chương → PayOS → coins → doanh thu  │
└─────────────────────────────────────────────────────────┘
```

— Cowork Admin Agent
