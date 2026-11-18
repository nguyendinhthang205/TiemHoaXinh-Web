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
const REVIEWS_STORAGE_KEY = 'thx_product_reviews';
const HOTLINE_STORAGE_KEY = 'thx_hotline_number';
export const DEFAULT_HOTLINE = '0905 123 456';

const SQL_CATEGORY_NAMES = {
  1: 'Bó hoa tươi nghệ thuật',
  2: 'Giỏ hoa chúc mừng',
  3: 'Lẵng hoa khai trương',
  4: 'Hộp hoa cao cấp',
  5: 'Hoa cưới cầm tay',
};

let inFlightCloudGet = null;
let lastCloudPayload = null;
let lastCloudFetchedAt = 0;

async function fetchCloudWithTimeout(options = {}, timeoutMs = 5500) {
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

async function getSharedCloudBin(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && lastCloudPayload && now - lastCloudFetchedAt < 3000) {
    return lastCloudPayload;
  }
  if (inFlightCloudGet) {
    return inFlightCloudGet;
  }

  inFlightCloudGet = (async () => {
    try {
      const res = await fetchCloudWithTimeout({ method: 'GET', cache: 'no-store' }, 5500);
      if (!res.ok) return lastCloudPayload;
      const raw = await res.json();
      const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      lastCloudPayload = safeBin;
      lastCloudFetchedAt = Date.now();
      return safeBin;
    } catch {
      return lastCloudPayload;
    } finally {
      inFlightCloudGet = null;
    }
  })();

  return inFlightCloudGet;
}

