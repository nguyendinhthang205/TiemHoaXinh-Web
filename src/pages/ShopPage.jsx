import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  Gift,
  Wallet,
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const OCCASION_OPTIONS = [
  {
    id: '',
    label: 'Tất cả dịp',
    keywords: [],
    categories: [],
  },
  {
    id: 'birthday',
    label: '🎂 Sinh nhật',
    keywords: ['sinh nhật', 'pastel', 'hồng', 'tulip', 'baby', 'công chúa', 'ngọt ngào', 'dâu', 'hướng dương'],
    categories: [1, 4],
  },
  {
    id: 'opening',
    label: '🎉 Khai trương',
    keywords: ['khai trương', 'hồng phát', 'đại cát', 'kệ hoa', 'lẵng hoa', 'vàng', 'đỏ', 'hướng dương', 'lan hồ điệp'],
    categories: [2, 3],
  },
  {
    id: 'love',
    label: '❤️ Tình yêu & Kỷ niệm',
    keywords: ['tình yêu', 'yêu', 'kỷ niệm', 'valentine', 'hồng đỏ', 'lãng mạn', 'trái tim', 'nhung', 'pastel'],
    categories: [1, 4],
  },
  {
    id: 'gratitude',
    label: '🌸 Tri ân & Chúc mừng',
    keywords: ['tri ân', 'chúc mừng', 'cảm ơn', 'giỏ hoa', 'lan', 'hướng dương', 'mẹ', 'thầy', 'cô'],
    categories: [2, 4],
  },
  {
    id: 'wedding',
    label: '👰 Hoa cưới cầm tay',
    keywords: ['cưới', 'cô dâu', 'cầm tay', 'trắng', 'tinh khôi', 'baby', 'tulip'],
    categories: [5],
  },
];

const BUDGET_OPTIONS = [
  { id: '', label: 'Tất cả ngân sách' },
  { id: 'under-400', label: 'Dưới 400.000đ' },
  { id: '400-700', label: '400.000đ – 700.000đ' },
  { id: 'over-700', label: 'Trên 700.000đ' },
];

