import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowDown,
  ShoppingCart,
  LayoutDashboard,
  Settings,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Gift,
  Wallet,
  Palette,
  Heart,
  Star,
} from 'lucide-react';
import api, { formatVND, getFlowerImage } from '../services/api';
import { useApp } from '../context/AppContext';

const WISHLIST_STORAGE_KEY = 'thx_wishlist_ids';

const CATEGORY_RULES = {
  'sinh-nhat': {
    title: 'Hoa Sinh Nhật',
    keywords: ['sinh nhật', 'pastel', 'hồng', 'tulip', 'baby', 'công chúa', 'ngọt ngào', 'dâu', 'hướng dương'],
    categories: [1, 4],
  },
  'khai-truong': {
    title: 'Hoa Khai Trương',
    keywords: ['khai trương', 'hồng phát', 'đại cát', 'kệ hoa', 'lẵng hoa', 'vàng', 'đỏ', 'hướng dương', 'lan hồ điệp'],
    categories: [2, 3],
  },
  'lan-ho-diep': {
    title: 'Lan Hồ Điệp',
    keywords: ['lan hồ điệp', 'lan'],
    categories: [2, 3],
  },
  'chu-de': {
    title: 'Hoa Theo Chủ Đề',
    keywords: ['tình yêu', 'tri ân', 'cưới', 'chúc mừng', 'kỷ niệm', 'hồng'],
    categories: [1, 2, 4, 5],
  },
  'thiet-ke': {
    title: 'Thiết Kế Hoa Tươi',
    keywords: [],
    categories: [1, 2, 3, 4, 5],
  },
  'hoa-tuoi': {
    title: 'Các Loài Hoa Tươi',
    keywords: ['hồng', 'hướng dương', 'tulip', 'baby', 'lan'],
    categories: [1, 2, 3, 4, 5],
  },
};

const OCCASION_OPTIONS = [
  { id: '', label: 'Tất cả dịp' },
  { id: 'sinh-nhat', label: '🎂 Sinh nhật' },
  { id: 'khai-truong', label: '🎉 Khai trương' },
  { id: 'lan-ho-diep', label: '🪴 Lan Hồ Điệp' },
  { id: 'chu-de', label: '❤️ Tình yêu & Tri ân' },
];

const BUDGET_OPTIONS = [
  { id: '', label: 'Tất cả ngân sách' },
  { id: 'under-400', label: 'Dưới 400.000đ' },
  { id: '400-700', label: '400.000đ – 700.000đ' },
  { id: 'over-700', label: 'Trên 700.000đ' },
];

function readWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const appCtx = useApp() || {};
  const { addToCart, user, showToast } = appCtx;
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const catalogRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(() => readWishlist());

  // Trạng thái bộ lọc hợp nhất ngay trên Trang chủ
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [activeNavCat, setActiveNavCat] = useState(searchParams.get('cat') || '');
  const [subQuery, setSubQuery] = useState(searchParams.get('sub') || '');
  const [subLabel, setSubLabel] = useState(searchParams.get('subLabel') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('dm') || '');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const isAdmin =
    String(user?.vaiTro || user?.role || '').toLowerCase() === 'admin' ||
    String(user?.email || '').toLowerCase().includes('admin') ||
    String(user?.hoTen || '').trim().toLowerCase() === 'admin';

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [spRes, dmRes] = await Promise.all([
        api.get('/SanPham'),
        api.get('/DanhMuc').catch(() => ({ data: [] })),
      ]);
      const list = Array.isArray(spRes.data) ? spRes.data : spRes.data?.items || [];
      setProducts(list);
      setCategories(Array.isArray(dmRes.data) ? dmRes.data : []);
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

  // Đồng bộ khi người dùng chọn danh mục trên thanh ngang hoặc tìm kiếm trên Header
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const catParam = searchParams.get('cat') || '';
    const dmParam = searchParams.get('dm') || '';
    const subParam = searchParams.get('sub') || '';
    const subLabelParam = searchParams.get('subLabel') || '';

    setKeyword(qParam);
    setActiveNavCat(catParam);
    setSelectedCategory(dmParam);
    setSubQuery(subParam);
    setSubLabel(subLabelParam);

    if (location.hash === '#catalog' || qParam || catParam || dmParam || subParam) {
      setTimeout(() => {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchParams, location.hash]);

  const toggleWishlist = (productId, productName) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Bỏ qua
      }
      if (typeof showToast === 'function') {
        showToast(
          exists
            ? `Đã bỏ "${productName}" khỏi danh sách yêu thích`
            : `Đã thêm "${productName}" vào yêu thích ❤️`
        );
      }
      return next;
    });
  };

  const handleQuickAdd = (sp) => {
    if (typeof addToCart === 'function' && sp?.maSanPham) {
      addToCart(sp.maSanPham, 1);
    }
  };

  const resetAllFilters = () => {
    setKeyword('');
    setActiveNavCat('');
    setSubQuery('');
    setSubLabel('');
    setSelectedCategory('');
    setSelectedColor('');
    setSelectedBudget('');
    setSortBy('default');
    setSearchParams({});
  };

  const uniqueColors = Array.from(
    new Set(products.map((p) => p.tongMauSac).filter(Boolean))
  );

  // Lọc theo danh mục thanh ngang + từ khóa con + bộ lọc AI
  const filteredProducts = products
    .filter((p) => {
      const price = Number(p.giaBan || 0);
      const text = `${p.tenSanPham || ''} ${p.moTa || ''} ${
        p.tongMauSac || ''
      }`.toLowerCase();

      if (keyword && !text.includes(keyword.toLowerCase())) return false;
      if (selectedCategory && String(p.maDanhMuc) !== String(selectedCategory)) {
        return false;
      }
      if (selectedColor && p.tongMauSac !== selectedColor) return false;

      if (selectedBudget === 'under-400' && !(price < 400000)) return false;
      if (selectedBudget === '400-700' && !(price >= 400000 && price <= 700000)) {
        return false;
      }
      if (selectedBudget === 'over-700' && !(price > 700000)) return false;

      if (subQuery) {
        const subKw = subQuery.toLowerCase();
        if (!text.includes(subKw)) return false;
      } else if (activeNavCat && CATEGORY_RULES[activeNavCat]) {
        const rule = CATEGORY_RULES[activeNavCat];
        const matchKeyword = rule.keywords.some((kw) => text.includes(kw));
        const matchCatId = rule.categories.includes(Number(p.maDanhMuc));
        if (!matchKeyword && !matchCatId) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.giaBan - b.giaBan;
      if (sortBy === 'price-desc') return b.giaBan - a.giaBan;
      if (sortBy === 'newest') return b.maSanPham - a.maSanPham;
      return a.maSanPham - b.maSanPham;
    });

  const spotlightProduct =
    products.find((p) =>
      String(p.tenSanPham || '').toLowerCase().includes('công chúa')
    ) || products[0];

  const hasAnyFilter = Boolean(
    keyword ||
      activeNavCat ||
      subQuery ||
      selectedCategory ||
      selectedColor ||
      selectedBudget ||
      sortBy !== 'default'
  );

  const activeHeadingTitle = subLabel
    ? subLabel
    : activeNavCat && CATEGORY_RULES[activeNavCat]
    ? CATEGORY_RULES[activeNavCat].title
    : 'Danh Sách Mẫu Hoa Tươi';

  return (
    <div>
      <style>{`
        .thx-hero-section {
          background: linear-gradient(135deg, #fff1f2 0%, #fffafb 55%, #ffffff 100%);
          padding: 36px 0 42px;
          border-bottom: 1px solid #fce7f3;
        }
        .thx-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          align-items: center;
          gap: 32px;
        }
        .thx-hero-title {
          font-size: clamp(1.7rem, 3.4vw, 2.8rem);
          line-height: 1.2;
          font-weight: 800;
          color: #111827;
          margin-bottom: 12px;
        }
        .thx-hero-desc {
          font-size: 0.94rem;
          color: #4b5563;
          line-height: 1.55;
          max-width: 520px;
          margin-bottom: 20px;
        }
        .thx-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .thx-hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding-top: 14px;
          border-top: 1px solid #fce7f3;
        }
        .thx-spotlight-img-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 15px;
          overflow: hidden;
          background: #fff1f2;
          margin-bottom: 10px;
        }
        .thx-ai-guide-box {
          background: linear-gradient(135deg, #fff1f2 0%, #fffafb 65%, #ffffff 100%);
          border: 1.5px solid #fecdd3;
          border-radius: 20px;
          padding: 18px 20px;
          margin-bottom: 16px;
        }
        .thx-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .thx-filter-chip {
          padding: 6px 13px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
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
            padding: 18px 0 24px;
          }
          .thx-hero-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .thx-hero-title {
            font-size: 1.5rem;
            margin-bottom: 8px;
          }
          .thx-hero-desc {
            font-size: 0.85rem;
            margin-bottom: 14px;
          }
          .thx-hero-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 14px;
          }
          .thx-hero-actions > a,
          .thx-hero-actions > button {
            width: 100%;
            justify-content: center;
            padding: 10px 8px !important;
            font-size: 0.82rem !important;
          }
          .thx-hero-stats {
            gap: 8px;
            padding-top: 10px;
          }
          .thx-ai-guide-box {
            padding: 14px;
            border-radius: 16px;
          }
          .thx-chip-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .thx-chip-row::-webkit-scrollbar {
            display: none;
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

      {/* Banner giới thiệu đầu trang */}
      <section className="thx-hero-section">
        <div className="container thx-hero-grid">
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
                  : 'Hoa Tươi Nhập Mới Mỗi Sáng • Tích Hợp Smart AI'}
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
                ? 'Kiểm tra nhanh danh mục hoa đang mở bán hoặc mở Bảng điều khiển để xử lý đơn hàng và dự báo nhập hàng.'
                : 'Những thiết kế hoa bó, giỏ hoa và kệ khai trương được tuyển chọn tỉ mỉ mỗi ngày, giúp bạn gửi trọn lời chúc tinh tế đến người thương.'}
            </p>

            {isAdmin ? (
              <div className="thx-hero-actions">
                <Link
                  to="/admin"
                  className="btn btn-primary"
                  style={{
                    padding: '11px 20px',
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <LayoutDashboard size={17} />
                  <span>Bảng Quản Trị</span>
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    catalogRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="btn btn-outline"
                  style={{
                    padding: '11px 20px',
                    fontSize: '0.92rem',
                    background: '#ffffff',
                    borderColor: '#fecdd3',
                    color: '#be123c',
                    fontWeight: 700,
                  }}
                >
                  Xem danh mục hoa
                </button>
              </div>
            ) : (
              <div className="thx-hero-actions">
                <button
                  type="button"
                  onClick={() =>
                    catalogRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="btn btn-primary"
                  style={{
                    padding: '11px 20px',
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span>Chọn mẫu hoa ngay</span>
                  <ArrowDown size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNavCat('sinh-nhat');
                    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn btn-outline"
                  style={{
                    padding: '11px 20px',
                    fontSize: '0.92rem',
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
                </button>
              </div>
            )}

            <div className="thx-hero-stats">
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                  Miễn Phí
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  Thiệp &amp; Banner thiết kế
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                  Smart AI
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  Gợi ý mẫu hoa chuẩn gu
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                  2 Giờ
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  Giao hoa tận tay
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="panel"
              style={{
                width: '100%',
                maxWidth: 420,
                padding: 14,
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
                      fontSize: '0.95rem',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {spotlightProduct?.tenSanPham || 'Bó Hồng Pastel Công Chúa'}
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#6b7280', marginTop: 2 }}>
                    Thiết kế bán chạy nhất mùa lễ
                  </div>
                </div>

                <Link
                  to={
                    spotlightProduct
                      ? `/product/${spotlightProduct.maSanPham}`
                      : '/#catalog'
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

      {/* Khu vực Bộ Lọc Thông Minh & Toàn Bộ Danh Sách Hoa Tươi */}
      <section
        id="catalog"
        ref={catalogRef}
        className="container"
        style={{ paddingTop: 32, marginBottom: 72, scrollMarginTop: 120 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: 4 }}>{activeHeadingTitle}</h2>
            <p style={{ fontSize: '0.88rem', color: '#6b7280' }}>
              Bấm vào bất kỳ mẫu hoa nào để xem hệ thống AI gợi ý các bó hoa đồng điệu nhất
            </p>
          </div>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="btn btn-outline btn-sm"
              style={{ color: '#be123c', borderColor: '#fecdd3', background: '#fff1f2' }}
            >
              <RotateCcw size={14} />
              <span>Xóa bộ lọc ({filteredProducts.length} mẫu)</span>
            </button>
          )}
        </div>

        {/* Khung Smart AI Gợi ý theo Dịp tặng, Ngân sách & Màu sắc */}
        <div className="thx-ai-guide-box">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background: '#e11d48',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={15} />
            </span>
            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#be123c' }}>
              Smart AI • Lọc Nhanh Theo Dịp Tặng, Ngân Sách &amp; Tông Màu
            </div>
          </div>

          {/* Hàng 1: Dịp tặng */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.79rem',
                fontWeight: 700,
                color: '#374151',
                marginBottom: 6,
              }}
            >
              <Gift size={13} color="#e11d48" />
              <span>Dịp tặng:</span>
            </div>
            <div className="thx-chip-row">
              {OCCASION_OPTIONS.map((occ) => {
                const active = activeNavCat === occ.id && !subQuery;
                return (
                  <button
                    key={occ.id || 'all-occ'}
                    type="button"
                    onClick={() => {
                      setActiveNavCat(occ.id);
                      setSubQuery('');
                      setSubLabel('');
                    }}
                    className="thx-filter-chip"
                    style={{
                      border: active ? '1.5px solid #e11d48' : '1px solid #e5e7eb',
                      background: active ? '#e11d48' : '#ffffff',
                      color: active ? '#ffffff' : '#374151',
                    }}
                  >
                    {occ.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hàng 2: Ngân sách */}
          <div style={{ marginBottom: uniqueColors.length > 0 ? 10 : 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.79rem',
                fontWeight: 700,
                color: '#374151',
                marginBottom: 6,
              }}
            >
              <Wallet size={13} color="#e11d48" />
              <span>Ngân sách:</span>
            </div>
            <div className="thx-chip-row">
              {BUDGET_OPTIONS.map((b) => {
                const active = selectedBudget === b.id;
                return (
                  <button
                    key={b.id || 'all-budget'}
                    type="button"
                    onClick={() => setSelectedBudget(b.id)}
                    className="thx-filter-chip"
                    style={{
                      border: active ? '1.5px solid #be123c' : '1px solid #e5e7eb',
                      background: active ? '#ffe4e6' : '#ffffff',
                      color: active ? '#be123c' : '#374151',
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hàng 3: Tông màu */}
          {uniqueColors.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.79rem',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: 6,
                }}
              >
                <Palette size={13} color="#e11d48" />
                <span>Tông màu sắc:</span>
              </div>
              <div className="thx-chip-row">
                <button
                  type="button"
                  onClick={() => setSelectedColor('')}
                  className="thx-filter-chip"
                  style={{
                    border: !selectedColor ? '1.5px solid #be123c' : '1px solid #e5e7eb',
                    background: !selectedColor ? '#ffe4e6' : '#ffffff',
                    color: !selectedColor ? '#be123c' : '#374151',
                  }}
                >
                  Tất cả màu
                </button>
                {uniqueColors.map((col) => {
                  const active = selectedColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className="thx-filter-chip"
                      style={{
                        border: active ? '1.5px solid #be123c' : '1px solid #e5e7eb',
                        background: active ? '#ffe4e6' : '#ffffff',
                        color: active ? '#be123c' : '#374151',
                      }}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Thanh tìm kiếm từ khóa, kiểu thiết kế & sắp xếp */}
        <div
          className="panel"
          style={{
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <div>
            <label className="form-label">Tìm kiếm tên hoa</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="#9ca3af"
                style={{ position: 'absolute', left: 11, top: 12 }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 34 }}
                placeholder="Hồng đỏ, hướng dương, tulip..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Kiểu thiết kế</label>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSubQuery('');
                setSubLabel('');
              }}
            >
              <option value="">Tất cả kiểu thiết kế</option>
              {categories.map((c) => (
                <option key={c.maDanhMuc} value={c.maDanhMuc}>
                  {c.tenDanhMuc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Sắp xếp theo</label>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Mặc định</option>
              <option value="newest">Sản phẩm mới nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
            fontSize: '0.88rem',
            color: '#6b7280',
          }}
        >
          <SlidersHorizontal size={15} />
          <span>
            Hiển thị <b>{filteredProducts.length}</b> mẫu hoa phù hợp
          </span>
        </div>

        {loading ? (
          <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
            Đang tải danh sách mẫu hoa...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ marginBottom: 14, color: '#4b5563' }}>
              Không tìm thấy mẫu hoa nào khớp với điều kiện lọc hiện tại.
            </p>
            <button type="button" onClick={resetAllFilters} className="btn btn-primary btn-sm">
              Hiển thị tất cả mẫu hoa
            </button>
          </div>
        ) : (
          <div className="thx-home-products">
            {filteredProducts.map((sp) => {
              const stock = Number(sp.soLuongTon ?? 20);
              const isOutOfStock = stock <= 0;
              const isLowStock = stock > 0 && stock <= 5;
              const isLiked = wishlistIds.includes(sp.maSanPham);

              return (
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
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <Link to={`/product/${sp.maSanPham}`} style={{ display: 'block' }}>
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
                      </Link>

                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'rgba(255, 255, 255, 0.94)',
                          color: '#be123c',
                          padding: '2px 9px',
                          borderRadius: 999,
                          fontSize: '0.71rem',
                          fontWeight: 700,
                        }}
                      >
                        {sp.tongMauSac || 'Tông Hồng'}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(sp.maSanPham, sp.tenSanPham)}
                        aria-label="Yêu thích"
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.94)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                      >
                        <Heart
                          size={16}
                          fill={isLiked ? '#e11d48' : 'none'}
                          color={isLiked ? '#e11d48' : '#6b7280'}
                        />
                      </button>
                    </div>

                    <Link
                      to={`/product/${sp.maSanPham}`}
                      style={{
                        textDecoration: 'none',
                        color: '#111827',
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      {sp.tenSanPham}
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
                        <span>4.9</span>
                      </span>

                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontWeight: 600,
                          background: isOutOfStock
                            ? '#f3f4f6'
                            : isLowStock
                            ? '#fef3c7'
                            : '#dcfce7',
                          color: isOutOfStock
                            ? '#6b7280'
                            : isLowStock
                            ? '#92400e'
                            : '#166534',
                        }}
                      >
                        {isOutOfStock
                          ? 'Hết hàng'
                          : isLowStock
                          ? `Sắp hết (${stock} bó)`
                          : `Còn hàng (${stock})`}
                      </span>
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
                        disabled={isOutOfStock}
                      >
                        <ShoppingCart size={14} />
                        <span>{isOutOfStock ? 'Hết hàng' : 'Thêm'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}