export const STORE_INFO = {
  name: 'Tiệm Hoa Xinh',
  tagline: 'Fresh Floral Atelier & Smart AI',
  address: '120 Lê Duẩn, Quận Hải Châu, TP. Đà Nẵng',
  openHours: '07:00 – 21:30 (Mở cửa cả tuần)',
  deliveryTime: 'Giao hỏa tốc 2H nội thành Đà Nẵng',
  shippingRatePerKm: 5000,
};

export function isAdminAccount(account) {
  if (!account || typeof account !== 'object') return false;
  const roleStr = String(
    account.vaiTro || account.role || account.quyen || ''
  ).toLowerCase();
  return (
    roleStr.includes('admin') ||
    roleStr.includes('quản trị') ||
    String(account.email || '').toLowerCase().includes('admin') ||
    String(account.hoTen || '').trim().toLowerCase() === 'admin'
  );
}

export function formatVietnamPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return String(raw || '').trim();
}

export const STANDARD_COLORS = [
  'Hồng Pastel',
  'Đỏ',
  'Vàng',
  'Trắng',
  'Tím',
  'Cam Đào',
  'Xanh Dương',
];

export const COLOR_SWATCH_MAP = {
  'Hồng Pastel': '#f9a8d4',
  Đỏ: '#e11d48',
  Vàng: '#facc15',
  Trắng: '#f8fafc',
  Tím: '#a855f7',
  'Cam Đào': '#fb923c',
  'Xanh Dương': '#38bdf8',
};

export function normalizeColorGroup(rawColor) {
  const s = String(rawColor || '').trim().toLowerCase();
  if (!s) return 'Hồng Pastel';
  if (s.includes('xanh')) return 'Xanh Dương';
  if (s.includes('đỏ')) return 'Đỏ';
  if (s.includes('vàng')) return 'Vàng';
  if (s.includes('trắng')) return 'Trắng';
  if (s.includes('tím')) return 'Tím';
  if (s.includes('cam') || s.includes('đào')) return 'Cam Đào';
  if (s.includes('hồng') || s.includes('pastel')) return 'Hồng Pastel';
  return 'Hồng Pastel';
}

export const CATEGORY_RULES = {
  'sinh-nhat': {
    title: 'Hoa Sinh Nhật',
    subtitle: 'Những thiết kế rạng rỡ, ngọt ngào gửi lời chúc tuổi mới trọn vẹn',
    keywords: [
      'sinh nhật',
      'pastel',
      'hồng',
      'tulip',
      'baby',
      'công chúa',
      'ngọt ngào',
      'dâu',
      'hướng dương',
    ],
    categories: [1, 4],
  },
  'khai-truong': {
    title: 'Hoa Khai Trương',
    subtitle: 'Kệ hoa và lẵng hoa sang trọng mang thông điệp Hồng Phát – Đại Cát',
    keywords: [
      'khai trương',
      'hồng phát',
      'đại cát',
      'kệ hoa',
      'lẵng hoa',
      'vàng',
      'đỏ',
      'hướng dương',
      'lan hồ điệp',
    ],
    categories: [2, 3],
  },
  'lan-ho-diep': {
    title: 'Lan Hồ Điệp',
    subtitle: 'Chậu lan hồ điệp tuyển chọn loại A bền đẹp, đẳng cấp vượt thời gian',
    keywords: ['lan hồ điệp', 'lan'],
    categories: [2, 3],
  },
  'chu-de': {
    title: 'Hoa Theo Chủ Đề',
    subtitle: 'Hoa tình yêu, kỷ niệm, tri ân thầy cô và hoa cưới cầm tay tinh khôi',
    keywords: ['tình yêu', 'tri ân', 'cưới', 'chúc mừng', 'kỷ niệm', 'hồng'],
    categories: [1, 2, 4, 5],
  },
  thietKe: {
    title: 'Thiết Kế Hoa Tươi',
    subtitle: 'Tuyển tập đầy đủ các kiểu dáng hoa nghệ thuật tại Tiệm Hoa Xinh',
    keywords: [],
    categories: [1, 2, 3, 4, 5],
  },
  'thiet-ke': {
    title: 'Thiết Kế Hoa Tươi',
    subtitle: 'Tuyển tập đầy đủ các kiểu dáng hoa nghệ thuật tại Tiệm Hoa Xinh',
    keywords: [],
    categories: [1, 2, 3, 4, 5],
  },
};

export const OCCASION_OPTIONS = [
  { id: '', label: 'Tất cả dịp' },
  { id: 'sinh-nhat', label: 'Sinh nhật' },
  { id: 'khai-truong', label: 'Khai trương' },
  { id: 'lan-ho-diep', label: 'Lan Hồ Điệp' },
  { id: 'chu-de', label: 'Tình yêu & Tri ân' },
];

export const BUDGET_OPTIONS = [
  { id: '', label: 'Tất cả ngân sách' },
  { id: 'under-400', label: 'Dưới 400.000đ' },
  { id: '400-700', label: '400.000đ – 700.000đ' },
  { id: 'over-700', label: 'Trên 700.000đ' },
];

