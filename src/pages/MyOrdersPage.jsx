import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Gift,
  QrCode,
  XCircle,
  CheckCircle,
  X,
  User,
  Truck,
  Store,
  Check,
  RefreshCw,
} from 'lucide-react';
import api, {
  formatVND,
  getFlowerImage,
  readLocalOrderMeta,
  syncOrderMetaFromCloud,
  writeOrderMeta,
} from '../services/api';
import { useApp } from '../context/AppContext';
import ConfirmModal from '../components/ConfirmModal';

function extractCustomerRawStatus(order, meta = {}) {
  if (meta.statusOverride) return meta.statusOverride;
  return (
    order.trangThai ||
    order.trangThaiDonHang ||
    order.trangThaiDon ||
    order.status ||
    order.tinhTrang ||
    'Pending'
  );
}

function translateCustomerOrderStatus(rawStatus = '', isPickup = false) {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (s.includes('cancel') || s.includes('hủy')) {
    return {
      code: 'Cancelled',
      label: 'Đã hủy',
      step: -1,
      isPending: false,
      isCancelled: true,
      isDelivered: false,
      bg: '#f3f4f6',
      color: '#4b5563',
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
      isPending: false,
      isCancelled: false,
      isDelivered: true,
      bg: '#dcfce7',
      color: '#166534',
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
      isPending: false,
      isCancelled: false,
      isDelivered: false,
      bg: '#e0e7ff',
      color: '#3730a3',
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
      isPending: false,
      isCancelled: false,
      isDelivered: false,
      bg: '#dbeafe',
      color: '#1e40af',
    };
  }
  return {
    code: 'Pending',
    label: 'Chờ xác nhận',
    step: 0,
    isPending: true,
    isCancelled: false,
    isDelivered: false,
    bg: '#fef3c7',
    color: '#92400e',
  };
}

