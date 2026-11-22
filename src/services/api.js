import axios from 'axios';
import {
  CATALOG_SEED_CUTOFF,
  CURATED_CATEGORIES,
  SERVER_PRODUCT_PATCHES,
  EXTRA_CURATED_PRODUCTS,
  LOCAL_FLOWER_FALLBACKS,
  getCuratedProductById,
} from '../data/flowerCatalog';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://tiemhoaxinh.runasp.net/api'
).replace(/\/+$/, '');
export const API_URL = API_BASE_URL;

export const AI_BASE_URL = (
  import.meta.env.VITE_AI_URL || 'https://tiemhoaxinh-ai.onrender.com'
).replace(/\/+$/, '');
export const AI_URL = AI_BASE_URL;

export const CLOUD_BIN_URL = 'https://api.npoint.io/639a3cda635df1c41eb4';
const ORDER_META_KEY = 'thx_order_meta';
const PRODUCT_SYNC_KEY = 'thx_product_overrides';
const REVIEWS_STORAGE_KEY = 'thx_product_reviews';
const HOTLINE_STORAGE_KEY = 'thx_hotline_number';
export const DEFAULT_HOTLINE = '0905 123 456';

export const SQL_CATEGORY_NAMES = {
  1: 'Bó hoa tươi nghệ thuật',
  2: 'Giỏ hoa chúc mừng',
  3: 'Lẵng hoa khai trương',
  4: 'Hộp hoa cao cấp',
  5: 'Hoa cưới cầm tay',
};

