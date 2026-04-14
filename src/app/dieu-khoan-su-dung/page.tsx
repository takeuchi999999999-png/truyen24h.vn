import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';

export const metadata = {
  title: 'Điều Khoản Sử Dụng - Truyen24h',
  description: 'Điều khoản sử dụng dịch vụ tại Truyen24h.vn',
};

export default function TermsOfServicePage() {
  return (
    <>
      <TopNavBarClientWrapper />
      <main className="w-full max-w-4xl mx-auto px-4 py-32 text-text-main">
        <h1 className="text-4xl md:text-5xl font-black mb-12 tracking-tighter text-primary">Điều Khoản Sử Dụng</h1>
        
        <div className="prose prose-invert prose-lg max-w-none text-muted">
          <p>Cập nhật lần cuối: Tháng 4/2026</p>

          <h3 className="text-2xl font-bold mt-8 mb-4 text-white">1. Chấp nhận điều khoản</h3>
          <p>
            Khi truy cập và sử dụng dịch vụ tại Truyen24h.vn, bạn đồng ý tuân thủ toàn bộ các điều khoản và quy định dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngưng sử dụng dịch vụ.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-4 text-white">2. Quyền và Trách nhiệm của Người Dùng</h3>
          <p>
            Dịch vụ của chúng tôi cung cấp nền tảng chia sẻ và xuất bản văn học (User-Generated Content). Bạn đồng ý tự chịu toàn bộ trách nhiệm về tính pháp lý và bản quyền đối với các nội dung do mình tải lên hệ thống.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Không đăng tải các nội dung vi phạm pháp luật, thuần phong mỹ tục hoặc chứa thông tin đồi trụy, thù địch.</li>
            <li>Không mạo danh tác giả, mạo danh ban quản trị.</li>
            <li>Có quyền nhận tiền nhuận bút (chia sẻ doanh thu 60%) dựa trên số xu độc giả trả cho các chương VIP của tác phẩm bạn sở hữu hợp pháp.</li>
          </ul>

          <h3 className="text-2xl font-bold mt-8 mb-4 text-white">3. Giao dịch & Mua sắm (Xu)</h3>
          <p>
            Mọi giao dịch mua Xu trên nền tảng (nếu có) được thực hiện qua các Cổng thanh toán hợp pháp. Xu chỉ có giá trị nội bộ để mở khóa truyện VIP và không có giá trị quy đổi ngược ra tiền mặt đối với Người Đọc. Đội ngũ tác giả có thể thực hiện Rút Tiền căn cứ theo chính sách thanh toán của Truyen24h.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-4 text-white">4. Miễn trừ trách nhiệm DMCA</h3>
          <p>
            Truyen24h là nền tảng chia sẻ dữ liệu do người dùng tự đăng. Chúng tôi không có nghĩa vụ hoặc khả năng kiểm duyệt 100% nội dung tải lên. Khi nhận được khiếu nại (DMCA) hợp lệ từ các bên chủ sở hữu trí tuệ đến địa chỉ <strong>truyen24hvnn@gmail.com</strong>, chúng tôi sẽ lập tức khóa/gỡ bỏ nội dung vi phạm mà không cần báo trước.
          </p>
        </div>
      </main>
    </>
  );
}
