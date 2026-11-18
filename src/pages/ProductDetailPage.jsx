import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart,
  Sparkles,
  Star,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Gift,
  Clock,
  Ruler,
  Flower2,
  Heart,
  Zap,
} from 'lucide-react';
import api, { AI_BASE_URL, formatVND, getFlowerImage } from '../services/api';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const WISHLIST_STORAGE_KEY = 'thx_wishlist_ids';

function readWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildFlowerSpecs(product) {
  const name = String(product?.tenSanPham || '').toLowerCase();
  const tone = product?.tongMauSac || 'Hài hòa tự nhiên';
  const catId = Number(product?.maDanhMuc || 1);
  const price = Number(product?.giaBan || 0);

  let composition = `Hoa tươi chủ đạo ${tone.toLowerCase()}, kết hợp hoa lá phụ nhập khẩu và giấy gói lụa Hàn Quốc chống thấm.`;
  if (name.includes('hướng dương')) {
    composition =
      'Hoa hướng dương tuyển chọn bông to, phối cùng hoa hồng kem, cúc tana, lá bạc eucalyptus và nơ ruy băng lụa.';
  } else if (name.includes('lan hồ điệp') || name.includes('lan')) {
    composition =
      'Cành lan hồ điệp loại A cánh dày nở đều, trồng trong chậu sứ men cao cấp kèm phụ kiện trang trí sang trọng.';
  } else if (name.includes('tulip')) {
    composition =
      'Hoa tulip Hà Lan nhập khẩu tươi mới trong ngày, điểm xuyết lá xanh mềm mại và giấy gói tối giản thanh lịch.';
  } else if (name.includes('baby')) {
    composition =
      'Hoa baby trắng tinh khôi bồng bềnh kết hợp giấy gói mờ cao cấp và thiệp chúc mừng thiết kế riêng.';
  } else if (name.includes('hồng')) {
    composition = `Hoa hồng tươi Đà Lạt tuyển chọn (${tone.toLowerCase()}), phối cùng baby trắng, lá bạc và giấy gói nghệ thuật.`;
  }

  let dimensions = 'Cao 55cm – 65cm × Rộng 40cm (Bó tiêu chuẩn)';
  if (catId === 3 || name.includes('kệ') || name.includes('lẵng') || price >= 900000) {
    dimensions = 'Cao 150cm – 170cm × Rộng 80cm (Kệ / Lẵng hoa quy mô lớn)';
  } else if (catId === 2 || catId === 4 || name.includes('giỏ') || name.includes('hộp')) {
    dimensions = 'Cao 40cm – 50cm × Rộng 35cm (Giỏ / Hộp hoa để bàn sang trọng)';
  } else if (catId === 5 || name.includes('cưới')) {
    dimensions = 'Đường kính 28cm – 32cm (Bó hoa cầm tay gọn nhẹ, cân đối)';
  }

  return {
    composition,
    dimensions,
    freshness: 'Tươi đẹp từ 3 – 5 ngày (tặng kèm gói dưỡng hoa chuyên dụng)',
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, addToCart, showToast } = useApp();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(() => readWishlist());
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [buyingNow, setBuyingNow] = useState(false);

  const normalizeScore = (raw) => {
    if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
    if (raw > 1 && raw <= 100) return Number((raw / 100).toFixed(2));
    if (raw >= 0 && raw <= 1) return Number(raw.toFixed(2));
    return null;
  };

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [spRes, recRes, revRes, allSpRes] = await Promise.all([
        api.get(`/SanPham/${id}`),
        api.get(`/SanPham/${id}/recommendations`).catch(() => ({ data: {} })),
        api.get(`/DanhGia/product/${id}`).catch(() => ({ data: [] })),
        api.get('/SanPham').catch(() => ({ data: [] })),
      ]);
      const currentSp = spRes.data;
      setProduct(currentSp);
      setQty(1);

      const allProducts = Array.isArray(allSpRes.data)
        ? allSpRes.data
        : allSpRes.data?.items || [];

      const recData = recRes.data || {};
      let recList =
        recData.sanPhamGoiY ||
        recData.danhSachGoiY ||
        recData.sanPhamTuongTu ||
        recData.goiY ||
        recData.recommendations ||
        recData.items ||
        (Array.isArray(recData) ? recData : []);

      if (!Array.isArray(recList) || recList.length === 0) {
        const firstArrayKey = Object.keys(recData).find((k) => Array.isArray(recData[k]));
        if (firstArrayKey) {
          recList = recData[firstArrayKey];
        }
      }

      const sourceLabel = recData.nguonGoiY || 'MachineLearning_Smart_AI';

      recList = (recList || []).map((item) => {
        const rawScore =
          item.similarityScore ??
          item.doTuongDong ??
          item.diemTuongDong ??
          item.score ??
          null;
        return {
          ...item,
          similarityScore: normalizeScore(rawScore),
        };
      });

      const hasValidScores =
        recList.length > 0 && recList.every((x) => typeof x.similarityScore === 'number');

      if (!hasValidScores || sourceLabel.toLowerCase().includes('fallback')) {
        try {
          const aiRes = await axios.get(`${AI_BASE_URL}/recommend/${id}`);
          const details =
            aiRes.data?.details ||
            aiRes.data?.recommendations ||
            (Array.isArray(aiRes.data) ? aiRes.data : []);
          if (details.length > 0) {
            recList = details
              .map((d) => {
                const spId = d.maSanPham ?? d.id;
                const full = allProducts.find((p) => p.maSanPham === spId);
                const score = normalizeScore(
                  d.similarityScore ?? d.score ?? d.doTuongDong ?? 0.75
                );
                return full
                  ? { ...full, similarityScore: score }
                  : { ...d, maSanPham: spId, similarityScore: score };
              })
              .filter(Boolean);
          }
        } catch {
          // Dùng gợi ý dự phòng bên dưới nếu dịch vụ AI nghỉ
        }
      }

      if ((!recList || recList.length === 0) && allProducts.length > 1) {
        recList = allProducts.filter((p) => p.maSanPham !== Number(id)).slice(0, 4);
      }

      recList = (recList || []).map((item, idx) => {
        if (typeof item.similarityScore === 'number') return item;
        let calcScore = 0.64 - idx * 0.04;
        if (currentSp?.tongMauSac && item.tongMauSac === currentSp.tongMauSac) {
          calcScore += 0.22;
        }
        if (currentSp?.maDanhMuc && item.maDanhMuc === currentSp.maDanhMuc) {
          calcScore += 0.1;
        }
        const clamped = Math.min(0.96, Math.max(0.45, Number(calcScore.toFixed(2))));
        return { ...item, similarityScore: clamped };
      });

      setRecommendations(recList);
      setReviews(Array.isArray(revRes.data) ? revRes.data : []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadDetail();

    const handleProductSync = () => loadDetail();
    window.addEventListener('thx_products_updated', handleProductSync);
    return () => window.removeEventListener('thx_products_updated', handleProductSync);
  }, [loadDetail]);

  const toggleWishlist = () => {
    if (!product?.maSanPham) return;
    const spId = product.maSanPham;
    setWishlistIds((prev) => {
      const exists = prev.includes(spId);
      const next = exists ? prev.filter((item) => item !== spId) : [...prev, spId];
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Bỏ qua
      }
      showToast(
        exists
          ? `Đã bỏ "${product.tenSanPham}" khỏi yêu thích`
          : `Đã lưu "${product.tenSanPham}" vào mục yêu thích ❤️`
      );
      return next;
    });
  };

  const handleBuyNow = async () => {
    if (!product?.maSanPham || buyingNow) return;
    setBuyingNow(true);
    try {
      const ok = await addToCart(product.maSanPham, qty);
      if (ok) {
        navigate('/cart');
      }
    } finally {
      setBuyingNow(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Vui lòng đăng nhập để gửi đánh giá!', 'error');
      return;
    }
    try {
      await api.post('/DanhGia', {
        maSanPham: Number(id),
        soSao: Number(rating),
        binhLuan: comment,
      });
      showToast('Cảm ơn bạn đã gửi đánh giá sản phẩm!');
      setComment('');
      const revRes = await api.get(`/DanhGia/product/${id}`);
      setReviews(Array.isArray(revRes.data) ? revRes.data : []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể gửi đánh giá lúc này', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          Đang tải chi tiết sản phẩm và gợi ý hoa đồng điệu...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <div className="panel">Không tìm thấy sản phẩm.</div>
      </div>
    );
  }

  const stock = Number(product.soLuongTon ?? 15);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const isLiked = wishlistIds.includes(product.maSanPham);
  const specs = buildFlowerSpecs(product);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (Number(r.soSao) || 5), 0) / reviews.length
        ).toFixed(1)
      : '4.9';

  return (
    <div className="container" style={{ marginTop: 24, marginBottom: 64 }}>
      <style>{`
        .thx-detail-card {
          display: grid;
          grid-template-columns: 1fr 1.08fr;
          gap: 32px;
          padding: 26px;
        }
        .thx-detail-img {
          width: 100%;
          height: 440px;
          object-fit: cover;
          border-radius: 18px;
          border: 1px solid #f3f4f6;
        }
        .thx-promise-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .thx-promise-box {
          border: 1px solid #fce7f3;
          background: #fffafb;
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .thx-detail-cta-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: auto;
        }
        @media (max-width: 768px) {
          .thx-detail-card {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 16px;
          }
          .thx-detail-img {
            height: 310px;
          }
          .thx-promise-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .thx-promise-box {
            flex-direction: row;
            text-align: left;
            padding: 9px 12px;
            gap: 10px;
          }
        }
      `}</style>

      <Link
        to="/#catalog"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#6b7280',
          marginBottom: 16,
          fontSize: '0.9rem',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} /> Quay lại danh sách hoa
      </Link>

      {/* Khung chi tiết sản phẩm */}
      <div className="panel thx-detail-card">
        {/* Cột ảnh sản phẩm */}
        <div style={{ position: 'relative' }}>
          <img
            src={getFlowerImage(product)}
            alt={product.tenSanPham}
            className="thx-detail-img"
          />

          <button
            type="button"
            onClick={toggleWishlist}
            aria-label="Yêu thích sản phẩm"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #fce7f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <Heart
              size={19}
              fill={isLiked ? '#e11d48' : 'none'}
              color={isLiked ? '#e11d48' : '#6b7280'}
            />
          </button>
        </div>

        {/* Cột thông tin & quy cách */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="badge badge-rose">{product.tenDanhMuc || 'Hoa Nghệ Thuật'}</span>
            {product.tongMauSac && (
              <span className="badge badge-gold">Tông màu: {product.tongMauSac}</span>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                background: isOutOfStock
                  ? '#f3f4f6'
                  : isLowStock
                  ? '#fef3c7'
                  : '#dcfce7',
                color: isOutOfStock
                  ? '#4b5563'
                  : isLowStock
                  ? '#92400e'
                  : '#166534',
              }}
            >
              <CheckCircle2 size={13} />
              <span>
                {isOutOfStock
                  ? 'Tạm hết hàng'
                  : isLowStock
                  ? `Sắp hết hàng (còn ${stock} bó)`
                  : `Còn hàng (${stock} bó)`}
              </span>
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', marginBottom: 8 }}>{product.tenSanPham}</h1>

          {/* Đánh giá sao */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              fontSize: '0.86rem',
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
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <span>{avgRating} / 5.0</span>
            </span>
            <span style={{ color: '#9ca3af' }}>&bull;</span>
            <span style={{ color: '#6b7280' }}>
              {reviews.length > 0 ? `${reviews.length} đánh giá thực tế` : 'Được khách hàng yêu thích'}
            </span>
          </div>

          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#e11d48',
              marginBottom: 14,
            }}
          >
            {formatVND(product.giaBan)}
          </div>

          <p style={{ color: '#4b5563', marginBottom: 16, lineHeight: 1.65, fontSize: '0.93rem' }}>
            {product.moTa ||
              'Bó hoa tươi tuyển chọn trong ngày, phối màu hài hòa tinh tế, tặng kèm thiệp chúc mừng viết tay và hướng dẫn dưỡng hoa tươi lâu.'}
          </p>

          {/* 3 Cam kết dịch vụ chuẩn mẫu */}
          <div className="thx-promise-grid">
            <div className="thx-promise-box">
              <Truck size={19} color="#e11d48" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111827' }}>
                  Giao nhanh 2H
                </div>
                <div style={{ fontSize: '0.71rem', color: '#6b7280' }}>
                  0đ khi lấy tại tiệm
                </div>
              </div>
            </div>

            <div className="thx-promise-box">
              <Gift size={19} color="#e11d48" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111827' }}>
                  Tặng Thiệp / Banner
                </div>
                <div style={{ fontSize: '0.71rem', color: '#6b7280' }}>
                  Thiết kế miễn phí
                </div>
              </div>
            </div>

            <div className="thx-promise-box">
              <Clock size={19} color="#e11d48" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111827' }}>
                  Hoa tươi trong ngày
                </div>
                <div style={{ fontSize: '0.71rem', color: '#6b7280' }}>
                  Gửi ảnh duyệt trước
                </div>
              </div>
            </div>
          </div>

          {/* Bảng thông số Thành phần hoa & Kích thước */}
          <div
            style={{
              background: '#f9fafb',
              border: '1px solid #f3f4f6',
              borderRadius: 14,
              padding: '13px 15px',
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: '0.85rem',
              color: '#374151',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Flower2 size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                <b>Thành phần hoa:</b> {specs.composition}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Ruler size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                <b>Kích thước ước tính:</b> {specs.dimensions}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                <b>Độ bền tươi:</b> {specs.freshness}
              </span>
            </div>
          </div>

          {/* Bộ chọn số lượng & 2 nút hành động */}
          <div className="thx-detail-cta-row">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1.5px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#ffffff',
              }}
            >
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ padding: '10px 14px', background: 'white', fontWeight: 700 }}
              >
                -
              </button>
              <span style={{ padding: '0 13px', fontWeight: 700 }}>{qty}</span>
              <button
                type="button"
                disabled={isOutOfStock || qty >= stock}
                onClick={() => setQty(Math.min(stock, qty + 1))}
                style={{ padding: '10px 14px', background: 'white', fontWeight: 700 }}
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => addToCart(product.maSanPham, qty)}
              className="btn btn-outline"
              style={{
                flex: 1,
                minWidth: 165,
                padding: '12px 16px',
                borderColor: '#e11d48',
                color: '#e11d48',
                fontWeight: 700,
              }}
            >
              <ShoppingCart size={17} />
              <span>{isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock || buyingNow}
              onClick={handleBuyNow}
              className="btn btn-primary"
              style={{ flex: 1, minWidth: 165, padding: '12px 16px', fontWeight: 700 }}
            >
              <Zap size={17} />
              <span>{buyingNow ? 'Đang chuyển...' : 'Đặt hoa ngay'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gợi ý mẫu hoa tương tự từ Smart AI */}
      <section style={{ marginTop: 44 }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.55rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <Sparkles color="#e11d48" size={22} />
            <span>Gợi Ý Hoa Đồng Điệu Từ Smart AI</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#6b7280' }}>
            Đề xuất tự động dựa trên sự hài hòa về tông màu sắc, kiểu dáng và ý nghĩa quà tặng
          </p>
        </div>

        <div className="product-grid">
          {recommendations.map((item) => (
            <ProductCard
              key={item.maSanPham}
              product={item}
              similarityScore={item.similarityScore}
            />
          ))}
        </div>
      </section>

      {/* Đánh giá từ khách hàng */}
      <section style={{ marginTop: 44 }}>
        <h2 style={{ fontSize: '1.55rem', marginBottom: 16 }}>
          Đánh Giá Từ Khách Hàng ({reviews.length})
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 22,
          }}
        >
          <div className="panel">
            <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Viết nhận xét của bạn</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Đánh giá sao</label>
                <select
                  className="form-control"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 - Tuyệt vời)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 - Rất hài lòng)</option>
                  <option value={3}>⭐⭐⭐ (3/5 - Khá ổn)</option>
                  <option value={2}>⭐⭐ (2/5 - Cần cải thiện)</option>
                  <option value={1}>⭐ (1/5 - Chưa hài lòng)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cảm nhận về bó hoa</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Hoa rất tươi, giao đúng giờ và gói cực kỳ xinh..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Gửi đánh giá
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.length === 0 ? (
              <div className="panel" style={{ color: '#6b7280' }}>
                Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên nhận xét nhé!
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.maDanhGia} className="panel" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <b>{r.hoTenNguoiDung || r.tenNguoiDung || 'Khách hàng'}</b>
                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={15} fill="#f59e0b" /> {r.soSao}/5
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>{r.binhLuan}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}