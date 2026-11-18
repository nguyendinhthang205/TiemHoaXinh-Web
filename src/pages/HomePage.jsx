import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Heart,
  ShoppingCart,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import api, { formatVND, getFlowerImage } from '../services/api';
import { useApp } from '../context/AppContext';

const FEATURED_CATEGORIES = [
  {
    id: 1,
    name: 'Bó hoa tươi nghệ thuật',
    desc: 'Các mẫu bó hoa gói giấy Hàn Quốc tinh tế phù hợp tặng sinh nhật, kỷ niệm',
  },
  {
    id: 2,
    name: 'Giỏ hoa chúc mừng',
    desc: 'Giỏ hoa mây tre đan phối hoa tươi sang trọng để bàn tiếp khách',
  },
  {
    id: 3,
    name: 'Lẵng hoa khai trương',
    desc: 'Kệ hoa chúc mừng khai trương hồng phát quy mô lớn nổi bật',
  },
  {
    id: 4,
    name: 'Hộp hoa cao cấp',
    desc: 'Hộp hoa thiết kế hiện đại kèm thiệp và ruy băng lụa tinh xảo',
  },
  {
    id: 5,
    name: 'Hoa cưới cầm tay',
    desc: 'Bó hoa cô dâu thanh lịch với hồng trắng, tulip và baby nhập khẩu',
  },
];

