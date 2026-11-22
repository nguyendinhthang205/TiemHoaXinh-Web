import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles,
  ShoppingBag,
  Package,
  BarChart3,
  RefreshCw,
  DollarSign,
  Cpu,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';
import api, {
  AI_BASE_URL,
  formatVND,
  getFlowerImage,
  saveProductOverride,
  syncProductOverridesFromCloud,
  getHotlineNumber,
  readLocalOrderMeta,
  syncOrderMetaFromCloud,
  writeOrderMeta,
  writeOrdersDeletedBatch,
} from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  getAllConversationsForAdmin,
  sendAdminReply,
  markConversationReadByAdmin,
  syncChatsFromCloud,
} from '../../services/chatService';
import ConfirmModal from '../../components/ConfirmModal';
import AdminOrdersTab from './components/AdminOrdersTab';
import AdminMessagesTab from './components/AdminMessagesTab';
import AdminProductsTab from './components/AdminProductsTab';
import AdminForecastTab from './components/AdminForecastTab';
import AdminChartsTab from './components/AdminChartsTab';
import AdminSettingsTab from './components/AdminSettingsTab';
import {
  PAGE_SIZE,
  FLOWER_CATEGORIES,
  getCurrentYearMonth,
  shiftYearMonth,
  getOrderYearMonth,
  formatYearMonthVN,
  compressImageFile,
  extractRawStatus,
  normalizeAdminOrderStatus,
} from './adminUtils';

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

  // Hộp thoại xác nhận dùng chung (thay thế window.confirm)
  const [confirmState, setConfirmState] = useState(null);

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

  const openEditProduct = useCallback((sp) => {
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
  }, []);

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
  }, [searchParams, products, setSearchParams, openEditProduct]);

  useEffect(() => {
    if (openMenuOrderId == null) return undefined;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-order-menu-root]')) {
        setOpenMenuOrderId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openMenuOrderId]);

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

  const executeDeleteSingleOrder = async (order) => {
    const orderId = order.maDonHang;
    try {
      setDeletingOrders(true);
      await deleteOrderFromBackend(orderId);
      const nextMeta = await writeOrdersDeletedBatch([orderId]);
      setOrderMetaMap(nextMeta);
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

  const executeBulkDeleteOrders = async (idsToDelete) => {
    if (!Array.isArray(idsToDelete) || idsToDelete.length === 0) return;
    try {
      setDeletingOrders(true);
      const chunkSize = 6;
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const chunk = idsToDelete.slice(i, i + chunkSize);
        await Promise.allSettled(chunk.map((id) => deleteOrderFromBackend(id)));
      }
      const nextMeta = await writeOrdersDeletedBatch(idsToDelete);
      setOrderMetaMap(nextMeta);
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

  const applyOrderStatusChange = (order, nextCode, targetInfo) => {
    const orderId = order.maDonHang;
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

  const handleChangeOrderStatus = (order, nextCode, isPickup = false, askConfirm = false) => {
    const orderId = order.maDonHang;
    const targetInfo = normalizeAdminOrderStatus(nextCode, isPickup);
    setOpenMenuOrderId(null);

    if (askConfirm) {
      setConfirmState({
        title: `Chuyển trạng thái đơn #${orderId}`,
        message: `Xác nhận chuyển đơn hàng #${orderId} sang trạng thái "${targetInfo.label}"?`,
        confirmLabel: 'Xác nhận chuyển',
        variant: nextCode === 'Cancelled' ? 'danger' : 'sage',
        onConfirm: () => {
          applyOrderStatusChange(order, nextCode, targetInfo);
          setConfirmState(null);
        },
      });
      return;
    }

    applyOrderStatusChange(order, nextCode, targetInfo);
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

  const executeRetrainAI = async () => {
    try {
      setTraining(true);
      let trainPayload = null;
      try {
        const res = await api.post('/DuBao/train', {}, { timeout: 12000 });
        trainPayload = res.data;
      } catch {
        const res = await axios.post(`${AI_BASE_URL}/forecast/train`, {}, { timeout: 12000 });
        trainPayload = res.data;
      }

      const comparison = trainPayload?.soSanhMoHinh;
      const chosen = trainPayload?.moHinhDuocChon || modelMetrics.modelName;
      if (comparison && comparison[chosen]) {
        const lr = comparison.LinearRegression;
        const rf = comparison.RandomForestRegressor;
        setModelMetrics((prev) => ({
          ...prev,
          modelName: chosen,
          mae: comparison[chosen].MAE ?? prev.mae,
          rmse: comparison[chosen].RMSE ?? prev.rmse,
          rfMae: rf?.MAE ?? prev.rfMae,
          rfRmse: rf?.RMSE ?? prev.rfRmse,
          lrMae: lr?.MAE ?? prev.mae,
        }));
      }

      await loadAllData();
      const chosenMae = comparison?.[chosen]?.MAE ?? trainPayload?.mae ?? modelMetrics.mae;
      const chosenRmse = comparison?.[chosen]?.RMSE ?? trainPayload?.rmse ?? modelMetrics.rmse;
      showToast(
        `Huấn luyện lại thành công (${chosen})! MAE: ${chosenMae} bó • RMSE: ${chosenRmse} bó`
      );
    } catch {
      showToast('Không kết nối được dịch vụ Python AI để huấn luyện.', 'error');
    } finally {
      setTraining(false);
    }
  };

  const handleRetrainAI = () => {
    setConfirmState({
      title: 'Huấn luyện lại mô hình AI',
      message:
        'Hệ thống sẽ chạy lại Linear Regression & Random Forest trên dữ liệu đơn hàng hoàn tất mới nhất và cập nhật bảng dự báo. Tiếp tục?',
      confirmLabel: 'Bắt đầu huấn luyện',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmState(null);
        await executeRetrainAI();
      },
    });
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

  const executeDeleteProduct = async (sp) => {
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
    <div className="thx-admin-shell">
      {/* Header Admin */}
      <div
        className="thx-no-print"
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
              fontSize: '0.76rem',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Trung tâm điều hành &bull; Tiệm Hoa Xinh
          </span>
          <h1 style={{ fontSize: 'clamp(1.45rem, 2.5vw, 1.9rem)', marginTop: 2 }}>
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
            className="btn btn-outline btn-sm"
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
            className="btn btn-primary btn-sm"
          >
            <Sparkles size={15} />
            <span>{training ? 'Đang huấn luyện AI...' : 'Huấn luyện lại mô hình AI'}</span>
          </button>
        </div>
      </div>

      {apiError && (
        <div
          className="thx-no-print"
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

      {/* Khối "Việc cần làm hôm nay" */}
      <div className="thx-todo-strip thx-no-print">
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
            <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#181316', marginTop: 2 }}>
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
            Xử lý &rarr;
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
            <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#181316', marginTop: 2 }}>
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
            <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#181316', marginTop: 2 }}>
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
            <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#181316', marginTop: 2 }}>
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

      {/* 4 Thẻ KPI */}
      <div className="thx-admin-kpi-grid thx-no-print">
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
              className="thx-nowrap tabular-nums"
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
            <div className="tabular-nums" style={{ fontSize: '1.38rem', fontWeight: 800, margin: '3px 0' }}>
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
                padding: 0,
                fontSize: '0.76rem',
                color: inProgressCount > 0 ? '#d97706' : '#16a34a',
                fontWeight: 700,
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
            <div className="tabular-nums" style={{ fontSize: '1.38rem', fontWeight: 800, margin: '3px 0' }}>
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
            <div className="tabular-nums" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Sai số TB: <b>±{modelMetrics.mae} bó</b> (RMSE: {modelMetrics.rmse})
            </div>
          </div>
        </div>
      </div>

      {/* Thanh chuyển 6 Tab */}
      <div className="thx-admin-tabs thx-no-print">
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

      {activeTab === 'orders' && (
        <AdminOrdersTab
          activeOrders={activeOrders}
          filteredOrders={filteredOrders}
          paginatedOrders={paginatedOrders}
          orderMetaMap={orderMetaMap}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          orderSearch={orderSearch}
          setOrderSearch={setOrderSearch}
          inProgressCount={inProgressCount}
          unpaidActiveCount={unpaidActiveCount}
          selectedOrderIds={selectedOrderIds}
          isAllPageSelected={isAllPageSelected}
          toggleSelectPageOrders={toggleSelectPageOrders}
          toggleSelectOneOrder={toggleSelectOneOrder}
          deletingOrders={deletingOrders}
          onRequestBulkDelete={(ids, labelText) =>
            setConfirmState({
              title: `Xóa ${ids.length} đơn hàng?`,
              message: `Bạn có chắc muốn xóa ${labelText} khỏi danh sách quản trị? Hành động này không thể hoàn tác.`,
              confirmLabel: `Xóa ${ids.length} đơn`,
              variant: 'danger',
              onConfirm: async () => {
                setConfirmState(null);
                await executeBulkDeleteOrders(ids);
              },
            })
          }
          onRequestDeleteSingle={(order) => {
            setOpenMenuOrderId(null);
            setConfirmState({
              title: `Xóa đơn hàng #${order.maDonHang}?`,
              message: `Bạn có chắc muốn xóa vĩnh viễn đơn hàng #${order.maDonHang} của "${order.tenNguoiNhan || 'Khách hàng'}" không?`,
              confirmLabel: 'Xóa vĩnh viễn',
              variant: 'danger',
              onConfirm: async () => {
                setConfirmState(null);
                await executeDeleteSingleOrder(order);
              },
            });
          }}
          oldDummyOrderIds={oldDummyOrderIds}
          loadingOrders={loadingOrders}
          openMenuOrderId={openMenuOrderId}
          setOpenMenuOrderId={setOpenMenuOrderId}
          onChangeOrderStatus={handleChangeOrderStatus}
          onConfirmPayment={handleConfirmPayment}
          onOpenOrderDetail={handleOpenOrderDetail}
          loadingDetailId={loadingDetailId}
          safePage={safePage}
          totalPages={totalPages}
          startIndex={startIndex}
          setCurrentPage={setCurrentPage}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
        />
      )}

      {activeTab === 'messages' && (
        <AdminMessagesTab
          conversations={conversations}
          activeConversation={activeConversation}
          setSelectedConvId={setSelectedConvId}
          adminReplyText={adminReplyText}
          setAdminReplyText={setAdminReplyText}
          sendingReply={sendingReply}
          onSendAdminReply={handleSendAdminReply}
          adminChatEndRef={adminChatEndRef}
        />
      )}

      {activeTab === 'products' && (
        <AdminProductsTab
          filteredProducts={filteredProducts}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          openCreateProduct={openCreateProduct}
          openEditProduct={openEditProduct}
          onRequestDeleteProduct={(sp) =>
            setConfirmState({
              title: `Xóa mẫu hoa "${sp.tenSanPham}"?`,
              message: 'Mẫu hoa sẽ bị gỡ khỏi danh mục mở bán. Tiếp tục?',
              confirmLabel: 'Xóa mẫu hoa',
              variant: 'danger',
              onConfirm: async () => {
                setConfirmState(null);
                await executeDeleteProduct(sp);
              },
            })
          }
          productModal={productModal}
          setProductModal={setProductModal}
          productForm={productForm}
          setProductForm={setProductForm}
          savingProduct={savingProduct}
          onSaveProduct={handleSaveProduct}
          imageFileName={imageFileName}
          setImageFileName={setImageFileName}
          fileInputRef={fileInputRef}
          onSelectImageFile={handleSelectImageFile}
        />
      )}

      {activeTab === 'forecast' && (
        <AdminForecastTab
          forecasts={forecasts}
          topForecastItem={topForecastItem}
          topForecastImport={topForecastImport}
          modelName={modelMetrics.modelName}
          onExportForecastCSV={handleExportForecastCSV}
        />
      )}

      {activeTab === 'charts' && (
        <AdminChartsTab forecasts={forecasts} modelMetrics={modelMetrics} />
      )}

      {activeTab === 'settings' && (
        <AdminSettingsTab
          hotlineInput={hotlineInput}
          setHotlineInput={setHotlineInput}
          showToast={showToast}
        />
      )}

      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        variant={confirmState?.variant || 'primary'}
        loading={deletingOrders || training}
        onConfirm={() => confirmState?.onConfirm?.()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
