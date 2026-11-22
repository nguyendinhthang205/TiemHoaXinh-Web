import React from 'react';
import { Send } from 'lucide-react';
import { markConversationReadByAdmin } from '../../../services/chatService';
import { ADMIN_QUICK_REPLIES, formatShortTime } from '../adminUtils';

export default function AdminMessagesTab({
  conversations,
  activeConversation,
  setSelectedConvId,
  adminReplyText,
  setAdminReplyText,
  sendingReply,
  onSendAdminReply,
  adminChatEndRef,
}) {
  return (
    <div
      className="panel thx-admin-chat-grid"
      style={{
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          borderRight: '1px solid #f3f4f6',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid #f3f4f6',
            fontWeight: 700,
            fontSize: '1.02rem',
          }}
        >
          Hộp Thoại Khách Hàng ({conversations.length})
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: '0.88rem' }}>
              Chưa có khách hàng nào gửi tin nhắn.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const lastMsg = conv.messages?.[conv.messages.length - 1];
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    markConversationReadByAdmin(conv.id);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    background: isSelected ? '#fff1f2' : 'transparent',
                    borderLeft: isSelected
                      ? '4px solid #e11d48'
                      : '4px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#181316', fontSize: '0.92rem' }}>
                      {conv.customerName}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: '#9ca3af' }}>
                      {formatShortTime(conv.updatedAt)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.82rem',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lastMsg
                        ? `${lastMsg.sender === 'admin' ? 'Bạn: ' : ''}${lastMsg.text}`
                        : 'Bắt đầu trò chuyện'}
                    </span>

                    {conv.unreadByAdmin > 0 && (
                      <span
                        style={{
                          background: '#e11d48',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: 999,
                          padding: '1px 7px',
                          flexShrink: 0,
                        }}
                      >
                        {conv.unreadByAdmin}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        {activeConversation ? (
          <>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  {activeConversation.customerName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Email: {activeConversation.customerEmail}
                  {activeConversation.customerPhone
                    ? ` • SĐT: ${activeConversation.customerPhone}`
                    : ''}
                </div>
              </div>
              <span className="badge badge-sage">Đang đồng bộ trực tuyến</span>
            </div>

            <div
              style={{
                flex: 1,
                padding: 20,
                overflowY: 'auto',
                background: '#fffafb',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: 340,
              }}
            >
              {(activeConversation.messages || []).map((m) => {
                const isAdminMsg = m.sender === 'admin';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '72%',
                        padding: '10px 14px',
                        borderRadius: isAdminMsg
                          ? '16px 16px 4px 16px'
                          : '16px 16px 16px 4px',
                        background: isAdminMsg ? '#e11d48' : '#ffffff',
                        color: isAdminMsg ? '#ffffff' : '#1f2937',
                        border: isAdminMsg ? 'none' : '1px solid #e5e7eb',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {m.text}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>
                      {isAdminMsg ? 'Admin' : activeConversation.customerName} &bull;{' '}
                      {formatShortTime(m.createdAt)}
                    </span>
                  </div>
                );
              })}
              <div ref={adminChatEndRef} />
            </div>

            <div
              style={{
                padding: '8px 16px',
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                background: '#fafafa',
              }}
            >
              {ADMIN_QUICK_REPLIES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  disabled={sendingReply}
                  onClick={() => onSendAdminReply(tpl)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: '#ffffff',
                    color: '#be123c',
                    border: '1px solid #fecdd3',
                  }}
                >
                  + {tpl}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSendAdminReply();
              }}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                gap: 10,
              }}
            >
              <input
                type="text"
                className="form-control"
                placeholder="Nhập nội dung phản hồi cho khách hàng..."
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
              />
              <button
                type="submit"
                disabled={sendingReply}
                className="btn btn-primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Send size={16} />
                <span>{sendingReply ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              padding: 32,
            }}
          >
            Chọn một khách hàng ở danh sách bên trái để xem và trả lời tin nhắn.
          </div>
        )}
      </div>
    </div>
  );
}
