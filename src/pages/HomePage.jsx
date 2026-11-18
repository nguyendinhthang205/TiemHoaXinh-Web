import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  MessageCircle,
  Heart,
  ShoppingCart,
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
  const { addToCart } = appCtx;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleOpenChat = () => {
    window.dispatchEvent(new Event('thx_open_customer_chat'));
  };

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
      {/* Banner chính (Hero Section) */}
      <section
        style={{
          background: 'linear-gradient(135deg, #fff1f2 0%, #fffafb 55%, #ffffff 100%)',
          padding: '54px 0 64px',
          borderBottom: '1px solid #fce7f3',
        }}
      >
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: 40,
          }}
        >
          {/* Cột nội dung bên trái */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: '#ffe4e6',
                color: '#be123c',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: 18,
              }}
            >
              <Sparkles size={14} />
              <span>Bộ Sưu Tập Hoa Tươi 2026 &bull; Tích hợp AI Gợi Ý</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.15rem)',
                lineHeight: 1.18,
                fontWeight: 800,
                color: '#111827',
                marginBottom: 18,
              }}
            >
              Trao Gửi Yêu Thương Qua Từng{' '}
              <span style={{ color: '#e11d48', fontStyle: 'italic' }}>
                Cánh Hoa Tươi
              </span>
            </h1>

            <p
              style={{
                fontSize: '1rem',
                color: '#4b5563',
                lineHeight: 1.65,
                maxWidth: 530,
                marginBottom: 28,
              }}
            >
              Những thiết kế hoa bó, giỏ hoa nghệ thuật được tuyển chọn tỉ mỉ mỗi ngày.
              Bấm vào bất kỳ mẫu hoa nào để xem hệ thống AI gợi ý các bó hoa đồng điệu nhất.
            </p>

            {/* 2 Nút thao tác chính: Khám phá cửa hàng & Nhắn với Admin */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link
                to="/shop"
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '0.96rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Khám phá cửa hàng</span>
                <ArrowRight size={18} />
              </Link>

              <button
                type="button"
                onClick={handleOpenChat}
                className="btn btn-outline"
                style={{
                  padding: '12px 22px',
                  fontSize: '0.96rem',
                  background: '#ffffff',
                  borderColor: '#fecdd3',
                  color: '#be123c',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MessageCircle size={18} />
                <span>Nhắn với Admin</span>
              </button>
            </div>

            {/* 3 Chỉ số nổi bật */}
            <div
              style={{
                display: 'flex',
                gap: 32,
                flexWrap: 'wrap',
                paddingTop: 18,
                borderTop: '1px solid #fce7f3',
              }}
            >
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
                  {products.length > 0 ? `${products.length}+` : '20+'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  Mẫu hoa nghệ thuật
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
                  TF-IDF AI
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  Gợi ý tương đồng thông minh
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>
                  2 Giờ
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  Giao hoa tươi tận tay
                </div>
              </div>
            </div>
          </div>

          {/* Cột thẻ hoa nổi bật bên phải */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="panel"
              style={{
                width: '100%',
                maxWidth: 430,
                padding: 18,
                borderRadius: 24,
                boxShadow: '0 20px 45px rgba(225, 29, 72, 0.1)',
                background: '#ffffff',
              }}
            >
              <div
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  height: 330,
                  background: '#fff1f2',
                  marginBottom: 16,
                }}
              >
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
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>
                    {spotlightProduct?.tenSanPham || 'Bó Hồng Pastel Công Chúa'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
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
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Xem &amp; Gợi ý AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danh mục hoa nổi bật */}
      <section className="container" style={{ marginTop: 48 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: 4 }}>Danh Mục Hoa Nổi Bật</h2>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Lựa chọn kiểu dáng hoa phù hợp với không gian và thông điệp của bạn
            </p>
          </div>
          <Link
            to="/shop"
            style={{
              color: '#e11d48',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 16,
          }}
        >
          {FEATURED_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?danhMuc=${cat.id}`}
              className="panel"
              style={{
                padding: 18,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                transition: 'transform 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: '#fff1f2',
                  color: '#e11d48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Heart size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem', marginBottom: 4 }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.45 }}>
                  {cat.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bộ sưu tập hoa tươi tiêu biểu */}
      <section className="container" style={{ marginTop: 48, marginBottom: 60 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: 4 }}>Mẫu Hoa Tươi Tuyển Chọn</h2>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Cập nhật mẫu mới mỗi ngày &bull; Bấm xem chi tiết để nhận gợi ý phối hoa bằng AI
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 20,
            }}
          >
            {products.slice(0, 8).map((sp) => (
              <div
                key={sp.maSanPham}
                className="panel"
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
                    style={{ display: 'block', position: 'relative', marginBottom: 12 }}
                  >
                    <img
                      src={getFlowerImage(sp)}
                      alt={sp.tenSanPham}
                      style={{
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                        borderRadius: 14,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'rgba(255, 255, 255, 0.92)',
                        color: '#be123c',
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: '0.75rem',
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
                      fontSize: '1.02rem',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {sp.tenSanPham}
                  </Link>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 12 }}>
                    Còn lại: {sp.soLuongTon ?? 20} bó
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    borderTop: '1px solid #f3f4f6',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#e11d48', fontSize: '1.05rem' }}>
                    {formatVND(sp.giaBan)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(sp)}
                    className="btn btn-primary btn-sm"
                    disabled={sp.soLuongTon === 0}
                  >
                    <ShoppingCart size={14} />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}