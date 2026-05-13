# Deploy lên Vercel — Hướng dẫn step-by-step

Repo: https://github.com/Horizon-PVT/truyen24h.vn

Tổng thời gian: ~30 phút (lần đầu) — sau lần đầu thì mỗi lần deploy chỉ là `git push`.

---

## 1. Push code lên GitHub (5 phút)

Mở Terminal/PowerShell trong folder `truyen24h.vn`:

```bash
git add .
git commit -m "Sprint 1: AI pipeline, admin panel, SEO, monetization"
git push origin main
```

Nếu chưa có remote:
```bash
git remote add origin https://github.com/Horizon-PVT/truyen24h.vn.git
git branch -M main
git push -u origin main
```

> Lưu ý: `.env.local` và `.env*` đã có trong `.gitignore` nên KHÔNG bị push lên GitHub. An toàn.

---

## 2. Link Vercel với repo (5 phút)

1. Vào https://vercel.com → **Add New… → Project**
2. **Import** repo `Horizon-PVT/truyen24h.vn`
3. Framework Preset: **Next.js** (auto-detect)
4. Root directory: để mặc định `./`
5. Build Command: để mặc định (`next build`)
6. **Khoan bấm Deploy** — sang bước 3 set env trước.

---

## 3. Set Environment Variables trên Vercel (10 phút)

Trong project Vercel, vào **Settings → Environment Variables**, paste lần lượt các biến dưới đây. Đối với mỗi biến, tick cả **Production**, **Preview** và **Development**.

| Biến | Giá trị | Lấy ở đâu |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://truyen24h.vn` | (cố định) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (đã có trong .env.local) | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (cùng) | (cùng) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (cùng) | (cùng) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (cùng) | (cùng) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (cùng) | (cùng) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (cùng) | (cùng) |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | (cùng) | (cùng) |
| `NEXT_PUBLIC_ADMIN_EMAILS` | `tonypham.automation@gmail.com,truyen24hvnn@gmail.com` | — |
| `ADMIN_API_TOKEN` | `b2cce1174a705bed6b62f3dc05576fa8ee1d27bb0dba7cdcdabf9db8355112c9` | (em đã gen ở chat) |
| `GEMINI_API_KEY` | (sk-…) | aistudio.google.com/app/apikey |
| `NEXT_PUBLIC_GEMINI_API_KEY` | (cùng key trên) | (cùng) |
| `PAYOS_CLIENT_ID` | (UUID) | my.payos.vn → API Keys |
| `PAYOS_API_KEY` | (UUID) | (cùng) |
| `PAYOS_CHECKSUM_KEY` | (chuỗi dài) | (cùng) |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | analytics.google.com (tạo property) |
| `NEXT_PUBLIC_CLARITY_ID` | `abcd1234ef` | clarity.microsoft.com |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | (chưa cần, để trống) | sau khi traffic > 500/ngày |
| `NEXT_PUBLIC_SHOPEE_AFF_ID` | (chưa cần, để trống) | sau khi Shopee duyệt |

> **Tips**: ở góc dưới có nút **"Import .env"** — anh có thể paste cả nội dung `.env.local` vào để khỏi điền từng dòng.

---

## 4. First deploy (5 phút)

1. Sau khi set env xong → quay về **Deployments** → bấm **Redeploy** (hoặc commit gì đó mới vào main).
2. Đợi build chạy. Nếu lỗi: vào tab **Logs** xem stderr. 99% lỗi build = quên biến env nào đó.
3. Build xong → Vercel sẽ cấp 1 URL `*.vercel.app`. Mở thử xem trang chủ load đúng không.

---

## 5. Map domain truyen24h.vn (5 phút)

1. Trong project Vercel → **Settings → Domains** → Add `truyen24h.vn`
2. Vercel show 2 record DNS cần tạo:
   - `A @ → 76.76.21.21`
   - `CNAME www → cname.vercel-dns.com`
3. Vào nhà cung cấp domain (Tenten/Mắt Bão/...) → DNS Management → thêm 2 record đó
4. Đợi 5–30 phút DNS propagate → status đổi từ "Pending" sang "Valid"
5. Vercel auto cấp SSL miễn phí.

---

## 6. Set Webhook PayOS (2 phút)

1. Vào https://my.payos.vn → chọn website → **Webhook** tab
2. URL = `https://truyen24h.vn/api/webhooks/payos`
3. Bấm **Test webhook** — phải thấy response 200 từ Vercel.

---

## 7. Verify cron daily-run

Vercel cron sẽ tự chạy 01:00 UTC = 08:00 VN. Để test ngay không đợi:

**Cách 1 — chạy thủ công qua curl** (cần CRON_SECRET hoặc ADMIN_API_TOKEN):

```bash
curl -X GET \
  -H "Authorization: Bearer b2cce1174a705bed6b62f3dc05576fa8ee1d27bb0dba7cdcdabf9db8355112c9" \
  "https://truyen24h.vn/api/admin/daily-run-cron?newNovels=1&continueNovels=2"
```

**Cách 2 — qua GitHub Actions** (workflow_dispatch):
- Vào repo → tab **Actions** → "Daily AI Story Run" → **Run workflow** → Run.
- Trước đó set 2 secrets ở **Settings → Secrets and variables → Actions**:
  - `ADMIN_API_TOKEN` = chuỗi giống ở Vercel
  - `SITE_URL` = `https://truyen24h.vn`

**Cách 3 — qua UI** (cần login admin):
- Vào `https://truyen24h.vn/admin/ai-studio` → bấm "Chạy Daily Pipeline".

---

## 8. Lựa chọn cron (Vercel Hobby vs Pro)

| Plan | Cron support | Khuyến nghị |
|---|---|---|
| Hobby (free) | Tối đa 2 cron, mỗi lần daily | OK cho start — vercel.json đã set 1 cron daily |
| Pro ($20/tháng) | Tối đa 40 cron, frequency cao hơn | Khi anh muốn chạy mỗi giờ, hoặc nhiều job |

Nếu Vercel báo Hobby không hỗ trợ thì dùng GitHub Actions (free unlimited cho public repo). Cả 2 đã wire sẵn — anh chỉ cần kích hoạt 1 trong 2.

---

## 9. Sau khi go-live

1. Submit `https://truyen24h.vn/sitemap.xml` vào https://search.google.com/search-console (anh tự verify domain với DNS TXT record Vercel cấp).
2. Submit cùng URL vào https://www.bing.com/webmasters.
3. Tạo Facebook Fanpage + TikTok account để có link OG hợp lệ.
4. Đợi 24h xem GA4 có ghi nhận visitor thật chưa.
5. Login `/admin/ai-studio` test sinh 1 truyện thật → kiểm tra hiện đúng ở trang chủ.

---

## 10. Mọi lần deploy tiếp theo

Chỉ cần:
```bash
git add .
git commit -m "feat: ..."
git push
```

Vercel auto deploy 1–2 phút. Nếu cần preview trước khi merge thì push lên branch khác → Vercel cấp preview URL riêng.

— Cowork Admin Agent
