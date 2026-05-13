# Deploy Vercel + Import .env — 1 file đọc xong làm trong 10 phút

## Phần 1 — Tạo project Vercel (5 phút)

1. Vào https://vercel.com → đăng nhập (dùng cùng GitHub đang chứa repo).
2. Bấm **Add New… → Project**.
3. Tìm `Horizon-PVT/truyen24h.vn` → **Import**.
4. Màn hình "Configure Project":
   - **Project Name**: `truyen24h` (hoặc tự đặt)
   - **Framework Preset**: Next.js (auto-detect)
   - **Root Directory**: để trống / `./`
   - **Build Command**: để trống (mặc định `next build`)
   - **Output Directory**: để trống

5. **KHOAN BẤM DEPLOY** — xuống phần **Environment Variables** trước.

---

## Phần 2 — Import .env (3 phút, đây là chỗ tiết kiệm thời gian nhất)

Vercel có nút **"Import .env"** trong khu vực Environment Variables.

1. Bấm icon **Import .env** (hoặc đôi khi là dấu `...` rồi chọn Import).
2. Hộp thoại sẽ hiện popup dán content. Mở file `.env.local` ở folder dự án, **copy toàn bộ nội dung**, paste vào hộp popup.
3. Vercel sẽ tự parse từng dòng. Em đã ghi sẵn 15 biến vào `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_*` (7 biến)
   - `NEXT_PUBLIC_SITE_URL=https://truyen24h.vn`
   - `NEXT_PUBLIC_GEMINI_API_KEY` + `GEMINI_API_KEY`
   - `NEXT_PUBLIC_ADMIN_EMAILS`
   - `ADMIN_API_TOKEN`
   - `NEXT_PUBLIC_GA_ID`
   - `NEXT_PUBLIC_CLARITY_ID`
   - `PAYOS_CLIENT_ID` + `PAYOS_API_KEY` + `PAYOS_CHECKSUM_KEY`
4. Vercel sẽ hiện list các biến. Mỗi biến anh check 3 environments: **Production**, **Preview**, **Development**.
5. Bấm **Save**.

> Nếu Vercel không có nút Import, anh copy từng dòng `KEY=value`. Mất ~5 phút thay vì 30 giây.

---

## Phần 3 — Deploy lần đầu (2 phút)

1. Sau khi env xong → quay về phần trên cùng → bấm **Deploy** (hoặc nút màu xanh ở góc).
2. Vercel build trong ~ 2–4 phút.
3. Build xong → Vercel cấp URL `https://truyen24h-xxx.vercel.app`. Mở thử.

Nếu build fail → bấm **Logs** xem stderr → paste cho em đọc.

---

## Phần 4 — Map domain truyen24h.vn (5 phút)

1. Trong project Vercel → **Settings → Domains** → Add `truyen24h.vn`.
2. Vercel hiện 2 record DNS:
   - `A     @     76.76.21.21`
   - `CNAME www   cname.vercel-dns.com`
3. Đăng nhập nhà cung cấp domain → DNS Management → Thêm 2 record trên.
4. Quay về Vercel — 5–30 phút sau status đổi từ Pending → Valid.
5. Vercel auto cấp SSL miễn phí (Let's Encrypt).

---

## Phần 5 — Verify cron daily-run (1 phút)

Sau khi deploy xong, kiểm tra cron đã đăng ký:

1. Vercel project → **Settings → Cron Jobs**.
2. Phải thấy 1 cron: `/api/admin/daily-run-cron` chạy `0 1 * * *` (= 8h sáng VN).

> Nếu plan Hobby không cho cron, anh enable workflow `daily-run.yml` ở GitHub Actions (sẵn rồi). Vào repo → Actions tab → "Daily AI Story Run" → Run workflow để test.

---

## Phần 6 — Smoke test (3 phút)

Sau khi domain xong, mở thử:

| URL | Phải thấy gì |
|---|---|
| `https://truyen24h.vn` | Trang chủ load, không lỗi 500 |
| `https://truyen24h.vn/gioi-thieu` | Trang About mới em vừa làm |
| `https://truyen24h.vn/sitemap.xml` | XML có cả static pages + (chưa có truyện cũng OK) |
| View source `https://truyen24h.vn` | Thấy 2 `<script type="application/ld+json">` (Organization + WebSite) |
| `https://truyen24h.vn/admin` | Đăng nhập Google bằng `tonypham.automation@gmail.com` → thấy dashboard mới có 3 cards |
| `https://truyen24h.vn/admin/ai-studio` | Bấm Sinh outline → outline + cover hiện ra |
| Mở Chrome DevTools → Network | Sau 5–10s phải thấy request `googletagmanager.com` (GA4) + `clarity.ms` |

Nếu mục nào fail → screenshot + paste cho em, em fix.

---

## Phần 7 — Sau khi mọi thứ OK

1. Mở `/admin/ai-studio` → bấm **Chạy Daily Pipeline** (nhập 2 truyện mới + 5 chương tiếp).
2. Đợi ~ 60–120 giây.
3. Truyện mới sẽ xuất hiện ở trang chủ với cover Pollinations.ai đẹp.
4. Mua thử 1 chương VIP bằng tài khoản thường (login Google khác email admin) → test luồng PayOS thực tế.

— Cowork Admin Agent