// --- QUẢN LÝ PHIÊN ĐĂNG NHẬP THỐNG NHẤT ---
export function getStoredToken() {
  try {
    return (
      sessionStorage.getItem('thx_token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('thx_token') ||
      localStorage.getItem('token') ||
      ''
    );
  } catch {
    return '';
  }
}

export function getStoredUser() {
  try {
    const raw =
      sessionStorage.getItem('thx_user') ||
      sessionStorage.getItem('user') ||
      localStorage.getItem('thx_user') ||
      localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth({ token = '', user = null, rememberMe = true } = {}) {
  try {
    const userJson = user ? JSON.stringify(user) : '';
    if (token) {
      sessionStorage.setItem('thx_token', token);
      sessionStorage.setItem('token', token);
    }
    if (userJson) {
      sessionStorage.setItem('thx_user', userJson);
      sessionStorage.setItem('user', userJson);
    }

    if (rememberMe) {
      if (token) {
        localStorage.setItem('thx_token', token);
        localStorage.setItem('token', token);
      }
      if (userJson) {
        localStorage.setItem('thx_user', userJson);
        localStorage.setItem('user', userJson);
      }
    } else {
      localStorage.removeItem('thx_token');
      localStorage.removeItem('token');
      localStorage.removeItem('thx_user');
      localStorage.removeItem('user');
    }
  } catch {
    // Bỏ qua lỗi storage
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem('thx_token');
    localStorage.removeItem('thx_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('thx_token');
    sessionStorage.removeItem('thx_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } catch {
    // Bỏ qua
  }
}

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

export async function getSharedCloudBin(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && lastCloudPayload && now - lastCloudFetchedAt < 4000) {
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

function isSameOverrideItem(a, b) {
  if (!a || !b) return false;
  return (
    (a.hinhAnhChinh || '') === (b.hinhAnhChinh || '') &&
    (a.anhChinh || '') === (b.anhChinh || '') &&
    (a.tongMauSac || '') === (b.tongMauSac || '') &&
    Number(a.maDanhMuc || 0) === Number(b.maDanhMuc || 0) &&
    Number(a.updatedAt || 0) === Number(b.updatedAt || 0) &&
    JSON.stringify(a.danhMucTrangChu || []) === JSON.stringify(b.danhMucTrangChu || [])
  );
}

function isSameOrderMetaItem(a, b) {
  if (!a || !b) return false;
  return (
    (a.statusOverride || '') === (b.statusOverride || '') &&
    Boolean(a.deleted) === Boolean(b.deleted) &&
    Boolean(a.isPaid) === Boolean(b.isPaid) &&
    (a.deliveryMethod || '') === (b.deliveryMethod || '') &&
    Number(a.shippingFee || 0) === Number(b.shippingFee || 0) &&
    Number(a.grandTotal || 0) === Number(b.grandTotal || 0) &&
    Number(a.updatedAt || 0) === Number(b.updatedAt || 0)
  );
}

// Dọn các dữ liệu phụ cũ trước, luôn ưu tiên giữ lại hình ảnh sản phẩm mới nhất
export function compactCloudBin(rawBin) {
  const safeBin =
    rawBin && typeof rawBin === 'object' && !Array.isArray(rawBin) ? { ...rawBin } : {};

  if (
    safeBin.__order_meta__ &&
    typeof safeBin.__order_meta__ === 'object' &&
    !Array.isArray(safeBin.__order_meta__)
  ) {
    const orderEntries = Object.entries(safeBin.__order_meta__).sort(
      (a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0)
    );
    if (orderEntries.length > 150) {
      safeBin.__order_meta__ = Object.fromEntries(orderEntries.slice(0, 150));
    }
  }

  const overrides = safeBin.__product_overrides__;
  if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
    const entries = Object.entries(overrides).sort(
      (a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0)
    );
    const kept = {};
    for (let i = 0; i < entries.length; i += 1) {
      const [k, val] = entries[i];
      if (!val || typeof val !== 'object') continue;
      const itemCopy = { ...val };

      if (k.startsWith('name:') && itemCopy.hinhAnhChinh?.startsWith('data:image/')) {
        delete itemCopy.hinhAnhChinh;
      }

      kept[k] = itemCopy;
      const testBin = { ...safeBin, __product_overrides__: kept };
      if (i > 0 && JSON.stringify(testBin).length > 88000) {
        if (kept[k]?.hinhAnhChinh?.startsWith('data:image/')) {
          delete kept[k].hinhAnhChinh;
        }
      }
    }
    safeBin.__product_overrides__ = kept;
  }

  return safeBin;
}

export async function pushCompactCloudBin(rawBin) {
  const compacted = compactCloudBin(rawBin);
  lastCloudPayload = compacted;
  lastCloudFetchedAt = Date.now();
  return fetchCloudWithTimeout(
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compacted),
    },
    6500
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
    const remoteMeta =
      safeBin.__order_meta__ &&
      typeof safeBin.__order_meta__ === 'object' &&
      !Array.isArray(safeBin.__order_meta__)
        ? safeBin.__order_meta__
        : {};

    const merged = { ...localMeta };
    let localChanged = false;
    let shouldPushBack = false;

    Object.entries(remoteMeta).forEach(([orderId, rItem]) => {
      if (!rItem || typeof rItem !== 'object') return;
      const lItem = merged[orderId];
      const rTime = Number(rItem.updatedAt || 0);
      const lTime = Number(lItem?.updatedAt || 0);
      if (!lItem || rTime >= lTime) {
        const nextMerged = { ...(lItem || {}), ...rItem };
        if (!isSameOrderMetaItem(lItem, nextMerged)) {
          merged[orderId] = nextMerged;
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

export async function writeOrdersDeletedBatch(orderIds) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return readLocalOrderMeta();
  const now = Date.now();
  const localCurrent = readLocalOrderMeta();

  orderIds.forEach((id) => {
    const idStr = String(id);
    localCurrent[idStr] = {
      ...(localCurrent[idStr] || {}),
      deleted: true,
      updatedAt: now,
    };
  });

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

    orderIds.forEach((id) => {
      const idStr = String(id);
      remoteMeta[idStr] = {
        ...(remoteMeta[idStr] || {}),
        deleted: true,
        updatedAt: now,
      };
    });
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
        const nextMerged = { ...(lItem || {}), ...rItem };
        if (!isSameOverrideItem(lItem, nextMerged)) {
          merged[key] = nextMerged;
          localChanged = true;
        }
      }
    });

    Object.entries(localOverrides).forEach(([key, lItem]) => {
      if (!lItem || typeof lItem !== 'object') return;
      if (key.startsWith('name:')) return;
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

  const sanitizedPatch = { ...patch };
  if (keyStr.startsWith('name:') && sanitizedPatch.hinhAnhChinh?.startsWith('data:image/')) {
    delete sanitizedPatch.hinhAnhChinh;
  }

  const current = getProductOverrides();
  const nextEntry = {
    ...(current[keyStr] || {}),
    ...sanitizedPatch,
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

export function mergeProductOverride(product) {
  if (!product || typeof product !== 'object') return product;

  const rawId = Number(product.maSanPham ?? product.MaSanPham);
  const curatedPatch = Number.isFinite(rawId) ? SERVER_PRODUCT_PATCHES[rawId] || null : null;
  const baseProduct = curatedPatch
    ? {
        ...product,
        tenSanPham: curatedPatch.tenSanPham,
        loaiHoa: curatedPatch.loaiHoa,
        maDanhMuc: curatedPatch.maDanhMuc,
        tenDanhMuc: curatedPatch.tenDanhMuc,
        tongMauSac: curatedPatch.tongMauSac,
        danhMucTrangChu: curatedPatch.danhMucTrangChu,
        moTa: curatedPatch.moTa,
        anhChinh: curatedPatch.hinhAnhChinh,
        hinhAnhChinh: curatedPatch.hinhAnhChinh,
        hinhAnh: curatedPatch.hinhAnhChinh,
      }
    : { ...product };

  const overrides = getProductOverrides();
  const byId = baseProduct.maSanPham != null ? overrides[String(baseProduct.maSanPham)] : null;
  const nameKey = baseProduct.tenSanPham
    ? `name:${String(baseProduct.tenSanPham).trim().toLowerCase()}`
    : '';
  const byName = nameKey ? overrides[nameKey] : null;

  // Chỉ áp dụng override mới hơn mốc chuẩn hóa bộ sưu tập (tránh dữ liệu thử nghiệm cũ ghi đè ảnh & tên đúng loài)
  const freshById =
    byId && Number(byId.updatedAt || 0) >= CATALOG_SEED_CUTOFF ? byId : null;
  const freshByName =
    byName && Number(byName.updatedAt || 0) >= CATALOG_SEED_CUTOFF ? byName : null;
  const matched = freshById || freshByName;

  const resolvedCatId = matched?.maDanhMuc ?? baseProduct.maDanhMuc;
  const resolvedCatName =
    SQL_CATEGORY_NAMES[Number(resolvedCatId)] || baseProduct.tenDanhMuc || 'Hoa Nghệ Thuật';

  if (!matched) {
    return {
      ...baseProduct,
      tenDanhMuc: resolvedCatName,
    };
  }

  const resolvedImg =
    freshById?.hinhAnhChinh ||
    freshById?.anhChinh ||
    freshByName?.hinhAnhChinh ||
    freshByName?.anhChinh ||
    baseProduct.hinhAnhChinh ||
    baseProduct.anhChinh;

  return {
    ...baseProduct,
    anhChinh: resolvedImg,
    hinhAnhChinh: resolvedImg || baseProduct.hinhAnhChinh,
    hinhAnh: resolvedImg || baseProduct.hinhAnh,
    tongMauSac: matched.tongMauSac || baseProduct.tongMauSac,
    maDanhMuc: resolvedCatId,
    tenDanhMuc: resolvedCatName,
    danhMucTrangChu: Array.isArray(matched.danhMucTrangChu)
      ? matched.danhMucTrangChu
      : baseProduct.danhMucTrangChu,
  };
}

export function applyOverridesToProductList(list) {
  const safeList = Array.isArray(list) ? list : [];
  const mergedServer = safeList.map(mergeProductOverride);
  const existingIds = new Set(mergedServer.map((p) => Number(p.maSanPham)));

  const extras = EXTRA_CURATED_PRODUCTS.filter(
    (item) => !existingIds.has(Number(item.maSanPham))
  ).map(mergeProductOverride);

  return [...mergedServer, ...extras];
}

export function getOfflineFallbackProducts() {
  const baseFromPatches = Object.entries(SERVER_PRODUCT_PATCHES).map(([idStr, patch]) => ({
    maSanPham: Number(idStr),
    giaBan: 550000,
    soLuongTon: 18,
    ...patch,
  }));
  return applyOverridesToProductList(baseFromPatches);
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
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const reqUrl = String(response?.config?.url || '').toLowerCase();
    const isListSanPham = /^\/?sanpham\/?(\?.*)?$/.test(reqUrl);
    if (reqUrl.includes('/sanpham') && response?.data) {
      if (Array.isArray(response.data)) {
        response.data = isListSanPham
          ? applyOverridesToProductList(response.data)
          : response.data.map(mergeProductOverride);
      } else if (Array.isArray(response.data.items)) {
        response.data.items = isListSanPham
          ? applyOverridesToProductList(response.data.items)
          : response.data.items.map(mergeProductOverride);
      } else if (typeof response.data === 'object') {
        response.data = mergeProductOverride(response.data);
      }
    }
    if (/^\/?danhmuc\/?(\?.*)?$/.test(reqUrl)) {
      if (!Array.isArray(response.data) || response.data.length === 0) {
        response.data = CURATED_CATEGORIES;
      }
    }
    return response;
  },
  (error) => {
    const reqUrl = String(error?.config?.url || '').toLowerCase();
    const method = String(error?.config?.method || 'get').toLowerCase();
    if (method === 'get') {
      const detailMatch = reqUrl.match(/^\/?sanpham\/(\d+)\/?$/);
      if (detailMatch) {
        const curated = getCuratedProductById(detailMatch[1]);
        if (curated) {
          return Promise.resolve({
            data: mergeProductOverride(curated),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config,
          });
        }
      }
      if (/^\/?sanpham\/?(\?.*)?$/.test(reqUrl)) {
        return Promise.resolve({
          data: getOfflineFallbackProducts(),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }
      if (/^\/?danhmuc\/?(\?.*)?$/.test(reqUrl)) {
        return Promise.resolve({
          data: CURATED_CATEGORIES,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }
    }
    return Promise.reject(error);
  }
);

const FLORAL_GALLERY = LOCAL_FLOWER_FALLBACKS;

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
      trimmed.startsWith('/images/') ||
      trimmed.startsWith('./images/') ||
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