export default function MyOrdersPage() {
  const { user, showToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [orderMetaMap, setOrderMetaMap] = useState(() => readLocalOrderMeta());
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL');
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState(null);
  const [qrOrder, setQrOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const syncedMeta = await syncOrderMetaFromCloud();
      setOrderMetaMap(syncedMeta);

      const spRes = await api.get('/SanPham').catch(() => ({ data: [] }));
      const spList = Array.isArray(spRes.data) ? spRes.data : spRes.data?.items || [];
      const pMap = {};
      spList.forEach((p) => {
        pMap[p.maSanPham] = p;
      });
      setProductMap(pMap);

      let rawList = [];
      try {
        const res = await api.get('/DonHang/my-orders');
        rawList = Array.isArray(res.data) ? res.data : res.data?.items || [];
      } catch {
        const resAll = await api.get('/DonHang');
        const all = Array.isArray(resAll.data) ? resAll.data : resAll.data?.items || [];
        rawList = user.maNguoiDung
          ? all.filter((o) => o.maNguoiDung === user.maNguoiDung)
          : all;
      }

      rawList.sort((a, b) => (b.maDonHang || 0) - (a.maDonHang || 0));

      const enriched = await Promise.all(
        rawList.map(async (order) => {
          const existingItems =
            order.chiTietDonHangs ||
            order.chiTietDonHang ||
            order.items ||
            order.sanPhams;
          if (Array.isArray(existingItems) && existingItems.length > 0) {
            return { ...order, _items: existingItems };
          }
          try {
            const detailRes = await api.get(`/DonHang/${order.maDonHang}`);
            const d = detailRes.data || {};
            const detailItems =
              d.chiTietDonHangs ||
              d.chiTietDonHang ||
              d.items ||
              d.sanPhams ||
              [];
            return { ...order, ...d, _items: detailItems };
          } catch {
            return { ...order, _items: [] };
          }
        })
      );

      setOrders(enriched);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không tải được danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!user) return undefined;
    const handleMetaEvent = () => setOrderMetaMap(readLocalOrderMeta());
    window.addEventListener('thx_orders_updated', handleMetaEvent);
    window.addEventListener('storage', handleMetaEvent);

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncOrderMetaFromCloud().then((latest) => setOrderMetaMap(latest));
    }, 5000);

    return () => {
      window.removeEventListener('thx_orders_updated', handleMetaEvent);
      window.removeEventListener('storage', handleMetaEvent);
      clearInterval(timer);
    };
  }, [user]);

  const executeCancelOrder = async () => {
    const orderId = confirmCancelOrderId;
    if (!orderId) return;
    try {
      setCancelingId(orderId);
      try {
        await api.put(`/DonHang/${orderId}/cancel`, { lyDoHuy: 'Khách hàng yêu cầu hủy' });
      } catch {
        await api.put(`/DonHang/${orderId}/status`, { trangThai: 'Cancelled' }).catch(() => {});
      }
      const nextMeta = await writeOrderMeta(orderId, { statusOverride: 'Cancelled' });
      setOrderMetaMap(nextMeta);
      setOrders((prev) =>
        prev.map((o) => (o.maDonHang === orderId ? { ...o, trangThai: 'Cancelled' } : o))
      );
      showToast(`Đã hủy đơn hàng #${orderId} thành công!`);
    } finally {
      setCancelingId(null);
      setConfirmCancelOrderId(null);
    }
  };

  const openQrForOrder = async (order, amountToPay) => {
    const orderId = order.maDonHang;
    let qrUrl = `https://img.vietqr.io/image/MB-0905111222-compact2.png?amount=${amountToPay}&addInfo=TIEMHOAXINH%20DH${orderId}`;
    try {
      const qrRes = await api.get(`/ThanhToan/vietqr/${orderId}`);
      if (qrRes.data?.qrUrl) qrUrl = qrRes.data.qrUrl;
    } catch {
      // Giữ link VietQR mặc định
    }
    setQrOrder({
      maDonHang: orderId,
      tongTien: amountToPay,
      qrUrl,
    });
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

  if (!user) {
    return (
      <div className="container" style={{ marginTop: 48 }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48, maxWidth: 520, margin: '0 auto' }}>
          <ShoppingBag size={42} color="#e11d48" style={{ marginBottom: 12 }} />
          <h2>Vui lòng đăng nhập để xem đơn hàng</h2>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 14 }}>
            Đi tới trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const visibleOrders = orders.filter((order) => {
    const meta = orderMetaMap[order.maDonHang] || {};
    if (meta.deleted) return false;
    const stInfo = translateCustomerOrderStatus(extractCustomerRawStatus(order, meta));
    if (statusTab === 'ALL') return true;
    if (statusTab === 'IN_PROGRESS') {
      return stInfo.code === 'Pending' || stInfo.code === 'Confirmed' || stInfo.code === 'Shipping';
    }
    return stInfo.code === statusTab;
  });

  return (
    <div className="container" style={{ marginTop: 28, marginBottom: 64 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: '1.9rem' }}>Đơn Hàng Của Tôi ({orders.length})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw size={14} />
            <span>{loading ? 'Đang đồng bộ...' : 'Cập nhật trạng thái'}</span>
          </button>
          <Link to="/#catalog" className="btn btn-primary btn-sm">
            + Đặt thêm hoa mới
          </Link>
        </div>
      </div>

      {/* Bộ lọc trạng thái */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { id: 'ALL', label: 'Tất cả đơn' },
          { id: 'IN_PROGRESS', label: 'Đang thực hiện' },
          { id: 'Completed', label: 'Hoàn tất' },
          { id: 'Cancelled', label: 'Đã hủy' },
        ].map((tab) => {
          const active = statusTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={active ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map((n) => (
            <div key={n} className="panel" style={{ padding: 20 }}>
              <div className="thx-skeleton" style={{ height: 24, width: '40%', marginBottom: 14 }} />
              <div className="thx-skeleton" style={{ height: 76, width: '100%', marginBottom: 12 }} />
              <div className="thx-skeleton" style={{ height: 48, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 52 }}>
          <ShoppingBag size={40} color="#fecdd3" style={{ marginBottom: 12 }} />
          <p style={{ color: '#6b7280', marginBottom: 18 }}>
            {orders.length === 0
              ? 'Bạn chưa có đơn đặt hoa nào.'
              : 'Không có đơn hàng nào thuộc nhóm trạng thái này.'}
          </p>
          <Link to="/#catalog" className="btn btn-primary btn-sm">
            Khám phá bộ sưu tập hoa
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {visibleOrders.map((order) => {
            const meta = orderMetaMap[order.maDonHang] || {};
            const phone =
              order.sdtNguoiNhan || order.soDienThoaiNhan || order.soDienThoai || 'Chưa cập nhật';
            const address =
              order.diaChiGiao || order.diaChiGiaoHang || order.diaChi || 'Chưa cập nhật';

            const isPickup =
              meta.deliveryMethod === 'pickup' ||
              address.toLowerCase().includes('tới cửa hàng lấy') ||
              String(order.ghiChu || '').toLowerCase().includes('tới tiệm lấy');

            const stInfo = translateCustomerOrderStatus(
              extractCustomerRawStatus(order, meta),
              isPickup
            );

            const deliveryDate = formatDateOnly(order.ngayGiao || order.ngayGiaoHang);
            const timeSlot = order.khungGioGiao || '';

            const rawPayment =
              meta.paymentMethod ||
              order.phuongThucThanhToan ||
              order.phuongThucTt ||
              order.hinhThucThanhToan ||
              'VietQR';
            const isVietQR = rawPayment.toLowerCase().includes('qr');

            const isPaid =
              meta.isPaid === true ||
              order.daThanhToan === true ||
              String(order.trangThaiThanhToan || '')
                .toLowerCase()
                .includes('đã thanh toán') ||
              stInfo.isDelivered;

            const totalMoney = meta.grandTotal ?? order.tongThanhToan ?? order.tongTien ?? 0;

            const trackingSteps = isPickup
              ? [
                  { title: '1. Chờ xác nhận', desc: 'Tiệm đã nhận yêu cầu' },
                  { title: '2. Đang cắm hoa', desc: 'Nghệ nhân đang thiết kế' },
                  { title: '3. Sẵn sàng tại tiệm', desc: 'Mời bạn ghé tiệm lấy hoa' },
                  { title: '4. Khách đã nhận hoa', desc: 'Hoàn tất tại cửa hàng' },
                ]
              : [
                  { title: '1. Chờ xác nhận', desc: 'Tiệm đã nhận yêu cầu' },
                  { title: '2. Đang cắm hoa', desc: 'Đang thiết kế & viết thiệp' },
                  { title: '3. Shipper đang giao', desc: 'Đang trên đường giao tới bạn' },
                  { title: '4. Đã giao thành công', desc: 'Khách đã nhận hoa tươi' },
                ];

            return (
              <div key={order.maDonHang} className="panel" style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    paddingBottom: 14,
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '1.12rem' }}>
                      Đơn hàng #{order.maDonHang}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: '0.79rem',
                        fontWeight: 600,
                        background: isPickup ? '#f0fdf4' : '#fff1f2',
                        color: isPickup ? '#15803d' : '#be123c',
                      }}
                    >
                      {isPickup ? <Store size={13} /> : <Truck size={13} />}
                      {isPickup
                        ? 'Tới tiệm lấy (0 đ ship)'
                        : meta.distanceKm
                        ? `Ship tận nơi (${meta.distanceKm} km)`
                        : 'Ship tận nơi'}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.84rem' }}>
                      &bull; Đặt lúc {formatDateTime(order.ngayDat || order.thoiGianDat)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: stInfo.bg,
                        color: stInfo.color,
                        padding: '5px 12px',
                        borderRadius: 999,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      {stInfo.label}
                    </span>

                    {isVietQR && !stInfo.isCancelled && !isPaid && (
                      <button
                        type="button"
                        onClick={() => openQrForOrder(order, totalMoney)}
                        className="btn btn-primary btn-sm"
                      >
                        <QrCode size={15} /> Quét mã VietQR
                      </button>
                    )}

                    {stInfo.isPending && (
                      <button
                        type="button"
                        disabled={cancelingId === order.maDonHang}
                        onClick={() => setConfirmCancelOrderId(order.maDonHang)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#e11d48', borderColor: '#fecdd3' }}
                      >
                        <XCircle size={15} />
                        {cancelingId === order.maDonHang ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Thanh tiến trình 4 giai đoạn */}
                {!stInfo.isCancelled && (
                  <div className="thx-order-steps">
                    {trackingSteps.map((step, idx) => {
                      const done = idx <= stInfo.step;
                      const isCurrent = idx === stInfo.step;
                      return (
                        <div
                          key={step.title}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: done ? '#16a34a' : '#e5e7eb',
                              color: done ? '#ffffff' : '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              marginBottom: 6,
                              boxShadow: isCurrent ? '0 0 0 4px #dcfce7' : 'none',
                            }}
                          >
                            {done ? <Check size={15} /> : idx + 1}
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: done ? 700 : 500,
                              color: done ? '#181316' : '#6b7280',
                            }}
                          >
                            {step.title}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 2 }}>
                            {step.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Danh sách bó hoa trong đơn */}
                {order._items && order._items.length > 0 && (
                  <div
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {order._items.map((item, idx) => {
                      const prod = productMap[item.maSanPham] || {};
                      const quantity = item.soLuong ?? 1;
                      const unitPrice =
                        item.donGia ??
                        item.giaLucMua ??
                        item.giaBan ??
                        (item.thanhTien && quantity ? item.thanhTien / quantity : null) ??
                        prod.giaBan ??
                        0;
                      const flowerName =
                        item.tenSanPham || prod.tenSanPham || `Sản phẩm #${item.maSanPham}`;
                      const mergedItem = { ...prod, ...item, tenSanPham: flowerName };

                      return (
                        <div
                          key={item.maSanPham ?? idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={getFlowerImage(mergedItem)}
                              alt={flowerName}
                              style={{
                                width: 54,
                                height: 54,
                                borderRadius: 11,
                                objectFit: 'cover',
                                border: '1px solid #f3f4f6',
                              }}
                            />
                            <div>
                              <Link
                                to={`/product/${item.maSanPham}`}
                                style={{ fontWeight: 600, fontSize: '0.94rem', color: '#181316' }}
                              >
                                {flowerName}
                              </Link>
                              <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                                Số lượng: <b>{quantity}</b> bó × {formatVND(unitPrice)}
                              </div>
                            </div>
                          </div>
                          <div className="tabular-nums" style={{ fontWeight: 700, color: '#374151' }}>
                            {formatVND(unitPrice * quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Thông tin giao hàng, lời chúc & trạng thái thanh toán */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                    paddingTop: 14,
                    alignItems: 'end',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={15} color="#e11d48" />
                      <span>
                        Người nhận: <b>{order.tenNguoiNhan || user.hoTen}</b>
                      </span>
                      <span
                        style={{
                          color: '#6b7280',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Phone size={14} /> ({phone})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#4b5563' }}>
                      <MapPin size={15} color="#e11d48" style={{ marginTop: 3, flexShrink: 0 }} />
                      <span>
                        {isPickup ? 'Nhận tại:' : 'Địa chỉ giao:'} <b>{address}</b>
                      </span>
                    </div>

                    {(deliveryDate || timeSlot) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
                        <Calendar size={15} color="#e11d48" />
                        <span>
                          {isPickup ? 'Thời gian tới lấy:' : 'Thời gian giao:'}{' '}
                          <b>
                            {deliveryDate}
                            {timeSlot ? ` • ${timeSlot}` : ''}
                          </b>
                        </span>
                      </div>
                    )}

                    {order.ghiChu && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#6b7280' }}>
                        <Gift size={15} color="#e11d48" style={{ marginTop: 3, flexShrink: 0 }} />
                        <span>
                          Ghi chú &amp; lời chúc: <i>“{order.ghiChu}”</i>
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 10,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: isPaid ? '#dcfce7' : '#fef3c7',
                        color: isPaid ? '#166534' : '#92400e',
                      }}
                    >
                      <CreditCard size={15} />
                      <span>
                        {isVietQR
                          ? isPaid
                            ? 'Đã thanh toán online qua web (VietQR)'
                            : 'Thanh toán online qua web (VietQR) • Chờ chuyển khoản'
                          : isPaid
                          ? 'Đã thanh toán tiền mặt khi nhận hoa (COD)'
                          : 'Thanh toán tiền mặt khi nhận hoa (COD) • Chưa thanh toán'}
                      </span>
                    </div>

                    {typeof meta.shippingFee === 'number' && (
                      <div style={{ fontSize: '0.81rem', color: '#6b7280' }}>
                        {meta.shippingFee > 0
                          ? `Đã bao gồm phí ship ${meta.distanceKm} km: ${formatVND(meta.shippingFee)}`
                          : 'Miễn phí vận chuyển (Nhận tại tiệm)'}
                      </div>
                    )}

                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      Tổng thanh toán:{' '}
                      <span
                        className="tabular-nums"
                        style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e11d48' }}
                      >
                        {formatVND(totalMoney)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal VietQR */}
      {qrOrder && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ textAlign: 'center', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setQrOrder(null)}
              title="Đóng cửa sổ"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#f3f4f6',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>

            <QrCode size={36} color="#e11d48" style={{ marginBottom: 8 }} />
            <h2>Quét Mã VietQR Để Thanh Toán</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '8px 0 16px' }}>
              Đơn hàng <b>#{qrOrder.maDonHang}</b> &bull; Số tiền:{' '}
              <b className="tabular-nums" style={{ color: '#e11d48' }}>
                {formatVND(qrOrder.tongTien)}
              </b>
            </p>
            <img
              src={qrOrder.qrUrl}
              alt="VietQR Payment"
              style={{
                width: 260,
                height: 260,
                borderRadius: 16,
                border: '1px solid var(--border)',
                marginBottom: 18,
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={async () => {
                  const nextMeta = await writeOrderMeta(qrOrder.maDonHang, {
                    isPaid: true,
                    paymentMethod: 'VietQR',
                  });
                  setOrderMetaMap(nextMeta);
                  setQrOrder(null);
                  showToast('Đã xác nhận thanh toán online qua web (VietQR)!');
                }}
                className="btn btn-sage"
              >
                <CheckCircle size={18} />
                <span>Tôi đã chuyển khoản xong</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmCancelOrderId)}
        title={`Hủy đơn hàng #${confirmCancelOrderId}?`}
        message="Bạn có chắc chắn muốn hủy đơn đặt hoa này không? Thao tác này không thể hoàn tác."
        confirmLabel="Xác nhận hủy đơn"
        cancelLabel="Giữ lại đơn"
        variant="danger"
        loading={Boolean(cancelingId)}
        onConfirm={executeCancelOrder}
        onCancel={() => setConfirmCancelOrderId(null)}
      />
    </div>
  );
}
