import React from 'react';
import { Flower2, Sparkles, ShieldCheck, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 72,
        background: '#fff5f7',
        borderTop: '1px solid var(--border)',
        padding: '44px 0 28px',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 28,
            paddingBottom: 32,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div className="brand" style={{ marginBottom: 10 }}>
              <div className="brand-icon">
                <Flower2 size={20} />
              </div>
              <span>Tiệm Hoa Xinh</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#6b7280' }}>
              Hệ thống thương mại điện tử hoa tươi nghệ thuật tích hợp Học máy gợi ý sản phẩm tương đồng (TF-IDF) và dự báo tồn kho thông minh.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Sparkles size={22} color="#e11d48" style={{ flexShrink: 0, marginTop: 3 }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Gợi ý cá nhân hóa AI</h4>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Phân tích tông màu, loài hoa và dịp tặng để đề xuất bó hoa đồng điệu nhất.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Truck size={22} color="#e11d48" style={{ flexShrink: 0, marginTop: 3 }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Giao hoa hỏa tốc 2H</h4>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Hoa tươi nhập mới mỗi sáng, tặng kèm thiệp chúc mừng thiết kế riêng.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <ShieldCheck size={22} color="#e11d48" style={{ flexShrink: 0, marginTop: 3 }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Thanh toán VietQR tiện lợi</h4>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Hỗ trợ quét mã VietQR tự động điền nội dung chuyển khoản hoặc thanh toán COD.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            paddingTop: 18,
            textAlign: 'center',
            fontSize: '0.83rem',
            color: '#9ca3af',
          }}
        >
          © 2026 Tiệm Hoa Xinh — ASP.NET Core 3.1 + Python FastAPI AI + SQL Server + ReactJS
        </div>
      </div>
    </footer>
  );
}
