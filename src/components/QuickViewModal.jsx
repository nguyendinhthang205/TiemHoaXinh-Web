import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Gift,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Settings,
} from 'lucide-react';
import { formatVND, getFlowerImage, getProductRatingStats } from '../services/api';
import { useApp } from '../context/AppContext';
import { COLOR_SWATCH_MAP, isAdminAccount, normalizeColorGroup } from '../utils/storeUtils';

export default function QuickViewModal({ product, onClose }) {
  const { user, addToCart, wishlistIds = [], toggleWishlist } = useApp() || {};
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const isAdmin = isAdminAccount(user);
  const stock = Number(product.soLuongTon ?? 15);
  const isOutOfStock = stock <= 0;
  const isLiked = wishlistIds.includes(product.maSanPham);
  const ratingStats = getProductRatingStats(product.maSanPham);
  const cleanTone = normalizeColorGroup(product.tongMauSac);
  const swatchHex = COLOR_SWATCH_MAP[cleanTone] || '#f9a8d4';

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="modal-box"
        style={{ maxWidth: 740, padding: 0, overflow: 'hidden', position: 'relative' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng xem nhanh"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
          }}
        >
          <X size={17} />
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          }}
        >
          <div style={{ background: '#fff5f7', position: 'relative', minHeight: 320 }}>
            <img
              src={getFlowerImage(product)}
              alt={product.tenSanPham}
              style={{ width: '100%', height: '100%', maxHeight: 430, objectFit: 'cover', display: 'block' }}
            />
            <span
              className="badge badge-rose"
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: 'rgba(255, 255, 255, 0.94)',
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: swatchHex,
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              />
              {cleanTone}
            </span>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge badge-rose">{product.tenDanhMuc || 'Hoa Nghệ Thuật'}</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#f59e0b',
                }}
              >
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span>{ratingStats.avg}</span>
                {ratingStats.count > 0 && (
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>({ratingStats.count})</span>
                )}
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem', lineHeight: 1.25, color: '#111827' }}>
              {product.tenSanPham}
            </h2>

            <div
              className="tabular-nums"
              style={{ fontSize: '1.45rem', fontWeight: 800, color: '#e11d48' }}
            >
              {formatVND(product.giaBan)}
            </div>

            <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.6 }}>
              {product.moTa ||
                'Bó hoa tươi tuyển chọn trong ngày, phối màu tinh tế, tặng kèm thiệp chúc mừng viết tay và gói dưỡng hoa.'}
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                background: '#fffafb',
                border: '1px solid #fce7f3',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#374151',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Truck size={14} color="#e11d48" />
                <span>Giao hỏa tốc 2 giờ nội thành • 0đ khi nhận tại tiệm</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Gift size={14} color="#e11d48" />
                <span>Tặng kèm thiệp thiết kế &amp; gửi ảnh duyệt trước khi giao</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span>
                  {isOutOfStock ? 'Tạm hết hàng' : `Sẵn sàng giao ngay (Còn ${stock} bó)`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 6 }}>
              {isAdmin ? (
                <Link
                  to={`/admin?editProduct=${product.maSanPham}`}
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Settings size={16} />
                  <span>Chỉnh sửa mẫu hoa này</span>
                </Link>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: 11,
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      style={{ padding: '8px 12px', background: '#ffffff', fontWeight: 700 }}
                    >
                      -
                    </button>
                    <span style={{ padding: '0 10px', fontWeight: 700 }}>{qty}</span>
                    <button
                      type="button"
                      disabled={isOutOfStock || qty >= stock}
                      onClick={() => setQty((q) => Math.min(stock, q + 1))}
                      style={{ padding: '8px 12px', background: '#ffffff', fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={async () => {
                      const ok = await addToCart(product.maSanPham, qty);
                      if (ok) onClose?.();
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    <ShoppingCart size={16} />
                    <span>{isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => toggleWishlist?.(product.maSanPham, product.tenSanPham)}
                aria-label="Lưu vào yêu thích"
                className="btn btn-outline"
                style={{ padding: '10px 12px', borderColor: isLiked ? '#fda4af' : '#e5e7eb' }}
              >
                <Heart
                  size={17}
                  fill={isLiked ? '#e11d48' : 'none'}
                  color={isLiked ? '#e11d48' : '#6b7280'}
                />
              </button>
            </div>

            <Link
              to={`/product/${product.maSanPham}`}
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: '0.83rem',
                fontWeight: 700,
                color: '#be123c',
                paddingTop: 4,
              }}
            >
              <Sparkles size={14} />
              <span>Xem chi tiết &amp; Gợi ý phối hoa Smart AI</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
