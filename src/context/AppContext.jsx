import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AppContext = createContext(null);

function isAdminAccount(account) {
  if (!account) return false;
  const roleStr = String(
    account.vaiTro || account.role || account.quyen || ''
  ).toLowerCase();
  return (
    roleStr.includes('admin') ||
    roleStr.includes('quản trị') ||
    String(account.email || '').toLowerCase().includes('admin') ||
    String(account.hoTen || '').trim().toLowerCase() === 'admin'
  );
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('thx_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [backendOffline, setBackendOffline] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const fetchCart = useCallback(async () => {
    const token = sessionStorage.getItem('thx_token');
    if (!token || isAdminAccount(user)) {
      setCartItems([]);
      return;
    }
    try {
      const res = await api.get('/GioHang');
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setCartItems(items);
    } catch {
      // Bỏ qua nếu không tải được giỏ hàng
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const login = async (email, matKhau) => {
    const res = await api.post('/Auth/login', { email, matKhau });
    const data = res.data || {};
    const token = data.token || data.Token || data.accessToken || '';
    const nguoiDung = data.nguoiDung || data.NguoiDung || data.user || data;

    if (token) {
      sessionStorage.setItem('thx_token', token);
    }
    sessionStorage.setItem('thx_user', JSON.stringify(nguoiDung));
    setUser(nguoiDung);
    showToast(`Chào mừng ${nguoiDung.hoTen || 'bạn'} quay trở lại Tiệm Hoa Xinh!`);
    return nguoiDung;
  };

  const register = async (payload) => {
    const res = await api.post('/Auth/register', payload);
    const data = res.data || {};
    const token = data.token || data.Token || data.accessToken || '';
    const nguoiDung = data.nguoiDung || data.NguoiDung || data.user || data;

    if (token) {
      sessionStorage.setItem('thx_token', token);
    }
    sessionStorage.setItem('thx_user', JSON.stringify(nguoiDung));
    setUser(nguoiDung);
    showToast('Đăng ký tài khoản thành công!');
    return nguoiDung;
  };

  const logout = () => {
    localStorage.removeItem('thx_token');
    localStorage.removeItem('thx_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('thx_token');
    sessionStorage.removeItem('thx_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setCartItems([]);
    showToast('Đã đăng xuất tài khoản.');
  };

  const addToCart = async (maSanPham, soLuong = 1) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để thêm hoa vào giỏ hàng!', 'error');
      return false;
    }
    try {
      await api.post('/GioHang', { maSanPham, soLuong });
      await fetchCart();
      showToast('Đã thêm bó hoa vào giỏ hàng!');
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể thêm vào giỏ hàng', 'error');
      return false;
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + (item.soLuong || 1), 0);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        cartItems,
        cartCount,
        fetchCart,
        addToCart,
        showToast,
        backendOffline,
        setBackendOffline,
      }}
    >
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'success' ? '🌸' : '⚠️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);