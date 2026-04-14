import { Novel } from './types';

export const GENRES = [
  'Bách Hợp', 'BE', 'Bình Luận Cốt Truyện', 'Chữa Lành',
  'Cổ Đại', 'Cung Đấu', 'Cưới Trước Yêu Sau', 'Cường Thủ Hào Đoạt',
  'Dị Năng', 'Dương Thê', 'Đam Mỹ', 'Điền Văn',
  'Đô Thị', 'Đoản Văn', 'Đọc Tâm', 'Gả Thay',
  'Gia Đấu', 'Gia Đình', 'Gương Vỡ Không Lành', 'Gương Vỡ Lại Lành',
  'Hài Hước', 'Hành Động', 'Hào Môn Thế Gia', 'HE',
  'Hệ Thống', 'Hiện Đại', 'Hoán Đổi Thân Xác', 'Học Bá',
  'Học Đường', 'Hư Cấu Kỳ Ảo', 'Huyền Huyễn', 'Không CP',
  'Kinh Dị', 'Linh Dị', 'Mạt Thế', 'Mỹ Thực',
  'Ngôn Tình', 'Ngọt', 'Ngược', 'Ngược Luyến Tàn Tâm',
  'Ngược Nam', 'Ngược Nữ', 'Nhân Thú', 'Niên Đại',
  'Nữ Cường', 'OE', 'Phép Thuật', 'Phiêu Lưu',
  'Phương Đông', 'Phương Tây', 'Quy Tắc', 'Sảng Văn',
  'SE', 'Showbiz', 'Sủng', 'Thanh Xuân Vườn Trường',
  'Thức Tỉnh Nhân Vật', 'Tiên Hiệp', 'Tiểu Thuyết', 'Tổng Tài',
  'Trả Thù', 'Trinh Thám', 'Trọng Sinh', 'Truy Thê',
  'Truyền Cảm Hứng', 'Vả Mặt', 'Vô Tri', 'Xuyên Không',
  'Xuyên Sách'
];

export const MOCK_CHAPTERS = [
  {
    id: 'c124',
    title: 'Ngọn Lửa Trại',
    chapterNumber: 124,
    publishDate: '2 ngày trước',
    content: `Ánh trăng treo thấp trên bầu trời, đổ những bóng dài bạc trắng lên thảm cỏ được cắt tỉa cẩn thận của dinh thự. Elara đứng bên cửa sổ lớn, hơi thở cô làm mờ đi lớp kính mát lạnh. Cô không thể ngủ được. Những sự kiện của buổi tối cứ lặp đi lặp lại trong tâm trí cô, một bản giao hưởng hỗn loạn của những cuộc trò chuyện nghe lỏm được và những cái nhìn trộm.\n\nJulian đã ở đó, tất nhiên rồi. Anh ấy luôn như vậy, ẩn hiện ở rìa tầm mắt cô, một người quan sát thầm lặng với đôi mắt như những đám mây bão. Khi cuối cùng anh tiến lại gần cô, không khí trong phòng dường như loãng đi, khiến việc hít một hơi thật sâu cũng trở nên khó khăn. Giọng nói của anh, khi cất lên, là một tiếng trầm thấp vang vọng ngay trong lồng ngực cô.\n\n"Em trông có vẻ quá thoải mái giữa sự hỗn loạn này," anh lẩm bẩm, xoay nhẹ chất lỏng màu hổ phách trong chiếc ly pha lê.\n\nCô nhớ mình đã cứng người lại, những ngón tay siết chặt lấy chiếc ly của chính mình. "Và anh trông như đang âm mưu một vụ giết người, như thường lệ."\n\nMột nụ cười thoáng qua chạm vào môi anh, chóng vánh và nguy hiểm. "Có lẽ là vậy."`
  },
  {
    id: 'c123',
    title: 'Gió Biển (Chương VIP)',
    chapterNumber: 123,
    publishDate: '5 ngày trước',
    content: 'Bạn đã mở khóa thành công chương VIP này. Đây là nội dung đặc quyền dành cho người đọc trả phí. Ánh sáng le lói từ chân trời như báo hiệu một ngày mới đang thật sự bắt đầu. Gió biển đêm qua đã thôi gào thét...',
    isVip: true,
    price: 50
  },
  {
    id: 'c122',
    title: 'Những Lời Chưa Nói',
    chapterNumber: 122,
    publishDate: '1 tuần trước',
    content: 'Nội dung chương 122 đang được cập nhật...'
  }
];

