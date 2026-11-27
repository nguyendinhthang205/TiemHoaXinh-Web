import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PhoneCall, MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getHotlineNumber } from '../services/api';
import {
  ensureCustomerConversation,
  sendCustomerMessage,
  markConversationReadByCustomer,
  syncChatsFromCloud,
} from '../services/chatService';
import { formatVietnamPhone, isAdminAccount } from '../utils/storeUtils';

const CUSTOMER_QUICK_PROMPTS = [
  'Tư vấn mẫu hoa sinh nhật đẹp',
  'Tư vấn kệ hoa chia buồn giao nhanh',
  'Hỏi phí ship & giao nhanh 2H',
  'Kiểm tra trạng thái đơn hàng',
];

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
  const isHidden = isAdminPage || isAdminAccount(user);

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
      if (typeof document !== 'undefined' && document.hidden) return;
      syncChatsFromCloud().then(() => {
        loadConversationMessages();
        markConversationReadByCustomer(user);
      });
    }, 4000);
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

  const submitMessageText = async (rawText) => {
    const text = String(rawText || '').trim();
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

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    await submitMessageText(inputText);
  };

  if (isHidden) return null;

  const dialHref = `tel:${String(hotline).replace(/[^0-9+]/g, '')}`;
  const displayPhone = formatVietnamPhone(hotline);

  return (
    <>
      {isOpen && (
        <div className="thx-chat-box" role="dialog" aria-label="Hộp thoại tư vấn trực tuyến">
          <div
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
              color: '#ffffff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  Tư Vấn Tiệm Hoa Xinh
                </div>
                <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>
                  Trực tuyến &bull; Hotline: {displayPhone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng hộp thoại"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                      background: isCustomer
                        ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                        : '#ffffff',
                      color: isCustomer ? '#ffffff' : '#1f2937',
                      border: isCustomer ? 'none' : '1px solid #f1e6ea',
                      padding: '8px 12px',
                      borderRadius: isCustomer
                        ? '14px 14px 4px 14px'
                        : '14px 14px 14px 4px',
                      fontSize: '0.84rem',
                      maxWidth: '85%',
                      lineHeight: 1.48,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: '7px 11px',
              background: '#ffffff',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {CUSTOMER_QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={sending}
                onClick={() => submitMessageText(q)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 9px',
                  borderRadius: 999,
                  background: '#fff1f2',
                  color: '#be123c',
                  border: '1px solid #fecdd3',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles size={11} />
                {q}
              </button>
            ))}
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
              placeholder="Nhập tin nhắn gửi tư vấn viên..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ height: 38, fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="btn btn-primary btn-sm"
              style={{ height: 38, padding: '0 14px' }}
              aria-label="Gửi tin nhắn"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Nút mở chat với Admin */}
      <button
        type="button"
        onClick={handleToggleChat}
        aria-label="Nhắn tin với Admin"
        title="Nhắn tin tư vấn với Admin"
        className="thx-floating-chat-btn"
      >
        <MessageCircle size={18} color="#e11d48" />
        <span className="thx-floating-chat-label">Nhắn Admin</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              background: '#e11d48',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: 19,
              height: 19,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
              border: '1.5px solid #ffffff',
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
        <div className="thx-hotline-text" style={{ lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: '0.64rem',
              fontWeight: 700,
              opacity: 0.92,
              letterSpacing: '0.05em',
            }}
          >
            HOTLINE TƯ VẤN
          </div>
          <div className="tabular-nums" style={{ fontSize: '0.92rem', fontWeight: 800 }}>
            {displayPhone}
          </div>
        </div>
      </a>
    </>
  );
}
