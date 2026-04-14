import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';

export const metadata = {
  title: 'Chính Sách Bảo Mật - Truyen24h',
  description: 'Chính sách bảo mật thông tin tại Truyen24h.vn',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <TopNavBarClientWrapper />
      <main className="w-full max-w-4xl mx-auto px-4 py-32 text-text-main">
        <h1 className="text-4xl md:text-5xl font-black mb-12 tracking-tighter text-primary">Chính Sách Bảo Mật</h1>
        
        <div className="prose prose-invert prose-lg max-w-none text-muted">
          <p>Cập nhật lần cuối: Tháng 4/2026</p>

          <h3 className="text-2xl font-bold mt-8 mb-4 text-white">1. Mục đích thu thập thông tin</h3>
          <p>
            Truyen24h có thể thu thập bao gồm Email, Tên hiển thị (Thông qua Google Authentication) và các Cookie truy cập cơ bản để tạo định danh tài khoản, giúp bạn lưu trữ tủ sách cá nhân và thực hiện quy trình nạp - rút thẻ an toàn.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-4 text-white">2. Cam kết bảo mật</h3>
          <p>
            Thông tin của bạn được lưu trữ qua hạ tầng cơ sở dữ liệu bảo mật Firebase (của Google). Chúng tôi KHÔNG tiết lộ, mua bán hay chia sẻ thông tin định danh của người dùng với bất kỳ bên thứ ba giấu tên nào nhằm mục đích trục lợi.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-4 text-white">3. Dữ liệu Lịch sử & Cookie</h3>
          <p>
            Trình duyệt của bạn sẽ tự động lưu hoặc gửi các Cookies để hệ thống nhận diện việc tải trang, trạng thái đăng nhập, và tùy biến giao diện (Ví dụ: Chế độ ban đêm). Bạn hoàn toàn có thể vô hiệu hóa cookies qua cài đặt của trình duyệt, tuy nhiên điều này làm giảm một số tính năng chính của trang web.
          </p>
        </div>
      </main>
    </>
  );
}
