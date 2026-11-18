const NPOINT_URL = 'https://api.npoint.io/639a3cda635df1c41eb4';
const CHAT_STORAGE_KEY = 'thx_support_chats_v1';
const GUEST_ID_KEY = 'thx_chat_guest_id';

function extractChatEntries(rawObj) {
  if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) return {};
  const result = {};
  Object.entries(rawObj).forEach(([key, val]) => {
    if (!key.startsWith('__') && val && typeof val === 'object' && Array.isArray(val.messages)) {
      result[key] = val;
    }
  });
  return result;
}

function readLocalChats() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return extractChatEntries(parsed);
  } catch {
    return {};
  }
}

function writeLocalChats(data) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(extractChatEntries(data)));
    window.dispatchEvent(new Event('thx_chat_updated'));
  } catch {
    // Bỏ qua lỗi bộ nhớ cục bộ
  }
}

async function fetchRawCloudBin() {
  try {
    const res = await fetch(NPOINT_URL, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return null;
  }
}

async function fetchLatestCloudChats() {
  const raw = await fetchRawCloudBin();
  if (!raw) return readLocalChats();
  return extractChatEntries(raw);
}

async function pushCloudChats(chatMap) {
  const cleanChats = extractChatEntries(chatMap);
  writeLocalChats(cleanChats);
  try {
    const latestRaw = (await fetchRawCloudBin()) || {};
    const nextBin = { ...latestRaw };
    Object.keys(nextBin).forEach((k) => {
      if (!k.startsWith('__')) delete nextBin[k];
    });
    Object.assign(nextBin, cleanChats);

    await fetch(NPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nextBin),
    });
  } catch {
    // Giữ bản lưu cục bộ nếu mạng gián đoạn
  }
}

export async function syncChatsFromCloud() {
  const remote = await fetchLatestCloudChats();
  const local = readLocalChats();
  if (JSON.stringify(remote) !== JSON.stringify(local)) {
    writeLocalChats(remote);
  }
  return remote;
}

export function getCustomerConversationId(user) {
  if (user?.email) return `user_${String(user.email).toLowerCase().trim()}`;
  if (user?.maNguoiDung) return `user_${user.maNguoiDung}`;
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

function buildConversationObject(existing, user, convId) {
  const displayName = user?.hoTen || user?.email || 'Khách ghé thăm';
  if (!existing) {
    return {
      id: convId,
      customerName: displayName,
      customerEmail: user?.email || 'Khách truy cập trực tuyến',
      customerPhone: user?.soDienThoai || '',
      unreadByAdmin: 0,
      unreadByCustomer: 1,
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `welcome_${convId}`,
          sender: 'admin',
          senderName: 'Tư vấn viên Tiệm Hoa Xinh',
          text: `Xin chào ${displayName}! Tiệm Hoa Xinh có thể tư vấn mẫu hoa, lời chúc trên thiệp hoặc kiểm tra đơn hàng nào cho bạn ạ?`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  return {
    ...existing,
    customerName: user?.hoTen || existing.customerName || displayName,
    customerEmail: user?.email || existing.customerEmail,
    customerPhone: user?.soDienThoai || existing.customerPhone || '',
  };
}

export function ensureCustomerConversation(user) {
  const all = readLocalChats();
  const convId = getCustomerConversationId(user);
  const updated = buildConversationObject(all[convId], user, convId);

  if (!all[convId] || all[convId].customerName !== updated.customerName) {
    all[convId] = updated;
    writeLocalChats(all);
  }
  return all[convId];
}

export async function sendCustomerMessage(user, text) {
  const clean = String(text || '').trim();
  if (!clean) return null;

  const convId = getCustomerConversationId(user);
  const nowIso = new Date().toISOString();
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: 'customer',
    senderName: user?.hoTen || user?.email || 'Khách hàng',
    text: clean,
    createdAt: nowIso,
  };

  const localAll = readLocalChats();
  const localConv = buildConversationObject(localAll[convId], user, convId);
  localConv.messages = [...(localConv.messages || []), newMsg];
  localConv.unreadByAdmin = (localConv.unreadByAdmin || 0) + 1;
  localConv.updatedAt = nowIso;
  localAll[convId] = localConv;
  writeLocalChats(localAll);

  const remoteAll = await fetchLatestCloudChats();
  const remoteConv = buildConversationObject(remoteAll[convId], user, convId);
  const exists = (remoteConv.messages || []).some((m) => m.id === newMsg.id);
  if (!exists) {
    remoteConv.messages = [...(remoteConv.messages || []), newMsg];
    remoteConv.unreadByAdmin = (remoteConv.unreadByAdmin || 0) + 1;
    remoteConv.updatedAt = nowIso;
  }
  remoteAll[convId] = remoteConv;
  await pushCloudChats(remoteAll);

  return remoteConv;
}

export async function sendAdminReply(convId, text) {
  const clean = String(text || '').trim();
  if (!clean || !convId) return null;

  const nowIso = new Date().toISOString();
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: 'admin',
    senderName: 'Tiệm Hoa Xinh (Admin)',
    text: clean,
    createdAt: nowIso,
  };

  const remoteAll = await fetchLatestCloudChats();
  if (!remoteAll[convId]) return null;

  remoteAll[convId].messages = [...(remoteAll[convId].messages || []), newMsg];
  remoteAll[convId].unreadByCustomer = (remoteAll[convId].unreadByCustomer || 0) + 1;
  remoteAll[convId].unreadByAdmin = 0;
  remoteAll[convId].updatedAt = nowIso;

  await pushCloudChats(remoteAll);
  return remoteAll[convId];
}

export async function markConversationReadByCustomer(user) {
  const convId = getCustomerConversationId(user);
  const localAll = readLocalChats();
  if (localAll[convId] && localAll[convId].unreadByCustomer > 0) {
    localAll[convId].unreadByCustomer = 0;
    writeLocalChats(localAll);

    const remoteAll = await fetchLatestCloudChats();
    if (remoteAll[convId]) {
      remoteAll[convId].unreadByCustomer = 0;
      await pushCloudChats(remoteAll);
    }
  }
}

export async function markConversationReadByAdmin(convId) {
  const localAll = readLocalChats();
  if (localAll[convId] && localAll[convId].unreadByAdmin > 0) {
    localAll[convId].unreadByAdmin = 0;
    writeLocalChats(localAll);

    const remoteAll = await fetchLatestCloudChats();
    if (remoteAll[convId]) {
      remoteAll[convId].unreadByAdmin = 0;
      await pushCloudChats(remoteAll);
    }
  }
}

export function getAllConversationsForAdmin() {
  const all = readLocalChats();
  return Object.values(all).sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );
}