import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('danhMuc') || ''
  );
  const [selectedColor, setSelectedColor] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
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
    }
    fetchAll();
  }, []);

  const uniqueColors = Array.from(
    new Set(products.map((p) => p.tongMauSac).filter(Boolean))
  );

  const filtered = products
    .filter((p) => {
      const matchKw =
        !keyword ||
        p.tenSanPham?.toLowerCase().includes(keyword.toLowerCase()) ||
        p.moTa?.toLowerCase().includes(keyword.toLowerCase());
      const matchCat =
        !selectedCategory || String(p.maDanhMuc) === String(selectedCategory);
      const matchColor = !selectedColor || p.tongMauSac === selectedColor;
      return matchKw && matchCat && matchColor;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.giaBan - b.giaBan;
      if (sortBy === 'price-desc') return b.giaBan - a.giaBan;
      return a.maSanPham - b.maSanPham;
    });

  return (
    <div className="container" style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '2.1rem' }}>Bộ Sưu Tập Hoa Tươi</h1>
        <p style={{ color: '#6b7280' }}>
          Tìm kiếm và lọc nhanh theo danh mục, tông màu sắc hoặc mức giá mong muốn
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="panel"
        style={{
          marginBottom: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
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
                Tông {col}
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
            <option value="default">Mặc định</option>
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
          marginBottom: 18,
          fontSize: '0.9rem',
          color: '#6b7280',
        }}
      >
        <SlidersHorizontal size={16} />
        <span>
          Hiển thị <b>{filtered.length}</b> sản phẩm phù hợp
        </span>
      </div>

      {loading ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          Đang tải bộ sưu tập hoa...
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          Không tìm thấy mẫu hoa nào khớp với bộ lọc hiện tại.
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
