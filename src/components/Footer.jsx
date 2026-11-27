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
  Sparkles,
  QrCode,
  Banknote,
} from 'lucide-react';
import { getHotlineNumber } from '../services/api';
import { STORE_INFO, formatVietnamPhone } from '../utils/storeUtils';

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
        background: '#ffffff',
        borderTop: '1px solid #f1e6ea',
        marginTop: 56,
        color: '#4b5563',
      }}
    >
      <div className="container thx-footer-grid">
        {/* Cột 1: Thông tin cửa hàng & liên hệ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flower2 size={20} />
            </div>
            <div>
              <div
                className="serif-title"
                style={{ fontWeight: 700, fontSize: '1.15rem', color: '#9f1239' }}
              >
                {STORE_INFO.name}
              </div>
              <div style={{ fontSize: '0.73rem', color: '#6b7280', fontStyle: 'italic' }}>
                {STORE_INFO.tagline}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', lineHeight: 1.65, marginBottom: 14, color: '#4b5563' }}>
            Chuyên thiết kế hoa bó nghệ thuật, giỏ hoa chúc mừng, kệ hoa khai trương và hoa chia buồn tang lễ từ nguồn hoa tươi tuyển chọn mỗi sáng tại Đà Nẵng.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{STORE_INFO.address}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={16} color="#e11d48" style={{ flexShrink: 0 }} />
              <a href={dialHref} style={{ color: '#be123c', fontWeight: 700 }}>
                Hotline tư vấn: {displayPhone}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#e11d48" style={{ flexShrink: 0 }} />
              <span>{STORE_INFO.openHours}</span>
            </div>
          </div>
        </div>

        {/* Cột 2: Khám phá nhanh */}
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.94rem',
              color: '#181316',
              marginBottom: 12,
            }}
          >
            Khám Phá Nhanh
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.85rem' }}>
            <Link to="/" style={{ color: '#4b5563' }}>
              Trang chủ cửa hàng
            </Link>
            <Link to="/#catalog" style={{ color: '#4b5563' }}>
              Bộ sưu tập hoa tươi
            </Link>
            <Link
              to="/shop?goiY=dip#ai-concierge"
              style={{
                color: '#be123c',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Sparkles size={13} />
              <span>Smart AI gợi ý hoa theo dịp</span>
            </Link>
            <Link to="/my-orders" style={{ color: '#4b5563' }}>
              Tra cứu đơn hàng của tôi
            </Link>
          </div>
        </div>

        {/* Cột 3: Dịp tặng nổi bật */}
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.94rem',
              color: '#181316',
              marginBottom: 12,
            }}
          >
            Danh Mục Phổ Biến
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.85rem' }}>
            <Link to="/?cat=sinh-nhat#catalog" style={{ color: '#4b5563' }}>
              Hoa Sinh Nhật Ngọt Ngào
            </Link>
            <Link to="/?cat=khai-truong#catalog" style={{ color: '#4b5563' }}>
              Kệ &amp; Lẵng Hoa Khai Trương
            </Link>
            <Link to="/?cat=lan-ho-diep#catalog" style={{ color: '#4b5563' }}>
              Lan Hồ Điệp Cao Cấp
            </Link>
            <Link to="/?cat=chu-de#catalog" style={{ color: '#4b5563' }}>
              Hoa Tình Yêu &amp; Tri Ân
            </Link>
            <Link to="/?cat=tang-le#catalog" style={{ color: '#4b5563' }}>
              Hoa Tang Lễ &amp; Chia Buồn
            </Link>
          </div>
        </div>

        {/* Cột 4: Chính sách mua hàng & Thanh toán */}
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.94rem',
              color: '#181316',
              marginBottom: 12,
            }}
          >
            Cam Kết Dịch Vụ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Truck size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Giao hoa hỏa tốc 2H nội thành; 0đ khi nhận trực tiếp tại tiệm.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Gift size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Tặng thiệp chúc mừng viết tay hoặc banner thiết kế theo yêu cầu.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <ShieldCheck size={16} color="#e11d48" style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Gửi ảnh thành phẩm duyệt trước khi giao; đổi mới 100% nếu hoa dập nát.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <span className="badge badge-rose">
              <QrCode size={12} /> VietQR Online
            </span>
            <span className="badge badge-sage">
              <Banknote size={12} /> Tiền mặt COD
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#fffafb',
          borderTop: '1px solid #fce7f3',
          padding: '14px 20px',
          textAlign: 'center',
          fontSize: '0.79rem',
          color: '#6b7280',
        }}
      >
        &copy; {new Date().getFullYear()} {STORE_INFO.name} &bull; Hệ thống Đặt Hoa Tươi Nghệ Thuật &amp; Dự Báo AI
      </div>
    </footer>
  );
}
