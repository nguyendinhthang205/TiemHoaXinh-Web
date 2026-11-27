import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingCart, ArrowRight, RotateCcw } from 'lucide-react';
import { formatVND, getFlowerImage } from '../services/api';
import { useApp } from '../context/AppContext';
import {
  AI_CONCIERGE_OCCASIONS,
  AI_CONCIERGE_RECIPIENTS,
  BUDGET_OPTIONS,
  COLOR_SWATCH_MAP,
  STANDARD_COLORS,
  computeSmartAiMatches,
} from '../utils/storeUtils';

export default function SmartAiConcierge({ products = [] }) {
  const { addToCart } = useApp() || {};
  const [occasionId, setOccasionId] = useState('sinh-nhat');
  const [recipientId, setRecipientId] = useState('lover');
  const [tone, setTone] = useState('');
  const [budgetId, setBudgetId] = useState('');

  const matches = useMemo(
    () =>
      computeSmartAiMatches({
        products,
        occasionId,
        recipientId,
        tone,
        budgetId,
        limit: 3,
      }),
    [products, occasionId, recipientId, tone, budgetId]
  );

  const resetConcierge = () => {
    setOccasionId('sinh-nhat');
    setRecipientId('lover');
    setTone('');
    setBudgetId('');
  };

  return (
    <section id="ai-concierge" className="container" style={{ scrollMarginTop: 120 }}>
      <div className="thx-ai-studio">
        <div className="thx-ai-studio-grid">
          <div style={{ minWidth: 0, width: '100%' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(251, 113, 133, 0.18)',
                border: '1px solid rgba(253, 164, 175, 0.35)',
                color: '#fecdd3',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <Sparkles size={14} />
              <span>SMART AI FLORAL CONCIERGE</span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.45rem, 2.5vw, 2rem)',
                color: '#ffffff',
                lineHeight: 1.22,
                marginBottom: 8,
              }}
            >
              Chọn Hoa Chuẩn Gu Trong 10 Giây
            </h2>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'rgba(255, 255, 255, 0.78)',
                lineHeight: 1.6,
                marginBottom: 18,
              }}
            >
              Chọn dịp tặng, đối tượng nhận và tông màu yêu thích — trợ lý AI sẽ phân tích kho hoa thực tế và đề xuất 3 thiết kế đồng điệu nhất.
            </p>

            {/* 1. Dịp tặng */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#fda4af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 7,
                }}
              >
                1. Dịp trao tặng
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {AI_CONCIERGE_OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => {
                      setOccasionId(occ.id);
                      if (occ.id === 'tang-le') {
                        setRecipientId('condolence');
                      } else if (recipientId === 'condolence') {
                        setRecipientId('lover');
                      }
                    }}
                    className={`thx-ai-chip ${occasionId === occ.id ? 'active' : ''}`}
                  >
                    {occ.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Người nhận */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#fda4af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 7,
                }}
              >
                2. Người nhận hoa
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {AI_CONCIERGE_RECIPIENTS.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setRecipientId(rec.id)}
                    className={`thx-ai-chip ${recipientId === rec.id ? 'active' : ''}`}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tông màu + Ngân sách */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#fda4af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 7,
                }}
              >
                3. Tông màu &amp; Ngân sách
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setTone('')}
                  className={`thx-ai-chip ${tone === '' ? 'active' : ''}`}
                >
                  Mọi tông màu
                </button>
                {STANDARD_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setTone(col)}
                    className={`thx-ai-chip ${tone === col ? 'active' : ''}`}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: COLOR_SWATCH_MAP[col] || '#f9a8d4',
                        border: '1px solid rgba(255,255,255,0.6)',
                      }}
                    />
                    {col}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b.id || 'all-b'}
                    type="button"
                    onClick={() => setBudgetId(b.id)}
                    className={`thx-ai-chip ${budgetId === b.id ? 'active' : ''}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {(tone || budgetId) && (
              <button
                type="button"
                onClick={resetConcierge}
                style={{
                  background: 'transparent',
                  color: '#fecdd3',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <RotateCcw size={13} />
                <span>Đặt lại sở thích</span>
              </button>
            )}
          </div>

          {/* Kết quả AI Matching */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0, width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '4px 10px',
                fontSize: '0.82rem',
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: 2,
              }}
            >
              <span style={{ fontWeight: 700 }}>
                Top {matches.length} mẫu hoa phù hợp nhất với yêu cầu của bạn
              </span>
              <span style={{ fontSize: '0.74rem', color: '#fda4af' }}>
                Cập nhật theo tồn kho thực
              </span>
            </div>

            {matches.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.06)',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '0.88rem',
                }}
              >
                Đang đồng bộ danh mục hoa tươi để đề xuất...
              </div>
            ) : (
              matches.map(({ product, score, reason }) => (
                <div key={product.maSanPham} className="thx-ai-match-card">
                  <Link
                    to={`/product/${product.maSanPham}`}
                    style={{ flexShrink: 0, display: 'block' }}
                  >
                    <img
                      src={getFlowerImage(product)}
                      alt={product.tenSanPham}
                      className="thx-ai-match-img"
                    />
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#86efac',
                          fontSize: '0.71rem',
                          fontWeight: 700,
                        }}
                      >
                        Khớp {Math.round(score * 100)}%
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          fontWeight: 800,
                          color: '#fecdd3',
                          fontSize: '0.9rem',
                        }}
                      >
                        {formatVND(product.giaBan)}
                      </span>
                    </div>

                    <Link
                      to={`/product/${product.maSanPham}`}
                      className="thx-ai-match-title"
                    >
                      {product.tenSanPham}
                    </Link>

                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'rgba(255,255,255,0.74)',
                        margin: '2px 0 8px',
                        lineHeight: 1.4,
                      }}
                    >
                      {reason}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => addToCart?.(product.maSanPham, 1)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '5px 11px', fontSize: '0.76rem' }}
                      >
                        <ShoppingCart size={13} />
                        <span>Đặt nhanh</span>
                      </button>
                      <Link
                        to={`/product/${product.maSanPham}`}
                        style={{
                          fontSize: '0.77rem',
                          fontWeight: 600,
                          color: '#fda4af',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