function compactCloudBin(rawBin) {
  const safeBin =
    rawBin && typeof rawBin === 'object' && !Array.isArray(rawBin) ? { ...rawBin } : {};
  const overrides = safeBin.__product_overrides__;
  if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
    const entries = Object.entries(overrides).sort(
      (a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0)
    );
    const kept = {};
    for (const [k, val] of entries) {
      kept[k] = val;
      if (JSON.stringify(safeBin).length > 72000) {
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
  lastCloudPayload = compacted;
  lastCloudFetchedAt = Date.now();
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
    const raw = await getSharedCloudBin(false);
    if (!raw) return getHotlineNumber();
    const remoteHotline = typeof raw?.__hotline__ === 'string' ? raw.__hotline__.trim() : '';
    if (remoteHotline && remoteHotline !== getHotlineNumber()) {
      localStorage.setItem(HOTLINE_STORAGE_KEY, remoteHotline);
      window.dispatchEvent(new Event('thx_hotline_updated'));
      return remoteHotline;
    }
  } catch {
    // Bỏ qua
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

  getSharedCloudBin(true)
    .then((raw) => {
      const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
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
    const raw = await getSharedCloudBin(false);
    if (!raw) return localMeta;
    const safeBin = { ...raw };
    const isOversized = JSON.stringify(safeBin).length > 75000;
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
    const raw = await getSharedCloudBin(true);
    const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
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
    // Giữ bản lưu cục bộ
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
    const raw = await getSharedCloudBin(false);
    if (!raw) return localOverrides;
    const safeBin = { ...raw };
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
      if ((!rItem && (lItem.hinhAnhChinh || lItem.danhMucTrangChu)) || lTime > rTime) {
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
    const raw = await getSharedCloudBin(true);
    const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
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
    // Giữ bản lưu cục bộ
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

  const resolvedCatId = matched?.maDanhMuc ?? product.maDanhMuc;
  const resolvedCatName =
    SQL_CATEGORY_NAMES[Number(resolvedCatId)] || product.tenDanhMuc || 'Hoa Nghệ Thuật';

  if (!matched) {
    return {
      ...product,
      tenDanhMuc: resolvedCatName,
    };
  }

  return {
    ...product,
    anhChinh: matched.hinhAnhChinh || matched.anhChinh || product.anhChinh,
    hinhAnhChinh: matched.hinhAnhChinh || product.hinhAnhChinh,
    hinhAnh: matched.hinhAnhChinh || product.hinhAnh,
    tongMauSac: matched.tongMauSac || product.tongMauSac,
    maDanhMuc: resolvedCatId,
    tenDanhMuc: resolvedCatName,
    danhMucTrangChu: Array.isArray(matched.danhMucTrangChu)
      ? matched.danhMucTrangChu
      : product.danhMucTrangChu,
  };
}

// --- HỆ THỐNG LƯU & ĐỒNG BỘ ĐÁNH GIÁ KHÁCH HÀNG ---
function readAllLocalReviewsMap() {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function getLocalProductReviews(maSanPham) {
  if (maSanPham == null) return [];
  const all = readAllLocalReviewsMap();
  const list = all[String(maSanPham)];
  return Array.isArray(list) ? list : [];
}

export function getMergedProductReviews(maSanPham, serverReviews = []) {
  const localList = getLocalProductReviews(maSanPham);
  const normalizedServer = (Array.isArray(serverReviews) ? serverReviews : []).map((r) => ({
    maDanhGia: r.maDanhGia || `srv-${r.ngayDanhGia || Math.random()}`,
    hoTenNguoiDung: r.hoTenNguoiDung || r.tenNguoiDung || 'Khách hàng',
    soSao: Number(r.soSao) || 5,
    binhLuan: r.binhLuan || '',
    createdAt: r.ngayDanhGia || r.createdAt || '',
    isVerifiedBuyer: true,
  }));

  const combined = [...localList];
  normalizedServer.forEach((srv) => {
    const isDuplicate = combined.some(
      (loc) =>
        loc.binhLuan.trim().toLowerCase() === srv.binhLuan.trim().toLowerCase() &&
        Number(loc.soSao) === Number(srv.soSao)
    );
    if (!isDuplicate) {
      combined.push(srv);
    }
  });

  combined.sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime() || 0;
    const tb = new Date(b.createdAt || 0).getTime() || 0;
    return tb - ta;
  });

  return combined;
}

export function getProductRatingStats(maSanPham, serverReviews = []) {
  const list = getMergedProductReviews(maSanPham, serverReviews);
  if (list.length === 0) {
    return { avg: '4.9', count: 0 };
  }
  const sum = list.reduce((acc, r) => acc + (Number(r.soSao) || 5), 0);
  return {
    avg: (sum / list.length).toFixed(1),
    count: list.length,
  };
}

export async function syncProductReviewsFromCloud() {
  const localMap = readAllLocalReviewsMap();
  try {
    const raw = await getSharedCloudBin(false);
    if (!raw) return localMap;
    const remoteMap =
      raw.__product_reviews__ &&
      typeof raw.__product_reviews__ === 'object' &&
      !Array.isArray(raw.__product_reviews__)
        ? raw.__product_reviews__
        : {};

    const mergedMap = { ...localMap };
    let changed = false;

    Object.entries(remoteMap).forEach(([spId, rList]) => {
      if (!Array.isArray(rList)) return;
      const currentList = Array.isArray(mergedMap[spId]) ? [...mergedMap[spId]] : [];
      rList.forEach((rItem) => {
        if (!rItem || !rItem.binhLuan) return;
        const exists = currentList.some(
          (x) =>
            x.maDanhGia === rItem.maDanhGia ||
            (x.hoTenNguoiDung === rItem.hoTenNguoiDung &&
              x.binhLuan.trim() === rItem.binhLuan.trim())
        );
        if (!exists) {
          currentList.push(rItem);
          changed = true;
        }
      });
      mergedMap[spId] = currentList;
    });

    if (changed) {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(mergedMap));
      window.dispatchEvent(new Event('thx_reviews_updated'));
    }
    return mergedMap;
  } catch {
    return localMap;
  }
}

export async function saveProductReview(
  maSanPham,
  { userName, rating = 5, comment = '', isVerifiedBuyer = true }
) {
  if (maSanPham == null || !String(comment).trim()) return null;
  const spKey = String(maSanPham);
  const newReview = {
    maDanhGia: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hoTenNguoiDung: String(userName || 'Khách hàng').trim(),
    soSao: Math.min(5, Math.max(1, Number(rating) || 5)),
    binhLuan: String(comment).trim(),
    createdAt: new Date().toISOString(),
    isVerifiedBuyer,
  };

  const allLocal = readAllLocalReviewsMap();
  const existing = Array.isArray(allLocal[spKey]) ? allLocal[spKey] : [];
  allLocal[spKey] = [newReview, ...existing].slice(0, 30);

  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(allLocal));
    window.dispatchEvent(new Event('thx_reviews_updated'));
  } catch {
    // Bỏ qua
  }

  // Đẩy lên đám mây để mọi tài khoản và thiết bị đều nhìn thấy đánh giá
  getSharedCloudBin(true)
    .then((raw) => {
      const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
      const remoteMap =
        safeBin.__product_reviews__ && typeof safeBin.__product_reviews__ === 'object'
          ? { ...safeBin.__product_reviews__ }
          : {};
      const remoteList = Array.isArray(remoteMap[spKey]) ? remoteMap[spKey] : [];
      remoteMap[spKey] = [newReview, ...remoteList].slice(0, 20);
      safeBin.__product_reviews__ = remoteMap;
      return pushCompactCloudBin(safeBin);
    })
    .catch(() => {});

  // Đồng thời gửi tới Backend SQL Server nếu có hỗ trợ
  api
    .post('/DanhGia', {
      maSanPham: Number(maSanPham),
      soSao: newReview.soSao,
      binhLuan: newReview.binhLuan,
    })
    .catch(() => {});

  return newReview;
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