import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Truck,
  Store,
  Ticket,
  Check,
  Star,
  Sparkles,
  Heart,
} from 'lucide-react';
import api, {
  formatVND,
  getFlowerImage,
  writeOrderMeta,
  saveProductReview,
} from '../services/api';
import { useApp } from '../context/AppContext';
import { STORE_INFO } from '../utils/storeUtils';
import VietQrPaymentModal from '../components/VietQrPaymentModal';

const SHIPPING_RATE_PER_KM = STORE_INFO.shippingRatePerKm;
const SHOP_PICKUP_ADDRESS = STORE_INFO.address;

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

const QUICK_REVIEW_TAGS = [
  'Mẫu hoa đẹp, phối màu tinh tế',
  'Đặt hoa nhanh gọn, tư vấn nhiệt tình',
  'Rất hài lòng với chất lượng hoa tươi',
];

export default function CartPage() {
  const {
    user,
    cartItems,
    fetchCart,
    updateCartItemQty,
    removeCartItem,
    clearEntireCart,
    showToast,
  } = useApp();
  const navigate = useNavigate();

  const getDefaultDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [stockMap, setStockMap] = useState({});
  const [tenNguoiNhan, setTenNguoiNhan] = useState(user?.hoTen || '');
  const [sdtNguoiNhan, setSdtNguoiNhan] = useState(user?.soDienThoai || '0905111222');

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

  const [postOrderReviewData, setPostOrderReviewData] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittingReviews, setSubmittingReviews] = useState(false);

  useEffect(() => {
    if (user) {
      setTenNguoiNhan((prev) => prev || user.hoTen || '');
      if (user.soDienThoai) setSdtNguoiNhan(user.soDienThoai);
      if (user.diaChi) setDiaChiGiao(user.diaChi);
    }
  }, [user]);

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
      await updateCartItemQty(item, newQty);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể cập nhật số lượng';
      setErrorMsg(msg);
      showToast(msg, 'error');
    }
  };

  const removeItem = async (item) => {
    setErrorMsg('');
    try {
      await removeCartItem(item);
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
      await clearEntireCart();
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

  const hasOverStock = cartItems.some((item) => {
    const stock = stockMap[item.maSanPham];
    return typeof stock === 'number' && item.soLuong > stock;
  });

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

  const nextVoucherUnlock = STORE_VOUCHERS.filter(
    (v) => v.minSubtotal > flowerSubtotal
  ).sort((a, b) => a.minSubtotal - b.minSubtotal)[0];

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

  const openPostCheckoutReview = (orderId, orderedItems) => {
    const initialDrafts = {};
    (orderedItems || []).forEach((it) => {
      initialDrafts[it.maSanPham] = {
        rating: 5,
        comment: 'Bó hoa rất đẹp, tư vấn nhiệt tình!',
      };
    });
    setReviewDrafts(initialDrafts);
    setPostOrderReviewData({
      maDonHang: orderId,
      items: orderedItems || [],
    });
  };

  const handleSubmitPostOrderReviews = async (e) => {
    e.preventDefault();
    if (!postOrderReviewData?.items?.length) {
      setPostOrderReviewData(null);
      navigate('/my-orders');
      return;
    }

    try {
      setSubmittingReviews(true);
      const reviewerName =
        user?.hoTen || tenNguoiNhan.trim() || user?.email || 'Khách hàng';

      for (const item of postOrderReviewData.items) {
        const draft = reviewDrafts[item.maSanPham] || { rating: 5, comment: '' };
        const text = String(draft.comment || '').trim();
        if (text) {
          await saveProductReview(item.maSanPham, {
            userName: reviewerName,
            rating: draft.rating || 5,
            comment: text,
            isVerifiedBuyer: true,
          });
        }
      }

      showToast('Cảm ơn bạn! Đánh giá đã được lưu và hiển thị trên mẫu hoa.');
      setPostOrderReviewData(null);
      navigate('/my-orders');
    } finally {
      setSubmittingReviews(false);
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
    if (hasOverStock) {
      const msg = 'Một số bó hoa vượt quá số lượng tồn kho hiện có. Vui lòng điều chỉnh lại số lượng.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    const orderedSnapshot = cartItems.map((it) => {
      const rawImg = it.hinhAnhChinh || it.anhChinh || '';
      return {
        maSanPham: it.maSanPham,
        tenSanPham: it.tenSanPham,
        giaBan: it.giaBan || it.donGia || 0,
        soLuong: it.soLuong || 1,
        ...(rawImg && !String(rawImg).startsWith('data:image/')
          ? { hinhAnhChinh: rawImg }
          : {}),
      };
    });

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

    const curatedLocalItems = cartItems.filter((it) => it.isCuratedLocal);
    const curatedTag =
      curatedLocalItems.length > 0
        ? ` | [Mẫu tuyển chọn: ${curatedLocalItems
            .map((it) => `${it.tenSanPham} x${it.soLuong || 1}`)
            .join(', ')}]`
        : '';

    const fullNote = `${
      ghiChu.trim() ? `${ghiChu.trim()} | ` : ''
    }${shippingTag}${voucherTag}${curatedTag}`;

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
      const hasServerCartItem = cartItems.some((it) => !it.isCuratedLocal);
      if (!hasServerCartItem && curatedLocalItems.length > 0) {
        const proxyCandidates = Array.from(
          new Set([curatedLocalItems[0].checkoutProxyId || 24, 24, 1, 2, 3].filter(Boolean))
        );
        for (const candidateId of proxyCandidates) {
          try {
            await api.post('/GioHang', {
              maSanPham: candidateId,
              soLuong: 1,
            });
            break;
          } catch {
            // Thử sản phẩm đại diện khác nếu hết tồn kho backend
          }
        }
      }

      const res = await api.post('/DonHang', payload);
      await clearEntireCart();
      const created = res.data?.donHang || res.data;
      const orderId = created?.maDonHang || created?.id || '';
      const baseFlowerMoney =
        curatedLocalItems.length > 0
          ? flowerSubtotal
          : Number(created?.tongThanhToan) > 0
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
        orderedItems: orderedSnapshot,
      });

      if (phuongThucThanhToan === 'VietQR') {
        setQrOrder({
          maDonHang: orderId,
          tongTien: finalMoney,
          qrUrl: '/images/vietqr-vietinbank.jpg',
          items: orderedSnapshot,
        });
      } else {
        showToast('Đặt hàng thành công! Hãy chia sẻ cảm nhận về bó hoa nhé.');
        openPostCheckoutReview(orderId, orderedSnapshot);
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
    const items = qrOrder?.items || [];
    const orderId = qrOrder?.maDonHang || '';
    setQrOrder(null);
    openPostCheckoutReview(orderId, items);
  };

  const handleConfirmPaid = async () => {
    const items = qrOrder?.items || [];
    const orderId = qrOrder?.maDonHang || '';
    if (orderId) {
      await writeOrderMeta(orderId, {
        isPaid: true,
        paymentMethod: 'VietQR',
      });
    }
    setQrOrder(null);
    showToast('Xác nhận thanh toán VietQR thành công!');
    openPostCheckoutReview(orderId, items);
  };

  if (!user) {
    return (
      <div className="container" style={{ marginTop: 48, marginBottom: 48 }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48, maxWidth: 540, margin: '0 auto' }}>
          <ShoppingBag size={42} color="#e11d48" style={{ marginBottom: 12 }} />
          <h2>Vui lòng đăng nhập để xem giỏ hàng</h2>
          <p style={{ color: '#6b7280', margin: '10px 0 20px', fontSize: '0.92rem' }}>
            Đăng nhập tài khoản để lưu giỏ hoa, áp dụng Voucher ưu đãi và thanh toán nhanh qua VietQR.
          </p>
          <Link to="/login" className="btn btn-primary">
            Đi tới trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const currentCheckoutStep = qrOrder ? 3 : cartItems.length > 0 ? 2 : 1;

  return (
    <div className="container" style={{ marginTop: 28, marginBottom: 56 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <h1 style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.1rem)' }}>
          Giỏ Hàng &amp; Thanh Toán
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {[
            { num: 1, label: 'Chọn hoa' },
            { num: 2, label: 'Giao nhận & Thiệp' },
            { num: 3, label: 'Hoàn tất' },
          ].map((s, idx) => {
            const active = currentCheckoutStep >= s.num;
            return (
              <React.Fragment key={s.num}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: active ? '#be123c' : '#9ca3af',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: active ? '#e11d48' : '#f3f4f6',
                      color: active ? '#ffffff' : '#6b7280',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.73rem',
                      fontWeight: 800,
                    }}
                  >
                    {s.num}
                  </span>
                  <span>{s.label}</span>
                </span>
                {idx < 2 && <span style={{ color: '#d1d5db' }}>&rarr;</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {cartItems.length === 0 && !qrOrder && !postOrderReviewData ? (
        <div className="panel" style={{ textAlign: 'center', padding: 52 }}>
          <ShoppingBag size={42} color="#fecdd3" style={{ marginBottom: 12 }} />
          <h3 style={{ marginBottom: 6 }}>Giỏ hàng của bạn hiện đang trống</h3>
          <p style={{ color: '#6b7280', marginBottom: 18, fontSize: '0.9rem' }}>
            Hãy chọn một bó hoa tươi thắm hoặc nhờ Smart AI gợi ý theo dịp tặng nhé!
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/#catalog" className="btn btn-primary">
              Chọn hoa ngay
            </Link>
            <Link to="/shop?goiY=dip#ai-concierge" className="btn btn-outline">
              <Sparkles size={15} /> Smart AI Chọn Hoa
            </Link>
          </div>
        </div>
      ) : (
        <div className="thx-cart-layout">
          {/* Cột 1: Danh sách sản phẩm + Voucher + Tóm tắt tiền */}
          <div className="panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h3>Danh sách bó hoa ({cartItems.length})</h3>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllCart}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fecaca' }}
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {cartItems.map((item) => {
              const stock = stockMap[item.maSanPham];
              const overStock = typeof stock === 'number' && item.soLuong > stock;
              return (
                <div key={item.maSanPham} className="thx-cart-item-row">
                  <img
                    src={getFlowerImage(item)}
                    alt={item.tenSanPham}
                    style={{ width: 66, height: 66, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to={`/product/${item.maSanPham}`}
                      style={{ fontWeight: 700, color: '#181316', display: 'block', lineHeight: 1.35 }}
                    >
                      {item.tenSanPham}
                    </Link>
                    <div
                      className="tabular-nums"
                      style={{ color: '#e11d48', fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}
                    >
                      {formatVND(item.giaBan || item.donGia)}
                    </div>
                    {typeof stock === 'number' && (
                      <div
                        style={{
                          fontSize: '0.77rem',
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
                              fontSize: '0.77rem',
                            }}
                          >
                            (Giảm về {stock} bó)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="thx-cart-item-actions">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, item.soLuong - 1)}
                        className="btn btn-outline btn-sm"
                      >
                        -
                      </button>
                      <span className="tabular-nums" style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
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
                      aria-label="Xóa khỏi giỏ"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Chọn Voucher ưu đãi 1 chạm */}
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 16,
                background: '#fffafb',
                border: '1px solid #fce7f3',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
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
                      color: '#6b7280',
                      fontSize: '0.76rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>

              {nextVoucherUnlock && (
                <div
                  style={{
                    fontSize: '0.77rem',
                    color: '#9f1239',
                    background: '#fff1f2',
                    padding: '6px 10px',
                    borderRadius: 10,
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  Thêm <b>{formatVND(nextVoucherUnlock.minSubtotal - flowerSubtotal)}</b> tiền hoa để mở khóa mã{' '}
                  <b>{nextVoucherUnlock.badge}</b>!
                </div>
              )}

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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
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
                      <div style={{ fontSize: '0.73rem', color: '#4b5563', lineHeight: 1.3 }}>
                        {v.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>Tạm tính tiền hoa:</span>
                <b className="tabular-nums">{formatVND(flowerSubtotal)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                <span>
                  {deliveryMethod === 'ship'
                    ? `Phí ship tận nơi (${validKm} km × 5.000 đ/km):`
                    : 'Phí nhận tại cửa hàng:'}
                </span>
                <b className="tabular-nums" style={{ color: shippingFee === 0 ? '#16a34a' : '#181316' }}>
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
                  <b className="tabular-nums">-{formatVND(discountAmount)}</b>
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
                <span className="tabular-nums" style={{ color: '#e11d48' }}>
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Cột 2: Form thông tin nhận hoa & Xem trước thiệp */}
          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>Thông tin nhận hoa &amp; Lời chúc</h3>
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
                    }}
                  >
                    <Truck size={20} />
                    <span>Ship tận nơi</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>5.000 đ / km</span>
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
                    }}
                  >
                    <Store size={20} />
                    <span>Tới tiệm lấy</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#16a34a' }}>
                      Miễn phí ship (0 đ)
                    </span>
                  </button>
                </div>
              </div>

              <div className="thx-two-col">
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
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        step="0.5"
                        className="form-control"
                        required
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                        style={{ maxWidth: 105 }}
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
                    fontSize: '0.86rem',
                    marginBottom: 14,
                  }}
                >
                  <b>Địa chỉ nhận hoa tại tiệm:</b> {SHOP_PICKUP_ADDRESS} ({STORE_INFO.openHours}).
                </div>
              )}

              <div className="thx-two-col">
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
                <label className="form-label">Nội dung thiệp chúc mừng (Tặng miễn phí)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                />
                {ghiChu.trim() && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #fffdfb 0%, #fff1f2 100%)',
                      border: '1px dashed #fda4af',
                      fontSize: '0.82rem',
                      color: '#881337',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#be123c',
                        marginBottom: 4,
                      }}
                    >
                      <Heart size={12} fill="#be123c" />
                      <span>Xem trước thiệp viết tay gửi {tenNguoiNhan || 'người nhận'}</span>
                    </div>
                    <div className="serif-title" style={{ fontStyle: 'italic', fontSize: '0.94rem' }}>
                      “{ghiChu.trim()}”
                    </div>
                  </div>
                )}
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
                    fontSize: '0.87rem',
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
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={submitting || hasOverStock}
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
      <VietQrPaymentModal
        order={qrOrder}
        onClose={handleCloseQrModal}
        onConfirmPaid={handleConfirmPaid}
        showToast={showToast}
      />

      {/* Cửa sổ Đánh giá bó hoa ngay sau khi đặt hàng thành công */}
      {postOrderReviewData && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: 540,
              width: '94%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              position: 'relative',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <CheckCircle size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 4 }}>
                Đặt Hoa Thành Công {postOrderReviewData.maDonHang ? `(#${postOrderReviewData.maDonHang})` : ''}!
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#6b7280' }}>
                Chia sẻ nhanh đánh giá của bạn để hiển thị cho các khách hàng khác khi xem mẫu hoa nhé
              </p>
            </div>

            <form onSubmit={handleSubmitPostOrderReviews}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                {postOrderReviewData.items.map((item) => {
                  const draft = reviewDrafts[item.maSanPham] || {
                    rating: 5,
                    comment: '',
                  };
                  return (
                    <div
                      key={item.maSanPham}
                      style={{
                        border: '1px solid #fce7f3',
                        background: '#fffafb',
                        borderRadius: 14,
                        padding: 13,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <img
                          src={getFlowerImage(item)}
                          alt={item.tenSanPham}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            objectFit: 'cover',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                            {item.tenSanPham}
                          </div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() =>
                                  setReviewDrafts((prev) => ({
                                    ...prev,
                                    [item.maSanPham]: { ...draft, rating: starVal },
                                  }))
                                }
                                style={{
                                  background: 'transparent',
                                  padding: 2,
                                }}
                              >
                                <Star
                                  size={20}
                                  fill={starVal <= draft.rating ? '#f59e0b' : 'none'}
                                  color={starVal <= draft.rating ? '#f59e0b' : '#d1d5db'}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {QUICK_REVIEW_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setReviewDrafts((prev) => ({
                                ...prev,
                                [item.maSanPham]: { ...draft, comment: tag },
                              }))
                            }
                            style={{
                              fontSize: '0.73rem',
                              padding: '3px 9px',
                              borderRadius: 999,
                              border: '1px solid #fecdd3',
                              background: '#ffffff',
                              color: '#be123c',
                            }}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Nhập cảm nhận của bạn về mẫu hoa này..."
                        value={draft.comment}
                        onChange={(e) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [item.maSanPham]: { ...draft, comment: e.target.value },
                          }))
                        }
                        style={{ fontSize: '0.85rem', background: '#ffffff' }}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPostOrderReviewData(null);
                    navigate('/my-orders');
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Bỏ qua &amp; Xem đơn hàng
                </button>
                <button
                  type="submit"
                  disabled={submittingReviews}
                  className="btn btn-primary btn-sm"
                >
                  {submittingReviews ? 'Đang lưu...' : 'Gửi đánh giá & Xem đơn hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
