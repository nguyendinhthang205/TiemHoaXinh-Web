import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Sparkles, Star, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api, { AI_BASE_URL, formatVND, getFlowerImage } from '../services/api';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, addToCart, showToast } = useApp();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  const normalizeScore = (raw) => {
    if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
    if (raw > 1 && raw <= 100) return Number((raw / 100).toFixed(2));
    if (raw >= 0 && raw <= 1) return Number(raw.toFixed(2));
    return null;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    async function loadDetail() {
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

        const sourceLabel = recData.nguonGoiY || 'MachineLearning_TFIDF_Cosine';

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
            // Giữ danh sách dự phòng bên dưới nếu dịch vụ AI tắt
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
    }
    loadDetail();
  }, [id]);

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
          Đang tải chi tiết sản phẩm và tính toán gợi ý AI...
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

  return (
    <div className="container" style={{ marginTop: 28 }}>
      <Link
        to="/shop"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#6b7280',
          marginBottom: 18,
          fontSize: '0.9rem',
        }}
      >
        <ArrowLeft size={16} /> Quay lại danh sách hoa
      </Link>

      {/* Main Product Box */}
      <div
        className="panel"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 36,
          padding: 28,
        }}
      >
        <div>
          <img
            src={getFlowerImage(product)}
            alt={product.tenSanPham}
            style={{
              width: '100%',
              height: 420,
              objectFit: 'cover',
              borderRadius: 18,
              border: '1px solid var(--border)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="badge badge-rose">{product.tenDanhMuc || 'Hoa Nghệ Thuật'}</span>
            {product.tongMauSac && (
              <span className="badge badge-gold">Tông màu: {product.tongMauSac}</span>
            )}
            <span className="badge badge-sage">
              <CheckCircle2 size={13} /> Còn {product.soLuongTon ?? 15} sản phẩm
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>{product.tenSanPham}</h1>

          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#e11d48',
              marginBottom: 18,
            }}
          >
            {formatVND(product.giaBan)}
          </div>

          <p style={{ color: '#4b5563', marginBottom: 22, lineHeight: 1.75 }}>
            {product.moTa ||
              'Bó hoa tươi tuyển chọn trong ngày, phối màu hài hòa tinh tế, tặng kèm thiệp chúc mừng viết tay và hướng dẫn dưỡng hoa tươi lâu.'}
          </p>

          <div
            style={{
              background: '#fff5f7',
              padding: 16,
              borderRadius: 14,
              marginBottom: 24,
              fontSize: '0.88rem',
              color: '#881337',
            }}
          >
            🎁 <b>Ưu đãi đi kèm:</b> Miễn phí thiệp chúc mừng sang trọng &amp; gói giấy lụa chống thấm cao cấp.
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1.5px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ padding: '10px 15px', background: 'white', fontWeight: 700 }}
              >
                -
              </button>
              <span style={{ padding: '0 14px', fontWeight: 700 }}>{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                style={{ padding: '10px 15px', background: 'white', fontWeight: 700 }}
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => addToCart(product.maSanPham, qty)}
              className="btn btn-primary"
              style={{ flex: 1, padding: '13px 24px' }}
            >
              <ShoppingCart size={18} />
              <span>Thêm vào giỏ hàng</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <section style={{ marginTop: 48 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.65rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles color="#e11d48" size={24} />
            <span>Gợi Ý Hoa Tương Tự Từ AI</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#6b7280' }}>
            Đề xuất tự động dựa trên độ tương đồng đặc trưng màu sắc, loài hoa và dịp tặng (TF-IDF + Cosine Similarity)
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

      {/* Reviews Section */}
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: 18 }}>
          Đánh Giá Từ Khách Hàng ({reviews.length})
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
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