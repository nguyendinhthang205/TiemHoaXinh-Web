import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({
  open,
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'primary', // 'primary' | 'danger' | 'sage'
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = variant === 'danger';
  const isSage = variant === 'sage';

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel?.();
      }}
    >
      <div className="modal-box" style={{ maxWidth: 440, padding: 24, position: 'relative' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Đóng hộp thoại"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#f3f4f6',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDanger ? '#fef2f2' : isSage ? '#dcfce7' : '#fff1f2',
              color: isDanger ? '#dc2626' : isSage ? '#15803d' : '#e11d48',
            }}
          >
            {isSage ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
          </div>

          <div style={{ flex: 1 }}>
            <h3
              id="confirm-modal-title"
              style={{ fontSize: '1.12rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}
            >
              {title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.55 }}>{message}</p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 22,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-outline btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn btn-sm ${
              isDanger ? 'btn-danger' : isSage ? 'btn-sage' : 'btn-primary'
            }`}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
