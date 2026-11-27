import React, { useState } from 'react';
import { QrCode, CheckCircle, X, Copy, Check, AlertCircle } from 'lucide-react';
import { formatVND } from '../services/api';

const BANK_INFO = {
  bankName: 'VietinBank',
  accountName: 'NGUYEN DINH THANG',
  accountNumber: '105880014341',
  qrImage: '/images/vietqr-vietinbank.jpg',
};

export default function VietQrPaymentModal({
  order,
  onClose,
  onConfirmPaid,
  showToast,
}) {
  const [copiedKey, setCopiedKey] = useState('');

  if (!order) return null;

  const amountDigits = String(Math.max(0, Math.round(Number(order.tongTien || 0))));
  const transferNote = `TIEMHOAXINH DH${order.maDonHang}`;

  const handleCopy = async (key, text, label) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedKey(key);
      showToast?.(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? '' : prev)), 2000);
    } catch {
      showToast?.(`Không thể tự động sao chép, vui lòng chép thủ công: ${text}`, 'error');
    }
  };

  const renderCopyBtn = (key, value, label) => {
    const isCopied = copiedKey === key;
    return (
      <button
        type="button"
        onClick={() => handleCopy(key, value, label)}
        className="btn btn-outline btn-sm"
        style={{
          padding: '4px 9px',
          fontSize: '0.75rem',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {isCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
        <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
      </button>
    );
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-box"
        style={{
          textAlign: 'center',
          position: 'relative',
          maxWidth: 460,
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px 22px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          title="Đóng cửa sổ thanh toán"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#f3f4f6',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        <QrCode size={34} color="#e11d48" style={{ marginBottom: 6 }} />
        <h2 style={{ fontSize: '1.28rem', marginBottom: 4 }}>
          Quét Mã VietQR Để Thanh Toán
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: '0 0 14px' }}>
          Đơn hàng <b>#{order.maDonHang}</b> &bull; Ngân hàng <b>{BANK_INFO.bankName}</b>
        </p>

        <img
          src={order.qrUrl || BANK_INFO.qrImage}
          alt={`VietQR ${BANK_INFO.bankName} - ${BANK_INFO.accountName} - ${BANK_INFO.accountNumber}`}
          style={{
            width: '100%',
            maxWidth: 250,
            height: 'auto',
            borderRadius: 16,
            border: '1px solid var(--border)',
            marginBottom: 14,
            display: 'block',
            marginInline: 'auto',
          }}
        />

        <div
          style={{
            textAlign: 'left',
            background: '#fffafb',
            border: '1px solid #fecdd3',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6b7280' }}>Chủ TK ({BANK_INFO.bankName}):</span>
            <b style={{ color: '#181316' }}>{BANK_INFO.accountName}</b>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>Số tài khoản</div>
              <b className="tabular-nums" style={{ color: '#181316', fontSize: '0.92rem' }}>
                {BANK_INFO.accountNumber}
              </b>
            </div>
            {renderCopyBtn('stk', BANK_INFO.accountNumber, 'số tài khoản')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>Số tiền chính xác</div>
              <b className="tabular-nums" style={{ color: '#e11d48', fontSize: '1.05rem' }}>
                {formatVND(order.tongTien)}
              </b>
            </div>
            {renderCopyBtn('amt', amountDigits, 'số tiền')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>Nội dung chuyển khoản</div>
              <b style={{ color: '#be123c', fontSize: '0.9rem' }}>{transferNote}</b>
            </div>
            {renderCopyBtn('note', transferNote, 'nội dung chuyển khoản')}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 7,
            textAlign: 'left',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: 10,
            padding: '8px 11px',
            fontSize: '0.77rem',
            lineHeight: 1.45,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Đây là mã VietQR cố định của tiệm, app ngân hàng sẽ không tự điền sẵn số tiền và lời
            nhắn. Bạn vui lòng nhập đúng thông tin ở trên nhé.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button type="button" onClick={onConfirmPaid} className="btn btn-sage" style={{ width: '100%' }}>
            <CheckCircle size={18} />
            <span>Tôi đã chuyển khoản xong</span>
          </button>
        </div>
      </div>
    </div>
  );
}
