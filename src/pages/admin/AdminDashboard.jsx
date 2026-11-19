import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles,
  ShoppingBag,
  Package,
  BarChart3,
  RefreshCw,
  Truck,
  Store,
  CreditCard,
  Eye,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Check,
  User,
  Phone,
  MapPin,
  Calendar,
  Gift,
  DollarSign,
  Cpu,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Palette,
  Settings,
  MoreHorizontal,
  Download,
  Clock,
} from 'lucide-react';
import api, {
  API_BASE_URL,
  AI_BASE_URL,
  formatVND,
  getFlowerImage,
  saveProductOverride,
  syncProductOverridesFromCloud,
  getHotlineNumber,
  saveHotlineNumber,
  readLocalOrderMeta,
  syncOrderMetaFromCloud,
  writeOrderMeta,
} from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  getAllConversationsForAdmin,
  sendAdminReply,
  markConversationReadByAdmin,
  syncChatsFromCloud,
} from '../../services/chatService';

const PAGE_SIZE = 15;
const CLOUD_BIN_URL = 'https://api.npoint.io/639a3cda635df1c41eb4';

const FLOWER_CATEGORIES = [
  { id: 1, name: 'Bó hoa tươi nghệ thuật' },
  { id: 2, name: 'Giỏ hoa chúc mừng' },
  { id: 3, name: 'Lẵng hoa khai trương' },
  { id: 4, name: 'Hộp hoa cao cấp' },
  { id: 5, name: 'Hoa cưới cầm tay' },
];

const HOMEPAGE_NAV_CATEGORIES = [
  { id: 'sinh-nhat', label: 'Hoa Sinh Nhật' },
  { id: 'khai-truong', label: 'Hoa Khai Trương' },
  { id: 'lan-ho-diep', label: 'Lan Hồ Điệp' },
  { id: 'chu-de', label: 'Chủ Đề' },
  { id: 'thiet-ke', label: 'Thiết Kế' },
];

const STANDARD_COLOR_TONES = [
  'Hồng Pastel',
  'Đỏ',
  'Vàng',
  'Trắng',
  'Tím',
  'Cam Đào',
];

