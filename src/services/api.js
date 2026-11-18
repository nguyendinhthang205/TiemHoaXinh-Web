import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://tiemhoaxinh.runasp.net/api'
).replace(/\/+$/, '');
export const API_URL = API_BASE_URL;

export const AI_BASE_URL = (
  import.meta.env.VITE_AI_URL || 'https://tiemhoaxinh-ai.onrender.com'
).replace(/\/+$/, '');
export const AI_URL = AI_BASE_URL;

const CLOUD_BIN_URL = 'https://api.npoint.io/639a3cda635df1c41eb4';
const ORDER_META_KEY = 'thx_order_meta';
const PRODUCT_SYNC_KEY = 'thx_product_overrides';
const HOTLINE_STORAGE_KEY = 'thx_hotline_number';
export const DEFAULT_HOTLINE = '0905 123 456';

async function fetchCloudWithTimeout(options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(CLOUD_BIN_URL, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// Tự động cắt gọn các ảnh base64 cũ nếu gói JSON trên npoint.io vượt 75KB để tránh lỗi nghẽn 413
function compactCloudBin(rawBin) {
  const safeBin = rawBin && typeof rawBin === 'object' && !Array.isArray(rawBin) ? { ...rawBin } : {};
  const overrides = safeBin.__product_overrides__;
  if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
    const entries = Object.entries(overrides).sort(
      (a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0)
    );
    const kept = {};
    for (const [k, val] of entries) {
      kept[k] = val;
      if (JSON.stringify(safeBin).length > 75000) {
        if (kept[k]?.hinhAnhChinh?.startsWith('data:image/')) {
          delete kept[k].hinhAnhChinh;
        }
      }
    }
    safeBin.__product_overrides__ = kept;
  }
  return safeBin;
}

async function pushCompactCloudBin(rawBin) {
  const compacted = compactCloudBin(rawBin);
  return fetchCloudWithTimeout(
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compacted),
    },
    6000
  );
}

export function getHotlineNumber() {
  try {
    const saved = localStorage.getItem(HOTLINE_STORAGE_KEY);
    return saved && saved.trim() ? saved.trim() : DEFAULT_HOTLINE;
  } catch {
    return DEFAULT_HOTLINE;
  }
}

export async function syncHotlineFromCloud() {
  try {
    const res = await fetchCloudWithTimeout({ method: 'GET', cache: 'no-store' }, 5000);
    if (!res.ok) return getHotlineNumber();
    const raw = await res.json();
    const remoteHotline = typeof raw?.__hotline__ === 'string' ? raw.__hotline__.trim() : '';
    if (remoteHotline && remoteHotline !== getHotlineNumber()) {
      localStorage.setItem(HOTLINE_STORAGE_KEY, remoteHotline);
      window.dispatchEvent(new Event('thx_hotline_updated'));
      return remoteHotline;
    }
  } catch {
    // Bỏ qua nếu mạng chậm
  }
  return getHotlineNumber();
}