export default function HomePage() {
  const appCtx = useApp() || {};
  const { addToCart, user } = appCtx;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    String(user?.vaiTro || user?.role || '').toLowerCase() === 'admin' ||
    String(user?.email || '').toLowerCase().includes('admin') ||
    String(user?.hoTen || '').trim().toLowerCase() === 'admin';

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/SanPham');
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    const handleSync = () => loadProducts();
    window.addEventListener('thx_products_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('thx_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadProducts]);

  const handleQuickAdd = (sp) => {
    if (typeof addToCart === 'function' && sp?.maSanPham) {
      addToCart(sp.maSanPham, 1);
    }
  };

  const spotlightProduct =
    products.find((p) =>
      String(p.tenSanPham || '').toLowerCase().includes('công chúa')
    ) || products[0];

  return (
    <div>
      <style>{`
        .thx-hero-section {
          background: linear-gradient(135deg, #fff1f2 0%, #fffafb 55%, #ffffff 100%);
          padding: 46px 0 54px;
          border-bottom: 1px solid #fce7f3;
        }
        .thx-hero-grid {
          display: grid;
          grid-template-columns: 1.12fr 0.88fr;
          align-items: center;
          gap: 38px;
        }
        .thx-hero-title {
          font-size: clamp(1.75rem, 3.6vw, 3rem);
          line-height: 1.2;
          font-weight: 800;
          color: #111827;
          margin-bottom: 14px;
        }
        .thx-hero-desc {
          font-size: 0.95rem;
          color: #4b5563;
          line-height: 1.58;
          max-width: 520px;
          margin-bottom: 22px;
        }
        .thx-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .thx-hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #fce7f3;
        }
        .thx-spotlight-img-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 15px;
          overflow: hidden;
          background: #fff1f2;
          margin-bottom: 12px;
        }
        .thx-cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 16px;
        }
        .thx-home-products {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .thx-home-prod-img {
          height: 220px;
        }

        @media (max-width: 768px) {
          .thx-hero-section {
            padding: 18px 0 26px;
          }
          .thx-hero-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }
          .thx-hero-title {
            font-size: 1.52rem;
            line-height: 1.22;
            margin-bottom: 9px;
          }
          .thx-hero-desc {
            font-size: 0.85rem;
            line-height: 1.48;
            margin-bottom: 15px;
          }
          .thx-hero-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px;
            margin-bottom: 16px;
          }
          .thx-hero-actions > a {
            width: 100%;
            justify-content: center;
            padding: 10px 8px !important;
            font-size: 0.83rem !important;
            white-space: nowrap;
          }
          .thx-hero-stats {
            gap: 8px;
            padding-top: 12px;
          }
          .thx-hero-stat-num {
            font-size: 0.98rem !important;
          }
          .thx-hero-stat-label {
            font-size: 0.71rem !important;
            line-height: 1.28;
          }
          .thx-spotlight-card {
            padding: 12px !important;
            border-radius: 18px !important;
          }
          .thx-spotlight-img-wrap {
            aspect-ratio: 4 / 3;
            margin-bottom: 10px;
          }
          .thx-cat-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .thx-home-products {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .thx-home-prod-card {
            padding: 10px !important;
            border-radius: 16px !important;
          }
          .thx-home-prod-img {
            height: 155px;
          }
          .thx-home-prod-footer {
            flex-direction: column;
            align-items: stretch !important;
            gap: 8px;
          }
          .thx-home-prod-footer > button,
          .thx-home-prod-footer > a {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* Banner chính (Hero Section - Tối ưu hiển thị trọn vẹn trong màn hình đầu tiên) */}
      <section className="thx-hero-section">
        <div className="container thx-hero-grid">
          {/* Cột nội dung bên trái */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#ffe4e6',
                color: '#be123c',
                padding: '4px 11px',
                borderRadius: 999,
                fontSize: '0.74rem',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              <Sparkles size={13} />
              <span>
                {isAdmin
                  ? 'Chế Độ Quản Trị Viên • Tiệm Hoa Xinh 2026'
                  : 'Bộ Sưu Tập Hoa Tươi 2026 • Gợi Ý Chuẩn Gu'}
              </span>
            </div>

            <h1 className="thx-hero-title">
              Trao Gửi Yêu Thương Qua Từng{' '}
              <span style={{ color: '#e11d48', fontStyle: 'italic' }}>
                Cánh Hoa Tươi
              </span>
            </h1>

            <p className="thx-hero-desc">
              {isAdmin
                ? 'Theo dõi nhanh danh mục hoa đang mở bán hoặc truy cập Bảng điều khiển để xử lý đơn hàng và dự báo nhập hàng.'
                : 'Những thiết kế hoa bó, giỏ hoa nghệ thuật được tuyển chọn tỉ mỉ mỗi ngày, giúp bạn gửi trọn lời chúc tinh tế đến người thương trong mọi dịp đặc biệt.'}
            </p>

            {/* 2 Nút thao tác chính hướng tới mua hoa & gợi ý AI */}
            {isAdmin ? (
              <div className="thx-hero-actions">
                <Link
                  to="/admin"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 22px',
                    fontSize: '0.94rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <LayoutDashboard size={17} />
                  <span>Bảng Quản Trị</span>
                </Link>

                <Link
                  to="/shop"
                  className="btn btn-outline"
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.94rem',
                    background: '#ffffff',
                    borderColor: '#fecdd3',
                    color: '#be123c',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>Cửa hàng</span>
                  <ArrowRight size={17} />
                </Link>
              </div>
            ) : (
              <div className="thx-hero-actions">
                <Link
                  to="/shop"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 22px',
                    fontSize: '0.94rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span>Khám phá cửa hàng</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/shop?goiY=dip"
                  className="btn btn-outline"
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.94rem',
                    background: '#ffffff',
                    borderColor: '#fecdd3',
                    color: '#be123c',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <Sparkles size={16} />
                  <span>Gợi ý hoa theo dịp</span>
                </Link>
              </div>
            )}

            {/* 3 Cam kết dịch vụ dành cho khách hàng */}
            <div className="thx-hero-stats">
              <div>
                <div
                  className="thx-hero-stat-num"
                  style={{ fontSize: '1.22rem', fontWeight: 800, color: '#111827' }}
                >
                  Miễn Phí
                </div>
                <div
                  className="thx-hero-stat-label"
                  style={{ fontSize: '0.8rem', color: '#6b7280' }}
                >
                  Thiệp &amp; Banner thiết kế
                </div>
              </div>
              <div>
                <div
                  className="thx-hero-stat-num"
                  style={{ fontSize: '1.22rem', fontWeight: 800, color: '#111827' }}
                >
                  Smart AI
                </div>
                <div
                  className="thx-hero-stat-label"
                  style={{ fontSize: '0.8rem', color: '#6b7280' }}
                >
                  Gợi ý mẫu hoa chuẩn gu
                </div>
              </div>
              <div>
                <div
                  className="thx-hero-stat-num"
                  style={{ fontSize: '1.22rem', fontWeight: 800, color: '#111827' }}
                >
                  2 Giờ
                </div>
                <div
                  className="thx-hero-stat-label"
                  style={{ fontSize: '0.8rem', color: '#6b7280' }}
                >
                  Giao hoa tận tay
                </div>
              </div>
            </div>
          </div>

          {/* Cột thẻ hoa nổi bật bên phải (tỷ lệ 4:3 gọn gàng) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="panel thx-spotlight-card"
              style={{
                width: '100%',
                maxWidth: 430,
                padding: 15,
                borderRadius: 22,
                boxShadow: '0 20px 45px rgba(225, 29, 72, 0.1)',
                background: '#ffffff',
              }}
            >
              <div className="thx-spotlight-img-wrap">
                <img
                  src={
                    spotlightProduct
                      ? getFlowerImage(spotlightProduct)
                      : 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={spotlightProduct?.tenSanPham || 'Bó Hồng Pastel Công Chúa'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.96rem',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {spotlightProduct?.tenSanPham || 'Bó Hồng Pastel Công Chúa'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                    Thiết kế bán chạy nhất mùa lễ
                  </div>
                </div>

                <Link
                  to={
                    spotlightProduct
                      ? `/product/${spotlightProduct.maSanPham}`
                      : '/shop'
                  }
                  className="btn btn-primary btn-sm"
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Xem &amp; Gợi ý AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danh mục hoa nổi bật */}
      <section className="container" style={{ marginTop: 36 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.45rem', marginBottom: 4 }}>Danh Mục Hoa Nổi Bật</h2>
            <p style={{ fontSize: '0.86rem', color: '#6b7280' }}>
              Lựa chọn kiểu dáng hoa phù hợp với không gian và thông điệp của bạn
            </p>
          </div>
          <Link
            to="/shop"
            style={{
              color: '#e11d48',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
            }}
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        <div className="thx-cat-grid">
          {FEATURED_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?danhMuc=${cat.id}`}
              className="panel"
              style={{
                padding: 16,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  background: '#fff1f2',
                  color: '#e11d48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Heart size={17} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.94rem', marginBottom: 3 }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: '0.79rem', color: '#6b7280', lineHeight: 1.45 }}>
                  {cat.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bộ sưu tập hoa tươi tiêu biểu (Đặt câu hướng dẫn AI ngay trên lưới sản phẩm) */}
      <section className="container" style={{ marginTop: 40, marginBottom: 76 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.45rem', marginBottom: 4 }}>Mẫu Hoa Tươi Tuyển Chọn</h2>
            <p style={{ fontSize: '0.86rem', color: '#6b7280' }}>
              Bấm vào bất kỳ mẫu hoa nào để xem hệ thống AI gợi ý các bó hoa đồng điệu nhất
            </p>
          </div>
          <Link to="/shop" className="btn btn-outline btn-sm">
            Khám phá toàn bộ cửa hàng
          </Link>
        </div>

        {loading ? (
          <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
            Đang tải danh sách mẫu hoa...
          </div>
        ) : (
          <div className="thx-home-products">
            {products.slice(0, 8).map((sp) => (
              <div
                key={sp.maSanPham}
                className="panel thx-home-prod-card"
                style={{
                  padding: 14,
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <Link
                    to={`/product/${sp.maSanPham}`}
                    style={{ display: 'block', position: 'relative', marginBottom: 10 }}
                  >
                    <img
                      src={getFlowerImage(sp)}
                      alt={sp.tenSanPham}
                      className="thx-home-prod-img"
                      style={{
                        width: '100%',
                        objectFit: 'cover',
                        borderRadius: 13,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(255, 255, 255, 0.92)',
                        color: '#be123c',
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {sp.tongMauSac || 'Tông Hồng'}
                    </span>
                  </Link>

                  <Link
                    to={`/product/${sp.maSanPham}`}
                    style={{
                      textDecoration: 'none',
                      color: '#111827',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {sp.tenSanPham}
                  </Link>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 10 }}>
                    Còn lại: {sp.soLuongTon ?? 20} bó
                  </div>
                </div>

                <div
                  className="thx-home-prod-footer"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    borderTop: '1px solid #f3f4f6',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#e11d48', fontSize: '0.98rem' }}>
                    {formatVND(sp.giaBan)}
                  </span>

                  {isAdmin ? (
                    <Link to="/admin" className="btn btn-outline btn-sm">
                      <Settings size={14} />
                      <span>Quản lý</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(sp)}
                      className="btn btn-primary btn-sm"
                      disabled={sp.soLuongTon === 0}
                    >
                      <ShoppingCart size={14} />
                      <span>Thêm</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}