import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flower2,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Truck,
  Gift,
} from 'lucide-react';
import { getHotlineNumber } from '../services/api';

function formatVietnamPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return String(raw || '').trim();
}

export default function Footer() {
  const [hotline, setHotline] = useState(() => getHotlineNumber());

  useEffect(() => {
    const syncHotline = () => setHotline(getHotlineNumber());
    window.addEventListener('thx_hotline_updated', syncHotline);
    window.addEventListener('storage', syncHotline);
    return () => {
      window.removeEventListener('thx_hotline_updated', syncHotline);
      window.removeEventListener('storage', syncHotline);
    };
  }, []);

  const displayPhone = formatVietnamPhone(hotline);
  const dialHref = `tel:${String(hotline).replace(/[^0-9+]/g, '')}`;

  return (
    <footer
      style={{
        background: '#fffafb',
        borderTop: '1px solid #fce7f3',
        marginTop: 56,
        color: '#4b5563',
      }}
    >
      <style>{`
        .thx-footer-grid {
          display: grid;
          grid-template-columns: 1.3fr 0.85fr 1.15fr;
          gap: 32px;
          padding: 40px 0 32px;
        }
        @media (max-width: 768px) {
          .thx-footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 28px 0 24px;
          }
        }
      `}</style>

      <div className="container thx-footer-grid">
        {/* Cột 1: Thông tin cửa hàng & liên hệ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#e11d48',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flower2 size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#be123c' }}>
                Tiệm Hoa Xinh
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                Fresh Floral &amp; Smart AI
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.86rem', lineHeight: 1.6, marginBottom: 14 }}>
            Chuyên thiết kế hoa bó nghệ thuật, giỏ hoa chúc mừng và kệ hoa khai trương từ nguồn hoa tươi nhập mới mỗi sáng.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Số 48 Cao Thắng, Quận Hải Châu, TP. Đà Nẵng</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={16} color="#e11d48" style={{ flexShrink: 0 }} />
              <a
                href={dialHref}
                style={{ color: '#be123c', fontWeight: 700, textDecoration: 'none' }}
              >
                Hotline tư vấn: {displayPhone}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#e11d48" style={{ flexShrink: 0 }} />
              <span>Mở cửa: 07:00 – 21:30 (Tất cả các ngày trong tuần)</span>
            </div>
          </div>
        </div>

        {/* Cột 2: Liên kết nhanh */}
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.96rem',
              color: '#111827',
              marginBottom: 12,
            }}
          >
            Khám Phá Nhanh
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.86rem' }}>
            <Link to="/" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Trang chủ
            </Link>
            <Link to="/shop" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Bộ sưu tập hoa tươi
            </Link>
            <Link to="/shop?goiY=dip" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Smart AI gợi ý hoa theo dịp
            </Link>
            <Link to="/my-orders" style={{ color: '#4b5563', textDecoration: 'none' }}>
              Tra cứu đơn hàng của tôi
            </Link>
          </div>
        </div>

        {/* Cột 3: Chính sách mua hàng & Cam kết */}
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.96rem',
              color: '#111827',
              marginBottom: 12,
            }}
          >
            Chính Sách &amp; Cam Kết Dịch Vụ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Truck size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Giao hoa hỏa tốc trong 2 giờ nội thành; miễn phí nhận hoa trực tiếp tại tiệm.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Gift size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Tặng kèm thiệp chúc mừng viết tay hoặc banner thiết kế riêng theo yêu cầu.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <ShieldCheck size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Chụp ảnh thành phẩm gửi khách duyệt trước khi giao; đổi mới 100% nếu hoa dập nát.</span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #fce7f3',
          padding: '14px 0',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#6b7280',
        }}
      >
        &copy; {new Date().getFullYear()} Tiệm Hoa Xinh &bull; Hệ thống đặt hoa tươi trực tuyến &amp; Gợi ý thông minh
      </div>
    </footer>
  );
}