export function saveHotlineNumber(newPhone) {
  const cleaned = String(newPhone || '').trim() || DEFAULT_HOTLINE;
  try {
    localStorage.setItem(HOTLINE_STORAGE_KEY, cleaned);
    window.dispatchEvent(new Event('thx_hotline_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Bỏ qua
  }

  fetchCloudWithTimeout({ method: 'GET', cache: 'no-store' }, 5000)
    .then((res) => (res.ok ? res.json() : {}))
    .then((raw) => {
      const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      safeBin.__hotline__ = cleaned;
      return pushCompactCloudBin(safeBin);
    })
    .catch(() => {});

  return cleaned;
}

export function readLocalOrderMeta() {
  try {
    const raw = localStorage.getItem(ORDER_META_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function syncOrderMetaFromCloud() {
  const localMeta = readLocalOrderMeta();
  try {
    const res = await fetchCloudWithTimeout({ method: 'GET', cache: 'no-store' }, 5000);
    if (!res.ok) return localMeta;
    const raw = await res.json();
    const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const isOversized = JSON.stringify(safeBin).length > 78000;
    const remoteMeta =
      safeBin.__order_meta__ &&
      typeof safeBin.__order_meta__ === 'object' &&
      !Array.isArray(safeBin.__order_meta__)
        ? safeBin.__order_meta__
        : {};

    const merged = { ...localMeta };
    let localChanged = false;
    let shouldPushBack = isOversized;

    Object.entries(remoteMeta).forEach(([orderId, rItem]) => {
      if (!rItem || typeof rItem !== 'object') return;
      const lItem = merged[orderId];
      const rTime = Number(rItem.updatedAt || 0);
      const lTime = Number(lItem?.updatedAt || 0);
      if (!lItem || rTime >= lTime) {
        if (JSON.stringify(lItem) !== JSON.stringify(rItem)) {
          merged[orderId] = { ...(lItem || {}), ...rItem };
          localChanged = true;
        }
      }
    });

    Object.entries(localMeta).forEach(([orderId, lItem]) => {
      if (!lItem || typeof lItem !== 'object') return;
      const rItem = remoteMeta[orderId];
      const lTime = Number(lItem.updatedAt || 0);
      const rTime = Number(rItem?.updatedAt || 0);
      if ((!rItem && (lItem.statusOverride || lItem.deleted)) || lTime > rTime) {
        const stamped = { ...lItem, updatedAt: lTime || Date.now() };
        merged[orderId] = stamped;
        remoteMeta[orderId] = stamped;
        shouldPushBack = true;
      }
    });

    if (localChanged || shouldPushBack) {
      localStorage.setItem(ORDER_META_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('thx_orders_updated'));
    }

    if (shouldPushBack) {
      safeBin.__order_meta__ = remoteMeta;
      await pushCompactCloudBin(safeBin);
    }

    return merged;
  } catch {
    return localMeta;
  }
}

export async function writeOrderMeta(orderId, patch) {
  if (orderId == null) return readLocalOrderMeta();
  const idStr = String(orderId);
  const now = Date.now();

  const localCurrent = readLocalOrderMeta();
  const nextEntry = {
    ...(localCurrent[idStr] || {}),
    ...patch,
    updatedAt: now,
  };
  localCurrent[idStr] = nextEntry;

  try {
    localStorage.setItem(ORDER_META_KEY, JSON.stringify(localCurrent));
    window.dispatchEvent(new Event('thx_orders_updated'));
  } catch {
    // Bỏ qua
  }

  try {
    const res = await fetchCloudWithTimeout({ method: 'GET', cache: 'no-store' }, 5000);
    const raw = res.ok ? await res.json() : {};
    const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const remoteMeta =
      safeBin.__order_meta__ && typeof safeBin.__order_meta__ === 'object'
        ? safeBin.__order_meta__
        : {};

    remoteMeta[idStr] = {
      ...(remoteMeta[idStr] || {}),
      ...nextEntry,
    };
    safeBin.__order_meta__ = remoteMeta;

    await pushCompactCloudBin(safeBin);
  } catch {
    // Giữ bản lưu cục bộ nếu mạng gián đoạn
  }

  return localCurrent;
}

export function getProductOverrides() {
  try {
    const raw = localStorage.getItem(PRODUCT_SYNC_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function syncProductOverridesFromCloud() {
  const localOverrides = getProductOverrides();
  try {
    const res = await fetchCloudWithTimeout({ method: 'GET', cache: 'no-store' }, 5000);
    if (!res.ok) return localOverrides;
    const raw = await res.json();
    const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const remoteOverrides =
      safeBin.__product_overrides__ &&
      typeof safeBin.__product_overrides__ === 'object' &&
      !Array.isArray(safeBin.__product_overrides__)
        ? safeBin.__product_overrides__
        : {};

    const merged = { ...localOverrides };
    let localChanged = false;
    let shouldPushBack = false;

    Object.entries(remoteOverrides).forEach(([key, rItem]) => {
      if (!rItem || typeof rItem !== 'object') return;
      const lItem = merged[key];
      const rTime = Number(rItem.updatedAt || 0);
      const lTime = Number(lItem?.updatedAt || 0);
      if (!lItem || rTime >= lTime) {
        if (JSON.stringify(lItem) !== JSON.stringify(rItem)) {
          merged[key] = { ...(lItem || {}), ...rItem };
          localChanged = true;
        }
      }
    });

    Object.entries(localOverrides).forEach(([key, lItem]) => {
      if (!lItem || typeof lItem !== 'object') return;
      const rItem = remoteOverrides[key];
      const lTime = Number(lItem.updatedAt || 0);
      const rTime = Number(rItem?.updatedAt || 0);
      if ((!rItem && lItem.hinhAnhChinh) || lTime > rTime) {
        const stamped = { ...lItem, updatedAt: lTime || Date.now() };
        merged[key] = stamped;
        remoteOverrides[key] = stamped;
        shouldPushBack = true;
      }
    });

    if (localChanged || shouldPushBack) {
      localStorage.setItem(PRODUCT_SYNC_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('thx_products_updated'));
    }

    if (shouldPushBack) {
      safeBin.__product_overrides__ = remoteOverrides;
      await pushCompactCloudBin(safeBin);
    }

    return merged;
  } catch {
    return localOverrides;
  }
}

export async function saveProductOverride(key, patch) {
  if (!key) return;
  const keyStr = String(key);
  const now = Date.now();

  const current = getProductOverrides();
  const nextEntry = {
    ...(current[keyStr] || {}),
    ...patch,
    updatedAt: now,
  };
  current[keyStr] = nextEntry;

  try {
    localStorage.setItem(PRODUCT_SYNC_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('thx_products_updated'));
  } catch {
    // Bỏ qua
  }

  try {
    const res = await fetchCloudWithTimeout({ method: 'GET', cache: 'no-store' }, 5000);
    const raw = res.ok ? await res.json() : {};
    const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const remoteOverrides =
      safeBin.__product_overrides__ && typeof safeBin.__product_overrides__ === 'object'
        ? safeBin.__product_overrides__
        : {};

    remoteOverrides[keyStr] = {
      ...(remoteOverrides[keyStr] || {}),
      ...nextEntry,
    };
    safeBin.__product_overrides__ = remoteOverrides;

    await pushCompactCloudBin(safeBin);
  } catch {
    // Giữ bản lưu cục bộ nếu mạng gián đoạn
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
    anhChinh: matched.hinhAnhChinh || matched.anhChinh || product.anhChinh,
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
  let token = sessionStorage.getItem('thx_token') || sessionStorage.getItem('token');

  if (!token) {
    const legacyToken = localStorage.getItem('thx_token') || localStorage.getItem('token');
    if (legacyToken) {
      token = legacyToken;
      sessionStorage.setItem('thx_token', legacyToken);
      localStorage.removeItem('thx_token');
      localStorage.removeItem('token');
    }
    const legacyUser = localStorage.getItem('thx_user') || localStorage.getItem('user');
    if (legacyUser) {
      sessionStorage.setItem('thx_user', legacyUser);
      localStorage.removeItem('thx_user');
      localStorage.removeItem('user');
    }
  }

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