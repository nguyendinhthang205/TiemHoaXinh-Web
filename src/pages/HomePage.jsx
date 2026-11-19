import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowDown,
  ShoppingCart,
  LayoutDashboard,
  Settings,
  Search,
  RotateCcw,
  Heart,
  Star,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import api, {
  formatVND,
  getFlowerImage,
  getProductRatingStats,
  getProductOverrides,
  syncProductReviewsFromCloud,
  syncProductOverridesFromCloud,
} from '../services/api';
import { useApp } from '../context/AppContext';

const WISHLIST_STORAGE_KEY = 'thx_wishlist_ids';

const STANDARD_COLORS = [
  'Hồng Pastel',
  'Đỏ',
  'Vàng',
  'Trắng',
  'Tím',
  'Cam Đào',
];

function normalizeColorGroup(rawColor) {
  const s = String(rawColor || '').trim().toLowerCase();
  if (!s) return 'Hồng Pastel';
  if (s.includes('đỏ')) return 'Đỏ';
  if (s.includes('vàng')) return 'Vàng';
  if (s.includes('trắng')) return 'Trắng';
  if (s.includes('tím')) return 'Tím';
  if (s.includes('cam')) return 'Cam Đào';
  if (s.includes('hồng') || s.includes('pastel')) return 'Hồng Pastel';
  return 'Hồng Pastel';
}

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
};

const OCCASION_OPTIONS = [
  { id: '', label: 'Tất cả dịp' },
  { id: 'sinh-nhat', label: '🎂 Sinh nhật' },
  { id: 'khai-truong', label: '🎉 Khai trương' },
  { id: 'chu-de', label: '❤️ Tình yêu & Tri ân' },
];

const BUDGET_OPTIONS = [
  { id: '', label: 'Tất cả ngân sách' },
  { id: 'under-400', label: 'Dưới 400.000đ' },
  { id: '400-700', label: '400.000đ – 700.000đ' },
  { id: 'over-700', label: 'Trên 700.000đ' },
];

function applyLocalOverridesToList(list) {
  const overrides = getProductOverrides();
  return list.map((p) => {
    const byId = p.maSanPham != null ? overrides[String(p.maSanPham)] : null;
    const nameKey = p.tenSanPham
      ? `name:${String(p.tenSanPham).trim().toLowerCase()}`
      : '';
    const byName = nameKey ? overrides[nameKey] : null;
    const matched = byId || byName;
    if (!matched) return p;

    const resolvedImg =
      byId?.hinhAnhChinh ||
      byId?.anhChinh ||
      byName?.hinhAnhChinh ||
      byName?.anhChinh ||
      p.anhChinh;

    return {
      ...p,
      anhChinh: resolvedImg,
      hinhAnhChinh: resolvedImg || p.hinhAnhChinh,
      hinhAnh: resolvedImg || p.hinhAnh,
      tongMauSac: matched.tongMauSac || p.tongMauSac,
      maDanhMuc: matched.maDanhMuc ?? p.maDanhMuc,
      danhMucTrangChu: Array.isArray(matched.danhMucTrangChu)
        ? matched.danhMucTrangChu
        : p.danhMucTrangChu,
    };
  });
}

