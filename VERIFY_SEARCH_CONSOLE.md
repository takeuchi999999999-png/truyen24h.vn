# Verify Google Search Console — 3 bước

Anh đã paste TXT record `google-site-verification=tbbtlX8FLXe7a_tGuNru9Dy5kijUJ35OAUStu-QojUo` vào DNS host `@` (em thấy trong screenshot trước). Bây giờ là lúc bấm Verify.

---

## Bước 1 — Đợi DNS lan truyền (5–60 phút)

Trước khi bấm Verify, mở 1 trong các tool dưới để chắc chắn Google thấy được record:

- https://dnschecker.org/#TXT/truyen24h.vn → check global; bao giờ ≥ 80% server show là OK
- https://toolbox.googleapps.com/apps/dig/#TXT/truyen24h.vn → Google Dig Tool, chính xác nhất vì cùng nameserver Google dùng

Hoặc test nhanh bằng PowerShell:

```powershell
Resolve-DnsName -Type TXT truyen24h.vn -Server 8.8.8.8 | Select-Object Strings
```

Phải thấy chuỗi: `google-site-verification=tbbtlX8FLXe7a_tGuNru9Dy5kijUJ35OAUStu-QojUo`

Nếu chưa thấy → đợi thêm 10–30 phút rồi thử lại. Một số nhà cung cấp DNS VN (Tenten/PA Việt Nam) chậm.

---

## Bước 2 — Bấm Verify

1. Vào https://search.google.com/search-console
2. Chọn property `truyen24h.vn` (cái anh đang chờ verify)
3. Bấm nút **VERIFY** (Xác minh)
4. Nếu thành công → màn hình hiện ✅ "Ownership verified"
5. Nếu vẫn lỗi → đợi thêm 30 phút rồi thử lại

---

## Bước 3 — Submit Sitemap (chỉ làm sau khi đã verify xong)

1. Trong Search Console, sidebar trái → **Sitemaps**
2. Trong ô "Add a new sitemap" → nhập: `sitemap.xml`
3. Bấm **Submit**
4. Status sẽ là **Pending** vài giờ đầu, sau 1–2 ngày sẽ chuyển **Success** + show số URL được phát hiện

> Lưu ý: sitemap chỉ hoạt động sau khi anh deploy lên Vercel + map domain truyen24h.vn xong. Hiện đường dẫn `https://truyen24h.vn/sitemap.xml` chưa có gì.

---

## Bước 4 (tùy chọn) — Submit luôn Bing Webmaster

Bing chiếm ~5% search VN, miễn phí, dễ duyệt hơn Google:

1. Vào https://www.bing.com/webmasters
2. Login Microsoft account
3. **Add a site** → `https://truyen24h.vn`
4. Chọn cách verify: **Import from Google Search Console** (nhanh nhất — bấm 1 nút)
5. Submit sitemap: `https://truyen24h.vn/sitemap.xml`

---

## Sau khi Verify xong

Search Console sẽ bắt đầu crawl site sau **1–7 ngày**. Em làm xong Sprint 1 với JSON-LD đầy đủ + sitemap động, nên ranking sẽ ổn nếu có nội dung mới mỗi ngày từ AI pipeline.

Anh có thể check tiến độ index ở mục **Coverage** trong Search Console — đếm số trang đã được Google biết tới.

— Cowork Admin Agent