function computeOccasionScore(product, occasionObj) {
  if (!occasionObj || !occasionObj.id) return 1;
  const text = `${product.tenSanPham || ''} ${product.moTa || ''} ${product.tongMauSac || ''}`.toLowerCase();
  let score = 0;

  if (occasionObj.categories.includes(Number(product.maDanhMuc))) {
    score += 2;
  }
  occasionObj.keywords.forEach((kw) => {
    if (text.includes(kw)) score += 1;
  });

  return score;
}

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const aiPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('danhMuc') || ''
  );
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState(
    searchParams.get('dip') || ''
  );
  const [selectedBudget, setSelectedBudget] = useState(
    searchParams.get('nganSach') || ''
  );
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(true);

  const loadShopData = useCallback(async () => {
    try {
      setLoading(true);
      const [spRes, dmRes] = await Promise.all([
        api.get('/SanPham'),
        api.get('/DanhMuc').catch(() => ({ data: [] })),
      ]);
      const list = Array.isArray(spRes.data) ? spRes.data : spRes.data?.items || [];
      setProducts(list);
      setCategories(Array.isArray(dmRes.data) ? dmRes.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShopData();
    const handleSync = () => loadShopData();
    window.addEventListener('thx_products_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('thx_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadShopData]);

  // Đồng bộ tham số URL khi người dùng chuyển từ Trang chủ sang
  useEffect(() => {
    const dmParam = searchParams.get('danhMuc');
    const goiYParam = searchParams.get('goiY');
    const timKiemParam = searchParams.get('timKiem');

    if (dmParam !== null) {
      setSelectedCategory(dmParam);
    }
    if (goiYParam === 'dip') {
      setTimeout(() => {
        aiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    }
    if (timKiemParam === '1') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 120);
    }
  }, [searchParams]);

  const uniqueColors = Array.from(
    new Set(products.map((p) => p.tongMauSac).filter(Boolean))
  );

  const activeOccasionObj = OCCASION_OPTIONS.find((o) => o.id === selectedOccasion);

  const baseMatched = products.filter((p) => {
    const price = Number(p.giaBan || 0);
    const matchKw =
      !keyword ||
      p.tenSanPham?.toLowerCase().includes(keyword.toLowerCase()) ||
      p.moTa?.toLowerCase().includes(keyword.toLowerCase()) ||
      p.tongMauSac?.toLowerCase().includes(keyword.toLowerCase());

    const matchCat =
      !selectedCategory || String(p.maDanhMuc) === String(selectedCategory);

    const matchColor = !selectedColor || p.tongMauSac === selectedColor;

    let matchBudget = true;
    if (selectedBudget === 'under-400') matchBudget = price < 400000;
    else if (selectedBudget === '400-700') matchBudget = price >= 400000 && price <= 700000;
    else if (selectedBudget === 'over-700') matchBudget = price > 700000;

    return matchKw && matchCat && matchColor && matchBudget;
  });

  // Lọc và xếp hạng thông minh theo Dịp tặng
  const occasionScored = baseMatched.map((p) => ({
    product: p,
    score: computeOccasionScore(p, activeOccasionObj),
  }));

  const strictOccasionMatches = selectedOccasion
    ? occasionScored.filter((item) => item.score > 0)
    : occasionScored;

  const effectiveList =
    strictOccasionMatches.length > 0 ? strictOccasionMatches : occasionScored;

  const filtered = effectiveList
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.product.giaBan - b.product.giaBan;
      if (sortBy === 'price-desc') return b.product.giaBan - a.product.giaBan;
      if (selectedOccasion && b.score !== a.score) return b.score - a.score;
      return a.product.maSanPham - b.product.maSanPham;
    })
    .map((item) => item.product);

  const hasAnyFilter = Boolean(
    keyword ||
      selectedCategory ||
      selectedColor ||
      selectedOccasion ||
      selectedBudget ||
      sortBy !== 'default'
  );

  const resetAllFilters = () => {
    setKeyword('');
    setSelectedCategory('');
    setSelectedColor('');
    setSelectedOccasion('');
    setSelectedBudget('');
    setSortBy('default');
  };

  return (
    <div className="container" style={{ marginTop: 28, marginBottom: 64 }}>
      <style>{`
        .thx-ai-guide-box {
          background: linear-gradient(135deg, #fff1f2 0%, #fffafb 65%, #ffffff 100%);
          border: 1.5px solid #fecdd3;
          border-radius: 20px;
          padding: 18px 20px;
          margin-bottom: 18px;
        }
        .thx-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .thx-filter-chip {
          padding: 7px 13px;
          border-radius: 999px;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.16s ease;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
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
          .thx-filter-chip {
            padding: 6px 12px;
            font-size: 0.8rem;
          }
        }
      `}</style>

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: '1.9rem', marginBottom: 4 }}>Bộ Sưu Tập Hoa Tươi</h1>
        <p style={{ color: '#6b7280', fontSize: '0.92rem' }}>
          Chọn nhanh theo dịp tặng, ngân sách hoặc tông màu để tìm bó hoa ưng ý nhất
        </p>
      </div>

      {/* Khung Smart AI Gợi ý theo Dịp tặng & Ngân sách */}
      <div ref={aiPanelRef} className="thx-ai-guide-box">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                background: '#e11d48',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#be123c' }}>
                Smart AI • Gợi Ý Hoa Theo Dịp &amp; Ngân Sách
              </div>
              <div style={{ fontSize: '0.79rem', color: '#6b7280' }}>
                Chạm chọn dịp tặng và mức giá bên dưới để lọc ngay các mẫu hoa phù hợp
              </div>
            </div>
          </div>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="btn btn-outline btn-sm"
              style={{ background: '#ffffff', color: '#be123c', borderColor: '#fecdd3' }}
            >
              <RotateCcw size={14} />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Hàng 1: Chọn dịp tặng */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#374151',
              marginBottom: 7,
            }}
          >
            <Gift size={14} color="#e11d48" />
            <span>Dịp tặng hoa:</span>
          </div>
          <div className="thx-chip-row">
            {OCCASION_OPTIONS.map((occ) => {
              const active = selectedOccasion === occ.id;
              return (
                <button
                  key={occ.id || 'all-occ'}
                  type="button"
                  onClick={() => setSelectedOccasion(occ.id)}
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

        {/* Hàng 2: Chọn ngân sách */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#374151',
              marginBottom: 7,
            }}
          >
            <Wallet size={14} color="#e11d48" />
            <span>Ngân sách dự kiến:</span>
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
      </div>

      {/* Thanh tìm kiếm & lọc chi tiết */}
      <div
        className="panel"
        style={{
          marginBottom: 24,
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
              size={16}
              color="#9ca3af"
              style={{ position: 'absolute', left: 12, top: 13 }}
            />
            <input
              ref={searchInputRef}
              type="text"
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Hồng đỏ, hướng dương, tulip..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Danh mục</label>
          <select
            className="form-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.maDanhMuc} value={c.maDanhMuc}>
                {c.tenDanhMuc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Tông màu chủ đạo</label>
          <select
            className="form-control"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            <option value="">Tất cả tông màu</option>
            {uniqueColors.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Sắp xếp giá</label>
          <select
            className="form-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">
              {selectedOccasion ? 'Phù hợp nhất với dịp đã chọn' : 'Mặc định'}
            </option>
            <option value="price-asc">Giá: Thấp đến Cao</option>
            <option value="price-desc">Giá: Cao đến Thấp</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 18,
          fontSize: '0.9rem',
          color: '#6b7280',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} />
          <span>
            Hiển thị <b>{filtered.length}</b> sản phẩm phù hợp
          </span>
        </div>

        <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
          Bấm vào từng bó hoa để xem gợi ý mẫu tương đồng từ AI
        </span>
      </div>

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          Đang tải bộ sưu tập hoa...
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ marginBottom: 14, color: '#4b5563' }}>
            Không tìm thấy mẫu hoa nào khớp với bộ lọc hiện tại.
          </p>
          <button type="button" onClick={resetAllFilters} className="btn btn-primary btn-sm">
            Xem tất cả mẫu hoa
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((sp) => (
            <ProductCard key={sp.maSanPham} product={sp} />
          ))}
        </div>
      )}
    </div>
  );
}