const ADMIN_QUICK_REPLIES = [
  'Chào bạn, tiệm đã nhận được yêu cầu và đang kiểm tra ngay ạ!',
  'Hoa tươi bên tiệm nhập mới mỗi sáng, tặng kèm thiệp chúc mừng miễn phí bạn nhé.',
  'Đơn hàng của bạn đang được thợ hoa chuẩn bị và sẽ giao đúng khung giờ đã đặt ạ!',
];

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftYearMonth(ym, delta) {
  const [yStr, mStr] = (ym || getCurrentYearMonth()).split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getOrderYearMonth(order) {
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

function formatYearMonthVN(ym) {
  if (!ym || !ym.includes('-')) return 'Tháng này';
  const [y, m] = ym.split('-');
  return `Tháng ${m}/${y}`;
}

function compressImageFile(file, maxSize = 240, quality = 0.62) {
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

function extractRawStatus(order, meta = {}) {
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

function normalizeAdminOrderStatus(rawStatus = '', isPickup = false) {
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

export default function AdminDashboard() {
  const { user, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('');
  const [training, setTraining] = useState(false);
  const [apiError, setApiError] = useState('');
  const [hotlineInput, setHotlineInput] = useState(() => getHotlineNumber());
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentYearMonth());

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [forecasts, setForecasts] = useState([]);
  const [modelMetrics, setModelMetrics] = useState({
    modelName: 'LinearRegression',
    mae: 2.51,
    rmse: 3.29,
    rfMae: 3.12,
    rfRmse: 4.05,
  });
  const [orderMetaMap, setOrderMetaMap] = useState(() => readLocalOrderMeta());

  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const adminChatEndRef = useRef(null);
  const ordersFetchLockRef = useRef(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [openMenuOrderId, setOpenMenuOrderId] = useState(null);
  const [deletingOrders, setDeletingOrders] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const [productModal, setProductModal] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageFileName, setImageFileName] = useState('');
  const fileInputRef = useRef(null);
  const [productForm, setProductForm] = useState({
    tenSanPham: '',
    maDanhMuc: 1,
    danhMucTrangChu: ['sinh-nhat', 'thiet-ke'],
    giaBan: 450000,
    soLuongTon: 30,
    tongMauSac: 'Hồng Pastel',
    moTa: '',
    hinhAnhChinh: '',
  });

  const stampNowTime = () => {
    const now = new Date();
    setLastUpdatedLabel(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );
  };

  const syncChats = useCallback(() => {
    const list = getAllConversationsForAdmin();
    setConversations(list);
    setSelectedConvId((prev) => {
      if (prev && list.some((c) => c.id === prev)) return prev;
      return list.length > 0 ? list[0].id : null;
    });
  }, []);

  useEffect(() => {
    syncChats();
    syncChatsFromCloud().then(() => syncChats());

    const handleChatEvent = () => syncChats();
    const handleOrderMetaEvent = () => setOrderMetaMap(readLocalOrderMeta());

    window.addEventListener('thx_chat_updated', handleChatEvent);
    window.addEventListener('thx_orders_updated', handleOrderMetaEvent);
    window.addEventListener('storage', handleChatEvent);
    window.addEventListener('storage', handleOrderMetaEvent);
    return () => {
      window.removeEventListener('thx_chat_updated', handleChatEvent);
      window.removeEventListener('thx_orders_updated', handleOrderMetaEvent);
      window.removeEventListener('storage', handleChatEvent);
      window.removeEventListener('storage', handleOrderMetaEvent);
    };
  }, [syncChats]);

  useEffect(() => {
    const intervalMs = activeTab === 'messages' ? 5000 : 20000;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncChatsFromCloud().then(() => syncChats());
      syncOrderMetaFromCloud().then((latest) => setOrderMetaMap(latest));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [activeTab, syncChats]);

  const activeConversation =
    conversations.find((c) => c.id === selectedConvId) || conversations[0] || null;

  useEffect(() => {
    if (activeTab === 'messages' && activeConversation?.id) {
      if ((activeConversation.unreadByAdmin || 0) > 0) {
        markConversationReadByAdmin(activeConversation.id);
      }
      setTimeout(() => {
        adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [
    activeTab,
    activeConversation?.id,
    activeConversation?.messages?.length,
    activeConversation?.unreadByAdmin,
  ]);

  const markOrdersDeletedBatch = async (orderIds) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) return;
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
      localStorage.setItem('thx_order_meta', JSON.stringify(localCurrent));
      window.dispatchEvent(new Event('thx_orders_updated'));
    } catch {
      // Bỏ qua
    }
    setOrderMetaMap({ ...localCurrent });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(CLOUD_BIN_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      const raw = res.ok ? await res.json() : {};
      const safeBin = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
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

      await fetch(CLOUD_BIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeBin),
      });
    } catch {
      // Giữ bản lưu cục bộ
    }
  };

  const buildFallbackForecast = useCallback((spList) => {
    setForecasts((prev) => {
      if (prev.length > 0) return prev;
      return spList.slice(0, 12).map((p, idx) => {
        const predicted = Math.max(18, 45 - idx * 2);
        const needImport = Math.max(0, predicted - (p.soLuongTon ?? 15) + 10);
        return {
          maSanPham: p.maSanPham,
          tenSanPham: p.tenSanPham,
          soLuongTon: p.soLuongTon ?? 15,
          duBaoThangToi: predicted,
          deXuatNhap: needImport,
        };
      });
    });
  }, []);

  const loadRecentOrdersFallback = useCallback(async () => {
    const metaKeys = Object.keys(readLocalOrderMeta())
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n) && n > 0);
    const maxKnownId = metaKeys.length > 0 ? Math.max(...metaKeys) : 776;
    const startId = Math.max(maxKnownId + 3, 776);

    const recovered = [];
    let missStreak = 0;

    for (let id = startId; id >= Math.max(1, startId - 23); id -= 4) {
      const batch = [id, id - 1, id - 2, id - 3].filter((x) => x >= 1);
      const resList = await Promise.allSettled(
        batch.map((orderId) => api.get(`/DonHang/${orderId}`, { timeout: 4000 }))
      );
      let batchHits = 0;
      resList.forEach((r) => {
        if (r.status === 'fulfilled' && r.value?.data?.maDonHang) {
          recovered.push(r.value.data);
          batchHits += 1;
        }
      });
      if (batchHits === 0) {
        missStreak += 1;
        if (missStreak >= 2) break;
      } else {
        missStreak = 0;
      }
    }

    recovered.sort((a, b) => (b.maDonHang || 0) - (a.maDonHang || 0));
    return recovered;
  }, []);

  const loadOrdersOnly = useCallback(async () => {
    if (ordersFetchLockRef.current) return false;
    ordersFetchLockRef.current = true;
    setLoadingOrders(true);

    try {
      const res = await api.get('/DonHang', { timeout: 6500 });
      setApiError('');
      const d = res.data;
      let ordList = Array.isArray(d) ? d : d?.items || d?.data || [];
      ordList.sort((a, b) => (b.maDonHang || 0) - (a.maDonHang || 0));

      const topEnriched = await Promise.all(
        ordList.slice(0, 4).map(async (ord) => {
          const hasStatus =
            ord.trangThai || ord.trangThaiDonHang || ord.trangThaiDon || ord.status;
          if (hasStatus) return ord;
          try {
            const dRes = await api.get(`/DonHang/${ord.maDonHang}`, { timeout: 3000 });
            return { ...ord, ...(dRes.data || {}) };
          } catch {
            return ord;
          }
        })
      );
      ordList = [...topEnriched, ...ordList.slice(4)];
      setOrders(ordList);
      stampNowTime();

      try {
        const prevCache = JSON.parse(localStorage.getItem('thx_admin_fast_cache') || '{}');
        localStorage.setItem(
          'thx_admin_fast_cache',
          JSON.stringify({ ...prevCache, orders: ordList.slice(0, 120) })
        );
      } catch {
        // Bỏ qua
      }
      return true;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setApiError(
          'Phiên đăng nhập Admin đã hết hạn. Vui lòng bấm Đăng xuất ở góc phải và đăng nhập lại.'
        );
        return false;
      }

      const fallbackList = await loadRecentOrdersFallback();
      if (fallbackList.length > 0) {
        setOrders(fallbackList);
        setApiError('');
        stampNowTime();
        try {
          const prevCache = JSON.parse(localStorage.getItem('thx_admin_fast_cache') || '{}');
          localStorage.setItem(
            'thx_admin_fast_cache',
            JSON.stringify({ ...prevCache, orders: fallbackList })
          );
        } catch {
          // Bỏ qua
        }
        return true;
      }

      const reasonText = status ? `HTTP ${status}` : 'Máy chủ đang khởi động';
      setApiError(
        `Chưa tải được đơn hàng (${reasonText}). Vui lòng đợi 5 giây rồi bấm "Thử kết nối lại".`
      );
      return false;
    } finally {
      ordersFetchLockRef.current = false;
      setLoadingOrders(false);
    }
  }, [loadRecentOrdersFallback]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setApiError('');

    try {
      const rawCache = localStorage.getItem('thx_admin_fast_cache');
      if (rawCache) {
        const cached = JSON.parse(rawCache);
        if (Array.isArray(cached.products) && cached.products.length > 0) {
          setProducts(cached.products);
          const pMap = {};
          cached.products.forEach((p) => {
            pMap[p.maSanPham] = p;
          });
          setProductMap(pMap);
          buildFallbackForecast(cached.products);
        }
        if (Array.isArray(cached.orders) && cached.orders.length > 0) {
          setOrders(cached.orders);
        }
      }
    } catch {
      // Bỏ qua
    }

    syncOrderMetaFromCloud().then((latest) => setOrderMetaMap(latest));
    syncProductOverridesFromCloud().then(() => {
      setProducts((prev) => [...prev]);
    });

    api
      .get('/SanPham', { timeout: 10000 })
      .then((res) => {
        const d = res.data;
        const spList = Array.isArray(d) ? d : d?.items || [];
        setProducts(spList);
        const pMap = {};
        spList.forEach((p) => {
          pMap[p.maSanPham] = p;
        });
        setProductMap(pMap);
        buildFallbackForecast(spList);
        stampNowTime();

        try {
          const prevCache = JSON.parse(localStorage.getItem('thx_admin_fast_cache') || '{}');
          localStorage.setItem(
            'thx_admin_fast_cache',
            JSON.stringify({ ...prevCache, products: spList })
          );
        } catch {
          // Bỏ qua
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    loadOrdersOnly();

    api
      .get('/DuBao', { timeout: 4500 })
      .then((res) => res.data)
      .catch(() =>
        axios
          .get(`${AI_BASE_URL}/forecast`, { timeout: 4500 })
          .then((res) => res.data)
          .catch(() => null)
      )
      .then((forecastData) => {
        if (!forecastData) return;
        const list =
          forecastData.danhSachDuBao ||
          forecastData.forecasts ||
          forecastData.items ||
          (Array.isArray(forecastData) ? forecastData : []);
        if (list.length > 0) setForecasts(list);

        if (forecastData.mae || forecastData.metrics?.mae) {
          setModelMetrics((prev) => ({
            ...prev,
            modelName: forecastData.moHinh || forecastData.modelName || prev.modelName,
            mae: forecastData.mae ?? forecastData.metrics?.mae ?? prev.mae,
            rmse: forecastData.rmse ?? forecastData.metrics?.rmse ?? prev.rmse,
          }));
        }
      });
  }, [buildFallbackForecast, loadOrdersOnly]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Hỗ trợ mở thẳng popup Sửa mẫu hoa khi Admin bấm "Sửa mẫu" từ Trang chủ
  useEffect(() => {
    const editId = searchParams.get('editProduct');
    if (editId && products.length > 0) {
      const targetSp = products.find((p) => String(p.maSanPham) === String(editId));
      if (targetSp) {
        setActiveTab('products');
        openEditProduct(targetSp);
        setSearchParams({});
      }
    }
  }, [searchParams, products, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, orderSearch]);

  const deleteOrderFromBackend = async (orderId) => {
    const cfg = { timeout: 4500 };
    const deleteAttempts = [
      () => api.delete(`/DonHang/${orderId}`, cfg),
      () => api.delete(`/DonHang/delete/${orderId}`, cfg),
      () => api.post(`/DonHang/${orderId}/delete`, null, cfg),
    ];
    for (const fn of deleteAttempts) {
      try {
        await fn();
        return true;
      } catch {
        // Thử tiếp
      }
    }
    return false;
  };

  const handleDeleteSingleOrder = async (order) => {
    const orderId = order.maDonHang;
    setOpenMenuOrderId(null);
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn đơn hàng #${orderId} không?`)) return;

    try {
      setDeletingOrders(true);
      await deleteOrderFromBackend(orderId);
      await markOrdersDeletedBatch([orderId]);

      setOrders((prev) => prev.filter((o) => o.maDonHang !== orderId));
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
      if (selectedOrder?.maDonHang === orderId) {
        setSelectedOrder(null);
      }
      showToast(`Đã xóa đơn hàng #${orderId}!`);
    } finally {
      setDeletingOrders(false);
    }
  };

  const handleBulkDeleteOrders = async (idsToDelete, labelText) => {
    if (!Array.isArray(idsToDelete) || idsToDelete.length === 0) return;
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa ${idsToDelete.length} đơn hàng (${labelText}) không?`
      )
    ) {
      return;
    }

    try {
      setDeletingOrders(true);
      const chunkSize = 6;
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const chunk = idsToDelete.slice(i, i + chunkSize);
        await Promise.allSettled(chunk.map((id) => deleteOrderFromBackend(id)));
      }

      await markOrdersDeletedBatch(idsToDelete);

      const idSet = new Set(idsToDelete);
      setOrders((prev) => prev.filter((o) => !idSet.has(o.maDonHang)));
      setSelectedOrderIds((prev) => prev.filter((id) => !idSet.has(id)));
      showToast(`Đã xóa thành công ${idsToDelete.length} đơn hàng!`);
    } finally {
      setDeletingOrders(false);
    }
  };

  const pushStatusToBackend = async (orderId, nextCode) => {
    const cfg = { timeout: 4500 };
    if (nextCode === 'Cancelled') {
      try {
        await api.put(`/DonHang/${orderId}/cancel`, { lyDoHuy: 'Cửa hàng hủy đơn' }, cfg);
        return true;
      } catch {
        try {
          await api.put(`/DonHang/${orderId}/status`, { trangThai: 'Cancelled' }, cfg);
          return true;
        } catch {
          return false;
        }
      }
    }

    const cachedMode = localStorage.getItem('thx_status_api_mode');
    const runners = {
      trangThai: () => api.put(`/DonHang/${orderId}/status`, { trangThai: nextCode }, cfg),
      status: () => api.put(`/DonHang/${orderId}/status`, { status: nextCode }, cfg),
      query: () =>
        api.put(`/DonHang/${orderId}/status?trangThai=${encodeURIComponent(nextCode)}`, null, cfg),
    };

    const orderedKeys =
      cachedMode && runners[cachedMode]
        ? [cachedMode, ...Object.keys(runners).filter((k) => k !== cachedMode)]
        : Object.keys(runners);

    for (const key of orderedKeys) {
      try {
        await runners[key]();
        localStorage.setItem('thx_status_api_mode', key);
        return true;
      } catch {
        // Thử định dạng kế tiếp
      }
    }
    return false;
  };

  const handleChangeOrderStatus = (order, nextCode, isPickup = false, askConfirm = false) => {
    const orderId = order.maDonHang;
    const targetInfo = normalizeAdminOrderStatus(nextCode, isPickup);
    setOpenMenuOrderId(null);

    if (
      askConfirm &&
      !window.confirm(`Xác nhận chuyển đơn #${orderId} sang trạng thái "${targetInfo.label}"?`)
    ) {
      return;
    }

    const patch = { statusOverride: nextCode };
    if (nextCode === 'Completed') {
      patch.isPaid = true;
    }

    const now = Date.now();
    const localCurrent = readLocalOrderMeta();
    localCurrent[String(orderId)] = {
      ...(localCurrent[String(orderId)] || {}),
      ...patch,
      updatedAt: now,
    };
    try {
      localStorage.setItem('thx_order_meta', JSON.stringify(localCurrent));
    } catch {
      // Bỏ qua
    }
    setOrderMetaMap({ ...localCurrent });

    setOrders((prev) =>
      prev.map((item) =>
        item.maDonHang === orderId
          ? { ...item, trangThai: nextCode, status: nextCode }
          : item
      )
    );

    if (selectedOrder && selectedOrder.maDonHang === orderId) {
      setSelectedOrder((prev) => ({
        ...prev,
        trangThai: nextCode,
        status: nextCode,
        _meta: { ...(prev._meta || {}), ...patch },
      }));
    }

    showToast(`Đã chuyển đơn #${orderId} sang "${targetInfo.label}"!`);

    pushStatusToBackend(orderId, nextCode).then(() => {
      if (nextCode === 'Completed') {
        api.put(`/DonHang/${orderId}/confirm-payment`, null, { timeout: 4500 }).catch(() => {});
      }
    });
    writeOrderMeta(orderId, patch);
  };

  const handleConfirmPayment = (order) => {
    const orderId = order.maDonHang;
    setOpenMenuOrderId(null);

    const now = Date.now();
    const localCurrent = readLocalOrderMeta();
    localCurrent[String(orderId)] = {
      ...(localCurrent[String(orderId)] || {}),
      isPaid: true,
      updatedAt: now,
    };
    try {
      localStorage.setItem('thx_order_meta', JSON.stringify(localCurrent));
    } catch {
      // Bỏ qua
    }
    setOrderMetaMap({ ...localCurrent });

    if (selectedOrder && selectedOrder.maDonHang === orderId) {
      setSelectedOrder((prev) => ({
        ...prev,
        _meta: { ...(prev._meta || {}), isPaid: true },
      }));
    }

    showToast(`Đã xác nhận thu tiền cho đơn hàng #${orderId}`);

    api.put(`/DonHang/${orderId}/confirm-payment`, null, { timeout: 4500 }).catch(() => {});
    writeOrderMeta(orderId, { isPaid: true });
  };

  const handleOpenOrderDetail = async (order) => {
    const orderId = order.maDonHang;
    const meta = orderMetaMap[orderId] || {};
    setOpenMenuOrderId(null);
    try {
      setLoadingDetailId(orderId);
      let detailObj = { ...order };
      let items =
        order.chiTietDonHangs || order.chiTietDonHang || order.items || order.sanPhams || [];

      try {
        const res = await api.get(`/DonHang/${orderId}`, { timeout: 5000 });
        const d = res.data || {};
        detailObj = { ...detailObj, ...d };
        const fetchedItems =
          d.chiTietDonHangs || d.chiTietDonHang || d.items || d.sanPhams || [];
        if (fetchedItems.length > 0) {
          items = fetchedItems;
        }
      } catch {
        // Dùng dữ liệu sẵn có
      }

      const enrichedItems = (items || []).map((it) => {
        const prod = productMap[it.maSanPham] || {};
        const qty = Number(it.soLuong ?? 1) || 1;
        const rawUnit =
          Number(it.donGia) ||
          Number(it.giaLucMua) ||
          Number(it.giaBan) ||
          (Number(it.thanhTien) > 0 ? Number(it.thanhTien) / qty : 0) ||
          Number(prod.giaBan) ||
          0;
        const flowerName =
          it.tenSanPham || prod.tenSanPham || `Bó hoa #${it.maSanPham}`;
        return {
          ...prod,
          ...it,
          tenSanPham: flowerName,
          soLuong: qty,
          _unitPrice: rawUnit,
          _lineTotal: rawUnit * qty,
        };
      });

      setSelectedOrder({
        ...detailObj,
        _items: enrichedItems,
        _meta: meta,
      });
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleRetrainAI = async () => {
    if (
      !window.confirm(
        'Hệ thống sẽ huấn luyện lại mô hình AI dựa trên các đơn hàng đã hoàn tất mới nhất. Tiếp tục?'
      )
    ) {
      return;
    }
    try {
      setTraining(true);
      try {
        await api.post('/DuBao/train', {}, { timeout: 10000 });
      } catch {
        await axios.post(`${AI_BASE_URL}/forecast/train`, {}, { timeout: 10000 });
      }
      await loadAllData();
      showToast(
        `Huấn luyện lại thành công! Sai số chuẩn MAE: ${modelMetrics.mae} bó • RMSE: ${modelMetrics.rmse} bó`
      );
    } catch {
      showToast('Không kết nối được dịch vụ Python AI để huấn luyện.', 'error');
    } finally {
      setTraining(false);
    }
  };

  const handleExportForecastCSV = () => {
    const header = 'Ma_Hoa,Ten_Bo_Hoa,Ton_Kho_Hien_Tai,AI_Du_Bao_Thang_Toi,De_Xuat_Nhap_Them\n';
    const rows = forecasts
      .map((item, idx) => {
        const stock = item.soLuongTon ?? 15;
        const predicted = Math.round(
          item.duBaoThangToi ?? item.soLuongDuBao ?? item.predictedSales ?? 30
        );
        const importQty =
          item.deXuatNhap ??
          item.soLuongCanNhap ??
          Math.max(0, Math.round(predicted - stock + 10));
        return `${item.maSanPham ?? idx + 1},"${String(item.tenSanPham || '').replace(/"/g, '""')}",${stock},${predicted},${importQty}`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Phieu_Nhap_Hang_AI_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất phiếu đề xuất nhập hàng (.CSV) thành công!');
  };

  const handleSendAdminReply = async (replyText) => {
    const content = typeof replyText === 'string' ? replyText : adminReplyText;
    const targetConvId = activeConversation?.id || selectedConvId;
    if (!content.trim() || !targetConvId || sendingReply) return;

    setSendingReply(true);
    if (typeof replyText !== 'string') {
      setAdminReplyText('');
    }
    try {
      await sendAdminReply(targetConvId, content);
      syncChats();
    } finally {
      setSendingReply(false);
    }
  };

  const openCreateProduct = () => {
    setImageFileName('');
    setProductForm({
      tenSanPham: '',
      maDanhMuc: 1,
      danhMucTrangChu: ['sinh-nhat', 'thiet-ke'],
      giaBan: 450000,
      soLuongTon: 30,
      tongMauSac: 'Hồng Pastel',
      moTa: '',
      hinhAnhChinh: '',
    });
    setProductModal({ mode: 'create' });
  };

  const openEditProduct = (sp) => {
    const existingImg = getFlowerImage(sp);
    setImageFileName(
      String(sp.hinhAnhChinh || sp.hinhAnh || '').startsWith('data:image/')
        ? 'Ảnh đã tải lên từ thiết bị'
        : ''
    );
    setProductForm({
      tenSanPham: sp.tenSanPham || '',
      maDanhMuc: sp.maDanhMuc || 1,
      danhMucTrangChu: Array.isArray(sp.danhMucTrangChu)
        ? sp.danhMucTrangChu
        : ['sinh-nhat', 'thiet-ke'],
      giaBan: sp.giaBan || 450000,
      soLuongTon: sp.soLuongTon ?? 20,
      tongMauSac: sp.tongMauSac || 'Hồng Pastel',
      moTa: sp.moTa || '',
      hinhAnhChinh: existingImg,
    });
    setProductModal({ mode: 'edit', id: sp.maSanPham });
  };

  const handleSelectImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).', 'error');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file, 240, 0.62);
      setImageFileName(file.name);
      setProductForm((prev) => ({
        ...prev,
        hinhAnhChinh: compressedDataUrl,
      }));
    } catch (err) {
      showToast(err.message || 'Không thể xử lý ảnh vừa chọn', 'error');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const cleanName = productForm.tenSanPham.trim();
    const cleanTone = productForm.tongMauSac.trim() || 'Hồng Pastel';
    const cleanImg = (productForm.hinhAnhChinh || '').trim();
    const isBase64Upload = cleanImg.startsWith('data:image/');

    if (!cleanName) {
      showToast('Vui lòng nhập tên bó hoa.', 'error');
      return;
    }

    try {
      setSavingProduct(true);
      const sqlPayload = {
        tenSanPham: cleanName,
        maDanhMuc: Number(productForm.maDanhMuc),
        giaBan: Number(productForm.giaBan),
        soLuongTon: Number(productForm.soLuongTon),
        tongMauSac: cleanTone,
        moTa: productForm.moTa.trim(),
        hinhAnhChinh: isBase64Upload ? '' : cleanImg,
        hinhAnh: isBase64Upload ? '' : cleanImg,
        trangThai: true,
      };

      let savedData = null;

      if (productModal.mode === 'create') {
        const res = await api.post('/SanPham', sqlPayload);
        savedData = res.data;
        showToast(`Đã thêm mẫu hoa "${cleanName}" thành công!`);
      } else {
        const res = await api.put(`/SanPham/${productModal.id}`, {
          ...sqlPayload,
          maSanPham: productModal.id,
        });
        savedData = res.data;
        showToast(`Đã cập nhật & đồng bộ bó hoa "${cleanName}" lên Trang chủ!`);
      }

      const overridePatch = {
        hinhAnhChinh: cleanImg,
        tongMauSac: cleanTone,
        maDanhMuc: Number(productForm.maDanhMuc),
        danhMucTrangChu: Array.isArray(productForm.danhMucTrangChu)
          ? productForm.danhMucTrangChu
          : [],
      };
      const resolvedId =
        productModal.mode === 'edit'
          ? productModal.id
          : savedData?.maSanPham ?? savedData?.MaSanPham;

      if (resolvedId != null) {
        await saveProductOverride(resolvedId, overridePatch);
      }
      await saveProductOverride(`name:${cleanName.toLowerCase()}`, overridePatch);

      setProductModal(null);
      await loadAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể lưu thông tin sản phẩm', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (sp) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${sp.tenSanPham}" không?`)) return;
    try {
      await api.delete(`/SanPham/${sp.maSanPham}`);
      showToast(`Đã xóa "${sp.tenSanPham}"!`);
      await loadAllData();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Không thể xóa sản phẩm đang có trong đơn hàng',
        'error'
      );
    }
  };

  const formatDateOnly = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val).split('T')[0];
    return d.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return `${d.toLocaleTimeString('vi-VN')} ${d.toLocaleDateString('vi-VN')}`;
  };

  const formatShortTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const activeOrders = orders.filter((o) => !orderMetaMap[o.maDonHang]?.deleted);

  const prevMonthKey = shiftYearMonth(selectedMonth, -1);

  const monthlyCompletedOrders = activeOrders.filter((o) => {
    const meta = orderMetaMap[o.maDonHang] || {};
    const st = normalizeAdminOrderStatus(extractRawStatus(o, meta));
    if (st.code !== 'Completed') return false;
    return getOrderYearMonth(o) === selectedMonth;
  });

  const prevMonthlyRevenue = activeOrders
    .filter((o) => {
      const meta = orderMetaMap[o.maDonHang] || {};
      const st = normalizeAdminOrderStatus(extractRawStatus(o, meta));
      return st.code === 'Completed' && getOrderYearMonth(o) === prevMonthKey;
    })
    .reduce((sum, o) => {
      const meta = orderMetaMap[o.maDonHang] || {};
      return sum + (meta.grandTotal ?? o.tongThanhToan ?? o.tongTien ?? 0);
    }, 0);

  const monthlyRevenue = monthlyCompletedOrders.reduce((sum, o) => {
    const meta = orderMetaMap[o.maDonHang] || {};
    return sum + (meta.grandTotal ?? o.tongThanhToan ?? o.tongTien ?? 0);
  }, 0);

  const revenueDiffPercent =
    prevMonthlyRevenue > 0
      ? Math.round(((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100)
      : null;

  // Thống kê khối "Việc cần làm hôm nay"
  const pendingConfirmCount = activeOrders.filter((o) => {
    const meta = orderMetaMap[o.maDonHang] || {};
    return normalizeAdminOrderStatus(extractRawStatus(o, meta)).code === 'Pending';
  }).length;

  const unpaidActiveCount = activeOrders.filter((o) => {
    const meta = orderMetaMap[o.maDonHang] || {};
    const st = normalizeAdminOrderStatus(extractRawStatus(o, meta));
    const isPaid =
      meta.isPaid === true ||
      o.daThanhToan === true ||
      String(o.trangThaiThanhToan || '').toLowerCase().includes('đã thanh toán') ||
      st.code === 'Completed';
    return !isPaid && st.code !== 'Cancelled';
  }).length;

  const inProgressCount = activeOrders.filter((o) => {
    const meta = orderMetaMap[o.maDonHang] || {};
    const st = normalizeAdminOrderStatus(extractRawStatus(o, meta));
    return st.code === 'Pending' || st.code === 'Confirmed' || st.code === 'Shipping';
  }).length;

  const lowStockProductsCount = products.filter(
    (p) => Number(p.soLuongTon ?? 20) <= 10
  ).length;

  const totalUnreadChats = conversations.reduce(
    (sum, c) => sum + (c.unreadByAdmin || 0),
    0
  );

  const oldDummyOrderIds = activeOrders
    .filter((o) => {
      const ym = getOrderYearMonth(o);
      return ym && ym < getCurrentYearMonth();
    })
    .map((o) => o.maDonHang);

  const filteredOrders = activeOrders.filter((o) => {
    const address = String(o.diaChiGiao || o.diaChi || '');
    const meta = orderMetaMap[o.maDonHang] || {};
    const isPickup =
      meta.deliveryMethod === 'pickup' ||
      address.toLowerCase().includes('tới cửa hàng lấy') ||
      String(o.ghiChu || '').toLowerCase().includes('tới tiệm lấy');

    const st = normalizeAdminOrderStatus(extractRawStatus(o, meta), isPickup);
    const isPaid =
      meta.isPaid === true ||
      o.daThanhToan === true ||
      String(o.trangThaiThanhToan || '').toLowerCase().includes('đã thanh toán') ||
      st.code === 'Completed';

    if (statusFilter === 'IN_PROGRESS') {
      if (st.code !== 'Pending' && st.code !== 'Confirmed' && st.code !== 'Shipping') {
        return false;
      }
    } else if (statusFilter === 'UNPAID') {
      if (isPaid || st.code === 'Cancelled') return false;
    } else if (statusFilter !== 'ALL' && st.code !== statusFilter) {
      return false;
    }

    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      const matchId = String(o.maDonHang).includes(q);
      const matchName = String(o.tenNguoiNhan || '').toLowerCase().includes(q);
      const matchPhone = String(o.sdtNguoiNhan || o.soDienThoaiNhan || '').includes(q);
      return matchId || matchName || matchPhone;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

  const pageOrderIds = paginatedOrders.map((o) => o.maDonHang);
  const isAllPageSelected =
    pageOrderIds.length > 0 && pageOrderIds.every((id) => selectedOrderIds.includes(id));

  const toggleSelectPageOrders = () => {
    if (isAllPageSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !pageOrderIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...pageOrderIds])));
    }
  };

  const toggleSelectOneOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const filteredProducts = products.filter((sp) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.trim().toLowerCase();
    return (
      String(sp.tenSanPham || '').toLowerCase().includes(q) ||
      String(sp.tongMauSac || '').toLowerCase().includes(q)
    );
  });

  const topForecastItem = forecasts[0];
  const topForecastImport = topForecastItem
    ? topForecastItem.deXuatNhap ??
      topForecastItem.soLuongCanNhap ??
      Math.max(
        0,
        Math.round(
          (topForecastItem.duBaoThangToi ?? topForecastItem.soLuongDuBao ?? 16) -
            (topForecastItem.soLuongTon ?? 15) +
            10
        )
      )
    : 11;

  if (!user) {
    return (
      <div className="container" style={{ marginTop: 48 }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <h2>Vui lòng đăng nhập bằng tài khoản Quản trị (Admin)</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: 22, marginBottom: 48 }}>
      <style>{`
        .thx-admin-chat-grid {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          min-height: 520px;
        }
        .thx-todo-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .thx-todo-card {
          background: #ffffff;
          border: 1.5px solid #f3f4f6;
          border-radius: 14px;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .thx-todo-card:hover {
          border-color: #fecdd3;
          background: #fffafb;
        }
        .thx-nowrap {
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .thx-admin-chat-grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }
        }
      `}</style>

      {/* Header Admin */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div>
          <span
            style={{
              color: '#e11d48',
              fontWeight: 700,
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Hệ thống quản trị nội bộ
          </span>
          <h1 style={{ fontSize: '1.85rem', marginTop: 2 }}>
            Quản Trị Cửa Hàng &amp; Dự Báo Nhập Hàng AI
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              loadAllData();
              syncChatsFromCloud().then(() => syncChats());
            }}
            disabled={loading || loadingOrders}
            className="btn btn-outline"
            title="Tải lại dữ liệu mới nhất"
          >
            <RefreshCw size={15} />
            <span>
              {loading || loadingOrders
                ? 'Đang tải...'
                : lastUpdatedLabel
                ? `Cập nhật lúc ${lastUpdatedLabel}`
                : 'Làm mới'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRetrainAI}
            disabled={training}
            className="btn btn-primary"
          >
            <Sparkles size={15} />
            <span>{training ? 'Đang huấn luyện AI...' : 'Huấn luyện lại mô hình AI'}</span>
          </button>
        </div>
      </div>

      {apiError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '13px 16px',
            borderRadius: 14,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={19} style={{ flexShrink: 0 }} />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={loadOrdersOnly}
            disabled={loadingOrders}
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            {loadingOrders ? 'Đang thử lại...' : 'Thử kết nối lại'}
          </button>
        </div>
      )}

      {/* Khối "Việc cần làm hôm nay" (Thế chỗ thanh Hotline cố định) */}
      <div className="thx-todo-strip">
        <button
          type="button"
          onClick={() => {
            setActiveTab('orders');
            setStatusFilter('Pending');
          }}
          className="thx-todo-card"
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>
              Đơn chờ xác nhận
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: 2 }}>
              {pendingConfirmCount} đơn
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: pendingConfirmCount > 0 ? '#fef3c7' : '#f3f4f6',
              color: pendingConfirmCount > 0 ? '#92400e' : '#6b7280',
            }}
          >
            Xử lý ngay &rarr;
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('orders');
            setStatusFilter('UNPAID');
          }}
          className="thx-todo-card"
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>
              Chờ thu tiền / VietQR
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: 2 }}>
              {unpaidActiveCount} đơn
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: unpaidActiveCount > 0 ? '#fff1f2' : '#f3f4f6',
              color: unpaidActiveCount > 0 ? '#be123c' : '#6b7280',
            }}
          >
            Kiểm tra &rarr;
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className="thx-todo-card"
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>
              Mẫu hoa tồn thấp (&le;10)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: 2 }}>
              {lowStockProductsCount} mẫu
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: lowStockProductsCount > 0 ? '#fef3c7' : '#dcfce7',
              color: lowStockProductsCount > 0 ? '#92400e' : '#166534',
            }}
          >
            Xem kho &rarr;
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('messages');
            syncChatsFromCloud().then(() => syncChats());
          }}
          className="thx-todo-card"
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>
              Tin nhắn khách chưa đọc
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: 2 }}>
              {totalUnreadChats} tin mới
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              background: totalUnreadChats > 0 ? '#dcfce7' : '#f3f4f6',
              color: totalUnreadChats > 0 ? '#166534' : '#6b7280',
            }}
          >
            Trả lời &rarr;
          </span>
        </button>
      </div>

      {/* 4 Thẻ KPI chuẩn tiếng Việt */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div className="panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#fff1f2',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DollarSign size={23} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>
                Doanh thu {formatYearMonthVN(selectedMonth)}
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftYearMonth(m, -1))}
                  title="Tháng trước"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: '1px solid #fecdd3',
                    background: '#fff1f2',
                    color: '#be123c',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftYearMonth(m, 1))}
                  title="Tháng sau"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: '1px solid #fecdd3',
                    background: '#fff1f2',
                    color: '#be123c',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div
              className="thx-nowrap"
              style={{ fontSize: '1.38rem', fontWeight: 800, color: '#e11d48', margin: '4px 0' }}
            >
              {formatVND(monthlyRevenue)}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              ✓ {monthlyCompletedOrders.length} đơn hoàn tất
              {revenueDiffPercent !== null && (
                <span style={{ marginLeft: 6 }}>
                  ({revenueDiffPercent >= 0 ? `▲ +${revenueDiffPercent}%` : `▼ ${revenueDiffPercent}%`} vs tháng trước)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
              Tổng đơn hàng hiện có
            </div>
            <div style={{ fontSize: '1.38rem', fontWeight: 800, margin: '3px 0' }}>
              {loadingOrders && activeOrders.length === 0 ? 'Đang tải...' : `${activeOrders.length} đơn`}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                setStatusFilter('IN_PROGRESS');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: '0.76rem',
                color: inProgressCount > 0 ? '#d97706' : '#16a34a',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: inProgressCount > 0 ? 'underline' : 'none',
              }}
            >
              {inProgressCount > 0
                ? `Đang xử lý: ${inProgressCount} đơn (Bấm để lọc)`
                : 'Đã xử lý toàn bộ đơn'}
            </button>
          </div>
        </div>

        <div className="panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
              Sản phẩm đang mở bán
            </div>
            <div style={{ fontSize: '1.38rem', fontWeight: 800, margin: '3px 0' }}>
              {products.length} sản phẩm
            </div>
            <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
              Thuộc {FLOWER_CATEGORIES.length} nhóm kiểu dáng hoa
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
              Mô hình AI dự báo nhập hàng
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '3px 0' }}>
              {modelMetrics.modelName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Sai số TB: <b>±{modelMetrics.mae} bó</b> (RMSE: {modelMetrics.rmse})
            </div>
          </div>
        </div>
      </div>

      {/* Thanh chuyển 6 Tab (Đặt 2 tab AI đứng cạnh nhau + Tab Cài đặt) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          <ShoppingBag size={15} /> Quản lý Đơn hàng ({activeOrders.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('messages');
            syncChatsFromCloud().then(() => syncChats());
          }}
          className={activeTab === 'messages' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          <MessageCircle size={15} />
          <span>Tin nhắn khách hàng ({conversations.length})</span>
          {totalUnreadChats > 0 && (
            <span
              style={{
                background: activeTab === 'messages' ? '#ffffff' : '#16a34a',
                color: activeTab === 'messages' ? '#e11d48' : '#ffffff',
                borderRadius: 999,
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: 700,
                marginLeft: 4,
              }}
            >
              {totalUnreadChats} mới
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={activeTab === 'products' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          <Package size={15} /> Quản lý Sản phẩm ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('forecast')}
          className={activeTab === 'forecast' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          <Sparkles size={15} /> Dự báo nhập hàng AI
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('charts')}
          className={activeTab === 'charts' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          <BarChart3 size={15} /> Biểu đồ &amp; Đối chiếu mô hình
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          <Settings size={15} /> Cài đặt
        </button>
      </div>

      {/* TAB 1: QUẢN LÝ ĐƠN HÀNG */}
      {activeTab === 'orders' && (
        <div className="panel" style={{ padding: 22 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Danh Sách Đơn Hàng Khách Đặt</h2>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedOrderIds.length > 0 && (
                <button
                  type="button"
                  disabled={deletingOrders}
                  onClick={() =>
                    handleBulkDeleteOrders(
                      selectedOrderIds,
                      `${selectedOrderIds.length} đơn đang chọn`
                    )
                  }
                  className="btn btn-primary btn-sm"
                  style={{ background: '#dc2626' }}
                >
                  <Trash2 size={14} />
                  <span>
                    {deletingOrders
                      ? 'Đang xóa...'
                      : `Xóa (${selectedOrderIds.length}) đơn đã chọn`}
                  </span>
                </button>
              )}

              {oldDummyOrderIds.length > 0 && (
                <button
                  type="button"
                  disabled={deletingOrders}
                  onClick={() =>
                    handleBulkDeleteOrders(
                      oldDummyOrderIds,
                      `toàn bộ ${oldDummyOrderIds.length} đơn mẫu cũ`
                    )
                  }
                  className="btn btn-outline btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fecaca' }}
                >
                  <Trash2 size={14} />
                  <span>Xóa {oldDummyOrderIds.length} đơn cũ</span>
                </button>
              )}

              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  color="#9ca3af"
                  style={{ position: 'absolute', left: 11, top: 11 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm mã đơn, tên khách, SĐT..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{ paddingLeft: 34, height: 38, fontSize: '0.86rem', width: 250 }}
                />
              </div>

              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: 38, fontSize: '0.86rem', width: 215 }}
              >
                <option value="ALL">Tất cả trạng thái ({activeOrders.length})</option>
                <option value="IN_PROGRESS">Đang xử lý ({inProgressCount})</option>
                <option value="UNPAID">Chờ thu tiền ({unpaidActiveCount})</option>
                <option value="Pending">Chờ xác nhận</option>
                <option value="Confirmed">Đang cắm hoa</option>
                <option value="Shipping">Shipper đang giao / Sẵn sàng</option>
                <option value="Completed">Đã giao / Đã nhận hoa</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.89rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid #f3f4f6',
                    textAlign: 'left',
                    color: '#6b7280',
                    fontSize: '0.8rem',
                  }}
                >
                  <th style={{ padding: '12px 8px', width: 32 }}>
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả đơn trên trang"
                      checked={isAllPageSelected}
                      onChange={toggleSelectPageOrders}
                      style={{ cursor: 'pointer', width: 15, height: 15 }}
                    />
                  </th>
                  <th className="thx-nowrap" style={{ padding: '12px 8px' }}>Mã Đơn</th>
                  <th style={{ padding: '12px 10px' }}>Khách nhận &amp; Hình thức</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Ngày đặt / Giao</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Tổng tiền</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Thanh toán</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Trạng thái</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                      {loadingOrders
                        ? 'Đang tải danh sách đơn hàng...'
                        : 'Không tìm thấy đơn hàng nào phù hợp với điều kiện lọc.'}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const meta = orderMetaMap[order.maDonHang] || {};
                    const address =
                      order.diaChiGiao || order.diaChiGiaoHang || order.diaChi || '';
                    const isPickup =
                      meta.deliveryMethod === 'pickup' ||
                      address.toLowerCase().includes('tới cửa hàng lấy') ||
                      String(order.ghiChu || '').toLowerCase().includes('tới tiệm lấy');

                    const st = normalizeAdminOrderStatus(
                      extractRawStatus(order, meta),
                      isPickup
                    );

                    const rawPayment =
                      meta.paymentMethod ||
                      order.phuongThucThanhToan ||
                      order.hinhThucThanhToan ||
                      'VietQR';
                    const isVietQR = rawPayment.toLowerCase().includes('qr');
                    const isPaid =
                      meta.isPaid === true ||
                      order.daThanhToan === true ||
                      String(order.trangThaiThanhToan || '')
                        .toLowerCase()
                        .includes('đã thanh toán') ||
                      st.code === 'Completed';

                    const totalMoney =
                      meta.grandTotal ?? order.tongThanhToan ?? order.tongTien ?? 0;
                    const isChecked = selectedOrderIds.includes(order.maDonHang);
                    const isMenuOpen = openMenuOrderId === order.maDonHang;

                    return (
                      <tr
                        key={order.maDonHang}
                        style={{
                          borderBottom: '1px solid #f3f4f6',
                          verticalAlign: 'middle',
                          background: isChecked ? '#fff1f2' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 8px' }}>
                          <input
                            type="checkbox"
                            aria-label={`Chọn đơn #${order.maDonHang}`}
                            checked={isChecked}
                            onChange={() => toggleSelectOneOrder(order.maDonHang)}
                            style={{ cursor: 'pointer', width: 15, height: 15 }}
                          />
                        </td>

                        <td className="thx-nowrap" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          #{order.maDonHang}
                        </td>

                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#111827' }}>
                            {order.tenNguoiNhan || 'Khách hàng'}
                            {order.sdtNguoiNhan && (
                              <a
                                href={`tel:${order.sdtNguoiNhan}`}
                                style={{
                                  color: '#4b5563',
                                  fontWeight: 500,
                                  textDecoration: 'none',
                                  marginLeft: 5,
                                }}
                              >
                                ({order.sdtNguoiNhan})
                              </a>
                            )}
                          </div>
                          <div
                            className="thx-nowrap"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.76rem',
                              marginTop: 3,
                              color: isPickup ? '#15803d' : '#be123c',
                              fontWeight: 600,
                            }}
                          >
                            {isPickup ? <Store size={12} /> : <Truck size={12} />}
                            <span>
                              {isPickup
                                ? 'Tới tiệm lấy (0 đ ship)'
                                : meta.distanceKm
                                ? `Ship tận nơi (${meta.distanceKm} km)`
                                : 'Ship tận nơi'}
                            </span>
                          </div>
                        </td>

                        <td className="thx-nowrap" style={{ padding: '12px 10px', fontSize: '0.82rem', color: '#4b5563' }}>
                          <div>Đặt: {formatDateOnly(order.ngayDat)}</div>
                          {order.ngayGiao && (
                            <div style={{ fontWeight: 700, color: '#111827', marginTop: 2 }}>
                              Giao: {formatDateOnly(order.ngayGiao)}
                            </div>
                          )}
                        </td>

                        <td
                          className="thx-nowrap"
                          style={{ padding: '12px 10px', fontWeight: 800, color: '#111827' }}
                        >
                          {formatVND(totalMoney)}
                        </td>

                        <td className="thx-nowrap" style={{ padding: '12px 10px' }}>
                          <div style={{ fontSize: '0.79rem', fontWeight: 600, color: '#374151' }}>
                            {isVietQR ? 'Online (VietQR)' : 'Tiền mặt (COD)'}
                          </div>
                          <span
                            className="thx-nowrap"
                            style={{
                              display: 'inline-block',
                              marginTop: 3,
                              padding: '2px 9px',
                              borderRadius: 999,
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              background: isPaid ? '#dcfce7' : '#fef3c7',
                              color: isPaid ? '#166534' : '#92400e',
                            }}
                          >
                            {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </td>

                        <td className="thx-nowrap" style={{ padding: '12px 10px' }}>
                          <select
                            aria-label={`Trạng thái đơn #${order.maDonHang}`}
                            value={st.code}
                            onChange={(e) =>
                              handleChangeOrderStatus(order, e.target.value, isPickup, true)
                            }
                            style={{
                              background: st.bg,
                              color: st.color,
                              border: `1.5px solid ${st.border}`,
                              borderRadius: 999,
                              padding: '6px 12px',
                              fontSize: '0.79rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              outline: 'none',
                              minWidth: 168,
                            }}
                          >
                            <option value="Pending" disabled={st.step > 0}>
                              Chờ xác nhận
                            </option>
                            <option value="Confirmed" disabled={st.step > 1}>
                              Đang cắm hoa
                            </option>
                            <option value="Shipping" disabled={st.step > 2}>
                              {isPickup ? 'Sẵn sàng tại tiệm' : 'Shipper đang giao'}
                            </option>
                            <option value="Completed">
                              {isPickup ? 'Khách đã nhận hoa' : 'Đã giao thành công'}
                            </option>
                            <option value="Cancelled">Đã hủy</option>
                          </select>
                        </td>

                        {/* 1 nút hành động chính theo tình huống + menu ⋯ */}
                        <td className="thx-nowrap" style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              gap: 6,
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              position: 'relative',
                            }}
                          >
                            {st.code === 'Pending' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleChangeOrderStatus(order, 'Confirmed', isPickup, false)
                                }
                                className="btn btn-primary btn-sm"
                              >
                                Xác nhận
                              </button>
                            )}

                            {st.code === 'Confirmed' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleChangeOrderStatus(order, 'Shipping', isPickup, false)
                                }
                                className="btn btn-primary btn-sm"
                              >
                                {isPickup ? 'Sẵn sàng lấy' : 'Giao Shipper'}
                              </button>
                            )}

                            {st.code === 'Shipping' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleChangeOrderStatus(order, 'Completed', isPickup, true)
                                }
                                className="btn btn-sage btn-sm"
                              >
                                <Check size={14} /> Hoàn tất
                              </button>
                            )}

                            {(st.code === 'Completed' || st.code === 'Cancelled') && !isPaid && st.code !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmPayment(order)}
                                className="btn btn-outline btn-sm"
                              >
                                <CreditCard size={14} /> Thu tiền
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={loadingDetailId === order.maDonHang}
                              onClick={() => handleOpenOrderDetail(order)}
                              className="btn btn-outline btn-sm"
                            >
                              <Eye size={14} />
                              <span>Chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuOrderId(isMenuOpen ? null : order.maDonHang)
                              }
                              aria-label="Thao tác khác"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '6px 8px' }}
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {isMenuOpen && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  marginTop: 4,
                                  minWidth: 165,
                                  background: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 12,
                                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.14)',
                                  padding: 6,
                                  zIndex: 50,
                                  textAlign: 'left',
                                }}
                              >
                                {!isPaid && st.code !== 'Cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmPayment(order)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: 8,
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      color: '#166534',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 7,
                                    }}
                                  >
                                    <CreditCard size={14} />
                                    <span>Xác nhận thu tiền</span>
                                  </button>
                                )}

                                {st.code !== 'Cancelled' && st.code !== 'Completed' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeOrderStatus(order, 'Cancelled', isPickup, true)
                                    }
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      background: 'transparent',
                                      border: 'none',
                                      borderRadius: 8,
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      color: '#4b5563',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 7,
                                    }}
                                  >
                                    <X size={14} />
                                    <span>Hủy đơn hàng</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={deletingOrders}
                                  onClick={() => handleDeleteSingleOrder(order)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>Xóa vĩnh viễn</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredOrders.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid #f3f4f6',
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              <div>
                Hiển thị <b>{startIndex + 1}</b>–
                <b>{Math.min(startIndex + PAGE_SIZE, filteredOrders.length)}</b> trên tổng{' '}
                <b>{filteredOrders.length}</b> đơn hàng
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="btn btn-outline btn-sm"
                >
                  <ChevronLeft size={15} /> Trước
                </button>
                <span style={{ fontWeight: 600, color: '#111827', padding: '0 6px' }}>
                  Trang {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-outline btn-sm"
                >
                  Sau <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIN NHẮN KHÁCH HÀNG */}
      {activeTab === 'messages' && (
        <div
          className="panel thx-admin-chat-grid"
          style={{
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              borderRight: '1px solid #f3f4f6',
              background: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 18px',
                borderBottom: '1px solid #f3f4f6',
                fontWeight: 700,
                fontSize: '1.05rem',
              }}
            >
              Hộp Thoại Khách Hàng ({conversations.length})
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: '0.88rem' }}>
                  Chưa có khách hàng nào gửi tin nhắn.
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = activeConversation?.id === conv.id;
                  const lastMsg = conv.messages?.[conv.messages.length - 1];
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        markConversationReadByAdmin(conv.id);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        background: isSelected ? '#fff1f2' : 'transparent',
                        borderLeft: isSelected
                          ? '4px solid #e11d48'
                          : '4px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>
                          {conv.customerName}
                        </span>
                        <span style={{ fontSize: '0.73rem', color: '#9ca3af' }}>
                          {formatShortTime(conv.updatedAt)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.82rem',
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lastMsg
                            ? `${lastMsg.sender === 'admin' ? 'Bạn: ' : ''}${lastMsg.text}`
                            : 'Bắt đầu trò chuyện'}
                        </span>

                        {conv.unreadByAdmin > 0 && (
                          <span
                            style={{
                              background: '#e11d48',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: 999,
                              padding: '1px 7px',
                              flexShrink: 0,
                            }}
                          >
                            {conv.unreadByAdmin}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
            {activeConversation ? (
              <>
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {activeConversation.customerName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      Email: {activeConversation.customerEmail}
                      {activeConversation.customerPhone
                        ? ` • SĐT: ${activeConversation.customerPhone}`
                        : ''}
                    </div>
                  </div>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#166534',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 999,
                    }}
                  >
                    Đang đồng bộ trực tuyến
                  </span>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: 20,
                    overflowY: 'auto',
                    background: '#fffafb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    maxHeight: 340,
                  }}
                >
                  {(activeConversation.messages || []).map((m) => {
                    const isAdminMsg = m.sender === 'admin';
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '72%',
                            padding: '10px 14px',
                            borderRadius: isAdminMsg
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            background: isAdminMsg ? '#e11d48' : '#ffffff',
                            color: isAdminMsg ? '#ffffff' : '#1f2937',
                            border: isAdminMsg ? 'none' : '1px solid #e5e7eb',
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {m.text}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
                          {isAdminMsg ? 'Admin' : activeConversation.customerName} &bull;{' '}
                          {formatShortTime(m.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={adminChatEndRef} />
                </div>

                <div
                  style={{
                    padding: '8px 16px',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    background: '#fafafa',
                  }}
                >
                  {ADMIN_QUICK_REPLIES.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      disabled={sendingReply}
                      onClick={() => handleSendAdminReply(tpl)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: '#ffffff',
                        color: '#be123c',
                        border: '1px solid #fecdd3',
                        cursor: 'pointer',
                      }}
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAdminReply();
                  }}
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập nội dung phản hồi cho khách hàng..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply}
                    className="btn btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Send size={16} />
                    <span>{sendingReply ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                  </button>
                </form>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  padding: 32,
                }}
              >
                Chọn một khách hàng ở danh sách bên trái để xem và trả lời tin nhắn.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ SẢN PHẨM */}
      {activeTab === 'products' && (
        <div className="panel" style={{ padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
              Danh Mục Hoa Tươi ({filteredProducts.length})
            </h2>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  color="#9ca3af"
                  style={{ position: 'absolute', left: 11, top: 11 }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm tên hoa, tông màu..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ paddingLeft: 34, height: 36, fontSize: '0.86rem', width: 220 }}
                />
              </div>

              <button type="button" onClick={openCreateProduct} className="btn btn-primary btn-sm">
                <Plus size={16} /> Thêm mẫu hoa mới
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid #f3f4f6',
                    textAlign: 'left',
                    color: '#6b7280',
                    fontSize: '0.82rem',
                  }}
                >
                  <th style={{ padding: '12px 10px' }}>Hình ảnh</th>
                  <th style={{ padding: '12px 10px' }}>Tên bó hoa</th>
                  <th style={{ padding: '12px 10px' }}>Kiểu dáng</th>
                  <th style={{ padding: '12px 10px' }}>Tông màu</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Giá bán</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Tồn kho</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((sp) => {
                  const catName =
                    sp.tenDanhMuc ||
                    FLOWER_CATEGORIES.find((c) => c.id === sp.maDanhMuc)?.name ||
                    'Bó hoa tươi nghệ thuật';
                  return (
                    <tr key={sp.maSanPham} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px' }}>
                        <img
                          src={getFlowerImage(sp)}
                          alt={sp.tenSanPham}
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 10,
                            objectFit: 'cover',
                            border: '1px solid #f3f4f6',
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{sp.tenSanPham}</td>
                      <td style={{ padding: '10px', color: '#4b5563', fontSize: '0.84rem' }}>
                        {catName}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          className="thx-nowrap"
                          style={{
                            background: '#fff1f2',
                            color: '#be123c',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {sp.tongMauSac || 'Hồng Pastel'}
                        </span>
                      </td>
                      <td className="thx-nowrap" style={{ padding: '10px', fontWeight: 700, color: '#111827' }}>
                        {formatVND(sp.giaBan)}
                      </td>
                      <td className="thx-nowrap" style={{ padding: '10px' }}>{sp.soLuongTon} bó</td>
                      <td className="thx-nowrap" style={{ padding: '10px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => openEditProduct(sp)}
                            className="btn btn-outline btn-sm"
                          >
                            <Edit2 size={14} /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(sp)}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#e11d48' }}
                            title="Xóa mẫu hoa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DỰ BÁO NHẬP HÀNG AI */}
      {activeTab === 'forecast' && (
        <div className="panel" style={{ padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                Bảng Khuyến Nghị Nhập Hàng Tháng Tới (AI Linear Regression)
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#6b7280', marginTop: 4 }}>
                Phân tích dữ liệu tiêu thụ 24 tháng kết hợp tồn kho hiện tại để đề xuất số lượng nhập tối ưu.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportForecastCSV}
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#fecdd3', color: '#be123c' }}
            >
              <Download size={15} />
              <span>Xuất phiếu nhập hàng (.CSV)</span>
            </button>
          </div>

          {topForecastItem && (
            <div
              style={{
                background: '#fffafb',
                border: '1px solid #fecdd3',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 18,
                fontSize: '0.88rem',
                color: '#881337',
              }}
            >
              💡 <b>Khuyến nghị nhanh từ AI:</b> Tháng tới nên ưu tiên nhập thêm khoảng{' '}
              <b>+{Math.round(topForecastImport)} bó {topForecastItem.tenSanPham}</b> để đáp ứng nhu cầu tăng cao.
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid #f3f4f6',
                    textAlign: 'left',
                    color: '#6b7280',
                    fontSize: '0.82rem',
                  }}
                >
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Mã Hoa</th>
                  <th style={{ padding: '12px 10px' }}>Tên Bó Hoa</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Tồn hiện tại</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>AI dự báo nhu cầu</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Đề xuất nhập thêm</th>
                  <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Trạng thái kho</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((item, idx) => {
                  const stock = item.soLuongTon ?? 15;
                  const predicted =
                    item.duBaoThangToi ?? item.soLuongDuBao ?? item.predictedSales ?? 30;
                  const importQty =
                    item.deXuatNhap ??
                    item.soLuongCanNhap ??
                    Math.max(0, Math.round(predicted - stock + 10));
                  const lowStock = importQty > 15;

                  return (
                    <tr
                      key={item.maSanPham ?? idx}
                      style={{ borderBottom: '1px solid #f3f4f6' }}
                    >
                      <td className="thx-nowrap" style={{ padding: '12px 10px', fontWeight: 600 }}>
                        #{item.maSanPham ?? idx + 1}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                        {item.tenSanPham}
                      </td>
                      <td className="thx-nowrap" style={{ padding: '12px 10px' }}>{stock} bó</td>
                      <td className="thx-nowrap" style={{ padding: '12px 10px', fontWeight: 600, color: '#2563eb' }}>
                        {Math.round(predicted)} bó
                      </td>
                      <td className="thx-nowrap" style={{ padding: '12px 10px', fontWeight: 700, color: '#e11d48' }}>
                        +{Math.round(importQty)} bó
                      </td>
                      <td className="thx-nowrap" style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: lowStock ? '#fee2e2' : '#dcfce7',
                            color: lowStock ? '#b91c1c' : '#166534',
                          }}
                        >
                          {lowStock ? 'Cần nhập gấp' : 'Tồn kho an toàn'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BIỂU ĐỒ & ĐỐI CHIẾU MÔ HÌNH */}
      {activeTab === 'charts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22 }}>
          <div className="panel" style={{ padding: 24 }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: 6 }}>
              Biểu Đồ Top Bó Hoa Đề Xuất Nhập Tháng Tới
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#6b7280', marginBottom: 14 }}>
              So sánh trực quan giữa tồn kho hiện tại và sản lượng dự báo từ mô hình AI.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 18,
                fontSize: '0.78rem',
              }}
            >
              <span style={{ background: '#fff1f2', color: '#be123c', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
                📅 Mốc cao điểm: 14/2 (Valentine)
              </span>
              <span style={{ background: '#fff1f2', color: '#be123c', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
                📅 8/3 (Quốc tế Phụ nữ)
              </span>
              <span style={{ background: '#fff1f2', color: '#be123c', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
                📅 20/10 (Phụ nữ Việt Nam)
              </span>
              <span style={{ background: '#fff1f2', color: '#be123c', padding: '4px 10px', borderRadius: 999, fontWeight: 600 }}>
                📅 20/11 (Nhà giáo Việt Nam)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {forecasts.slice(0, 6).map((item, idx) => {
                const predicted = Math.round(
                  item.duBaoThangToi ?? item.soLuongDuBao ?? item.predictedSales ?? 30
                );
                const stock = item.soLuongTon ?? 15;
                const maxVal = 60;
                const predPct = Math.min(100, Math.round((predicted / maxVal) * 100));
                const stockPct = Math.min(100, Math.round((stock / maxVal) * 100));

                return (
                  <div key={item.maSanPham ?? idx}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.88rem',
                        marginBottom: 4,
                      }}
                    >
                      <b>{item.tenSanPham}</b>
                      <span style={{ color: '#6b7280' }}>
                        Tồn: <b>{stock}</b> bó &bull; Dự báo bán:{' '}
                        <b style={{ color: '#e11d48' }}>{predicted}</b> bó
                      </span>
                    </div>
                    <div
                      style={{
                        height: 12,
                        background: '#f3f4f6',
                        borderRadius: 999,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: `${predPct}%`,
                          height: '100%',
                          background: '#fb7185',
                          borderRadius: 999,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: `${stockPct}%`,
                          height: '100%',
                          background: '#16a34a',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 18,
                marginTop: 14,
                fontSize: '0.82rem',
                color: '#4b5563',
              }}
            >
              <span>🟢 Tồn kho hiện tại</span>
              <span>🌸 Sản lượng AI dự báo tháng tới</span>
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: 14 }}>
              Đối Chiếu Độ Chính Xác Các Mô Hình Học Máy
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: 12 }}>Thuật toán</th>
                  <th style={{ padding: 12 }}>Sai số tuyệt đối (MAE)</th>
                  <th style={{ padding: 12 }}>Sai số toàn phương (RMSE)</th>
                  <th style={{ padding: 12 }}>Kết luận triển khai</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fff1f2' }}>
                  <td style={{ padding: 12, fontWeight: 700 }}>
                    Linear Regression (Mô hình được chọn)
                  </td>
                  <td style={{ padding: 12, fontWeight: 700, color: '#16a34a' }}>
                    {modelMetrics.mae} bó
                  </td>
                  <td style={{ padding: 12, fontWeight: 700, color: '#16a34a' }}>
                    {modelMetrics.rmse} bó
                  </td>
                  <td style={{ padding: 12, fontWeight: 600, color: '#be123c' }}>
                    Sai số thấp nhất, tối ưu cho chuỗi thời gian 24 tháng
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 12 }}>Random Forest Regressor</td>
                  <td style={{ padding: 12 }}>{modelMetrics.rfMae} bó</td>
                  <td style={{ padding: 12 }}>{modelMetrics.rfRmse} bó</td>
                  <td style={{ padding: 12, color: '#6b7280' }}>Mô hình học máy đối chứng</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}>Trung bình trượt 3 tháng (Mốc cơ bản)</td>
                  <td style={{ padding: 12 }}>3.85 bó</td>
                  <td style={{ padding: 12 }}>4.62 bó</td>
                  <td style={{ padding: 12, color: '#6b7280' }}>Mốc thống kê truyền thống</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CÀI ĐẶT CỬA HÀNG (Chứa cấu hình Hotline) */}
      {activeTab === 'settings' && (
        <div className="panel" style={{ padding: 24, maxWidth: 680 }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: 6 }}>Cài Đặt Hệ Thống Cửa Hàng</h2>
          <p style={{ fontSize: '0.86rem', color: '#6b7280', marginBottom: 20 }}>
            Cấu hình thông tin liên hệ hiển thị trực tiếp cho khách hàng trên toàn bộ trang web.
          </p>

          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: '#fffafb',
              border: '1px solid #fecdd3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: '#e11d48',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#111827' }}>
                  Số Hotline Tư Vấn Nhanh
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Đồng bộ tự động sang nút gọi nhanh trên điện thoại và chân trang khách hàng
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const saved = saveHotlineNumber(hotlineInput);
                setHotlineInput(saved);
                showToast(`Đã cập nhật số Hotline tư vấn thành: ${saved}`);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
            >
              <input
                type="text"
                className="form-control"
                required
                placeholder="Nhập số Hotline (VD: 0366 492 809)"
                value={hotlineInput}
                onChange={(e) => setHotlineInput(e.target.value)}
                style={{ height: 40, width: 230, fontWeight: 700, color: '#be123c' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: 40 }}>
                <Check size={15} />
                <span>Lưu Hotline</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Khung Chi tiết đơn hàng */}
      {selectedOrder && (() => {
        const meta = selectedOrder._meta || {};
        const address =
          selectedOrder.diaChiGiao || selectedOrder.diaChiGiaoHang || selectedOrder.diaChi || '';
        const isPickup =
          meta.deliveryMethod === 'pickup' ||
          address.toLowerCase().includes('tới cửa hàng lấy') ||
          String(selectedOrder.ghiChu || '').toLowerCase().includes('tới tiệm lấy');

        const st = normalizeAdminOrderStatus(
          extractRawStatus(selectedOrder, meta),
          isPickup
        );

        const rawPayment =
          meta.paymentMethod ||
          selectedOrder.phuongThucThanhToan ||
          selectedOrder.hinhThucThanhToan ||
          'VietQR';
        const isVietQR = rawPayment.toLowerCase().includes('qr');
        const isPaid =
          meta.isPaid === true ||
          selectedOrder.daThanhToan === true ||
          String(selectedOrder.trangThaiThanhToan || '')
            .toLowerCase()
            .includes('đã thanh toán') ||
          st.code === 'Completed';

        const itemsSubtotal = (selectedOrder._items || []).reduce(
          (sum, it) => sum + (it._lineTotal || 0),
          0
        );
        const grandTotal =
          meta.grandTotal ?? selectedOrder.tongThanhToan ?? selectedOrder.tongTien ?? itemsSubtotal;
        const shippingFee =
          typeof meta.shippingFee === 'number'
            ? meta.shippingFee
            : Math.max(0, grandTotal - itemsSubtotal);

        return (
          <div className="modal-backdrop">
            <div
              className="modal-box"
              style={{
                maxWidth: 640,
                width: '94%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                padding: 28,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                title="Đóng"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 6,
                }}
              >
                <h2 style={{ fontSize: '1.45rem' }}>Chi Tiết Đơn Hàng #{selectedOrder.maDonHang}</h2>
                <span
                  style={{
                    background: st.bg,
                    color: st.color,
                    border: `1px solid ${st.border}`,
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {st.label}
                </span>
              </div>

              {selectedOrder.ngayDat && (
                <div style={{ fontSize: '0.84rem', color: '#6b7280', marginBottom: 16 }}>
                  Thời gian đặt đơn: <b>{formatDateTime(selectedOrder.ngayDat)}</b>
                </div>
              )}

              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: '0.9rem',
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <User size={15} color="#e11d48" />
                  <span>
                    Người nhận: <b>{selectedOrder.tenNguoiNhan || 'Khách hàng'}</b>
                  </span>
                  {selectedOrder.sdtNguoiNhan && (
                    <a
                      href={`tel:${selectedOrder.sdtNguoiNhan}`}
                      style={{
                        color: '#be123c',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Phone size={14} /> ({selectedOrder.sdtNguoiNhan})
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPickup ? <Store size={15} color="#16a34a" /> : <Truck size={15} color="#e11d48" />}
                  <span>
                    Hình thức nhận:{' '}
                    <b style={{ color: isPickup ? '#15803d' : '#be123c' }}>
                      {isPickup
                        ? 'Tới tiệm lấy trực tiếp (0 đ ship)'
                        : meta.distanceKm
                        ? `Ship tận nơi (${meta.distanceKm} km)`
                        : 'Ship tận nơi'}
                    </b>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <MapPin size={15} color="#e11d48" style={{ marginTop: 3, flexShrink: 0 }} />
                  <span>
                    Địa chỉ: <b>{address || 'Chưa cập nhật'}</b>
                  </span>
                </div>

                {(selectedOrder.ngayGiao || selectedOrder.khungGioGiao) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={15} color="#e11d48" />
                    <span>
                      Thời gian giao:{' '}
                      <b>
                        {formatDateOnly(selectedOrder.ngayGiao)}
                        {selectedOrder.khungGioGiao ? ` • ${selectedOrder.khungGioGiao}` : ''}
                      </b>
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={15} color="#e11d48" />
                  <span>
                    Thanh toán:{' '}
                    <b>{isVietQR ? 'Chuyển khoản Online (VietQR)' : 'Tiền mặt khi nhận hàng (COD)'}</b>{' '}
                    —{' '}
                    <span style={{ color: isPaid ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </span>
                </div>

                {selectedOrder.ghiChu && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Gift size={15} color="#e11d48" style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>
                      Lời chúc &amp; ghi chú: <i>"{selectedOrder.ghiChu}"</i>
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: 10 }}>
                  Danh sách bó hoa ({selectedOrder._items?.length || 0} mẫu)
                </div>

                {selectedOrder._items && selectedOrder._items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedOrder._items.map((it, idx) => (
                      <div
                        key={it.maSanPham ?? idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: 10,
                          borderRadius: 12,
                          border: '1px solid #f3f4f6',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={getFlowerImage(it)}
                            alt={it.tenSanPham}
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 10,
                              objectFit: 'cover',
                              border: '1px solid #f3f4f6',
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                              {it.tenSanPham}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
                              Đơn giá: <b>{formatVND(it._unitPrice)}</b> &times;{' '}
                              <b>{it.soLuong}</b> bó
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.96rem' }}>
                          {formatVND(it._lineTotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '0.88rem' }}>
                    Không có dữ liệu chi tiết sản phẩm cho đơn hàng này.
                  </div>
                )}
              </div>

              <div
                style={{
                  borderTop: '1px dashed #e5e7eb',
                  paddingTop: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: '0.92rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Tạm tính tiền hoa:</span>
                  <b>{formatVND(itemsSubtotal)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Phí vận chuyển:</span>
                  <b>{shippingFee === 0 ? 'Miễn phí (0 đ)' : formatVND(shippingFee)}</b>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    paddingTop: 8,
                    borderTop: '1px solid #f3f4f6',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                  }}
                >
                  <span>Tổng thanh toán:</span>
                  <span style={{ color: '#e11d48' }}>{formatVND(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Thêm / Sửa sản phẩm */}
      {productModal && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: 540,
              width: '94%',
              maxHeight: '92vh',
              overflowY: 'auto',
              position: 'relative',
              padding: 26,
            }}
          >
            <button
              type="button"
              onClick={() => setProductModal(null)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
            <h2 style={{ marginBottom: 16 }}>
              {productModal.mode === 'create' ? 'Thêm Mẫu Hoa Mới' : 'Cập Nhật Mẫu Hoa'}
            </h2>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ImageIcon size={15} color="#e11d48" />
                  <span>Hình ảnh bó hoa (Tải trực tiếp từ thiết bị)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectImageFile}
                  style={{ display: 'none' }}
                />

                <div
                  style={{
                    border: '1.5px dashed #fecdd3',
                    background: '#fffafb',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  {productForm.hinhAnhChinh ? (
                    <img
                      src={productForm.hinhAnhChinh}
                      alt="Xem trước mẫu hoa"
                      style={{
                        width: 78,
                        height: 78,
                        borderRadius: 12,
                        objectFit: 'cover',
                        border: '1px solid #f3f4f6',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 78,
                        height: 78,
                        borderRadius: 12,
                        background: '#ffe4e6',
                        color: '#e11d48',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ImageIcon size={28} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-outline btn-sm"
                        style={{ background: '#ffffff' }}
                      >
                        <Upload size={14} />
                        <span>
                          {productForm.hinhAnhChinh ? 'Đổi ảnh từ thiết bị' : 'Chọn ảnh từ thiết bị'}
                        </span>
                      </button>

                      {productForm.hinhAnhChinh && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFileName('');
                            setProductForm((prev) => ({ ...prev, hinhAnhChinh: '' }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#e11d48', background: '#ffffff' }}
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {imageFileName
                        ? `Đã chọn: ${imageFileName}`
                        : 'Hỗ trợ JPG, PNG, WEBP trên máy tính hoặc điện thoại'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tên bó hoa</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ví dụ: Bó Hồng Kem Dâu Nghệ Thuật"
                  value={productForm.tenSanPham}
                  onChange={(e) =>
                    setProductForm({ ...productForm, tenSanPham: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kiểu thiết kế hoa</label>
                <select
                  className="form-control"
                  value={productForm.maDanhMuc}
                  onChange={(e) =>
                    setProductForm({ ...productForm, maDanhMuc: Number(e.target.value) })
                  }
                >
                  {FLOWER_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Hiển thị trên thanh danh mục Trang chủ (Chọn 1 hoặc nhiều)
                </label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {HOMEPAGE_NAV_CATEGORIES.map((navCat) => {
                    const currentList = Array.isArray(productForm.danhMucTrangChu)
                      ? productForm.danhMucTrangChu
                      : [];
                    const checked = currentList.includes(navCat.id);
                    return (
                      <button
                        key={navCat.id}
                        type="button"
                        onClick={() => {
                          const nextList = checked
                            ? currentList.filter((x) => x !== navCat.id)
                            : [...currentList, navCat.id];
                          setProductForm({ ...productForm, danhMucTrangChu: nextList });
                        }}
                        style={{
                          padding: '5px 11px',
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: checked ? '1.5px solid #e11d48' : '1px solid #e5e7eb',
                          background: checked ? '#fff1f2' : '#ffffff',
                          color: checked ? '#be123c' : '#4b5563',
                          cursor: 'pointer',
                        }}
                      >
                        {checked ? '✓ ' : '+ '}
                        {navCat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min={1000}
                    step={1000}
                    value={productForm.giaBan}
                    onChange={(e) =>
                      setProductForm({ ...productForm, giaBan: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số lượng tồn</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min={0}
                    value={productForm.soLuongTon}
                    onChange={(e) =>
                      setProductForm({ ...productForm, soLuongTon: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Palette size={15} color="#e11d48" />
                  <span>Tông màu chủ đạo (6 màu chuẩn)</span>
                </label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {STANDARD_COLOR_TONES.map((tone) => {
                    const active = productForm.tongMauSac === tone;
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, tongMauSac: tone })}
                        style={{
                          fontSize: '0.78rem',
                          padding: '5px 12px',
                          borderRadius: 999,
                          border: active ? '1.5px solid #e11d48' : '1px solid #e5e7eb',
                          background: active ? '#fff1f2' : '#ffffff',
                          color: active ? '#be123c' : '#4b5563',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {active ? '✓ ' : ''}
                        {tone}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả ngắn</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Mô tả ý nghĩa, loài hoa kết hợp và dịp tặng phù hợp..."
                  value={productForm.moTa}
                  onChange={(e) => setProductForm({ ...productForm, moTa: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={savingProduct}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {savingProduct ? 'Đang lưu & đồng bộ...' : 'Lưu thông tin hoa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}