export const AI_CONCIERGE_OCCASIONS = [
  { id: 'sinh-nhat', label: 'Sinh nhật', keywords: ['sinh nhật', 'pastel', 'tulip', 'baby', 'hướng dương', 'mẫu đơn', 'mao lương', 'cúc tana', 'juliet'] },
  { id: 'tinh-yeu', label: 'Tình yêu & Kỷ niệm', keywords: ['tình yêu', 'lãng mạn', 'trái tim', 'hồng', 'đỏ', 'pastel', 'công chúa', 'mẫu đơn', 'lavender'] },
  { id: 'khai-truong', label: 'Khai trương / Chúc mừng', keywords: ['khai trương', 'kệ', 'lẵng', 'hồng phát', 'vàng', 'lan', 'thiên điểu', 'đồng tiền'] },
  { id: 'tri-an', label: 'Tri ân / Tặng Mẹ', keywords: ['giỏ hoa', 'lan', 'hộp', 'tri ân', 'tặng mẹ', 'cẩm chướng', 'thược dược', 'sen', 'cẩm tú cầu', 'cát tường'] },
  { id: 'cuoi', label: 'Hoa Cưới / Cầm tay', keywords: ['cưới', 'cô dâu', 'linh lan', 'calla lily', 'loa kèn', 'trắng', 'tulip', 'baby'] },
];

export const AI_CONCIERGE_RECIPIENTS = [
  { id: 'lover', label: 'Người yêu / Vợ', preferredTones: ['Hồng Pastel', 'Đỏ', 'Trắng', 'Tím'], preferredCats: [1, 4] },
  { id: 'mom', label: 'Mẹ / Gia đình', preferredTones: ['Cam Đào', 'Hồng Pastel', 'Tím', 'Xanh Dương'], preferredCats: [2, 4, 1] },
  { id: 'partner', label: 'Sếp / Đối tác', preferredTones: ['Vàng', 'Đỏ', 'Trắng', 'Tím'], preferredCats: [2, 3] },
  { id: 'friend', label: 'Bạn bè / Đồng nghiệp', preferredTones: ['Vàng', 'Cam Đào', 'Hồng Pastel', 'Xanh Dương'], preferredCats: [1, 2] },
];

export function matchesBudget(price, budgetId) {
  const num = Number(price || 0);
  if (budgetId === 'under-400') return num < 400000;
  if (budgetId === '400-700') return num >= 400000 && num <= 700000;
  if (budgetId === 'over-700') return num > 700000;
  return true;
}

export function computeSmartAiMatches({
  products = [],
  occasionId = 'sinh-nhat',
  recipientId = 'lover',
  tone = '',
  budgetId = '',
  limit = 4,
}) {
  if (!Array.isArray(products) || products.length === 0) return [];

  const occ = AI_CONCIERGE_OCCASIONS.find((o) => o.id === occasionId) || AI_CONCIERGE_OCCASIONS[0];
  const rec = AI_CONCIERGE_RECIPIENTS.find((r) => r.id === recipientId) || AI_CONCIERGE_RECIPIENTS[0];

  const scored = products
    .filter((p) => Number(p.soLuongTon ?? 15) > 0)
    .map((p) => {
      const text = `${p.tenSanPham || ''} ${p.moTa || ''} ${p.tongMauSac || ''} ${p.tenDanhMuc || ''}`.toLowerCase();
      const normTone = normalizeColorGroup(p.tongMauSac);
      const price = Number(p.giaBan || 0);
      const catId = Number(p.maDanhMuc || 1);

      let score = 0.45;
      const reasons = [];

      // 1. Occasion keywords match
      const kwMatches = occ.keywords.filter((kw) => text.includes(kw));
      if (kwMatches.length > 0) {
        score += Math.min(0.24, kwMatches.length * 0.1);
        reasons.push(`Hợp dịp ${occ.label}`);
      } else if (
        Array.isArray(p.danhMucTrangChu) &&
        p.danhMucTrangChu.some((d) => occ.id.includes(d) || d.includes(occ.id))
      ) {
        score += 0.16;
        reasons.push(`Thuộc bộ sưu tập ${occ.label}`);
      }

      // 2. Recipient style & category fit
      if (rec.preferredCats.includes(catId)) {
        score += 0.12;
        reasons.push(`Kiểu dáng chuẩn tặng ${rec.label.toLowerCase()}`);
      }
      if (rec.preferredTones.includes(normTone)) {
        score += 0.08;
      }

      // 3. Explicit color preference
      if (tone) {
        if (normTone === tone) {
          score += 0.18;
          reasons.push(`Đúng tông ${tone}`);
        } else {
          score -= 0.08;
        }
      }

      // 4. Budget fit
      if (budgetId) {
        if (matchesBudget(price, budgetId)) {
          score += 0.14;
          const bLabel = BUDGET_OPTIONS.find((b) => b.id === budgetId)?.label;
          if (bLabel) reasons.push(`Khớp tầm giá ${bLabel}`);
        } else {
          score -= 0.22;
        }
      }

      if (reasons.length === 0) {
        reasons.push(`Tông ${normTone} hài hòa, dễ trao tặng`);
      }

      const finalScore = Math.min(0.99, Math.max(0.52, Number(score.toFixed(2))));
      return {
        product: p,
        score: finalScore,
        reason: reasons.slice(0, 2).join(' • '),
      };
    });

  return scored
    .sort((a, b) => b.score - a.score || (b.product.maSanPham || 0) - (a.product.maSanPham || 0))
    .slice(0, limit);
}

const WISHLIST_STORAGE_KEY = 'thx_wishlist_ids';
const RECENTLY_VIEWED_KEY = 'thx_recently_viewed_ids';

export function readWishlistIds() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeWishlistIds(ids) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event('thx_wishlist_updated'));
  } catch {
    // Bỏ qua lỗi bộ nhớ cục bộ
  }
}

export function toggleWishlistId(productId) {
  const prev = readWishlistIds();
  const exists = prev.includes(productId);
  const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
  writeWishlistIds(next);
  return { added: !exists, ids: next };
}

export function readRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewedId(productId) {
  if (productId == null) return;
  const numId = Number(productId);
  if (!Number.isFinite(numId)) return;
  try {
    const prev = readRecentlyViewedIds().filter((id) => Number(id) !== numId);
    const next = [numId, ...prev].slice(0, 8);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // Bỏ qua
  }
}
