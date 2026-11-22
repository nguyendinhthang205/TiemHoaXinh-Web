export const PAGE_SIZE = 15;

export const FLOWER_CATEGORIES = [
  { id: 1, name: 'Bó hoa tươi nghệ thuật' },
  { id: 2, name: 'Giỏ hoa chúc mừng' },
  { id: 3, name: 'Lẵng hoa khai trương' },
  { id: 4, name: 'Hộp hoa cao cấp' },
  { id: 5, name: 'Hoa cưới cầm tay' },
];

export const HOMEPAGE_NAV_CATEGORIES = [
  { id: 'sinh-nhat', label: 'Hoa Sinh Nhật' },
  { id: 'khai-truong', label: 'Hoa Khai Trương' },
  { id: 'lan-ho-diep', label: 'Lan Hồ Điệp' },
  { id: 'chu-de', label: 'Chủ Đề' },
  { id: 'thiet-ke', label: 'Thiết Kế' },
];

export const STANDARD_COLOR_TONES = [
  'Hồng Pastel',
  'Đỏ',
  'Vàng',
  'Trắng',
  'Tím',
  'Cam Đào',
];

export const ADMIN_QUICK_REPLIES = [
  'Chào bạn, tiệm đã nhận được yêu cầu và đang kiểm tra ngay ạ!',
  'Hoa tươi bên tiệm nhập mới mỗi sáng, tặng kèm thiệp chúc mừng miễn phí bạn nhé.',
  'Đơn hàng của bạn đang được nghệ nhân cắm hoa chuẩn bị và sẽ giao đúng khung giờ ạ!',
];

export function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftYearMonth(ym, delta) {
  const [yStr, mStr] = (ym || getCurrentYearMonth()).split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getOrderYearMonth(order) {
  const raw =
    order?.ngayDat || order?.thoiGianDat || order?.ngayTao || order?.ngayGiao;
  if (!raw) return '';
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const m = String(raw).match(/(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : '';
}

export function formatYearMonthVN(ym) {
  if (!ym || !ym.includes('-')) return 'Tháng này';
  const [y, m] = ym.split('-');
  return `Tháng ${m}/${y}`;
}

export function compressImageFile(file, maxSize = 240, quality = 0.62) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Không thể đọc định dạng ảnh này.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Lỗi khi tải tệp ảnh từ thiết bị.'));
    reader.readAsDataURL(file);
  });
}

export function extractRawStatus(order, meta = {}) {
  if (meta.statusOverride) return meta.statusOverride;
  return (
    order.trangThai ||
    order.trangThaiDonHang ||
    order.trangThaiDon ||
    order.status ||
    order.tinhTrang ||
    order.trangThaiXuLy ||
    'Pending'
  );
}

export function normalizeAdminOrderStatus(rawStatus = '', isPickup = false) {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (s.includes('cancel') || s.includes('hủy')) {
    return {
      code: 'Cancelled',
      label: 'Đã hủy',
      step: -1,
      bg: '#f3f4f6',
      color: '#4b5563',
      border: '#d1d5db',
    };
  }
  if (
    s.includes('complet') ||
    s.includes('deliver') ||
    s.includes('hoàn tất') ||
    s.includes('hoàn thành') ||
    s.includes('đã giao') ||
    s.includes('đã nhận hoa') ||
    s.includes('thành công')
  ) {
    return {
      code: 'Completed',
      label: isPickup ? 'Khách đã nhận hoa' : 'Đã giao thành công',
      step: 3,
      bg: '#dcfce7',
      color: '#166534',
      border: '#86efac',
    };
  }
  if (
    s.includes('ship') ||
    s.includes('transit') ||
    s.includes('đang giao') ||
    s.includes('sẵn sàng') ||
    s.includes('vận chuyển')
  ) {
    return {
      code: 'Shipping',
      label: isPickup ? 'Sẵn sàng tại tiệm' : 'Shipper đang giao',
      step: 2,
      bg: '#e0e7ff',
      color: '#3730a3',
      border: '#a5b4fc',
    };
  }
  if (
    s.includes('confirm') ||
    s.includes('cắm hoa') ||
    s.includes('chuẩn bị') ||
    (s.includes('xác nhận') && !s.includes('chờ'))
  ) {
    return {
      code: 'Confirmed',
      label: 'Đang cắm hoa',
      step: 1,
      bg: '#dbeafe',
      color: '#1e40af',
      border: '#93c5fd',
    };
  }
  return {
    code: 'Pending',
    label: 'Chờ xác nhận',
    step: 0,
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fcd34d',
  };
}

export function formatDateOnly(val) {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).split('T')[0];
  return d.toLocaleDateString('vi-VN');
}

export function formatDateTime(val) {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return `${d.toLocaleTimeString('vi-VN')} ${d.toLocaleDateString('vi-VN')}`;
}

export function formatShortTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
