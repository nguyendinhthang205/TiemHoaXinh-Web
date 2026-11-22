import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles, Heart, Star, Eye, Settings } from 'lucide-react';
import { formatVND, getFlowerImage, getProductRatingStats } from '../services/api';
import { useApp } from '../context/AppContext';
import { COLOR_SWATCH_MAP, normalizeColorGroup } from '../utils/storeUtils';

export default function ProductCard({
  product,
  similarityScore,
  promoTag = '',
  showAdminTools = false,
  onQuickView,
}) {
  const { addToCart, wishlistIds = [], toggleWishlist } = useApp() || {};
  const id = product.maSanPham;
  const imgUrl = getFlowerImage(product);
  const stock = Number(product.soLuongTon ?? 15);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const isLiked = wishlistIds.includes(id);
  const ratingStats = getProductRatingStats(id);
  const cleanTone = normalizeColorGroup(product.tongMauSac);
  const swatchColor = COLOR_SWATCH_MAP[cleanTone] || '#f9a8d4';

  return (
    <article className="thx-prod-card">
      <div>
        <div className="thx-prod-img-wrap">
          <Link to={`/product/${id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
            <img
              src={imgUrl}
              alt={product.tenSanPham}
              className="thx-prod-img"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/flowers/rose-tulip-pastel.webp';
              }}
            />
          </Link>

          <div
            style={{
              position: 'absolute',
              top: 9,
              left: 9,
              display: 'flex',
              gap: 5,
              flexWrap: 'wrap',
              maxWidth: '72%',
            }}
          >
            {promoTag && (
              <span
                style={{
                  background: promoTag === 'Bán chạy' ? '#e11d48' : '#15803d',
                  color: '#ffffff',
                  padding: '3px 9px',
                  borderRadius: 999,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                {promoTag}
              </span>
            )}
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(6px)',
                color: '#881337',
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: '0.68rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: swatchColor,
                  border: '1px solid rgba(0,0,0,0.14)',
                }}
              />
              {cleanTone}
            </span>
          </div>

          <div className="thx-prod-quick-actions">
            <button
              type="button"
              onClick={() => toggleWishlist?.(id, product.tenSanPham)}
              aria-label={isLiked ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
              title={isLiked ? 'Bỏ yêu thích' : 'Yêu thích'}
              className="thx-prod-circle-btn"
            >
              <Heart
                size={15}
                fill={isLiked ? '#e11d48' : 'none'}
                color={isLiked ? '#e11d48' : '#4b5563'}
              />
            </button>

            {typeof onQuickView === 'function' && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                aria-label="Xem nhanh mẫu hoa"
                title="Xem nhanh"
                className="thx-prod-circle-btn"
              >
                <Eye size={15} />
              </button>
            )}
          </div>

          {typeof similarityScore === 'number' && (
            <span
              style={{
                position: 'absolute',
                bottom: 9,
                left: 9,
                background: 'rgba(22, 101, 52, 0.92)',
                color: '#ffffff',
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backdropFilter: 'blur(6px)',
              }}
            >
              <Sparkles size={12} />
              <span>AI Khớp {Math.round(similarityScore * 100)}%</span>
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: '0.72rem',
            color: '#9ca3af',
            fontWeight: 600,
            marginBottom: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {product.tenDanhMuc || 'Hoa Nghệ Thuật'}
        </div>

        <Link to={`/product/${id}`} className="thx-prod-title">
          {product.tenSanPham}
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            marginBottom: 10,
            fontSize: '0.75rem',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: '#d97706',
              fontWeight: 700,
            }}
          >
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span>{ratingStats.avg}</span>
            {ratingStats.count > 0 && (
              <span style={{ color: '#9ca3af', fontWeight: 500 }}>({ratingStats.count})</span>
            )}
          </span>

          <span
            style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: '0.71rem',
              background: isOutOfStock
                ? '#f3f4f6'
                : isLowStock
                ? '#fef3c7'
                : '#dcfce7',
              color: isOutOfStock ? '#6b7280' : isLowStock ? '#92400e' : '#166534',
            }}
          >
            {isOutOfStock
              ? 'Hết hàng'
              : isLowStock
              ? `Còn ${stock} bó`
              : `Sẵn ${stock} bó`}
          </span>
        </div>
      </div>

      <div
        className="thx-prod-footer"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 10,
          borderTop: '1px solid #f5edf0',
          gap: 8,
        }}
      >
        <span
          className="tabular-nums"
          style={{ fontWeight: 800, color: '#181316', fontSize: '1.01rem' }}
        >
          {formatVND(product.giaBan)}
        </span>

        {showAdminTools ? (
          <Link
            to={`/admin?editProduct=${id}`}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#fecdd3', color: '#be123c' }}
          >
            <Settings size={14} />
            <span>Sửa mẫu</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => addToCart?.(id, 1)}
            className="btn btn-primary btn-sm"
            disabled={isOutOfStock}
          >
            <ShoppingCart size={14} />
            <span>{isOutOfStock ? 'Hết hàng' : 'Thêm'}</span>
          </button>
        )}
      </div>
    </article>
  );
}