export default function HomePage() {
  const appCtx = useApp() || {};
  const { addToCart, user, showToast } = appCtx;
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const catalogRef = useRef(null);
  const initialLoadedRef = useRef(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewAsCustomer, setPreviewAsCustomer] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [, setSyncVersion] = useState(0);

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [activeNavCat, setActiveNavCat] = useState(searchParams.get('cat') || '');
  const [subQuery, setSubQuery] = useState(searchParams.get('sub') || '');
  const [subLabel, setSubLabel] = useState(searchParams.get('subLabel') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('dm') || '');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const isActualAdmin =
    String(user?.vaiTro || user?.role || '').toLowerCase() === 'admin' ||
    String(user?.email || '').toLowerCase().includes('admin') ||
    String(user?.hoTen || '').trim().toLowerCase() === 'admin';

  const showAdminTools = isActualAdmin && !previewAsCustomer;

  // Tải danh sách sản phẩm 1 lần duy nhất khi mở trang, tuyệt đối không gây nhấp nháy
  const fetchInitialProducts = useCallback(async () => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    try {
      setLoading(true);
      const [spRes, dmRes] = await Promise.all([
        api.get('/SanPham'),
        api.get('/DanhMuc').catch(() => ({ data: [] })),
      ]);
      const rawList = Array.isArray(spRes.data) ? spRes.data : spRes.data?.items || [];
      setProducts(applyLocalOverridesToList(rawList));
      setCategories(Array.isArray(dmRes.data) ? dmRes.data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialProducts();

    // Đồng bộ ngầm ảnh & đánh giá từ đám mây, chỉ cập nhật nhẹ trên RAM chứ không gọi lại API
    syncProductOverridesFromCloud().catch(() => {});
    syncProductReviewsFromCloud().catch(() => {});

    const handleProductSync = () => {
      setProducts((prev) => applyLocalOverridesToList(prev));
      setSyncVersion((v) => v + 1);
    };
    const handleReviewSync = () => {
      setSyncVersion((v) => v + 1);
    };

    window.addEventListener('thx_products_updated', handleProductSync);
    window.addEventListener('thx_reviews_updated', handleReviewSync);
    return () => {
      window.removeEventListener('thx_products_updated', handleProductSync);
      window.removeEventListener('thx_reviews_updated', handleReviewSync);
    };
  }, [fetchInitialProducts]);

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
      if (selectedColor && normalizeColorGroup(p.tongMauSac) !== selectedColor) {
        return false;
      }

      if (selectedBudget === 'under-400' && !(price < 400000)) return false;
      if (selectedBudget === '400-700' && !(price >= 400000 && price <= 700000)) {
        return false;
      }
      if (selectedBudget === 'over-700' && !(price > 700000)) return false;

      if (subQuery) {
        const subKw = subQuery.toLowerCase();
        if (!text.includes(subKw)) return false;
      } else if (activeNavCat && CATEGORY_RULES[activeNavCat]) {
        if (Array.isArray(p.danhMucTrangChu) && p.danhMucTrangChu.length > 0) {
          if (!p.danhMucTrangChu.includes(activeNavCat)) return false;
        } else {
          const rule = CATEGORY_RULES[activeNavCat];
          const matchKeyword = rule.keywords.some((kw) => text.includes(kw));
          const matchCatId = rule.categories.includes(Number(p.maDanhMuc));
          if (!matchKeyword && !matchCatId) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.giaBan - b.giaBan;
      if (sortBy === 'price-desc') return b.giaBan - a.giaBan;
      if (sortBy === 'newest') return b.maSanPham - a.maSanPham;
      if (sortBy === 'bestseller') return (a.soLuongTon ?? 20) - (b.soLuongTon ?? 20);
      return a.maSanPham - b.maSanPham;
    });

  const spotlightProduct =
    products.find((p) => {
      const img = getFlowerImage(p);
      return (
        String(p.tenSanPham || '').toLowerCase().includes('công chúa') &&
        img.startsWith('http')
      );
    }) ||
    products.find((p) => getFlowerImage(p).startsWith('http')) ||
    products[0];

  const spotlightImageUrl =
    spotlightProduct && getFlowerImage(spotlightProduct).startsWith('http')
      ? getFlowerImage(spotlightProduct)
      : 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=85';

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
          background: linear-gradient(135deg, #fff1f2 0%, #fffafb 58%, #ffffff 100%);
          padding: 24px 0 28px;
          border-bottom: 1px solid #fce7f3;
        }
        .thx-hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          align-items: center;
          gap: 28px;
        }
        .thx-hero-title {
          font-size: clamp(1.6rem, 3.1vw, 2.55rem);
          line-height: 1.18;
          font-weight: 800;
          color: #111827;
          margin-bottom: 10px;
        }
        .thx-hero-desc {
          font-size: 0.92rem;
          color: #4b5563;
          line-height: 1.52;
          max-width: 510px;
          margin-bottom: 16px;
        }
        .thx-hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .thx-hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid #fce7f3;
        }
        .thx-spotlight-img-wrap {
          width: 100%;
          aspect-ratio: 16 / 10;
          border-radius: 14px;
          overflow: hidden;
          background: #fff1f2;
          margin-bottom: 10px;
        }
        .thx-compact-filter-bar {
          background: #ffffff;
          border: 1.5px solid #fce7f3;
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 18px;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
        }
        .thx-occasion-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .thx-filter-controls-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr 0.9fr 1fr 1fr;
          gap: 10px;
          align-items: center;
        }
        .thx-home-products {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
          gap: 18px;
        }
        .thx-home-prod-img {
          height: 215px;
        }

        @media (max-width: 900px) {
          .thx-filter-controls-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .thx-hero-section {
            padding: 16px 0 22px;
          }
          .thx-hero-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .thx-hero-title {
            font-size: 1.45rem;
          }
          .thx-hero-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .thx-hero-actions > button {
            width: 100%;
            justify-content: center;
            padding: 9px 8px !important;
            font-size: 0.82rem !important;
          }
          .thx-occasion-pills {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .thx-occasion-pills::-webkit-scrollbar {
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

      {/* Thanh Admin mỏng tách biệt hoàn toàn khỏi Hero của khách */}
      {isActualAdmin && (
        <div
          style={{
            background: '#111827',
            color: '#f9fafb',
            fontSize: '0.82rem',
            padding: '8px 0',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={15} color="#fb7185" />
              <span>
                {previewAsCustomer
                  ? 'Đang xem thử giao diện như khách hàng'
                  : 'Đang xem với quyền Admin'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link
                to="/admin"
                style={{
                  color: '#fda4af',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <LayoutDashboard size={14} />
                <span>Vào Bảng Quản Trị</span>
              </Link>

              <span style={{ color: '#4b5563' }}>&bull;</span>

              <button
                type="button"
                onClick={() => setPreviewAsCustomer((v) => !v)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#e5e7eb',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: 0,
                  fontSize: '0.82rem',
                }}
              >
                <Eye size={14} />
                <span>{previewAsCustomer ? 'Bật lại nút Admin' : 'Xem như khách'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section thuần túy dành cho khách hàng */}
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
                marginBottom: 8,
              }}
            >
              <Sparkles size={13} />
              <span>Bộ Sưu Tập Hoa Tươi 2026 &bull; Gợi Ý Chuẩn Gu</span>
            </div>

            <h1 className="thx-hero-title">
              Trao Gửi Yêu Thương Qua Từng{' '}
              <span style={{ color: '#e11d48', fontStyle: 'italic' }}>
                Cánh Hoa Tươi
              </span>
            </h1>

            <p className="thx-hero-desc">
              Những thiết kế hoa bó, giỏ hoa và kệ khai trương được cắm mới mỗi ngày, gửi trọn lời chúc tinh tế đến người thương trong mọi dịp đặc biệt.
            </p>

            <div className="thx-hero-actions">
              <button
                type="button"
                onClick={() =>
                  catalogRef.current?.scrollIntoView({ behavior: 'smooth' })
                }
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <span>Khám phá mẫu hoa</span>
                <ArrowDown size={15} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveNavCat('sinh-nhat');
                  catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-outline"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  background: '#ffffff',
                  borderColor: '#fecdd3',
                  color: '#be123c',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Sparkles size={15} />
                <span>Gợi ý hoa theo dịp</span>
              </button>
            </div>

            <div className="thx-hero-stats">
              <div>
                <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#111827' }}>
                  {products.length > 0 ? `${products.length}+ Mẫu` : '20+ Mẫu'}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                  Thiết kế hoa nghệ thuật
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#111827' }}>
                  4.9 &#9733;
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                  Đánh giá từ khách hàng
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#111827' }}>
                  2 Giờ
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
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
                maxWidth: 400,
                padding: 12,
                borderRadius: 20,
                boxShadow: '0 16px 38px rgba(225, 29, 72, 0.1)',
                background: '#ffffff',
              }}
            >
              <div className="thx-spotlight-img-wrap">
                <img
                  src={spotlightImageUrl}
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
                      fontSize: '0.94rem',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {spotlightProduct?.tenSanPham || 'Bó Hồng Pastel Công Chúa'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 1 }}>
                    Mẫu hoa được yêu thích nhất
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

      {/* Khu vực Bộ Lọc Thu Gọn & Danh Sách Sản Phẩm */}
      <section
        id="catalog"
        ref={catalogRef}
        className="container"
        style={{ paddingTop: 24, marginBottom: 72, scrollMarginTop: 115 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 2 }}>{activeHeadingTitle}</h2>
            <p style={{ fontSize: '0.84rem', color: '#6b7280' }}>
              Hiển thị <b>{filteredProducts.length}</b> mẫu hoa &bull; Bấm vào từng bó hoa để xem gợi ý phối hoa từ AI
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
              <span>Xóa lọc ({filteredProducts.length} kết quả)</span>
            </button>
          )}
        </div>

        <div className="thx-compact-filter-bar">
          <div className="thx-occasion-pills">
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#be123c',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginRight: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <Sparkles size={14} />
              <span>Dịp tặng:</span>
            </span>

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
                  style={{
                    padding: '6px 13px',
                    borderRadius: 999,
                    fontSize: '0.81rem',
                    fontWeight: 600,
                    border: active ? '1.5px solid #e11d48' : '1px solid #e5e7eb',
                    background: active ? '#e11d48' : '#ffffff',
                    color: active ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {occ.label}
                </button>
              );
            })}
          </div>

          <div className="thx-filter-controls-grid">
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="#9ca3af"
                style={{ position: 'absolute', left: 11, top: 11 }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 33, height: 38, fontSize: '0.85rem' }}
                placeholder="Tìm tên hoa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              style={{ height: 38, fontSize: '0.85rem' }}
            >
              {BUDGET_OPTIONS.map((b) => (
                <option key={b.id || 'all-b'} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{ height: 38, fontSize: '0.85rem' }}
            >
              <option value="">Tất cả màu sắc</option>
              {STANDARD_COLORS.map((col) => (
                <option key={col} value={col}>
                  Màu {col}
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSubQuery('');
                setSubLabel('');
              }}
              style={{ height: 38, fontSize: '0.85rem' }}
            >
              <option value="">Tất cả kiểu hoa</option>
              {categories.map((c) => (
                <option key={c.maDanhMuc} value={c.maDanhMuc}>
                  {c.tenDanhMuc}
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ height: 38, fontSize: '0.85rem' }}
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="bestseller">Bán chạy nhất</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
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
            {filteredProducts.map((sp, idx) => {
              const stock = Number(sp.soLuongTon ?? 20);
              const isOutOfStock = stock <= 0;
              const isLowStock = stock > 0 && stock <= 5;
              const isLiked = wishlistIds.includes(sp.maSanPham);
              const ratingStats = getProductRatingStats(sp.maSanPham);
              const cleanColorLabel = normalizeColorGroup(sp.tongMauSac);
              const promoTag =
                idx < 3 ? 'Bán chạy' : sp.maSanPham >= 20 ? 'Mới' : '';

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

                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          display: 'flex',
                          gap: 5,
                          flexWrap: 'wrap',
                        }}
                      >
                        {promoTag && (
                          <span
                            style={{
                              background: promoTag === 'Bán chạy' ? '#e11d48' : '#16a34a',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                            }}
                          >
                            {promoTag}
                          </span>
                        )}
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.94)',
                            color: '#be123c',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: '0.69rem',
                            fontWeight: 700,
                          }}
                        >
                          {cleanColorLabel}
                        </span>
                      </div>

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
                          color: '#f59e0b',
                          fontWeight: 700,
                        }}
                      >
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span>
                          {ratingStats.avg}
                          {ratingStats.count > 0 ? ` (${ratingStats.count})` : ''}
                        </span>
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
                    <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.98rem' }}>
                      {formatVND(sp.giaBan)}
                    </span>

                    {showAdminTools ? (
                      <Link
                        to={`/admin?editProduct=${sp.maSanPham}`}
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: '#fecdd3', color: '#be123c' }}
                      >
                        <Settings size={14} />
                        <span>Sửa mẫu</span>
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