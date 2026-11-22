import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowDown,
  LayoutDashboard,
  Search,
  RotateCcw,
  Heart,
  ShieldCheck,
  Eye,
  Truck,
  Gift,
  Camera,
  Flower2,
  Cake,
  PartyPopper,
  Award,
  ArrowRight,
} from 'lucide-react';
import api, {
  formatVND,
  getFlowerImage,
  applyOverridesToProductList,
  syncProductReviewsFromCloud,
  syncProductOverridesFromCloud,
} from '../services/api';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import SmartAiConcierge from '../components/SmartAiConcierge';
import {
  STORE_INFO,
  STANDARD_COLORS,
  normalizeColorGroup,
  CATEGORY_RULES,
  OCCASION_OPTIONS,
  BUDGET_OPTIONS,
  isAdminAccount,
  matchesBudget,
} from '../utils/storeUtils';

const HOME_PRODUCTS_CACHE_KEY = 'thx_home_products_cache';

function readCachedHomeProducts() {
  try {
    const raw = localStorage.getItem(HOME_PRODUCTS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? applyOverridesToProductList(parsed) : [];
  } catch {
    return [];
  }
}

const CURATED_COLLECTIONS = [
  {
    id: 'sinh-nhat',
    title: 'Hoa Sinh Nhật',
    desc: 'Tone pastel ngọt ngào, rạng rỡ',
    icon: Cake,
    accentBg: '#fff1f2',
    accentColor: '#e11d48',
  },
  {
    id: 'khai-truong',
    title: 'Hoa Khai Trương',
    desc: 'Kệ hoa, lẵng hoa hồng phát',
    icon: PartyPopper,
    accentBg: '#fef3c7',
    accentColor: '#b45309',
  },
  {
    id: 'lan-ho-diep',
    title: 'Lan Hồ Điệp',
    desc: 'Chậu lan loại A sang trọng, bền đẹp',
    icon: Award,
    accentBg: '#f3e8ff',
    accentColor: '#7e22ce',
  },
  {
    id: 'chu-de',
    title: 'Tình Yêu & Tri Ân',
    desc: 'Kỷ niệm, tri ân & hoa cưới',
    icon: Heart,
    accentBg: '#dcfce7',
    accentColor: '#15803d',
  },
];

export default function HomePage() {
  const appCtx = useApp() || {};
  const { user, wishlistIds = [] } = appCtx;
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const catalogRef = useRef(null);

  const [products, setProducts] = useState(() => readCachedHomeProducts());
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(() => readCachedHomeProducts().length === 0);
  const [previewAsCustomer, setPreviewAsCustomer] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [, setSyncVersion] = useState(0);

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [activeNavCat, setActiveNavCat] = useState(searchParams.get('cat') || '');
  const [subQuery, setSubQuery] = useState(searchParams.get('sub') || '');
  const [subLabel, setSubLabel] = useState(searchParams.get('subLabel') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('dm') || '');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [onlyWishlist, setOnlyWishlist] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  const isActualAdmin = isAdminAccount(user);
  const showAdminTools = isActualAdmin && !previewAsCustomer;

  useEffect(() => {
    let isMounted = true;

    async function initHomeData() {
      try {
        const [spRes, dmRes] = await Promise.all([
          api.get('/SanPham'),
          api.get('/DanhMuc').catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;
        const rawList = Array.isArray(spRes.data) ? spRes.data : spRes.data?.items || [];
        const enriched = applyOverridesToProductList(rawList);
        setProducts(enriched);
        setCategories(Array.isArray(dmRes.data) ? dmRes.data : []);
        try {
          localStorage.setItem(HOME_PRODUCTS_CACHE_KEY, JSON.stringify(rawList));
        } catch {
          // Bỏ qua
        }
      } catch {
        // Giữ dữ liệu cache nếu mạng chậm
      } finally {
        if (isMounted) setLoading(false);
      }

      syncProductOverridesFromCloud().catch(() => {});
      syncProductReviewsFromCloud().catch(() => {});
    }

    initHomeData();

    const handleProductSync = () => {
      if (!isMounted) return;
      setProducts((prev) => applyOverridesToProductList(prev));
    };
    const handleReviewSync = () => {
      if (!isMounted) return;
      setSyncVersion((v) => v + 1);
    };

    window.addEventListener('thx_products_updated', handleProductSync);
    window.addEventListener('thx_reviews_updated', handleReviewSync);
    return () => {
      isMounted = false;
      window.removeEventListener('thx_products_updated', handleProductSync);
      window.removeEventListener('thx_reviews_updated', handleReviewSync);
    };
  }, []);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const catParam = searchParams.get('cat') || '';
    const dmParam = searchParams.get('dm') || '';
    const subParam = searchParams.get('sub') || '';
    const subLabelParam = searchParams.get('subLabel') || '';
    const goiYParam = searchParams.get('goiY') || '';

    setKeyword(qParam);
    setActiveNavCat(catParam);
    setSelectedCategory(dmParam);
    setSubQuery(subParam);
    setSubLabel(subLabelParam);

    if (goiYParam === 'dip' || location.hash === '#ai-concierge') {
      setTimeout(() => {
        document.getElementById('ai-concierge')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (location.hash === '#catalog' || qParam || catParam || dmParam || subParam) {
      setTimeout(() => {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchParams, location.hash]);

  const resetAllFilters = () => {
    setKeyword('');
    setActiveNavCat('');
    setSubQuery('');
    setSubLabel('');
    setSelectedCategory('');
    setSelectedColor('');
    setSelectedBudget('');
    setOnlyWishlist(false);
    setSortBy('default');
    setSearchParams({});
  };

  const filteredProducts = products
    .filter((p) => {
      const price = Number(p.giaBan || 0);
      const text = `${p.tenSanPham || ''} ${p.loaiHoa || ''} ${p.tenDanhMuc || ''} ${p.moTa || ''} ${p.tongMauSac || ''}`.toLowerCase();

      if (onlyWishlist && !wishlistIds.includes(p.maSanPham)) return false;
      if (keyword && !text.includes(keyword.toLowerCase())) return false;
      if (selectedCategory && String(p.maDanhMuc) !== String(selectedCategory)) return false;
      if (selectedColor && normalizeColorGroup(p.tongMauSac) !== selectedColor) return false;
      if (selectedBudget && !matchesBudget(price, selectedBudget)) return false;

      if (activeNavCat && CATEGORY_RULES[activeNavCat]) {
        if (Array.isArray(p.danhMucTrangChu) && p.danhMucTrangChu.length > 0) {
          if (!p.danhMucTrangChu.includes(activeNavCat)) return false;
        } else {
          const rule = CATEGORY_RULES[activeNavCat];
          const matchKeyword = rule.keywords.some((kw) => text.includes(kw));
          const matchCatId = rule.categories.includes(Number(p.maDanhMuc));
          if (!matchKeyword && !matchCatId) return false;
        }
      }

      if (subQuery) {
        if (!text.includes(subQuery.toLowerCase())) return false;
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

  const isLocalOrHttpImg = (img) =>
    typeof img === 'string' && (img.startsWith('/images/') || img.startsWith('http'));

  const spotlightProduct =
    products.find((p) => {
      const img = getFlowerImage(p);
      return (
        String(p.tenSanPham || '').toLowerCase().includes('công chúa') &&
        isLocalOrHttpImg(img)
      );
    }) ||
    products.find((p) => isLocalOrHttpImg(getFlowerImage(p))) ||
    products[0];

  const spotlightImageUrl =
    spotlightProduct && isLocalOrHttpImg(getFlowerImage(spotlightProduct))
      ? getFlowerImage(spotlightProduct)
      : '/images/flowers/pink-peony-bouquet.webp';

  const hasAnyFilter = Boolean(
    keyword ||
      activeNavCat ||
      subQuery ||
      selectedCategory ||
      selectedColor ||
      selectedBudget ||
      onlyWishlist ||
      sortBy !== 'default'
  );

  const activeRule = activeNavCat ? CATEGORY_RULES[activeNavCat] : null;
  const activeHeadingTitle = subLabel
    ? subLabel
    : activeRule
    ? activeRule.title
    : 'Bộ Sưu Tập Hoa Tươi Nghệ Thuật';
  const activeHeadingSubtitle =
    activeRule?.subtitle ||
    `Hiển thị ${filteredProducts.length} thiết kế hoa tươi • Bấm vào từng bó hoa để xem gợi ý đồng điệu từ Smart AI`;

  const isInitialLoading = loading && products.length === 0;

  return (
    <div>
      {isActualAdmin && (
        <div
          style={{
            background: '#181316',
            color: '#f9fafb',
            fontSize: '0.82rem',
            padding: '9px 0',
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
                  : 'Đang xem với quyền Quản trị viên (Admin)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link
                to="/admin"
                style={{
                  color: '#fda4af',
                  fontWeight: 700,
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
                  color: '#e5e7eb',
                  fontWeight: 600,
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

      {/* HERO SECTION */}
      <section className="thx-hero-section">
        <div className="container thx-hero-grid">
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#ffe4e6',
                border: '1px solid #fecdd3',
                color: '#9f1239',
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <Sparkles size={13} />
              <span>Bộ Sưu Tập 2026 &bull; Gợi Ý Hoa Chuẩn Gu Bằng AI</span>
            </div>

            <h1 className="thx-hero-title">
              Trao Gửi Yêu Thương Qua Từng{' '}
              <span style={{ color: '#e11d48', fontStyle: 'italic' }}>Cánh Hoa Tươi</span>
            </h1>

            <p className="thx-hero-desc">
              Những thiết kế hoa bó, giỏ hoa và kệ khai trương được nghệ nhân cắm mới mỗi sáng tại Đà Nẵng, gửi trọn lời chúc tinh tế đến người thương trong mọi dịp đặc biệt.
            </p>

            <div className="thx-hero-actions">
              <button
                type="button"
                onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-primary btn-lg"
              >
                <span>Khám phá mẫu hoa</span>
                <ArrowDown size={16} />
              </button>

              <button
                type="button"
                onClick={() =>
                  document.getElementById('ai-concierge')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="btn btn-outline btn-lg"
                style={{
                  borderColor: '#fecdd3',
                  color: '#9f1239',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={16} />
                <span>Smart AI Chọn Hoa</span>
              </button>
            </div>

            <div className="thx-hero-stats">
              <div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '1.22rem', fontWeight: 800, color: '#181316' }}
                >
                  {products.length > 0 ? `${products.length}+ Mẫu` : '20+ Mẫu'}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                  Thiết kế hoa độc bản
                </div>
              </div>
              <div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '1.22rem', fontWeight: 800, color: '#181316' }}
                >
                  4.9 &#9733;
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                  Đánh giá từ khách hàng
                </div>
              </div>
              <div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '1.22rem', fontWeight: 800, color: '#181316' }}
                >
                  2 Giờ
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                  Giao hoa hỏa tốc
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="thx-spotlight-card">
              <div className="thx-spotlight-img-wrap">
                <img
                  src={spotlightImageUrl}
                  alt={spotlightProduct?.tenSanPham || 'Bó Hồng Pastel Công Chúa'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(24, 19, 22, 0.78)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '5px 11px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Sparkles size={12} color="#fda4af" />
                  Mẫu được yêu thích nhất
                </span>
                {spotlightProduct?.giaBan && (
                  <span
                    className="tabular-nums"
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      background: 'rgba(255, 255, 255, 0.94)',
                      backdropFilter: 'blur(8px)',
                      color: '#be123c',
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    {formatVND(spotlightProduct.giaBan)}
                  </span>
                )}
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
                      color: '#181316',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {spotlightProduct?.tenSanPham || 'Bó Hồng Pastel Công Chúa'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 2 }}>
                    {STORE_INFO.deliveryTime}
                  </div>
                </div>

                <Link
                  to={
                    spotlightProduct ? `/product/${spotlightProduct.maSanPham}` : '/#catalog'
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

      {/* 4 PILLARS TRUST STRIP */}
      <div className="container">
        <div className="thx-trust-strip">
          <div className="thx-trust-item">
            <div className="thx-trust-icon">
              <Flower2 size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#181316' }}>
                Hoa Tươi Nhập Mới 5AM
              </div>
              <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 2 }}>
                Tuyển chọn trực tiếp từ vườn Đà Lạt mỗi sáng
              </div>
            </div>
          </div>

          <div className="thx-trust-item">
            <div className="thx-trust-icon">
              <Camera size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#181316' }}>
                Gửi Ảnh Duyệt Trước
              </div>
              <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 2 }}>
                Chụp thành phẩm thực tế gửi bạn kiểm tra trước giao
              </div>
            </div>
          </div>

          <div className="thx-trust-item">
            <div className="thx-trust-icon">
              <Gift size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#181316' }}>
                Thiệp &amp; Banner Miễn Phí
              </div>
              <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 2 }}>
                Tặng kèm thiệp viết tay thiết kế theo lời chúc riêng
              </div>
            </div>
          </div>

          <div className="thx-trust-item">
            <div className="thx-trust-icon">
              <Truck size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#181316' }}>
                Giao Hỏa Tốc Trong 2H
              </div>
              <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 2 }}>
                Hoặc nhận miễn phí tại {STORE_INFO.address}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CURATED OCCASION CARDS */}
      <section className="container" style={{ marginTop: 24 }}>
        <div className="thx-occasions-grid">
          {CURATED_COLLECTIONS.map((col) => {
            const Icon = col.icon;
            const isActive = activeNavCat === col.id && !subQuery;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => {
                  setActiveNavCat(col.id);
                  setSubQuery('');
                  setSubLabel('');
                  catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="thx-occasion-card"
                style={{
                  borderColor: isActive ? '#e11d48' : undefined,
                  background: isActive ? '#fffafb' : '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: col.accentBg,
                      color: col.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={19} />
                  </div>
                  <ArrowRight size={16} color={isActive ? '#e11d48' : '#9ca3af'} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#181316', marginTop: 4 }}>
                  {col.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{col.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE SMART AI CONCIERGE */}
      <SmartAiConcierge products={products} />

      {/* MAIN CATALOG SECTION */}
      <section
        id="catalog"
        ref={catalogRef}
        className="container"
        style={{ paddingTop: 34, marginBottom: 40, scrollMarginTop: 120 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.4vw, 1.85rem)', marginBottom: 4 }}>
              {activeHeadingTitle}
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#6b7280' }}>{activeHeadingSubtitle}</p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setOnlyWishlist((v) => !v)}
              className="btn btn-outline btn-sm"
              style={{
                borderColor: onlyWishlist ? '#e11d48' : '#e5e7eb',
                background: onlyWishlist ? '#fff1f2' : '#ffffff',
                color: onlyWishlist ? '#be123c' : '#374151',
              }}
            >
              <Heart
                size={14}
                fill={onlyWishlist ? '#e11d48' : 'none'}
                color={onlyWishlist ? '#e11d48' : '#6b7280'}
              />
              <span>Đã thích ({wishlistIds.length})</span>
            </button>

            {hasAnyFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="btn btn-outline btn-sm"
                style={{ color: '#be123c', borderColor: '#fecdd3', background: '#fff1f2' }}
              >
                <RotateCcw size={14} />
                <span>Xóa lọc ({filteredProducts.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="thx-compact-filter-bar">
          <div className="thx-occasion-pills">
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#9f1239',
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
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: '0.81rem',
                    fontWeight: 600,
                    border: active ? '1.5px solid #e11d48' : '1px solid #e5e7eb',
                    background: active ? '#e11d48' : '#ffffff',
                    color: active ? '#ffffff' : '#374151',
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
                style={{ paddingLeft: 34, height: 38, fontSize: '0.85rem' }}
                placeholder="Tìm tên hoa, loài hoa..."
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
                  Tông {col}
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
              <option value="">Tất cả kiểu dáng</option>
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

        {isInitialLoading ? (
          <div className="thx-product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="thx-prod-card" style={{ gap: 10 }}>
                <div className="thx-skeleton" style={{ aspectRatio: '4 / 3.5', width: '100%' }} />
                <div className="thx-skeleton" style={{ height: 14, width: '45%' }} />
                <div className="thx-skeleton" style={{ height: 20, width: '85%' }} />
                <div className="thx-skeleton" style={{ height: 34, width: '100%' }} />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: 52 }}>
            <Flower2 size={40} color="#fecdd3" style={{ marginBottom: 12 }} />
            <h3 style={{ marginBottom: 6, color: '#181316' }}>
              Không tìm thấy mẫu hoa phù hợp
            </h3>
            <p style={{ marginBottom: 18, color: '#6b7280', fontSize: '0.9rem' }}>
              {onlyWishlist
                ? 'Bạn chưa có mẫu hoa yêu thích nào khớp điều kiện lọc này.'
                : 'Hãy thử bỏ bớt bộ lọc hoặc dùng Smart AI Chọn Hoa phía trên để tìm gợi ý phù hợp.'}
            </p>
            <button type="button" onClick={resetAllFilters} className="btn btn-primary btn-sm">
              Hiển thị tất cả mẫu hoa
            </button>
          </div>
        ) : (
          <div className="thx-product-grid">
            {filteredProducts.map((sp, idx) => {
              const promoTag =
                !hasAnyFilter && idx < 3 ? 'Bán chạy' : sp.maSanPham >= 20 ? 'Mới' : '';
              return (
                <ProductCard
                  key={sp.maSanPham}
                  product={sp}
                  promoTag={promoTag}
                  showAdminTools={showAdminTools}
                  onQuickView={(item) => setQuickViewProduct(item)}
                />
              );
            })}
          </div>
        )}
      </section>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