export const NOVELS: Novel[] = [
  {
    id: '1',
    title: 'Mùa Hè Chúng Ta Trở Nên Xinh Đẹp',
    author: 'Elara Vance',
    authorId: 'system',
    description: "Mỗi mùa hè, Belly rời bỏ cuộc sống thường nhật để đến bãi biển Cousins, nơi cô dành cả ngày với anh em nhà Fisher—Conrad và Jeremiah. Họ vừa là những người anh, vừa là những người cô thầm thương trộm nhớ, và là tất cả đối với cô. Nhưng mùa hè này thì khác. Khi họ trở lại ngôi nhà ven biển quen thuộc với những sàn gỗ bạc màu nắng và làn gió biển ấm áp, mọi thứ đã thay đổi. Belly không còn là cô em gái nhỏ luôn lẽo đẽo theo sau nữa. Cô đã trưởng thành, và lần đầu tiên, Conrad và Jeremiah dường như đã nhận ra điều đó.",
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR1qGStf75WdvLj2SFCx_Yoh4W4oYIZIzcsb4PpBWNGS0qbQUpZz_wzf6bQOsgOxyWcCSKMxgnHbKFyquplrwIlzoetec1DSQb_hGJ8EcPOJPCM8GVsyy-353gLho7Xl2M4opRq6arvs4P4taVGwOa0fJ0r8ro4Bu9eBu_fqQsuvXjhljfoKxKZVFRIuataR4Z7xH8f3CuUz1g3M6SPe-cqi5HB4iFQde9mxMOv0Uj03OU5WKFwWzQrMAAKBtF3eMCqs1GBorcabU',
    bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2krlchCRMDZAIIVIZVqwJChuRi0mL06RiEn5Pk4il0LQKABH1_vRqyvYGFKEfyVI1cD3HhbW_HfEZfusAaD2pp74aFycdOKpYXleFIJCHrPWpNfQ3UJZoMC7uq2OOTB0M5n2Abq5Q_6UL_rXJN18dN62kKZBovfv3R7XXcGYmANYfsiQlfBM7z5eiJR_wvXBYVvW7PJHf7jOuC-WFFO0MHcxn_QcWUexgTRxViKRXWt1PMhrt8WYdQd98xUxuxVDiqZL_6xSR6tM',
    genres: ['Ngôn Tình', 'Đời thường'],
    status: 'Đang ra',
    chapters: MOCK_CHAPTERS,
    views: '1.2M',
    rating: 4.9,
    lastUpdated: '2 ngày trước',
    isHot: true,
    translationGroup: 'Diệp Gia Gia'
  },
  {
    id: '2',
    title: 'Lời Thì Thầm Trong Gió',
    author: 'Julian Thorne',
    authorId: 'system',
    description: 'Một câu chuyện tình cảm huyền ảo đặt trong bối cảnh thế giới nơi phép thuật được mang đi bởi những làn gió.',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARM1aVA16Fro1XFskbixELVU-hDkNsMRbR3N9vcXhsCP8kTyTni62Z3OlIKNsghs_FFGl5X9XTbsH1C0nux3c5ZS9O4hhDaa-U2IxoJZMJ251UuVeQMRK7Lm0SM3YBRAHoBuunqQ7wD_-h-p6jBqE3voM3kcD3xyjy6diRYKZl8I3U-4BP31a4cwTWHfJxBa4JpikIQbrXbafgUJWbaWeizHJTRL84N-wvhKH7Z1hZNzm7Q-TCYvDbP7bklWVKVItmIkkPY0Jf-Ho',
    bannerUrl: '',
    genres: ['Huyền Huyễn', 'Ngôn Tình'],
    status: 'Đang ra',
    chapters: MOCK_CHAPTERS,
    views: '85.2k',
    rating: 4.7,
    lastUpdated: '5 giờ trước',
    isHot: true,
    translationGroup: 'Xoăn dịch truyện'
  },
  {
    id: '3',
    title: 'Cánh Hoa và Gai Nhọn',
    author: 'Rose Miller',
    authorId: 'system',
    description: 'Một bộ phim lịch sử về tình yêu và sự phản bội trong thời đại Victoria.',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgPtUwToMfHZv_NVDNrbB3CrNMJplD53notrnod9UCq2LWTFnBLn3VDi0LO69ZNvPDjuQuh9n0KTFbItXlyVftxOqk26jnmxR_ahBcFp2-u1b-SruvXKUHXgBnUjID4Ekcg8vPMz6opYSD0k4-F7APMRnMrqnLIz2QjkKJV5L_8lBfu8n_hELyDLaPX69uZNdx4w0hUjFwLDp2zR1ojvR4C-2FV10kPVpHCElwm_73iPmOhUmBlCwArbg-6cLIZ3AHZh_aczNYfPQ',
    bannerUrl: '',
    genres: ['Cổ Đại', 'Kịch tính'],
    status: 'Hoàn thành',
    chapters: MOCK_CHAPTERS,
    views: '72.1k',
    rating: 4.8,
    lastUpdated: '1 tuần trước',
    isFull: true,
    translationGroup: 'Hồng Trần Vô Định'
  },
  {
    id: '4',
    title: 'Thập Niên 80: Thiên Kim Thật Hiểu Thú Ngữ',
    author: 'Tống Minh Đường',
    authorId: 'system',
    description: 'Bị đuổi khỏi đại viện, thiên kim thật hiểu thú ngữ dẫn cả nhà bay cao.',
    coverUrl: 'https://picsum.photos/seed/novel4/400/600',
    bannerUrl: '',
    genres: ['Trọng Sinh', 'Hiện Đại'],
    status: 'Đang ra',
    chapters: MOCK_CHAPTERS,
    views: '250k',
    rating: 4.9,
    lastUpdated: '1 giờ trước',
    isHot: true,
    translationGroup: 'Tiểu Soái'
  },
  {
    id: '5',
    title: 'Thứ Nữ Thích Hóng Chuyện',
    author: 'Lâm Kim Khuyết',
    authorId: 'system',
    description: 'Thứ nữ thích hóng chuyện, cả triều nghe lén tâm thanh của nàng.',
    coverUrl: 'https://picsum.photos/seed/novel5/400/600',
    bannerUrl: '',
    genres: ['Cổ Đại', 'Cung Đấu'],
    status: 'Đang ra',
    chapters: MOCK_CHAPTERS,
    views: '180k',
    rating: 4.6,
    lastUpdated: '3 giờ trước',
    translationGroup: 'Vân Vũ Miên Miên'
  }
];
