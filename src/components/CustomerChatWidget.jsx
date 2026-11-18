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

export default function CustomerChatWidget() {
  const location = useLocation();
  const appCtx = useApp() || {};
  const { user } = appCtx;

  const [isOpen, setIsOpen] = useState(false);
  const [hotline, setHotline] = useState(() => getHotlineNumber());
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
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
    } catch {
      setMessages([]);
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
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen, isHidden, loadConversationMessages, user]);

  useEffect(() => {
    if (isOpen && !isHidden) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [isOpen, isHidden, messages.length]);

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

  return (
    <>
      <style>{`
        @keyframes thxRainbowBlink {
          0% {
            background-color: #e11d48;
            box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.7), 0 10px 24px rgba(225, 29, 72, 0.45);
            transform: scale(1);
          }
          20% {
            background-color: #f97316;
            box-shadow: 0 0 0 8px rgba(249, 115, 22, 0), 0 10px 26px rgba(249, 115, 22, 0.5);
            transform: scale(1.03);
          }
          40% {
            background-color: #eab308;
            box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7), 0 10px 24px rgba(234, 179, 8, 0.45);
            transform: scale(1);
          }
          60% {
            background-color: #10b981;
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0), 0 10px 26px rgba(16, 185, 129, 0.5);
            transform: scale(1.03);
          }
          80% {
            background-color: #2563eb;
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7), 0 10px 24px rgba(37, 99, 235, 0.45);
            transform: scale(1);
          }
          100% {
            background-color: #9333ea;
            box-shadow: 0 0 0 8px rgba(147, 51, 234, 0), 0 10px 26px rgba(147, 51, 234, 0.5);
            transform: scale(1.03);
          }
        }
        @keyframes thxPhoneShake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-18deg); }
          30% { transform: rotate(18deg); }
          45% { transform: rotate(-14deg); }
          60% { transform: rotate(14deg); }
          75% { transform: rotate(-8deg); }
        }
        .thx-chat-box {
          position: fixed;
          right: 22px;
          bottom: 94px;
          width: 350px;
          max-width: calc(100vw - 24px);
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
          border: 1px solid #fecdd3;
          overflow: hidden;
          z-index: 95;
          display: flex;
          flex-direction: column;
        }
        .thx-hotline-btn {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 90;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          border-radius: 999px;
          color: #ffffff;
          text-decoration: none;
          border: 2px solid rgba(255, 255, 255, 0.85);
          animation: thxRainbowBlink 2.4s infinite ease-in-out;
          cursor: pointer;
        }
        .thx-hotline-icon {
          width: 34px;
          height: 34px;
        }
        .thx-hotline-label {
          font-size: 0.68rem;
        }
        .thx-hotline-num {
          font-size: 0.98rem;
        }

        @media (max-width: 640px) {
          .thx-chat-box {
            right: 12px;
            left: 12px;
            width: auto;
            bottom: 70px;
          }
          .thx-hotline-btn {
            right: 12px;
            bottom: 12px;
            gap: 8px;
            padding: 7px 13px;
          }
          .thx-hotline-icon {
            width: 28px;
            height: 28px;
          }
          .thx-hotline-label {
            font-size: 0.6rem;
          }
          .thx-hotline-num {
            font-size: 0.85rem;
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
                  Thợ hoa &amp; Admin sẵn sàng hỗ trợ
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
              height: 250,
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

      <a
        href={`tel:${String(hotline).replace(/[^0-9+]/g, '')}`}
        title={`Gọi ngay Hotline ${hotline} để được tư vấn chọn hoa miễn phí`}
        className="thx-hotline-btn"
      >
        <span
          className="thx-hotline-icon"
          style={{
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'thxPhoneShake 1.2s infinite ease-in-out',
          }}
        >
          <PhoneCall size={15} />
        </span>
        <div style={{ lineHeight: 1.2 }}>
          <div
            className="thx-hotline-label"
            style={{
              fontWeight: 700,
              opacity: 0.95,
              letterSpacing: '0.04em',
            }}
          >
            HOTLINE TƯ VẤN
          </div>
          <div className="thx-hotline-num" style={{ fontWeight: 800 }}>
            {hotline}
          </div>
        </div>
      </a>
    </>
  );
}