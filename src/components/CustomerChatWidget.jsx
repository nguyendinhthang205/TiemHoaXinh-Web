import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PhoneCall, MessageCircle, X, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getHotlineNumber } from '../services/api';
import {
  ensureCustomerConversation,
  sendCustomerMessage,
  markConversationReadByCustomer,
  syncChatsFromCloud,
} from '../services/chatService';

function formatVietnamPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return String(raw || '').trim();
}

export default function CustomerChatWidget() {
  const location = useLocation();
  const appCtx = useApp() || {};
  const { user } = appCtx;

  const [isOpen, setIsOpen] = useState(false);
  const [hotline, setHotline] = useState(() => getHotlineNumber());
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isAdminPage = location.pathname.startsWith('/admin');
  const isAdminUser =
    String(user?.vaiTro || user?.role || '').toLowerCase() === 'admin' ||
    String(user?.email || '').toLowerCase().includes('admin') ||
    String(user?.hoTen || '').trim().toLowerCase() === 'admin';

  const isHidden = isAdminPage || isAdminUser;

  const loadConversationMessages = useCallback(() => {
    if (isHidden) return;
    try {
      const conv = ensureCustomerConversation(user);
      setMessages(Array.isArray(conv?.messages) ? conv.messages : []);
      setUnreadCount(Number(conv?.unreadByCustomer || 0));
    } catch {
      setMessages([]);
      setUnreadCount(0);
    }
  }, [user, isHidden]);

  useEffect(() => {
    if (isHidden) return undefined;

    loadConversationMessages();
    syncChatsFromCloud().then(() => loadConversationMessages());

    const handleOpenChat = () => {
      setIsOpen(true);
      loadConversationMessages();
      syncChatsFromCloud().then(() => {
        loadConversationMessages();
        markConversationReadByCustomer(user);
      });
    };
    const handleSyncChat = () => loadConversationMessages();
    const handleSyncHotline = () => setHotline(getHotlineNumber());

    window.addEventListener('thx_open_customer_chat', handleOpenChat);
    window.addEventListener('thx_chat_updated', handleSyncChat);
    window.addEventListener('storage', handleSyncChat);
    window.addEventListener('thx_hotline_updated', handleSyncHotline);
    window.addEventListener('storage', handleSyncHotline);

    return () => {
      window.removeEventListener('thx_open_customer_chat', handleOpenChat);
      window.removeEventListener('thx_chat_updated', handleSyncChat);
      window.removeEventListener('storage', handleSyncChat);
      window.removeEventListener('thx_hotline_updated', handleSyncHotline);
      window.removeEventListener('storage', handleSyncHotline);
    };
  }, [loadConversationMessages, user, isHidden]);

  useEffect(() => {
    if (!isOpen || isHidden) return undefined;
    const timer = setInterval(() => {
      syncChatsFromCloud().then(() => {
        loadConversationMessages();
        markConversationReadByCustomer(user);
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [isOpen, isHidden, loadConversationMessages, user]);

  useEffect(() => {
    if (isOpen && !isHidden) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [isOpen, isHidden, messages.length]);

  const handleToggleChat = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      loadConversationMessages();
      markConversationReadByCustomer(user);
      setUnreadCount(0);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');
    try {
      const updatedConv = await sendCustomerMessage(user, text);
      if (updatedConv && Array.isArray(updatedConv.messages)) {
        setMessages(updatedConv.messages);
      } else {
        loadConversationMessages();
      }
    } finally {
      setSending(false);
    }
  };

  if (isHidden) return null;

  const dialHref = `tel:${String(hotline).replace(/[^0-9+]/g, '')}`;
  const displayPhone = formatVietnamPhone(hotline);

  return (
    <>
      <style>{`
        @keyframes thxSoftPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.42), 0 6px 18px rgba(225, 29, 72, 0.25);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(225, 29, 72, 0), 0 6px 18px rgba(225, 29, 72, 0.25);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(225, 29, 72, 0), 0 6px 18px rgba(225, 29, 72, 0.25);
          }
        }
        .thx-chat-box {
          position: fixed;
          right: 22px;
          bottom: 136px;
          width: 350px;
          max-width: calc(100vw - 24px);
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
          border: 1px solid #fecdd3;
          overflow: hidden;
          z-index: 96;
          display: flex;
          flex-direction: column;
        }
        .thx-floating-chat-btn {
          position: fixed;
          right: 22px;
          bottom: 82px;
          z-index: 91;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 15px;
          border-radius: 999px;
          background: #ffffff;
          color: #be123c;
          border: 1.5px solid #fecdd3;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .thx-hotline-btn {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 90;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px;
          border-radius: 999px;
          background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
          color: #ffffff;
          text-decoration: none;
          border: 2px solid rgba(255, 255, 255, 0.9);
          animation: thxSoftPulse 2.4s infinite ease-out;
          cursor: pointer;
        }
        .thx-hotline-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .thx-hotline-text {
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .thx-chat-box {
            right: 12px;
            left: 12px;
            width: auto;
            bottom: 120px;
          }
          .thx-floating-chat-btn {
            right: 14px;
            bottom: 68px;
            width: 44px;
            height: 44px;
            padding: 0;
            justify-content: center;
          }
          .thx-floating-chat-label {
            display: none;
          }
          .thx-hotline-btn {
            right: 14px;
            bottom: 16px;
            width: 44px;
            height: 44px;
            padding: 0;
            justify-content: center;
            gap: 0;
          }
          .thx-hotline-icon {
            width: 100%;
            height: 100%;
            background: transparent;
          }
          .thx-hotline-text {
            display: none;
          }
        }
      `}</style>

      {isOpen && (
        <div className="thx-chat-box">
          <div
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              padding: '13px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <MessageCircle size={19} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  Tư Vấn Trực Tuyến Tiệm Hoa Xinh
                </div>
                <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>
                  Hotline: {displayPhone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Đóng hộp thoại"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div
            style={{
              height: 245,
              overflowY: 'auto',
              padding: 13,
              background: '#fffafb',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            {messages.map((m) => {
              const isCustomer = m.sender === 'customer';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isCustomer ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      background: isCustomer ? '#e11d48' : '#ffffff',
                      color: isCustomer ? '#ffffff' : '#1f2937',
                      border: isCustomer ? 'none' : '1px solid #e5e7eb',
                      padding: '8px 12px',
                      borderRadius: isCustomer
                        ? '14px 14px 4px 14px'
                        : '14px 14px 14px 4px',
                      fontSize: '0.85rem',
                      maxWidth: '84%',
                      lineHeight: 1.45,
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '9px 11px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              gap: 8,
              background: '#ffffff',
            }}
          >
            <input
              id="customer-chat-input"
              name="message"
              type="text"
              className="form-control"
              placeholder="Nhập tin nhắn gửi Admin..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(e);
              }}
              style={{ height: 38, fontSize: '0.85rem' }}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={sending}
              className="btn btn-primary btn-sm"
              style={{ height: 38, padding: '0 14px' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Nút mở chat với Admin nhỏ gọn */}
      <button
        type="button"
        onClick={handleToggleChat}
        aria-label="Nhắn tin với Admin"
        title="Nhắn tin tư vấn với Admin"
        className="thx-floating-chat-btn"
      >
        <MessageCircle size={19} color="#e11d48" />
        <span className="thx-floating-chat-label">Nhắn Admin</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#e11d48',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Nút gọi nhanh Hotline */}
      <a
        href={dialHref}
        aria-label={`Gọi ngay Hotline ${displayPhone}`}
        title={`Gọi ngay Hotline ${displayPhone}`}
        className="thx-hotline-btn"
      >
        <span className="thx-hotline-icon">
          <PhoneCall size={17} />
        </span>
        <div className="thx-hotline-text">
          <div
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              opacity: 0.92,
              letterSpacing: '0.04em',
            }}
          >
            HOTLINE TƯ VẤN
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: 800 }}>
            {displayPhone}
          </div>
        </div>
      </a>
    </>
  );
}