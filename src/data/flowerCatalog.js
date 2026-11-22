// Bộ sưu tập hoa chuẩn hóa cho Tiệm Hoa Xinh
// Tất cả 36 mẫu hoa đều gắn ảnh thực tế đã tải về trong public/images/flowers/
// và phân loại khớp 100% với danh mục thiết kế, dịp tặng và tông màu.

export const CATALOG_SEED_CUTOFF = 1795386000000; // Bỏ qua các bản override thử nghiệm cũ trước bản nâng cấp này

export const CURATED_CATEGORIES = [
  { maDanhMuc: 1, tenDanhMuc: 'Bó hoa tươi nghệ thuật' },
  { maDanhMuc: 2, tenDanhMuc: 'Giỏ hoa chúc mừng' },
  { maDanhMuc: 3, tenDanhMuc: 'Lẵng hoa khai trương' },
  { maDanhMuc: 4, tenDanhMuc: 'Hộp hoa cao cấp' },
  { maDanhMuc: 5, tenDanhMuc: 'Hoa cưới cầm tay' },
];

// Chuẩn hóa tên loài hoa, danh mục, tông màu & ảnh thực tế cho 20 sản phẩm hiện có trong SQL Server
export const SERVER_PRODUCT_PATCHES = {
  24: {
    tenSanPham: 'Bó Hoa Hồng Ohara Phối Tulip Pastel',
    loaiHoa: 'Hoa Hồng Ohara & Hoa Tulip',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    tongMauSac: 'Hồng Pastel',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/rose-tulip-pastel.webp',
    moTa:
      'Sự kết hợp ngọt ngào giữa hoa hồng Ohara hồng phấn và hoa tulip nhập khẩu Hà Lan, gói giấy lụa Hàn Quốc thanh lịch. Lý tưởng cho hoa sinh nhật tặng người yêu, kỷ niệm tình yêu sang trọng.',
  },
  2: {
    tenSanPham: 'Bó Hoa Ly Trắng Thơm Ngát Tinh Khôi',
    loaiHoa: 'Hoa Ly Trắng (Oriental Lily)',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['chu-de', 'sinh-nhat', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/white-lily-bouquet.jpg',
    moTa:
      'Bó hoa ly trắng Đà Lạt bông lớn hương thơm dịu nhẹ, điểm xuyết hoa baby trắng và giấy gói tối giản sang trọng, thích hợp tặng chúc mừng, tri ân và sinh nhật tinh tế.',
  },
  3: {
    tenSanPham: 'Bó Hoa Hướng Dương Rạng Rỡ Năng Lượng',
    loaiHoa: 'Hoa Hướng Dương & Hồng Vàng',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    tongMauSac: 'Vàng',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/sunflower-bouquet.jpg',
    moTa:
      'Bó hoa hướng dương tươi tắn rực rỡ ánh mặt trời phối cùng hoa hồng vàng và lá bạc eucalyptus. Lựa chọn hàng đầu cho bó hoa sinh nhật tươi tắn, lễ tốt nghiệp và chúc mừng thành công.',
  },
  4: {
    tenSanPham: 'Hoa Cưới Cầm Tay Hoa Baby Trắng Tinh Khôi',
    loaiHoa: 'Hoa Baby Trắng Hà Lan (Gypsophila)',
    maDanhMuc: 5,
    tenDanhMuc: 'Hoa cưới cầm tay',
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/wedding-babys-breath.jpg',
    moTa:
      'Bó hoa cưới cầm tay cô dâu kết hoàn toàn từ hoa baby trắng Hà Lan bồng bềnh như mây, thắt ruy băng lụa trắng tối giản, mang vẻ đẹp thuần khiết và hiện đại trong ngày trọng đại.',
  },
  5: {
    tenSanPham: 'Bó Hoa Tulip Vàng Hà Lan Sang Trọng',
    loaiHoa: 'Hoa Tulip Vàng Hà Lan',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    tongMauSac: 'Vàng',
    danhMucTrangChu: ['sinh-nhat', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/yellow-tulip-bouquet.jpg',
    moTa:
      'Tuyển chọn những cành hoa tulip vàng tươi nhập khẩu trực tiếp từ Hà Lan, gói giấy Hàn Quốc phối nơ caro vàng rạng rỡ. Món quà sinh nhật sang trọng và tinh tế.',
  },
  6: {
    tenSanPham: 'Bó Hoa Cẩm Tú Cầu Xanh Biếc Đà Lạt',
    loaiHoa: 'Hoa Cẩm Tú Cầu Xanh (Hydrangea)',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    tongMauSac: 'Xanh Dương',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/blue-hydrangea-bouquet.webp',
    moTa:
      'Bó hoa cẩm tú cầu xanh dương Đà Lạt tròn đầy tươi mát, biểu tượng của lòng biết ơn, sự chân thành và bình yên. Phù hợp tặng sinh nhật, kỷ niệm và tri ân.',
  },
  7: {
    tenSanPham: 'Giỏ Hoa Hồng Đỏ Nhung Chúc Mừng Sinh Nhật',
    loaiHoa: 'Hoa Hồng Đỏ Ecuador',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    tongMauSac: 'Đỏ',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/red-rose-peony-basket.webp',
    moTa:
      'Giỏ hoa chúc mừng đan mây thủ công xếp đầy hoa hồng đỏ nhung rực rỡ. Món quà sinh nhật tặng mẹ, người yêu hoặc đối tác đầy sang trọng và ấm áp.',
  },
  8: {
    tenSanPham: 'Chậu Hoa Lan Hồ Điệp Trắng Sang Trọng (5 Cành)',
    loaiHoa: 'Hoa Lan Hồ Điệp Trắng (Phalaenopsis)',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['lan-ho-diep', 'khai-truong', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/white-phalaenopsis-orchid.jpg',
    moTa:
      'Chậu hoa lan hồ điệp trắng loại A gồm 5 cành bông to nở đều, ghép trong chậu sứ men trắng cao cấp. Bền đẹp 4–6 tuần, cực kỳ sang trọng cho dịp khai trương, chúc mừng và tri ân.',
  },
  9: {
    tenSanPham: 'Giỏ Hoa Đồng Tiền Cam Đào & Kem Chúc Mừng',
    loaiHoa: 'Hoa Đồng Tiền Kép (Gerbera)',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    tongMauSac: 'Cam Đào',
    danhMucTrangChu: ['khai-truong', 'sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/orange-gerbera-rose-basket.jpg',
    moTa:
      'Giỏ hoa chúc mừng để bàn tươi sáng với hoa đồng tiền cam đào và kem sữa tượng trưng cho may mắn, tài lộc. Phù hợp giỏ hoa khai trương để bàn và sinh nhật tặng mẹ.',
  },
  10: {
    tenSanPham: 'Giỏ Hoa Cẩm Tú Cầu Xanh & Cát Tường Trắng',
    loaiHoa: 'Hoa Cẩm Tú Cầu & Hoa Cát Tường',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    tongMauSac: 'Xanh Dương',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/hydrangea-lisianthus-basket.webp',
    moTa:
      'Giỏ hoa đan cao cấp phối hoa cẩm tú cầu xanh dương dịu mắt cùng hoa hồng kem và hoa cát tường trắng tinh tế. Thiết kế được ưa chuộng làm giỏ hoa sinh nhật tặng mẹ và chúc mừng tri ân.',
  },
  11: {
    tenSanPham: 'Kệ Hoa Khai Trương Hồng Phát Đồng Tiền & Thiên Điểu Đỏ',
    loaiHoa: 'Hoa Đồng Tiền Đỏ, Lan Mokara & Thiên Điểu',
    maDanhMuc: 3,
    tenDanhMuc: 'Lẵng hoa khai trương',
    tongMauSac: 'Đỏ',
    danhMucTrangChu: ['khai-truong', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/grand-opening-red-stand.jpg',
    moTa:
      'Kệ hoa khai trương hồng phát đại cát nổi bật với sắc đỏ thịnh vượng từ hoa đồng tiền, lan mokara, hoa thiên điểu và lá trầu bà Nam Mỹ sang trọng.',
  },
  12: {
    tenSanPham: 'Kệ Hoa Khai Trương Hướng Dương Vàng Son Rực Rỡ',
    loaiHoa: 'Hoa Hướng Dương, Hồng Cam & Lan Vũ Nữ',
    maDanhMuc: 3,
    tenDanhMuc: 'Lẵng hoa khai trương',
    tongMauSac: 'Vàng',
    danhMucTrangChu: ['khai-truong', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/grand-opening-yellow-stand.webp',
    moTa:
      'Kệ hoa khai trương phong cách hiện đại với giá gỗ sang trọng, phối hoa hướng dương rực rỡ, hồng cam đào và lan vũ nữ vàng kim chúc doanh nghiệp đại phát.',
  },
  13: {
    tenSanPham: 'Lẵng Hoa Khai Trương Lan Hồ Điệp & Cẩm Tú Cầu Cao Cấp',
    loaiHoa: 'Lan Hồ Điệp Trắng, Cẩm Tú Cầu & Hồng Kem',
    maDanhMuc: 3,
    tenDanhMuc: 'Lẵng hoa khai trương',
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['khai-truong', 'lan-ho-diep', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/grand-opening-pastel-stand.webp',
    moTa:
      'Lẵng hoa khai trương đẳng cấp kết hợp lan hồ điệp trắng, cẩm tú cầu xanh pastel, hồng trắng và phi yến tím. Phong cách tinh tế dành cho showroom, spa và đối tác VIP.',
  },
  14: {
    tenSanPham: 'Hộp Hoa Hồng Đỏ Trái Tim Tình Yêu Lãng Mạn',
    loaiHoa: 'Hoa Hồng Đỏ Ecuador',
    maDanhMuc: 4,
    tenDanhMuc: 'Hộp hoa cao cấp',
    tongMauSac: 'Đỏ',
    danhMucTrangChu: ['chu-de', 'sinh-nhat', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/red-rose-heart-box.jpg',
    moTa:
      'Hộp nhung đen hình trái tim cao cấp xếp kín 36 bông hồng đỏ nhung Ecuador quyến rũ. Món quà hoa tình yêu, kỷ niệm và Valentine sang trọng khó quên.',
  },
  15: {
    tenSanPham: 'Hộp Hoa Tròn Hồng Đỏ & Chuỗi Ngọc Cao Cấp',
    loaiHoa: 'Hoa Hồng Đỏ & Chuỗi Ngọc Hypericum',
    maDanhMuc: 4,
    tenDanhMuc: 'Hộp hoa cao cấp',
    tongMauSac: 'Đỏ',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'khai-truong', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/luxury-red-peony-box.jpg',
    moTa:
      'Hộp hoa tròn sọc phong cách châu Âu kết từ hoa hồng đỏ tươi và quả chuỗi ngọc đỏ mọng, tặng sinh nhật sang trọng, kỷ niệm tình yêu hoặc chúc mừng để bàn.',
  },
  16: {
    tenSanPham: 'Hộp Hoa Gỗ Vintage Sắc Tím Thủy Chung',
    loaiHoa: 'Hoa Hồng Tím, Cẩm Chướng & Thảo Mộc Vintage',
    maDanhMuc: 4,
    tenDanhMuc: 'Hộp hoa cao cấp',
    tongMauSac: 'Tím',
    danhMucTrangChu: ['chu-de', 'sinh-nhat', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/purple-lavender-wood-box.jpg',
    moTa:
      'Hộp hoa gỗ mộc mạc mang phong cách châu Âu cổ điển, phối hồng tím khói, hồng kem, hoa cúc xanh biển và lá bạc. Rất phù hợp làm quà tri ân và kỷ niệm tinh tế.',
  },
  17: {
    tenSanPham: 'Hoa Cưới Cầm Tay Hồng Trắng & Hoa Linh Lan',
    loaiHoa: 'Hoa Linh Lan (Lily of the Valley) & Hồng Trắng',
    maDanhMuc: 5,
    tenDanhMuc: 'Hoa cưới cầm tay',
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/wedding-lily-of-valley.jpg',
    moTa:
      'Bó hoa cưới cầm tay cô dâu cao cấp kết từ hoa linh lan chuông trắng thanh tao và hoa hồng trắng Ohara thơm dịu — biểu tượng hạnh phúc viên mãn.',
  },
  18: {
    tenSanPham: 'Hoa Cưới Cầm Tay Tulip Trắng Tinh Tế',
    loaiHoa: 'Hoa Tulip Trắng Hà Lan',
    maDanhMuc: 5,
    tenDanhMuc: 'Hoa cưới cầm tay',
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/wedding-white-tulip.jpg',
    moTa:
      'Hoa cưới cầm tay cô dâu kết từ 20 cành tulip trắng nhập khẩu Hà Lan bó tròn gọn nhẹ, thắt nơ lụa satin trắng trang nhã tặng kèm hoa cài áo chú rể.',
  },
  19: {
    tenSanPham: 'Giỏ Hoa Cúc Tana Họa Mi Đồng Nội',
    loaiHoa: 'Hoa Cúc Tana (Chamomile Daisy)',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/tana-daisy-bouquet.jpg',
    moTa:
      'Thiết kế ngập tràn hoa cúc tana nhỏ xinh nhụy vàng cánh trắng tinh khôi, phong cách Hàn Quốc nhẹ nhàng tặng sinh nhật bạn bè, người yêu và trang trí bàn làm việc.',
  },
  20: {
    tenSanPham: 'Giỏ Hoa Hồng Tím & Cát Tường Quý Phái',
    loaiHoa: 'Hoa Hồng Tím Ocean Song & Hoa Cát Tường',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    tongMauSac: 'Tím',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/purple-rose-lisianthus-basket.webp',
    moTa:
      'Giỏ hoa mây quý phái phối hoa hồng pastel, hồng tím Ocean Song, hoa cát tường và cẩm tú cầu tím dịu dàng. Quà sinh nhật tặng mẹ và chúc mừng tri ân cực kỳ tinh tế.',
  },
};

// 16 mẫu hoa đa dạng loài mới bổ sung để phủ đầy đủ các loài hoa nổi tiếng & mọi danh mục shop
export const EXTRA_CURATED_PRODUCTS = [
  {
    maSanPham: 101,
    checkoutProxyId: 24,
    tenSanPham: 'Bó Hoa Mẫu Đơn Hồng Pastel Công Chúa',
    loaiHoa: 'Hoa Mẫu Đơn (Peony) & Mao Lương',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    giaBan: 890000,
    soLuongTon: 18,
    tongMauSac: 'Hồng Pastel',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/pink-peony-bouquet.webp',
    moTa:
      'Bó hoa mẫu đơn hồng nhập khẩu bung nở kiêu sa phối hoa mao lương kem và hoa thanh liễu, gói giấy lụa hồng pastel sang trọng. Lựa chọn hoàn hảo cho sinh nhật tặng người yêu và kỷ niệm tình yêu.',
  },
  {
    maSanPham: 102,
    checkoutProxyId: 24,
    tenSanPham: 'Bó Hoa Hồng Juliet Cam Đào Hoàng Gia',
    loaiHoa: 'Hoa Hồng David Austin Juliet',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    giaBan: 750000,
    soLuongTon: 14,
    tongMauSac: 'Cam Đào',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/juliet-peach-rose-bouquet.webp',
    moTa:
      'Hoa hồng triệu đô David Austin Juliet sắc cam đào xếp cánh xoắn tinh xảo, kết hợp cẩm tú cầu trắng và hoa lá phụ châu Âu. Thiết kế bó hoa sinh nhật sang trọng đẳng cấp.',
  },
  {
    maSanPham: 103,
    checkoutProxyId: 19,
    tenSanPham: 'Bó Hoa Oải Hương Lavender Pháp Thơm Dịu',
    loaiHoa: 'Hoa Oải Hương (Lavender)',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    giaBan: 450000,
    soLuongTon: 22,
    tongMauSac: 'Tím',
    danhMucTrangChu: ['chu-de', 'sinh-nhat', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/lavender-bouquet.jpg',
    moTa:
      'Bó hoa oải hương lavender sắc tím mộng mơ tỏa hương thảo mộc thư giãn tự nhiên, thắt nơ ruy băng lụa kem thanh lịch. Biểu tượng của tình yêu chung thủy và bình yên.',
  },
  {
    maSanPham: 104,
    checkoutProxyId: 24,
    tenSanPham: 'Bó Hoa Mao Lương Cam Đào & Mẫu Đơn Nghệ Thuật',
    loaiHoa: 'Hoa Mao Lương (Ranunculus) & Mẫu Đơn',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    giaBan: 620000,
    soLuongTon: 16,
    tongMauSac: 'Cam Đào',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/ranunculus-peach-bouquet.jpg',
    moTa:
      'Bó hoa mao lương nhiều lớp cánh mềm mại sắc cam đào phối mẫu đơn hồng và cúc xanh biển nghệ thuật. Phong cách florist châu Âu hiện đại cho dịp sinh nhật và kỷ niệm.',
  },
  {
    maSanPham: 105,
    checkoutProxyId: 24,
    tenSanPham: 'Bó Hoa Baby Hồng Pastel Bồng Bềnh Mộng Mơ',
    loaiHoa: 'Hoa Baby Hồng Pastel (Gypsophila)',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    giaBan: 420000,
    soLuongTon: 25,
    tongMauSac: 'Hồng Pastel',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/pink-babys-breath-bouquet.jpg',
    moTa:
      'Bó hoa baby nhuộm hồng pastel Hàn Quốc bồng bềnh dịu ngọt, gói giấy mờ hai lớp kèm ruy băng satin. Rất được yêu thích làm hoa sinh nhật tặng người yêu và bạn thân.',
  },
  {
    maSanPham: 106,
    checkoutProxyId: 24,
    tenSanPham: 'Bó Hoa Cẩm Chướng Hồng & Hồng Kem Tặng Mẹ',
    loaiHoa: 'Hoa Cẩm Chướng (Carnation) & Hồng Kem',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    giaBan: 380000,
    soLuongTon: 28,
    tongMauSac: 'Hồng Pastel',
    danhMucTrangChu: ['chu-de', 'sinh-nhat', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/pink-carnation-bouquet.jpg',
    moTa:
      'Hoa cẩm chướng hồng — loài hoa biểu trưng cho tình mẫu tử và lòng biết ơn sâu sắc — phối cùng hồng kem và hồng môn pastel, gửi trọn yêu thương dịp tri ân và tặng mẹ.',
  },
  {
    maSanPham: 107,
    checkoutProxyId: 2,
    tenSanPham: 'Bó Hoa Sen Hồng Cánh Kép Thanh Tao Thuần Khiết',
    loaiHoa: 'Hoa Sen Hồng Cánh Kép (Nelumbo)',
    maDanhMuc: 1,
    tenDanhMuc: 'Bó hoa tươi nghệ thuật',
    giaBan: 390000,
    soLuongTon: 15,
    tongMauSac: 'Hồng Pastel',
    danhMucTrangChu: ['chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/pink-lotus-bouquet.jpg',
    moTa:
      'Bó hoa sen hồng cánh kép hương thơm thoang thoảng, gói giấy thư pháp nghệ thuật phối xanh cổ vịt trang nhã. Món quà chúc mừng tri ân thầy cô và người lớn tuổi đầy ý nghĩa.',
  },
  {
    maSanPham: 108,
    checkoutProxyId: 8,
    tenSanPham: 'Chậu Hoa Lan Hồ Điệp Vàng Hoàng Kim Để Bàn',
    loaiHoa: 'Hoa Lan Hồ Điệp Vàng (Phalaenopsis)',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    giaBan: 980000,
    soLuongTon: 12,
    tongMauSac: 'Vàng',
    danhMucTrangChu: ['lan-ho-diep', 'khai-truong', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/yellow-phalaenopsis-orchid.jpg',
    moTa:
      'Chậu lan hồ điệp vàng hoàng kim lưỡi đỏ trong chậu sứ trắng tối giản, mang ý nghĩa khởi đầu thịnh vượng và tài lộc. Thích hợp trang trí bàn làm việc, chúc mừng khai trương.',
  },
  {
    maSanPham: 109,
    checkoutProxyId: 8,
    tenSanPham: 'Chậu Hoa Lan Hồ Điệp Tím Quý Phái (5 Cành)',
    loaiHoa: 'Hoa Lan Hồ Điệp Tím (Phalaenopsis)',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    giaBan: 1450000,
    soLuongTon: 10,
    tongMauSac: 'Tím',
    danhMucTrangChu: ['lan-ho-diep', 'khai-truong', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/purple-phalaenopsis-orchid.webp',
    moTa:
      'Chậu hoa lan hồ điệp tím đậm quý phái gồm 5 cành sai hoa, thắt ruy băng tím nhạt trong chậu sứ cao cấp. Quà tặng sếp, khai trương và chúc mừng tri ân đẳng cấp.',
  },
  {
    maSanPham: 110,
    checkoutProxyId: 8,
    tenSanPham: 'Giỏ Hoa Lan Hồ Điệp Hồng Chúc Mừng Sang Trọng',
    loaiHoa: 'Hoa Lan Hồ Điệp Hồng (Mini Phalaenopsis)',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    giaBan: 1150000,
    soLuongTon: 14,
    tongMauSac: 'Hồng Pastel',
    danhMucTrangChu: ['lan-ho-diep', 'sinh-nhat', 'khai-truong', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/pink-orchid-chrysanthemum-basket.jpg',
    moTa:
      'Giỏ hoa lan hồ điệp hồng phối tiên khách lai và cây xanh tiểu cảnh, trang trí nơ lụa rực rỡ. Phù hợp làm giỏ lan hồ điệp chúc mừng, khai trương để bàn và sinh nhật tặng mẹ.',
  },
  {
    maSanPham: 111,
    checkoutProxyId: 20,
    tenSanPham: 'Giỏ Hoa Thược Dược Cam Đào & Cúc Họa Mi Tặng Mẹ',
    loaiHoa: 'Hoa Thược Dược (Dahlia) & Hồng Kem',
    maDanhMuc: 2,
    tenDanhMuc: 'Giỏ hoa chúc mừng',
    giaBan: 680000,
    soLuongTon: 16,
    tongMauSac: 'Cam Đào',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/dahlia-rose-basket.jpg',
    moTa:
      'Thiết kế rực rỡ đầy sức sống với hoa thược dược cam san hô, cúc vàng thu và hoa cát tường trắng. Món quà sinh nhật tặng mẹ và chúc mừng tri ân ấm áp.',
  },
  {
    maSanPham: 112,
    checkoutProxyId: 11,
    tenSanPham: 'Kệ Hoa Khai Trương Hoa Thiên Điểu & Lan Trắng Vươn Xa',
    loaiHoa: 'Hoa Thiên Điểu (Strelitzia) & Lan Hồ Điệp Trắng',
    maDanhMuc: 3,
    tenDanhMuc: 'Lẵng hoa khai trương',
    giaBan: 1750000,
    soLuongTon: 9,
    tongMauSac: 'Cam Đào',
    danhMucTrangChu: ['khai-truong', 'lan-ho-diep', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/bird-of-paradise-stand.jpg',
    moTa:
      'Kệ hoa khai trương nghệ thuật kết hợp hoa thiên điểu mạnh mẽ, hoa loa kèn cam và lan hồ điệp trắng tinh tế — lời chúc khai trương hồng phát, bay cao vươn xa.',
  },
  {
    maSanPham: 113,
    checkoutProxyId: 12,
    tenSanPham: 'Kệ Hoa Khai Trương Đồng Tiền Vàng & Hướng Dương Khởi Sắc',
    loaiHoa: 'Hoa Đồng Tiền Vàng & Hoa Hướng Dương',
    maDanhMuc: 3,
    tenDanhMuc: 'Lẵng hoa khai trương',
    giaBan: 1350000,
    soLuongTon: 13,
    tongMauSac: 'Vàng',
    danhMucTrangChu: ['khai-truong', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/gerbera-opening-basket.jpg',
    moTa:
      'Kệ hoa khai trương giá đứng hiện đại phối hoa đồng tiền vàng rực rỡ, hoa hướng dương và lá monstera phủ ánh kim sang trọng, gửi trọn lời chúc kinh doanh thuận lợi.',
  },
  {
    maSanPham: 114,
    checkoutProxyId: 14,
    tenSanPham: 'Hộp Hoa Tròn Mẫu Đơn Hồng Pastel Cao Cấp',
    loaiHoa: 'Hoa Mẫu Đơn Hồng Phấn (Pink Peony)',
    maDanhMuc: 4,
    tenDanhMuc: 'Hộp hoa cao cấp',
    giaBan: 860000,
    soLuongTon: 15,
    tongMauSac: 'Hồng Pastel',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/pastel-rose-peony-box.jpg',
    moTa:
      'Hộp hoa tròn trắng cao cấp phong cách Paris xếp đầy hoa mẫu đơn hồng phấn căng mọng. Món quà hoa sinh nhật sang trọng tặng người yêu, vợ hoặc đối tác nữ.',
  },
  {
    maSanPham: 115,
    checkoutProxyId: 16,
    tenSanPham: 'Hộp Hoa Phi Yến Xanh & Hồng Trắng Thanh Lịch',
    loaiHoa: 'Hoa Phi Yến Xanh (Delphinium) & Hồng Trắng',
    maDanhMuc: 4,
    tenDanhMuc: 'Hộp hoa cao cấp',
    giaBan: 740000,
    soLuongTon: 14,
    tongMauSac: 'Xanh Dương',
    danhMucTrangChu: ['sinh-nhat', 'chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/blue-delphinium-box.jpg',
    moTa:
      'Hộp hoa cao cấp kết hợp hoa phi yến xanh dương thanh tao cùng hoa hồng trắng Đà Lạt và hoa chuỗi ngọc xanh, tạo điểm nhấn sang trọng, tươi mới cho không gian.',
  },
  {
    maSanPham: 116,
    checkoutProxyId: 17,
    tenSanPham: 'Hoa Cưới Cầm Tay Hoa Loa Kèn Trắng Calla Lily',
    loaiHoa: 'Hoa Loa Kèn Trắng (Calla Lily) & Baby Trắng',
    maDanhMuc: 5,
    tenDanhMuc: 'Hoa cưới cầm tay',
    giaBan: 950000,
    soLuongTon: 11,
    tongMauSac: 'Trắng',
    danhMucTrangChu: ['chu-de', 'thiet-ke'],
    hinhAnhChinh: '/images/flowers/wedding-calla-lily.webp',
    moTa:
      'Bó hoa cưới cầm tay cô dâu tối giản đầy khí chất từ hoa loa kèn trắng Calla Lily nhập khẩu điểm hoa baby trắng, thắt ruy băng voan tinh tế.',
  },
];

export const EXTRA_CURATED_MAP = Object.fromEntries(
  EXTRA_CURATED_PRODUCTS.map((item) => [String(item.maSanPham), item])
);

export function getCuratedProductById(id) {
  if (id == null) return null;
  return EXTRA_CURATED_MAP[String(id)] || null;
}

export function getServerProductPatch(id) {
  if (id == null) return null;
  return SERVER_PRODUCT_PATCHES[Number(id)] || null;
}

// Danh sách ảnh hoa cục bộ làm fallback (thay cho URL bên ngoài có thể hỏng)
export const LOCAL_FLOWER_FALLBACKS = [
  '/images/flowers/rose-tulip-pastel.webp',
  '/images/flowers/pink-peony-bouquet.webp',
  '/images/flowers/sunflower-bouquet.jpg',
  '/images/flowers/white-phalaenopsis-orchid.jpg',
  '/images/flowers/blue-hydrangea-bouquet.webp',
  '/images/flowers/juliet-peach-rose-bouquet.webp',
  '/images/flowers/red-rose-heart-box.jpg',
  '/images/flowers/wedding-calla-lily.webp',
];
