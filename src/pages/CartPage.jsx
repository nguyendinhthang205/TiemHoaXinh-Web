import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ShoppingBag,
  QrCode,
  CheckCircle,
  AlertCircle,
  X,
  Truck,
  Store,
  Ticket,
  Check,
} from 'lucide-react';
import api, { formatVND, getFlowerImage, writeOrderMeta } from '../services/api';
import { useApp } from '../context/AppContext';

const SHIPPING_RATE_PER_KM = 5000; // 5.000 đ / km
const SHOP_PICKUP_ADDRESS = '120 Lê Duẩn, Quận Hải Châu, TP. Đà Nẵng';

const STORE_VOUCHERS = [
  {
    code: 'GIAM25K',
    badge: 'Giảm 25K',
    title: 'Giảm trực tiếp 25.000đ',
    desc: 'Đơn hoa từ 300.000đ',
    minSubtotal: 300000,
    type: 'fixed',
    value: 25000,
  },
  {
    code: 'GIAM50K',
    badge: 'Giảm 50K',
    title: 'Giảm trực tiếp 50.000đ',
    desc: 'Đơn hoa từ 600.000đ',
    minSubtotal: 600000,
    type: 'fixed',
    value: 50000,
  },
  {
    code: 'GIAM10',
    badge: 'Giảm 10%',
    title: 'Giảm 10% tiền hoa',
    desc: 'Tối đa 80K • Đơn từ 400.000đ',
    minSubtotal: 400000,
    type: 'percent',
    value: 10,
    maxDiscount: 80000,
  },
  {
    code: 'FREESHIP',
    badge: 'Freeship 15K',
    title: 'Hỗ trợ 15.000đ phí ship',
    desc: 'Áp dụng khi giao tận nơi',
    minSubtotal: 0,
    type: 'shipping',
    value: 15000,
    shipOnly: true,
  },
];

