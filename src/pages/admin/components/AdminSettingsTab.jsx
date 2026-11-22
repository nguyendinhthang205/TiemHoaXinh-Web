import React from 'react';
import { Phone, Check, MapPin, Clock } from 'lucide-react';
import { saveHotlineNumber } from '../../../services/api';
import { STORE_INFO, formatVietnamPhone } from '../../../utils/storeUtils';

export default function AdminSettingsTab({
  hotlineInput,
  setHotlineInput,
  showToast,
}) {
  return (
    <div className="panel" style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontSize: '1.35rem', marginBottom: 6 }}>Cài Đặt Hệ Thống Cửa Hàng</h2>
      <p style={{ fontSize: '0.86rem', color: '#6b7280', marginBottom: 20 }}>
        Cấu hình thông tin liên hệ hiển thị trực tiếp cho khách hàng trên toàn bộ trang web.
      </p>

      <div
        style={{
          padding: 18,
          borderRadius: 16,
          background: '#fffafb',
          border: '1px solid #fecdd3',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#e11d48',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Phone size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#181316' }}>
              Số Hotline Tư Vấn Nhanh
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Đồng bộ tự động sang nút gọi nhanh nổi, hộp chat và chân trang khách hàng
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const saved = saveHotlineNumber(hotlineInput);
            setHotlineInput(saved);
            showToast(`Đã cập nhật số Hotline tư vấn thành: ${saved}`);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
        >
          <input
            type="text"
            className="form-control"
            required
            placeholder="Nhập số Hotline (VD: 0905 123 456)"
            value={hotlineInput}
            onChange={(e) => setHotlineInput(e.target.value)}
            style={{ height: 40, width: 240, fontWeight: 700, color: '#be123c' }}
          />
          <button type="submit" className="btn btn-primary btn-sm" style={{ height: 40 }}>
            <Check size={15} />
            <span>Lưu &amp; Đồng bộ Hotline</span>
          </button>
        </form>

        <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#6b7280' }}>
          Hiển thị thực tế cho khách hàng:{' '}
          <strong className="tabular-nums" style={{ color: '#be123c' }}>
            {formatVietnamPhone(hotlineInput)}
          </strong>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: 14,
          background: '#f9fafb',
          border: '1px solid #f1e6ea',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: '0.85rem',
          color: '#374151',
        }}
      >
        <div style={{ fontWeight: 700, color: '#181316' }}>Thông tin điểm bán mặc định</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={15} color="#e11d48" />
          <span>{STORE_INFO.address}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={15} color="#e11d48" />
          <span>{STORE_INFO.openHours}</span>
        </div>
      </div>
    </div>
  );
}
