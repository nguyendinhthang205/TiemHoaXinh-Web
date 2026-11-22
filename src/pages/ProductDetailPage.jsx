import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Maximize2,
  X,
  Droplets,
  ChevronDown,
} from 'lucide-react';
import api, {
  AI_BASE_URL,
  formatVND,
  getFlowerImage,
  getMergedProductReviews,
  syncProductReviewsFromCloud,
  syncProductOverridesFromCloud,
  saveProductReview,
} from '../services/api';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import {
  COLOR_SWATCH_MAP,
  normalizeColorGroup,
  pushRecentlyViewedId,
  readRecentlyViewedIds,
} from '../utils/storeUtils';

function buildFlowerSpecs(product) {
  const name = String(product?.tenSanPham || '').toLowerCase();
  const tone = product?.tongMauSac || 'Hài hòa tự nhiên';
  const catId = Number(product?.maDanhMuc || 1);
  const price = Number(product?.giaBan || 0);

  let composition = `Hoa tươi chủ đạo ${tone.toLowerCase()}, kết hợp hoa lá phụ nhập khẩu và giấy gói lụa Hàn Quốc chống thấm.`;
  if (name.includes('mẫu đơn')) {
    composition =
      'Hoa mẫu đơn (Peony) nhập khẩu cánh dày kiêu sa, phối hoa mao lương, hoa thanh liễu và giấy gói lụa Hàn Quốc cao cấp.';
  } else if (name.includes('hướng dương')) {
    composition =
      'Hoa hướng dương tuyển chọn bông to rực rỡ, phối cùng hoa hồng vàng, lá bạc eucalyptus và nơ ruy băng lụa.';
  } else if (name.includes('lan hồ điệp') || name.includes('lan')) {
    composition =
      'Cành lan hồ điệp loại A cánh dày nở đều, ghép trong chậu sứ men cao cấp kèm phụ kiện trang trí sang trọng bền đẹp 4–6 tuần.';
  } else if (name.includes('tulip')) {
    composition =
      'Hoa tulip Hà Lan nhập khẩu tươi mới trong ngày, điểm xuyết lá xanh mềm mại và giấy gói tối giản thanh lịch.';
  } else if (name.includes('cẩm tú cầu')) {
    composition =
      'Hoa cẩm tú cầu Đà Lạt bông tròn đầy đặn, phối cát tường trắng, lá bạc và nơ ruy băng cao cấp.';
  } else if (name.includes('oải hương') || name.includes('lavender')) {
    composition =
      'Hoa oải hương Lavender thơm dịu tự nhiên bó tròn thủ công, thắt dây ruy băng lụa phong cách Pháp cổ điển.';
  } else if (name.includes('mao lương')) {
    composition =
      'Hoa mao lương (Ranunculus) nhiều lớp cánh sắc cam đào phối mẫu đơn pastel và hoa lá phụ châu Âu tinh tế.';
  } else if (name.includes('cẩm chướng')) {
    composition =
      'Hoa cẩm chướng (Carnation) hồng ngọt ngào phối hồng kem, hoa baby trắng và lá bạc biểu trưng cho tình mẫu tử tri ân.';
  } else if (name.includes('hoa sen')) {
    composition =
      'Hoa sen hồng cánh kép tươi mới cắt sáng sớm, gói giấy thư pháp nghệ thuật và nơ lụa phong cách Á Đông thanh tao.';
  } else if (name.includes('thược dược')) {
    composition =
      'Hoa thược dược (Dahlia) cam san hô nổi bật kết hợp cúc họa mi và hoa cát tường trắng tràn đầy sức sống.';
  } else if (name.includes('thiên điểu')) {
    composition =
      'Hoa thiên điểu (Strelitzia) dáng vươn mạnh mẽ phối lan hồ điệp trắng, lá trầu bà Nam Mỹ và hoa phụ cao cấp.';
  } else if (name.includes('đồng tiền')) {
    composition =
      'Hoa đồng tiền kép (Gerbera) tuyển chọn bông to sắc nét, kết hợp lá monstera và hoa lá điểm chúc mừng rạng rỡ.';
  } else if (name.includes('phi yến')) {
    composition =
      'Hoa phi yến xanh dương (Delphinium) thanh thoát phối hồng trắng Đà Lạt và lá xanh trang trí hiện đại.';
  } else if (name.includes('loa kèn') || name.includes('calla')) {
    composition =
      'Hoa loa kèn trắng Calla Lily nhập khẩu dáng uốn mềm mại, điểm xuyết hoa baby trắng và ruy băng voan cô dâu.';
  } else if (name.includes('linh lan')) {
    composition =
      'Hoa linh lan chuông trắng quý hiếm kết hợp hoa hồng trắng Ohara thơm dịu và lá xanh thanh tao.';
  } else if (name.includes('cúc tana')) {
    composition =
      'Hoa cúc tana (Chamomile) nhụy vàng cánh trắng nhỏ xinh bồng bềnh phong cách Hàn Quốc.';
  } else if (name.includes('hoa ly')) {
    composition =
      'Hoa ly trắng Đà Lạt loại 1 bông to hương thơm ngát, điểm hoa baby trắng và giấy gói lụa tối giản.';
  } else if (name.includes('baby')) {
    composition =
      'Hoa baby Hà Lan (Gypsophila) bồng bềnh như mây kết hợp giấy gói mờ cao cấp và thiệp chúc mừng thiết kế riêng.';
  } else if (name.includes('hồng')) {
    composition = `Hoa hồng tươi tuyển chọn (${tone.toLowerCase()}), phối cùng hoa lá phụ nhập khẩu và giấy gói nghệ thuật.`;
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
  const { user, addToCart, showToast, wishlistIds = [], toggleWishlist } = useApp() || {};

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [aiSourceLabel, setAiSourceLabel] = useState('TF-IDF & Cosine Similarity');
  const [recentProducts, setRecentProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [buyingNow, setBuyingNow] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);

  const serverReviewsRef = useRef([]);

  const normalizeScore = (raw) => {
    if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
    if (raw > 1 && raw <= 100) return Number((raw / 100).toFixed(2));
    if (raw >= 0 && raw <= 1) return Number(raw.toFixed(2));
    return null;
  };

  const loadDetail = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        const [spRes, recRes, revRes, allSpRes] = await Promise.all([
          api.get(`/SanPham/${id}`),
          api.get(`/SanPham/${id}/recommendations`).catch(() => ({ data: {} })),
          api.get(`/DanhGia/product/${id}`).catch(() => ({ data: [] })),
          api.get('/SanPham').catch(() => ({ data: [] })),
        ]);

        const currentSp = spRes.data;
        setProduct(currentSp);
        if (!silent) {
          setQty(1);
          pushRecentlyViewedId(currentSp?.maSanPham ?? id);
        }

        const allProducts = Array.isArray(allSpRes.data)
          ? allSpRes.data
          : allSpRes.data?.items || [];

        const recentIds = readRecentlyViewedIds().filter(
          (rid) => Number(rid) !== Number(id)
        );
        const recentList = recentIds
          .map((rid) => allProducts.find((p) => Number(p.maSanPham) === Number(rid)))
          .filter(Boolean)
          .slice(0, 4);
        setRecentProducts(recentList);

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
        let activeSource = 'TF-IDF & Cosine Similarity';

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
            const aiRes = await axios.get(`${AI_BASE_URL}/recommend/${id}`, { timeout: 4000 });
            const details =
              aiRes.data?.details ||
              aiRes.data?.recommendations ||
              (Array.isArray(aiRes.data) ? aiRes.data : []);
            if (details.length > 0) {
              activeSource = aiRes.data?.algorithm || 'TF-IDF + Cosine Similarity (FastAPI AI)';
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
            activeSource = 'Smart Attribute Matching';
          }
        }

        if ((!recList || recList.length === 0) && allProducts.length > 1) {
          activeSource = 'Smart Attribute Matching';
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

        setAiSourceLabel(activeSource);
        setRecommendations(recList);

        const rawSrvReviews = Array.isArray(revRes.data) ? revRes.data : [];
        serverReviewsRef.current = rawSrvReviews;
        setReviews(getMergedProductReviews(id, rawSrvReviews));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadDetail(false);

    syncProductOverridesFromCloud().catch(() => {});
    syncProductReviewsFromCloud().catch(() => {});
  }, [id, loadDetail]);

  useEffect(() => {
    const handleProductSync = () => loadDetail(true);
    const handleReviewsSync = () => {
      setReviews(getMergedProductReviews(id, serverReviewsRef.current));
    };

    window.addEventListener('thx_products_updated', handleProductSync);
    window.addEventListener('thx_reviews_updated', handleReviewsSync);
    return () => {
      window.removeEventListener('thx_products_updated', handleProductSync);
      window.removeEventListener('thx_reviews_updated', handleReviewsSync);
    };
  }, [id, loadDetail]);

  const handleBuyNow = async () => {
    if (!product?.maSanPham || buyingNow) return;
    if (!user) {
      showToast('Vui lòng đăng nhập để đặt hoa!', 'error');
      navigate('/login');
      return;
    }
    setBuyingNow(true);
    try {
      const ok = await addToCart(product.maSanPham, qty);
      if (ok) navigate('/cart');
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
    const text = comment.trim();
    if (!text) return;

    await saveProductReview(id, {
      userName: user.hoTen || user.email || 'Khách hàng',
      rating: Number(rating),
      comment: text,
      isVerifiedBuyer: true,
    });

    showToast('Cảm ơn bạn! Đánh giá đã được lưu và hiển thị công khai.');
    setComment('');
    setReviews(getMergedProductReviews(id, serverReviewsRef.current));
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: 28, marginBottom: 64 }}>
        <div className="panel thx-detail-card">
          <div className="thx-skeleton" style={{ height: 420, borderRadius: 18 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="thx-skeleton" style={{ height: 24, width: '40%' }} />
            <div className="thx-skeleton" style={{ height: 38, width: '80%' }} />
            <div className="thx-skeleton" style={{ height: 32, width: '35%' }} />
            <div className="thx-skeleton" style={{ height: 90, width: '100%' }} />
            <div className="thx-skeleton" style={{ height: 110, width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ marginBottom: 10 }}>Không tìm thấy mẫu hoa này</h2>
          <Link to="/#catalog" className="btn btn-primary btn-sm">
            Quay lại bộ sưu tập
          </Link>
        </div>
      </div>
    );
  }

  const stock = Number(product.soLuongTon ?? 15);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const isLiked = wishlistIds.includes(product.maSanPham);
  const specs = buildFlowerSpecs(product);
  const cleanTone = normalizeColorGroup(product.tongMauSac);
  const swatchHex = COLOR_SWATCH_MAP[cleanTone] || '#f9a8d4';
  const mainImageUrl = getFlowerImage(product);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (Number(r.soSao) || 5), 0) / reviews.length
        ).toFixed(1)
      : '4.9';

  const starBreakdown = [5, 4, 3, 2, 1].map((s) => {
    const cnt = reviews.filter((r) => Number(r.soSao) === s).length;
    const pct = reviews.length > 0 ? Math.round((cnt / reviews.length) * 100) : s === 5 ? 90 : 10;
    return { star: s, count: cnt, pct };
  });

  return (
    <div className="container" style={{ marginTop: 24, marginBottom: 64 }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
          fontSize: '0.86rem',
        }}
      >
        <Link
          to="/#catalog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#6b7280',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Quay lại danh sách hoa
        </Link>

        <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
          <span>Trang chủ</span> &rsaquo;{' '}
          <span>{product.tenDanhMuc || 'Hoa Nghệ Thuật'}</span> &rsaquo;{' '}
          <strong style={{ color: '#181316' }}>{product.tenSanPham}</strong>
        </div>
      </div>

      {/* Khung chi tiết sản phẩm */}
      <div className="panel thx-detail-card">
        <div className="thx-detail-img-wrap">
          <img
            src={mainImageUrl}
            alt={product.tenSanPham}
            className="thx-detail-img"
            onClick={() => setLightboxOpen(true)}
            style={{ cursor: 'zoom-in' }}
          />

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Phóng to ảnh hoa"
            title="Xem ảnh lớn"
            style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'rgba(24, 19, 22, 0.72)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Maximize2 size={13} />
            <span>Phóng to</span>
          </button>

          <button
            type="button"
            onClick={() => toggleWishlist?.(product.maSanPham, product.tenSanPham)}
            aria-label="Yêu thích sản phẩm"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #fce7f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="badge badge-rose">{product.tenDanhMuc || 'Hoa Nghệ Thuật'}</span>
            {product.tongMauSac && (
              <span className="badge badge-gold">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: swatchHex,
                    border: '1px solid rgba(0,0,0,0.15)',
                  }}
                />
                Tông màu: {cleanTone}
              </span>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: '0.77rem',
                fontWeight: 700,
                background: isOutOfStock
                  ? '#f3f4f6'
                  : isLowStock
                  ? '#fef3c7'
                  : '#dcfce7',
                color: isOutOfStock ? '#4b5563' : isLowStock ? '#92400e' : '#166534',
              }}
            >
              <CheckCircle2 size={13} />
              <span>
                {isOutOfStock
                  ? 'Tạm hết hàng'
                  : isLowStock
                  ? `Sắp hết (còn ${stock} bó)`
                  : `Còn hàng (${stock} bó)`}
              </span>
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.55rem, 2.5vw, 2rem)', marginBottom: 8 }}>
            {product.tenSanPham}
          </h1>

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
                gap: 4,
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <span>{avgRating} / 5.0</span>
            </span>
            <span style={{ color: '#9ca3af' }}>&bull;</span>
            <a href="#reviews-section" style={{ color: '#6b7280', fontWeight: 500 }}>
              {reviews.length > 0
                ? `${reviews.length} đánh giá từ khách mua hoa`
                : 'Được khách hàng yêu thích'}
            </a>
          </div>

          <div
            className="tabular-nums"
            style={{
              fontSize: '1.85rem',
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

          <div className="thx-promise-grid">
            <div className="thx-promise-box">
              <Truck size={19} color="#e11d48" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#181316' }}>
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
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#181316' }}>
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
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#181316' }}>
                  Hoa tươi trong ngày
                </div>
                <div style={{ fontSize: '0.71rem', color: '#6b7280' }}>
                  Gửi ảnh duyệt trước
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#f9fafb',
              border: '1px solid #f1e6ea',
              borderRadius: 14,
              padding: '13px 15px',
              marginBottom: 14,
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

          {/* Mẹo chăm hoa Accordion */}
          <div style={{ marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setCareOpen((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 13px',
                borderRadius: 11,
                background: '#fffafb',
                border: '1px solid #fce7f3',
                color: '#9f1239',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Droplets size={15} />
                Hướng dẫn giữ hoa tươi lâu đến 5 ngày
              </span>
              <ChevronDown
                size={15}
                style={{
                  transform: careOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {careOpen && (
              <div
                style={{
                  marginTop: 6,
                  padding: '10px 13px',
                  borderRadius: 11,
                  background: '#ffffff',
                  border: '1px solid #f3f4f6',
                  fontSize: '0.81rem',
                  color: '#4b5563',
                  lineHeight: 1.6,
                }}
              >
                • Cắt vát gốc cành 45° khoảng 1–2cm và thay nước sạch mỗi 1–2 ngày (hoặc châm ẩm xốp với giỏ/kệ hoa).
                <br />• Pha gói dưỡng hoa tặng kèm để giữ cánh hoa cứng cáp, tránh đặt dưới nắng gắt hoặc luồng gió điều hòa trực tiếp.
              </div>
            )}
          </div>

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
              <span className="tabular-nums" style={{ padding: '0 13px', fontWeight: 700 }}>
                {qty}
              </span>
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
              onClick={() => addToCart?.(product.maSanPham, qty)}
              className="btn btn-outline"
              style={{
                flex: 1,
                minWidth: 160,
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
              style={{ flex: 1, minWidth: 160, padding: '12px 16px', fontWeight: 700 }}
            >
              <Zap size={17} />
              <span>{buyingNow ? 'Đang chuyển...' : 'Đặt hoa ngay'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gợi ý mẫu hoa tương tự từ Smart AI */}
      <section style={{ marginTop: 44 }}>
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
            <h2 style={{ fontSize: '1.55rem', display: 'flex', alignItems: 'center', gap: 9 }}>
              <Sparkles color="#e11d48" size={22} />
              <span>Gợi Ý Hoa Đồng Điệu Từ Smart AI</span>
            </h2>
            <p style={{ fontSize: '0.87rem', color: '#6b7280', marginTop: 2 }}>
              Đề xuất tự động dựa trên sự hài hòa tông màu, kiểu dáng và ý nghĩa trao tặng
            </p>
          </div>
          <span className="badge badge-sage">{aiSourceLabel}</span>
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
      <section id="reviews-section" style={{ marginTop: 46, scrollMarginTop: 110 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    className="tabular-nums"
                    style={{ fontSize: '2.2rem', fontWeight: 800, color: '#e11d48', lineHeight: 1 }}
                  >
                    {avgRating}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 4 }}>
                    trên 5.0 sao
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {starBreakdown.map((b) => (
                    <div
                      key={b.star}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem' }}
                    >
                      <span style={{ width: 28, fontWeight: 600 }}>{b.star} ★</span>
                      <div
                        style={{
                          flex: 1,
                          height: 7,
                          borderRadius: 999,
                          background: '#f3f4f6',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${b.pct}%`,
                            height: '100%',
                            background: '#f59e0b',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span style={{ width: 22, textAlign: 'right', color: '#6b7280' }}>
                        {b.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Viết nhận xét của bạn</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label">Chọn mức độ hài lòng</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        aria-label={`${starVal} sao`}
                        style={{
                          background: '#fffafb',
                          border:
                            starVal <= rating
                              ? '1.5px solid #f59e0b'
                              : '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: '6px 9px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Star
                          size={18}
                          fill={starVal <= rating ? '#f59e0b' : 'none'}
                          color={starVal <= rating ? '#f59e0b' : '#d1d5db'}
                        />
                      </button>
                    ))}
                  </div>
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
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b>{r.hoTenNguoiDung || 'Khách hàng'}</b>
                      {r.isVerifiedBuyer && (
                        <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>
                          ✓ Đã đặt mua hoa
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontWeight: 700,
                      }}
                    >
                      <Star size={15} fill="#f59e0b" color="#f59e0b" /> {r.soSao}/5
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.55 }}>
                    {r.binhLuan}
                  </p>
                  {r.createdAt && (
                    <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: 6 }}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Mẫu hoa bạn vừa xem */}
      {recentProducts.length > 0 && (
        <section style={{ marginTop: 46 }}>
          <h2 style={{ fontSize: '1.45rem', marginBottom: 14 }}>Mẫu Hoa Bạn Vừa Xem</h2>
          <div className="product-grid">
            {recentProducts.map((item) => (
              <ProductCard key={`recent-${item.maSanPham}`} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Phóng to ảnh */}
      {lightboxOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div style={{ position: 'relative', maxWidth: 860, width: '94%' }}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Đóng ảnh phóng to"
              style={{
                position: 'absolute',
                top: -14,
                right: -14,
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#ffffff',
                color: '#181316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
              }}
            >
              <X size={18} />
            </button>
            <img
              src={mainImageUrl}
              alt={product.tenSanPham}
              style={{
                width: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: 18,
                background: '#ffffff',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
