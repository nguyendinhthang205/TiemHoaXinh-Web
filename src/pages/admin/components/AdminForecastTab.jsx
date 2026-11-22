import React, { useState } from 'react';
import { Download, Lightbulb, Search } from 'lucide-react';

export default function AdminForecastTab({
  forecasts,
  topForecastItem,
  topForecastImport,
  modelName,
  onExportForecastCSV,
}) {
  const [search, setSearch] = useState('');
  const [onlyUrgent, setOnlyUrgent] = useState(false);

  const visibleForecasts = forecasts.filter((item) => {
    const stock = item.soLuongTon ?? 15;
    const predicted =
      item.duBaoThangToi ?? item.soLuongDuBao ?? item.predictedSales ?? 30;
    const importQty =
      item.deXuatNhap ??
      item.soLuongCanNhap ??
      Math.max(0, Math.round(predicted - stock + 10));

    if (onlyUrgent && importQty <= 15) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        String(item.tenSanPham || '').toLowerCase().includes(q) ||
        String(item.maSanPham || '').includes(q)
      );
    }
    return true;
  });

  const urgentCount = forecasts.filter((item) => {
    const stock = item.soLuongTon ?? 15;
    const predicted =
      item.duBaoThangToi ?? item.soLuongDuBao ?? item.predictedSales ?? 30;
    const importQty =
      item.deXuatNhap ??
      item.soLuongCanNhap ??
      Math.max(0, Math.round(predicted - stock + 10));
    return importQty > 15;
  }).length;

  return (
    <div className="panel" style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
            Bảng Khuyến Nghị Nhập Hàng Tháng Tới (AI {modelName})
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#6b7280', marginTop: 4 }}>
            Phân tích dữ liệu tiêu thụ chuỗi thời gian kết hợp tồn kho thực tế để đề xuất số lượng nhập tối ưu (kèm đệm an toàn +10 bó).
          </p>
        </div>

        <button
          type="button"
          onClick={onExportForecastCSV}
          className="btn btn-outline btn-sm"
          style={{ borderColor: '#fecdd3', color: '#be123c' }}
        >
          <Download size={15} />
          <span>Xuất phiếu nhập hàng (.CSV)</span>
        </button>
      </div>

      {topForecastItem && (
        <div
          style={{
            background: '#fffafb',
            border: '1px solid #fecdd3',
            borderRadius: 14,
            padding: '13px 16px',
            marginBottom: 18,
            fontSize: '0.88rem',
            color: '#881337',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Lightbulb size={18} color="#e11d48" style={{ flexShrink: 0 }} />
          <span>
            <b>Khuyến nghị ưu tiên từ AI:</b> Tháng tới nên nhập thêm khoảng{' '}
            <b>+{Math.round(topForecastImport)} bó {topForecastItem.tenSanPham}</b> để đáp ứng nhu cầu tăng cao.
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setOnlyUrgent(false)}
            className={!onlyUrgent ? 'btn btn-dark btn-sm' : 'btn btn-outline btn-sm'}
          >
            Tất cả ({forecasts.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyUrgent(true)}
            className={onlyUrgent ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          >
            Cần nhập gấp ({urgentCount})
          </button>
        </div>

        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search
            size={15}
            color="#9ca3af"
            style={{ position: 'absolute', left: 11, top: 11 }}
          />
          <input
            type="text"
            className="form-control thx-admin-filter-input"
            placeholder="Tìm mẫu hoa cần dự báo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr
              style={{
                borderBottom: '2px solid #f3f4f6',
                textAlign: 'left',
                color: '#6b7280',
                fontSize: '0.82rem',
              }}
            >
              <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Mã Hoa</th>
              <th style={{ padding: '12px 10px' }}>Tên Bó Hoa</th>
              <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Tồn hiện tại</th>
              <th className="thx-nowrap" style={{ padding: '12px 10px' }}>AI dự báo nhu cầu</th>
              <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Đề xuất nhập thêm</th>
              <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Trạng thái kho</th>
            </tr>
          </thead>
          <tbody>
            {visibleForecasts.map((item, idx) => {
              const stock = item.soLuongTon ?? 15;
              const predicted =
                item.duBaoThangToi ?? item.soLuongDuBao ?? item.predictedSales ?? 30;
              const importQty =
                item.deXuatNhap ??
                item.soLuongCanNhap ??
                Math.max(0, Math.round(predicted - stock + 10));
              const urgent = importQty > 15;
              const moderate = importQty > 0 && importQty <= 15;

              return (
                <tr
                  key={item.maSanPham ?? idx}
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <td className="thx-nowrap tabular-nums" style={{ padding: '12px 10px', fontWeight: 600 }}>
                    #{item.maSanPham ?? idx + 1}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                    {item.tenSanPham}
                  </td>
                  <td className="thx-nowrap tabular-nums" style={{ padding: '12px 10px' }}>
                    {stock} bó
                  </td>
                  <td
                    className="thx-nowrap tabular-nums"
                    style={{ padding: '12px 10px', fontWeight: 700, color: '#2563eb' }}
                  >
                    {Math.round(predicted)} bó
                  </td>
                  <td
                    className="thx-nowrap tabular-nums"
                    style={{ padding: '12px 10px', fontWeight: 800, color: '#e11d48' }}
                  >
                    +{Math.round(importQty)} bó
                  </td>
                  <td className="thx-nowrap" style={{ padding: '12px 10px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: urgent ? '#fee2e2' : moderate ? '#fef3c7' : '#dcfce7',
                        color: urgent ? '#b91c1c' : moderate ? '#92400e' : '#166534',
                      }}
                    >
                      {urgent
                        ? 'Cần nhập gấp'
                        : moderate
                        ? 'Bổ sung nhẹ'
                        : 'Tồn kho an toàn'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