export default function CartPage() {
  const { user, cartItems, fetchCart, showToast } = useApp();
  const navigate = useNavigate();

  const getDefaultDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [stockMap, setStockMap] = useState({});
  const [tenNguoiNhan, setTenNguoiNhan] = useState(user?.hoTen || '');
  const [sdtNguoiNhan, setSdtNguoiNhan] = useState(user?.soDienThoai || '0905111222');

  // Hình thức nhận hàng: 'ship' (Ship tận nơi) | 'pickup' (Tới cửa hàng lấy)
  const [deliveryMethod, setDeliveryMethod] = useState('ship');
  const [distanceKm, setDistanceKm] = useState(3);
  const [diaChiGiao, setDiaChiGiao] = useState(
    user?.diaChi || '45 Nguyễn Văn Linh, Hải Châu, Đà Nẵng'
  );

  const [ngayGiao, setNgayGiao] = useState(getDefaultDeliveryDate);
  const [khungGioGiao, setKhungGioGiao] = useState('08:00 - 10:00 (Buổi sáng)');
  const [ghiChu, setGhiChu] = useState('Chúc mừng bạn một ngày thật rạng rỡ!');
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState('VietQR');
  const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [qrOrder, setQrOrder] = useState(null);

  useEffect(() => {
    api
      .get('/SanPham')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const map = {};
        list.forEach((p) => {
          map[p.maSanPham] = p.soLuongTon;
        });
        setStockMap(map);
      })
      .catch(() => {});
  }, []);

  const updateQuantity = async (item, newQty) => {
    if (newQty < 1) {
      return removeItem(item);
    }
    setErrorMsg('');
    try {
      await api.put(`/GioHang/${item.maSanPham}`, { soLuong: newQty });
      await fetchCart();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể cập nhật số lượng';
      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  const removeItem = async (item) => {
    setErrorMsg('');
    try {
      await api.delete(`/GioHang/${item.maSanPham}`);
      await fetchCart();
      showToast(`Đã xóa "${item.tenSanPham}" khỏi giỏ hàng!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng';
      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  const clearAllCart = async () => {
    setErrorMsg('');
    try {
      await api.delete('/GioHang');
      await fetchCart();
      setSelectedVoucherCode('');
      showToast('Đã làm trống toàn bộ giỏ hàng!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa giỏ hàng';
      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  const flowerSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.giaBan || item.donGia || 0) * (item.soLuong || 1),
    0
  );

  const validKm = deliveryMethod === 'ship' ? Math.max(1, Number(distanceKm) || 1) : 0;
  const shippingFee = deliveryMethod === 'ship' ? validKm * SHIPPING_RATE_PER_KM : 0;

  const isVoucherEligible = (v) => {
    if (!v) return false;
    if (v.shipOnly && deliveryMethod !== 'ship') return false;
    return flowerSubtotal >= (v.minSubtotal || 0);
  };

  const selectedVoucher =
    STORE_VOUCHERS.find((v) => v.code === selectedVoucherCode && isVoucherEligible(v)) ||
    null;

  let discountAmount = 0;
  if (selectedVoucher) {
    if (selectedVoucher.type === 'fixed') {
      discountAmount = Math.min(flowerSubtotal, selectedVoucher.value);
    } else if (selectedVoucher.type === 'percent') {
      const rawPct = Math.round((flowerSubtotal * selectedVoucher.value) / 100);
      discountAmount = Math.min(
        flowerSubtotal,
        selectedVoucher.maxDiscount
          ? Math.min(rawPct, selectedVoucher.maxDiscount)
          : rawPct
      );
    } else if (selectedVoucher.type === 'shipping') {
      discountAmount = Math.min(shippingFee, selectedVoucher.value);
    }
  }

  const totalAmount = Math.max(0, flowerSubtotal + shippingFee - discountAmount);

  const handleToggleVoucher = (voucher) => {
    if (!isVoucherEligible(voucher)) {
      if (voucher.shipOnly && deliveryMethod !== 'ship') {
        showToast('Voucher Freeship chỉ áp dụng cho hình thức Ship tận nơi.', 'error');
      } else {
        const missing = Math.max(0, voucher.minSubtotal - flowerSubtotal);
        showToast(
          `Mua thêm ${formatVND(missing)} tiền hoa để áp dụng voucher ${voucher.badge}.`,
          'error'
        );
      }
      return;
    }

    if (selectedVoucherCode === voucher.code) {
      setSelectedVoucherCode('');
      showToast(`Đã bỏ áp dụng voucher ${voucher.badge}`);
    } else {
      setSelectedVoucherCode(voucher.code);
      showToast(`Đã áp dụng ưu đãi ${voucher.badge}!`);
    }
  };

  const parseBackendError = (err) => {
    if (!err.response) {
      return 'Không kết nối được tới máy chủ Backend.';
    }
    const data = err.response.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && Array.isArray(data.errors[firstKey])) {
        return `${firstKey}: ${data.errors[firstKey][0]}`;
      }
    }
    if (data?.title) return data.title;
    return `Lỗi từ máy chủ (${err.response.status})`;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!user) {
      navigate('/login');
      return;
    }

    const finalAddress =
      deliveryMethod === 'pickup'
        ? `Tới cửa hàng lấy trực tiếp (${SHOP_PICKUP_ADDRESS})`
        : `${diaChiGiao.trim()} (Cách tiệm ${validKm} km)`;

    const shippingTag =
      deliveryMethod === 'pickup'
        ? '[Tới tiệm lấy - Miễn phí ship]'
        : `[Ship tận nơi ${validKm} km - Phí ship ${formatVND(shippingFee)}]`;

    const voucherTag = selectedVoucher
      ? ` | [Voucher ${selectedVoucher.code}: -${formatVND(discountAmount)}]`
      : '';

    const fullNote = `${
      ghiChu.trim() ? `${ghiChu.trim()} | ` : ''
    }${shippingTag}${voucherTag}`;

    const payload = {
      tenNguoiNhan: tenNguoiNhan.trim(),
      sdtNguoiNhan: sdtNguoiNhan.trim(),
      soDienThoaiNhan: sdtNguoiNhan.trim(),
      diaChiGiao: finalAddress,
      ngayGiao,
      khungGioGiao,
      ghiChu: fullNote,
      phuongThucThanhToan,
      hinhThucNhanHang:
        deliveryMethod === 'pickup' ? 'Tới cửa hàng lấy' : 'Ship tận nơi',
      soKm: validKm,
      phiVanChuyen: shippingFee,
    };

    try {
      setSubmitting(true);
      const res = await api.post('/DonHang', payload);
      await fetchCart();
      const created = res.data?.donHang || res.data;
      const orderId = created?.maDonHang || created?.id || '';
      const baseFlowerMoney =
        Number(created?.tongThanhToan) > 0
          ? Number(created.tongThanhToan)
          : flowerSubtotal;
      const finalMoney = Math.max(0, baseFlowerMoney + shippingFee - discountAmount);

      await writeOrderMeta(orderId, {
        deliveryMethod,
        distanceKm: validKm,
        shippingFee,
        voucherCode: selectedVoucher?.code || '',
        discountAmount,
        paymentMethod: phuongThucThanhToan,
        isPaid: false,
        grandTotal: finalMoney,
      });

      if (phuongThucThanhToan === 'VietQR') {
        let qrUrl = `https://img.vietqr.io/image/MB-0905111222-compact2.png?amount=${finalMoney}&addInfo=TIEMHOAXINH%20DH${orderId}`;
        if (orderId) {
          try {
            const qrRes = await api.get(`/ThanhToan/vietqr/${orderId}`);
            if (qrRes.data?.qrUrl) qrUrl = qrRes.data.qrUrl;
          } catch {
            // Giữ link VietQR mặc định
          }
        }
        setQrOrder({
          maDonHang: orderId,
          tongTien: finalMoney,
          qrUrl,
        });
      } else {
        showToast('Đặt hàng thành công! Bạn sẽ thanh toán tiền mặt khi nhận hoa.');
        navigate('/my-orders');
      }
    } catch (err) {
      const msg = parseBackendError(err);
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseQrModal = () => {
    setQrOrder(null);
    showToast('Đơn hàng đã được lưu ở trạng thái Chờ thanh toán.');
    navigate('/my-orders');
  };

  const handleConfirmPaid = async () => {
    if (qrOrder?.maDonHang) {
      await writeOrderMeta(qrOrder.maDonHang, {
        isPaid: true,
        paymentMethod: 'VietQR',
      });
    }
    setQrOrder(null);
    showToast('Xác nhận thanh toán online qua VietQR thành công!');
    navigate('/my-orders');
  };

  if (!user) {
    return (
      <div className="container" style={{ marginTop: 48 }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <ShoppingBag size={42} color="#e11d48" style={{ marginBottom: 12 }} />
          <h2>Vui lòng đăng nhập để xem giỏ hàng</h2>
          <p style={{ color: '#6b7280', margin: '10px 0 20px' }}>
            Đăng nhập bằng tài khoản khách hàng hoặc quản trị để trải nghiệm đặt hoa và thanh toán VietQR.
          </p>
          <Link to="/login" className="btn btn-primary">
            Đi tới trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: 32, marginBottom: 48 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 22 }}>Giỏ Hàng &amp; Thanh Toán</h1>

      {cartItems.length === 0 && !qrOrder ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#6b7280', marginBottom: 18 }}>
            Giỏ hàng của bạn hiện đang trống.
          </p>
          <Link to="/#catalog" className="btn btn-primary">
            Chọn hoa ngay
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
            gap: 28,
            alignItems: 'start',
          }}
        >
          {/* Cột 1: Danh sách sản phẩm + Chọn Voucher ưu đãi + Tóm tắt tiền */}
          <div className="panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3>Danh sách bó hoa ({cartItems.length})</h3>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllCart}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#ef4444' }}
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {cartItems.map((item) => {
              const stock = stockMap[item.maSanPham];
              const overStock = typeof stock === 'number' && item.soLuong > stock;
              return (
                <div
                  key={item.maSanPham}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 0',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <img
                    src={getFlowerImage(item)}
                    alt={item.tenSanPham}
                    style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{item.tenSanPham}</div>
                    <div style={{ color: '#e11d48', fontWeight: 600, fontSize: '0.92rem' }}>
                      {formatVND(item.giaBan || item.donGia)}
                    </div>
                    {typeof stock === 'number' && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: overStock ? '#dc2626' : '#6b7280',
                        }}
                      >
                        Tồn kho: <b>{stock}</b> bó{' '}
                        {overStock && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, Math.max(1, stock))}
                            style={{
                              marginLeft: 6,
                              color: '#e11d48',
                              textDecoration: 'underline',
                              background: 'none',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                            }}
                          >
                            (Giảm về {stock} bó)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.soLuong - 1)}
                      className="btn btn-outline btn-sm"
                    >
                      -
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                      {item.soLuong}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.soLuong + 1)}
                      className="btn btn-outline btn-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    style={{ background: 'transparent', color: '#ef4444', padding: 6 }}
                    title="Xóa khỏi giỏ"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}

            {/* Khu vực chọn Voucher ưu đãi 1 chạm (thay thế ô nhập mã thủ công) */}
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 14,
                background: '#fffafb',
                border: '1px solid #fce7f3',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#be123c',
                  }}
                >
                  <Ticket size={16} />
                  <span>Chọn Voucher Ưu Đãi</span>
                </div>
                {selectedVoucher && (
                  <button
                    type="button"
                    onClick={() => setSelectedVoucherCode('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '0.76rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                  gap: 8,
                }}
              >
                {STORE_VOUCHERS.map((v) => {
                  const eligible = isVoucherEligible(v);
                  const isSelected = selectedVoucher?.code === v.code;

                  return (
                    <button
                      key={v.code}
                      type="button"
                      onClick={() => handleToggleVoucher(v)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 11px',
                        borderRadius: 12,
                        border: isSelected
                          ? '2px solid #e11d48'
                          : eligible
                          ? '1.5px dashed #fda4af'
                          : '1.5px dashed #e5e7eb',
                        background: isSelected
                          ? '#fff1f2'
                          : eligible
                          ? '#ffffff'
                          : '#f9fafb',
                        opacity: eligible ? 1 : 0.65,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            color: eligible ? '#e11d48' : '#6b7280',
                          }}
                        >
                          {v.badge}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: '#e11d48',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={11} />
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: '#4b5563',
                          lineHeight: 1.3,
                        }}
                      >
                        {v.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tóm tắt tiền hoa, phí ship & giảm giá Voucher */}
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>Tạm tính tiền hoa:</span>
                <b>{formatVND(flowerSubtotal)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>
                  {deliveryMethod === 'ship'
                    ? `Phí ship tận nơi (${validKm} km × 5.000 đ/km):`
                    : 'Phí nhận tại cửa hàng:'}
                </span>
                <b style={{ color: shippingFee === 0 ? '#16a34a' : '#111827' }}>
                  {shippingFee === 0 ? 'Miễn phí (0 đ)' : formatVND(shippingFee)}
                </b>
              </div>

              {selectedVoucher && discountAmount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#16a34a',
                    fontWeight: 600,
                  }}
                >
                  <span>Ưu đãi Voucher ({selectedVoucher.badge}):</span>
                  <b>-{formatVND(discountAmount)}</b>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 12,
                  marginTop: 4,
                  borderTop: '1px dashed #e5e7eb',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                }}
              >
                <span>Tổng thanh toán:</span>
                <span style={{ color: '#e11d48' }}>{formatVND(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Cột 2: Form thông tin nhận hoa */}
          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>Thông tin nhận hoa &amp; lời chúc</h3>
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label className="form-label">Hình thức nhận hoa</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('ship')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 12,
                      border:
                        deliveryMethod === 'ship'
                          ? '2px solid #e11d48'
                          : '1.5px solid #e5e7eb',
                      background: deliveryMethod === 'ship' ? '#fff1f2' : '#ffffff',
                      color: deliveryMethod === 'ship' ? '#be123c' : '#374151',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Truck size={20} />
                    <span>Ship tận nơi</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 500 }}>5.000 đ / km</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 12,
                      border:
                        deliveryMethod === 'pickup'
                          ? '2px solid #e11d48'
                          : '1.5px solid #e5e7eb',
                      background: deliveryMethod === 'pickup' ? '#fff1f2' : '#ffffff',
                      color: deliveryMethod === 'pickup' ? '#be123c' : '#374151',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Store size={20} />
                    <span>Tới tiệm lấy</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 500, color: '#16a34a' }}>
                      Miễn phí ship (0 đ)
                    </span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tên người nhận hoa</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={tenNguoiNhan}
                  onChange={(e) => setTenNguoiNhan(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại nhận</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={sdtNguoiNhan}
                  onChange={(e) => setSdtNguoiNhan(e.target.value)}
                />
              </div>

              {deliveryMethod === 'ship' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Địa chỉ giao hàng chi tiết</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      value={diaChiGiao}
                      onChange={(e) => setDiaChiGiao(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Khoảng cách giao hàng (Km) — Đơn giá <b>5.000 đ/km</b>
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        step="0.5"
                        className="form-control"
                        required
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                        style={{ maxWidth: 110 }}
                      />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[2, 5, 8, 12].map((km) => (
                          <button
                            key={km}
                            type="button"
                            onClick={() => setDistanceKm(km)}
                            className="btn btn-outline btn-sm"
                            style={{
                              borderColor: Number(distanceKm) === km ? '#e11d48' : undefined,
                              color: Number(distanceKm) === km ? '#e11d48' : undefined,
                            }}
                          >
                            {km} km
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '12px 14px',
                    borderRadius: 12,
                    fontSize: '0.88rem',
                    marginBottom: 14,
                  }}
                >
                  📍 <b>Địa chỉ cửa hàng nhận hoa:</b> {SHOP_PICKUP_ADDRESS} (Mở cửa 07:00 –
                  21:30 hằng ngày).
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div className="form-group">
                  <label className="form-label">
                    {deliveryMethod === 'ship' ? 'Ngày giao hoa' : 'Ngày tới lấy hoa'}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={ngayGiao}
                    onChange={(e) => setNgayGiao(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {deliveryMethod === 'ship' ? 'Khung giờ giao' : 'Khung giờ tới lấy'}
                  </label>
                  <select
                    className="form-control"
                    required
                    value={khungGioGiao}
                    onChange={(e) => setKhungGioGiao(e.target.value)}
                  >
                    <option value="08:00 - 10:00 (Buổi sáng)">08:00 - 10:00 (Buổi sáng)</option>
                    <option value="10:00 - 12:00 (Trưa)">10:00 - 12:00 (Trưa)</option>
                    <option value="14:00 - 16:00 (Buổi chiều)">14:00 - 16:00 (Buổi chiều)</option>
                    <option value="16:00 - 18:00 (Chiều tối)">16:00 - 18:00 (Chiều tối)</option>
                    <option value="18:00 - 20:00 (Buổi tối)">18:00 - 20:00 (Buổi tối)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nội dung thiệp chúc mừng</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phương thức thanh toán</label>
                <select
                  className="form-control"
                  value={phuongThucThanhToan}
                  onChange={(e) => setPhuongThucThanhToan(e.target.value)}
                >
                  <option value="VietQR">Thanh toán Online trên web qua mã VietQR</option>
                  <option value="COD">
                    {deliveryMethod === 'ship'
                      ? 'Thanh toán tiền mặt khi shipper giao tới (COD)'
                      : 'Thanh toán tiền mặt trực tiếp tại quầy'}
                  </option>
                </select>
              </div>

              {errorMsg && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: '0.88rem',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: 13 }}
                disabled={submitting}
              >
                {submitting
                  ? 'Đang xử lý đơn hàng...'
                  : `Xác nhận đặt hoa (${formatVND(totalAmount)})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cửa sổ quét mã VietQR */}
      {qrOrder && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ textAlign: 'center', position: 'relative' }}>
            <button
              type="button"
              onClick={handleCloseQrModal}
              title="Đóng cửa sổ thanh toán"
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
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <QrCode size={36} color="#e11d48" style={{ marginBottom: 8 }} />
            <h2>Quét Mã VietQR Để Thanh Toán</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '8px 0 16px' }}>
              Đơn hàng <b>#{qrOrder.maDonHang}</b> &bull; Số tiền:{' '}
              <b style={{ color: '#e11d48' }}>{formatVND(qrOrder.tongTien)}</b>
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
              <button type="button" onClick={handleConfirmPaid} className="btn btn-sage">
                <CheckCircle size={18} />
                <span>Tôi đã chuyển khoản xong</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}