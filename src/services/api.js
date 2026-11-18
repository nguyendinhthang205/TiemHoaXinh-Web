import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://tiemhoaxinh.runasp.net/api'
).replace(/\/+$/, '');
export const API_URL = API_BASE_URL;

export const AI_BASE_URL = (
  import.meta.env.VITE_AI_URL || 'https://tiemhoaxinh-ai.onrender.com'
).replace(/\/+$/, '');
export const AI_URL = AI_BASE_URL;

const PRODUCT_SYNC_KEY = 'thx_product_overrides';
const HOTLINE_STORAGE_KEY = 'thx_hotline_number';
export const DEFAULT_HOTLINE = '0905 123 456';

export function getHotlineNumber() {
  try {
    const saved = localStorage.getItem(HOTLINE_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : DEFAULT_HOTLINE;
  } catch {
    return DEFAULT_HOTLINE;
  }
}

export function saveHotlineNumber(newPhone) {
  const cleaned = String(newPhone || '').trim() || DEFAULT_HOTLINE;
  try {
    localStorage.setItem(HOTLINE_STORAGE_KEY, cleaned);
    window.dispatchEvent(new Event('thx_hotline_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Bỏ qua nếu trình duyệt chặn bộ nhớ cục bộ
  }
  return cleaned;
}

export function getProductOverrides() {
  try {
    const raw = localStorage.getItem(PRODUCT_SYNC_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProductOverride(key, patch) {
  if (!key) return;
  try {
    const current = getProductOverrides();
    current[String(key)] = {
      ...(current[String(key)] || {}),
      ...patch,
      updatedAt: Date.now(),
    };
    localStorage.setItem(PRODUCT_SYNC_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('thx_products_updated'));
  } catch {
    // Bỏ qua nếu bộ nhớ trình duyệt đầy
  }
}

function mergeProductOverride(product) {
  if (!product || typeof product !== 'object') return product;
  const overrides = getProductOverrides();
  const byId = product.maSanPham != null ? overrides[String(product.maSanPham)] : null;
  const nameKey = product.tenSanPham
    ? `name:${String(product.tenSanPham).trim().toLowerCase()}`
    : '';
  const byName = nameKey ? overrides[nameKey] : null;
  const matched = byId || byName;

  if (!matched) return product;

  return {
    ...product,
    anhChinh: matched.anhChinh || matched.hinhAnhChinh || product.anhChinh,
    hinhAnhChinh: matched.hinhAnhChinh || product.hinhAnhChinh,
    hinhAnh: matched.hinhAnhChinh || product.hinhAnh,
    tongMauSac: matched.tongMauSac || product.tongMauSac,
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('thx_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const reqUrl = String(response?.config?.url || '').toLowerCase();
    if (reqUrl.includes('/sanpham') && response?.data) {
      if (Array.isArray(response.data)) {
        response.data = response.data.map(mergeProductOverride);
      } else if (Array.isArray(response.data.items)) {
        response.data.items = response.data.items.map(mergeProductOverride);
      } else if (typeof response.data === 'object') {
        response.data = mergeProductOverride(response.data);
      }
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const reqUrl = String(error?.config?.url || '');
    if (status === 401 && !reqUrl.includes('/Auth/login')) {
      localStorage.removeItem('thx_token');
      localStorage.removeItem('thx_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const FLORAL_GALLERY = [
  'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1455659817273-f96807779a8a?auto=format&fit=crop&w=800&q=80',
];

export function getFlowerImage(product) {
  const enriched = mergeProductOverride(product);
  const raw =
    enriched?.anhChinh ||
    enriched?.AnhChinh ||
    enriched?.hinhAnhChinh ||
    enriched?.HinhAnhChinh ||
    enriched?.hinhAnh ||
    enriched?.HinhAnh ||
    '';

  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      const origin = API_BASE_URL.replace(/\/api\/?$/, '');
      return `${origin}${trimmed}`;
    }
  }

  const idx = ((product?.maSanPham || product?.MaSanPham || 1) - 1) % FLORAL_GALLERY.length;
  return FLORAL_GALLERY[Math.max(0, idx)];
}

export const getImageUrl = getFlowerImage;

export function formatVND(amount) {
  const num = Number(amount || 0);
  return num.toLocaleString('vi-VN') + ' ₫';
}

export const formatCurrency = formatVND;
export const formatPrice = formatVND;

export default api;