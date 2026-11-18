const CHAT_STORAGE_KEY = 'thx_support_chats_v1';
const GUEST_ID_KEY = 'thx_chat_guest_id';

function readAllChats() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAllChats(data) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('thx_chat_updated'));
  } catch {
    // Bỏ qua lỗi lưu trữ cục bộ
  }
}

export function getCustomerConversationId(user) {
  if (user?.email) return `user_${user.email.toLowerCase()}`;
  if (user?.maNguoiDung) return `user_${user.maNguoiDung}`;
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Date.now()}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function ensureCustomerConversation(user) {
  const all = readAllChats();
  const convId = getCustomerConversationId(user);
  const displayName = user?.hoTen || user?.email || 'Khách ghé thăm';

  if (!all[convId]) {
    all[convId] = {
      id: convId,
      customerName: displayName,
      customerEmail: user?.email || 'Chưa đăng nhập',
      customerPhone: user?.soDienThoai || '',
      unreadByAdmin: 0,
      unreadByCustomer: 1,
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `welcome_${Date.now()}`,
          sender: 'admin',
          senderName: 'Tư vấn viên Tiệm Hoa Xinh',
          text: `Xin chào ${displayName}! Tiệm Hoa Xinh có thể tư vấn mẫu hoa, lời chúc trên thiệp hoặc kiểm tra đơn hàng nào cho bạn ạ?`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    writeAllChats(all);
  } else if (user?.hoTen && all[convId].customerName !== user.hoTen) {
    all[convId].customerName = user.hoTen;
    all[convId].customerEmail = user.email || all[convId].customerEmail;
    all[convId].customerPhone = user.soDienThoai || all[convId].customerPhone;
    writeAllChats(all);
  }

  return all[convId];
}

export function sendCustomerMessage(user, text) {
  const clean = String(text || '').trim();
  if (!clean) return null;

  const all = readAllChats();
  const conv = ensureCustomerConversation(user);
  const current = all[conv.id] || conv;

  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: 'customer',
    senderName: user?.hoTen || current.customerName || 'Khách hàng',
    text: clean,
    createdAt: new Date().toISOString(),
  };

  current.messages = [...(current.messages || []), newMsg];
  current.unreadByAdmin = (current.unreadByAdmin || 0) + 1;
  current.updatedAt = newMsg.createdAt;
  all[conv.id] = current;
  writeAllChats(all);
  return current;
}

export function sendAdminReply(convId, text) {
  const clean = String(text || '').trim();
  if (!clean || !convId) return null;

  const all = readAllChats();
  if (!all[convId]) return null;

  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: 'admin',
    senderName: 'Tiệm Hoa Xinh (Admin)',
    text: clean,
    createdAt: new Date().toISOString(),
  };

  all[convId].messages = [...(all[convId].messages || []), newMsg];
  all[convId].unreadByCustomer = (all[convId].unreadByCustomer || 0) + 1;
  all[convId].unreadByAdmin = 0;
  all[convId].updatedAt = newMsg.createdAt;
  writeAllChats(all);
  return all[convId];
}

export function markConversationReadByCustomer(user) {
  const all = readAllChats();
  const convId = getCustomerConversationId(user);
  if (all[convId] && all[convId].unreadByCustomer > 0) {
    all[convId].unreadByCustomer = 0;
    writeAllChats(all);
  }
}

export function markConversationReadByAdmin(convId) {
  const all = readAllChats();
  if (all[convId] && all[convId].unreadByAdmin > 0) {
    all[convId].unreadByAdmin = 0;
    writeAllChats(all);
  }
}

export function getAllConversationsForAdmin() {
  const all = readAllChats();
  return Object.values(all).sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );
}