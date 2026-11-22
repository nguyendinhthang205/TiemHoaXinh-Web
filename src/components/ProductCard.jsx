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

          <div className="thx-prod-top-badges">
            {promoTag && (
              <span
                className="thx-prod-promo-pill"
                style={{
                  background: promoTag === 'Bán chạy' ? '#e11d48' : '#15803d',
                }}
              >
                {promoTag}
              </span>
            )}
            <span className="thx-prod-tone-pill" title={`Tông ${cleanTone}`}>
              <span
                className="thx-prod-swatch-dot"
                style={{ background: swatchColor }}
              />
              <span className="thx-prod-tone-text">{cleanTone}</span>
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
                className="thx-prod-circle-btn thx-prod-eye-btn"
              >
                <Eye size={15} />
              </button>
            )}
          </div>

          {typeof similarityScore === 'number' && (
            <span className="thx-prod-ai-badge">
              <Sparkles size={12} />
              <span>AI {Math.round(similarityScore * 100)}%</span>
            </span>
          )}
        </div>

        <div className="thx-prod-cat">{product.tenDanhMuc || 'Hoa Nghệ Thuật'}</div>

        <Link to={`/product/${id}`} className="thx-prod-title">
          {product.tenSanPham}
        </Link>

        <div className="thx-prod-meta-row">
          <span className="thx-prod-rating">
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span>{ratingStats.avg}</span>
            {ratingStats.count > 0 && (
              <span className="thx-prod-rev-count">({ratingStats.count})</span>
            )}
          </span>

          <span
            className="thx-prod-stock-pill"
            style={{
              background: isOutOfStock
                ? '#f3f4f6'
                : isLowStock
                ? '#fef3c7'
                : '#dcfce7',
              color: isOutOfStock ? '#6b7280' : isLowStock ? '#92400e' : '#166534',
            }}
          >
            {isOutOfStock ? (
              'Hết'
            ) : (
              <>
                <span className="thx-prod-stock-prefix">
                  {isLowStock ? 'Còn ' : 'Sẵn '}
                </span>
                {stock} bó
              </>
            )}
          </span>
        </div>
      </div>

      <div className="thx-prod-footer">
        <span className="tabular-nums thx-prod-price">{formatVND(product.giaBan)}</span>

        {showAdminTools ? (
          <Link
            to={`/admin?editProduct=${id}`}
            className="btn btn-outline btn-sm thx-prod-add-btn"
            style={{ borderColor: '#fecdd3', color: '#be123c' }}
          >
            <Settings size={14} />
            <span>Sửa</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => addToCart?.(id, 1)}
            className="btn btn-primary btn-sm thx-prod-add-btn"
            disabled={isOutOfStock}
          >
            <ShoppingCart size={14} />
            <span>{isOutOfStock ? 'Hết' : 'Thêm'}</span>
          </button>
        )}
      </div>
    </article>
  );
}
