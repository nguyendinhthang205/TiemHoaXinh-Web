import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, X, ArrowRight } from 'lucide-react';
import api, {
  formatVND,
  getFlowerImage,
  applyOverridesToProductList,
} from '../services/api';
import { useApp } from '../context/AppContext';

const HOME_PRODUCTS_CACHE_KEY = 'thx_home_products_cache';

export default function WishlistDrawer() {
  const {
    wishlistOpen,
    setWishlistOpen,
    wishlistIds = [],
    toggleWishlist,
    addToCart,
  } = useApp();

  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!wishlistOpen) return;
    let active = true;

    try {
      const raw = localStorage.getItem(HOME_PRODUCTS_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProducts(applyOverridesToProductList(parsed));
      }
    } catch {
      // Bỏ qua cache lỗi
    }

    api
      .get('/SanPham')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setProducts(applyOverridesToProductList(list));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [wishlistOpen]);

  if (!wishlistOpen) return null;

  const savedProducts = products.filter((p) => wishlistIds.includes(p.maSanPham));

  return (
    <>
      <div
        className="thx-overlay-backdrop"
        onClick={() => setWishlistOpen(false)}
        aria-hidden="true"
      />
      <aside
        className="thx-overlay-drawer"
        aria-label="Danh sách mẫu hoa yêu thích"
        style={{ width: 'min(410px, 92vw)' }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 14,
              marginBottom: 14,
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#fff1f2',
                  color: '#e11d48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={18} fill="#e11d48" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                  Mẫu Hoa Yêu Thích
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                  Đã lưu {wishlistIds.length} thiết kế
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWishlistOpen(false)}
              aria-label="Đóng danh sách yêu thích"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={17} />
            </button>
          </div>

          {savedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px 16px' }}>
              <Heart size={40} color="#fecdd3" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Chưa có bó hoa nào được lưu
              </div>
              <p style={{ fontSize: '0.84rem', color: '#6b7280', marginBottom: 18 }}>
                Hãy bấm biểu tượng trái tim trên bất kỳ mẫu hoa nào bạn ưng ý để xem lại tại đây nhé!
              </p>
              <Link
                to="/#catalog"
                onClick={() => setWishlistOpen(false)}
                className="btn btn-primary btn-sm"
              >
                Khám phá bộ sưu tập <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {savedProducts.map((sp) => {
                const isOut = Number(sp.soLuongTon ?? 15) <= 0;
                return (
                  <div
                    key={sp.maSanPham}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 10,
                      borderRadius: 14,
                      border: '1px solid #f3e8ec',
                      background: '#fffafb',
                      alignItems: 'center',
                    }}
                  >
                    <Link
                      to={`/product/${sp.maSanPham}`}
                      onClick={() => setWishlistOpen(false)}
                      style={{ flexShrink: 0 }}
                    >
                      <img
                        src={getFlowerImage(sp)}
                        alt={sp.tenSanPham}
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 11,
                          objectFit: 'cover',
                        }}
                      />
                    </Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        to={`/product/${sp.maSanPham}`}
                        onClick={() => setWishlistOpen(false)}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#111827',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sp.tenSanPham}
                      </Link>
                      <div
                        className="tabular-nums"
                        style={{
                          fontWeight: 800,
                          color: '#e11d48',
                          fontSize: '0.88rem',
                          margin: '3px 0 6px',
                        }}
                      >
                        {formatVND(sp.giaBan)}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={() => addToCart(sp.maSanPham, 1)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                        >
                          <ShoppingCart size={13} />
                          <span>{isOut ? 'Hết hàng' : 'Thêm giỏ'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(sp.maSanPham, sp.tenSanPham)}
                          aria-label="Xóa khỏi yêu thích"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '5px 8px', color: '#6b7280' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
          <Link
            to="/cart"
            onClick={() => setWishlistOpen(false)}
            className="btn btn-outline"
            style={{ width: '100%' }}
          >
            <ShoppingCart size={16} />
            <span>Đi tới Giỏ hàng &amp; Thanh toán</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
