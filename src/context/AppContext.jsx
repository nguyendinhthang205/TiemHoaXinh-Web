import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import api, {
  syncProductOverridesFromCloud,
  syncHotlineFromCloud,
  getStoredUser,
  getStoredToken,
  setStoredAuth,
  clearStoredAuth,
  mergeProductOverride,
} from '../services/api';
import { getCuratedProductById } from '../data/flowerCatalog';
import {
  isAdminAccount,
  readWishlistIds,
  toggleWishlistId,
} from '../utils/storeUtils';

const CURATED_CART_PREFIX = 'thx_curated_cart_';

function getCuratedCartKey(account) {
  const identity = String(account?.email || account?.maNguoiDung || 'guest')
    .trim()
    .toLowerCase();
  return `${CURATED_CART_PREFIX}${identity}`;
}

function readCuratedCart(account) {
  try {
    const raw = localStorage.getItem(getCuratedCartKey(account));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCuratedCart(account, list) {
  try {
    localStorage.setItem(getCuratedCartKey(account), JSON.stringify(list));
  } catch {
    // Bỏ qua lỗi bộ nhớ
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [backendOffline, setBackendOffline] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(() => readWishlistIds());
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    syncProductOverridesFromCloud();
    syncHotlineFromCloud();

    const handleFocus = () => {
      syncProductOverridesFromCloud();
      syncHotlineFromCloud();
    };
    const handleWishlistSync = () => {
      setWishlistIds(readWishlistIds());
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('thx_wishlist_updated', handleWishlistSync);
    window.addEventListener('storage', handleWishlistSync);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('thx_wishlist_updated', handleWishlistSync);
      window.removeEventListener('storage', handleWishlistSync);
    };
  }, []);

  const fetchCart = useCallback(async () => {
    const token = getStoredToken();
    if (!token || isAdminAccount(user)) {
      setCartItems([]);
      return;
    }
    const localCurated = readCuratedCart(user).map((it) => ({
      ...mergeProductOverride(it),
      isCuratedLocal: true,
    }));
    try {
      const res = await api.get('/GioHang');
      const rawItems = Array.isArray(res.data) ? res.data : res.data?.items || [];
      const serverItems = rawItems.map((it) => mergeProductOverride(it));
      const serverIds = new Set(serverItems.map((i) => Number(i.maSanPham)));
      const merged = [
        ...serverItems,
        ...localCurated.filter((i) => !serverIds.has(Number(i.maSanPham))),
      ];
      setCartItems(merged);
    } catch {
      setCartItems(localCurated);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const login = async (email, matKhau, rememberMe = true) => {
    const res = await api.post('/Auth/login', { email, matKhau, password: matKhau });
    const data = res.data || {};
    const token = data.token || data.Token || data.accessToken || data.jwtToken || '';
    const rawUser = data.nguoiDung || data.NguoiDung || data.user || data;
    const userData = {
      maNguoiDung: rawUser.maNguoiDung ?? data.maNguoiDung,
      hoTen: rawUser.hoTen || data.hoTen || String(email).split('@')[0],
      email: rawUser.email || data.email || email,
      vaiTro: rawUser.vaiTro || rawUser.role || data.vaiTro || data.role || 'KhachHang',
      soDienThoai: rawUser.soDienThoai || data.soDienThoai || '',
      diaChi: rawUser.diaChi || data.diaChi || '',
    };

    setStoredAuth({ token, user: userData, rememberMe });
    setUser(userData);
    return userData;
  };

  const register = async (payload) => {
    const res = await api.post('/Auth/register', payload);
    return res.data;
  };

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setCartItems([]);
    showToast('Đã đăng xuất tài khoản.');
  }, [showToast]);

  const addToCart = useCallback(
    async (maSanPham, soLuong = 1) => {
      if (!user) {
        showToast('Vui lòng đăng nhập để thêm hoa vào giỏ hàng!', 'error');
        return false;
      }
      if (isAdminAccount(user)) {
        showToast('Tài khoản Admin đang ở chế độ quản lý. Hãy đăng nhập tài khoản khách để đặt đơn.', 'info');
        return false;
      }
      const curatedItem = getCuratedProductById(maSanPham);
      if (curatedItem) {
        try {
          await api.post('/GioHang', { maSanPham, soLuong });
          await fetchCart();
          showToast('Đã thêm bó hoa vào giỏ hàng!');
          return true;
        } catch {
          const prevLocal = readCuratedCart(user);
          const idx = prevLocal.findIndex((x) => Number(x.maSanPham) === Number(maSanPham));
          const nextLocal = [...prevLocal];
          if (idx >= 0) {
            nextLocal[idx] = {
              ...nextLocal[idx],
              soLuong: Number(nextLocal[idx].soLuong || 1) + Number(soLuong || 1),
            };
          } else {
            nextLocal.push({
              ...curatedItem,
              soLuong: Number(soLuong || 1),
              isCuratedLocal: true,
            });
          }
          writeCuratedCart(user, nextLocal);
          await fetchCart();
          showToast('Đã thêm bó hoa vào giỏ hàng!');
          return true;
        }
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
    },
    [user, fetchCart, showToast]
  );

  const updateCartItemQty = useCallback(
    async (item, newQty) => {
      if (item?.isCuratedLocal) {
        const prevLocal = readCuratedCart(user);
        const nextLocal =
          newQty < 1
            ? prevLocal.filter((x) => Number(x.maSanPham) !== Number(item.maSanPham))
            : prevLocal.map((x) =>
                Number(x.maSanPham) === Number(item.maSanPham) ? { ...x, soLuong: newQty } : x
              );
        writeCuratedCart(user, nextLocal);
        await fetchCart();
        return true;
      }
      if (newQty < 1) {
        await api.delete(`/GioHang/${item.maSanPham}`);
      } else {
        await api.put(`/GioHang/${item.maSanPham}`, { soLuong: newQty });
      }
      await fetchCart();
      return true;
    },
    [user, fetchCart]
  );

  const removeCartItem = useCallback(
    async (item) => {
      if (item?.isCuratedLocal) {
        const nextLocal = readCuratedCart(user).filter(
          (x) => Number(x.maSanPham) !== Number(item.maSanPham)
        );
        writeCuratedCart(user, nextLocal);
        await fetchCart();
        return true;
      }
      await api.delete(`/GioHang/${item.maSanPham}`);
      await fetchCart();
      return true;
    },
    [user, fetchCart]
  );

  const clearEntireCart = useCallback(async () => {
    writeCuratedCart(user, []);
    try {
      await api.delete('/GioHang');
    } catch {
      // Bỏ qua nếu server cart đã trống
    }
    await fetchCart();
  }, [user, fetchCart]);

  const handleToggleWishlist = useCallback(
    (productId, productName) => {
      if (productId == null) return;
      const { added, ids } = toggleWishlistId(productId);
      setWishlistIds(ids);
      showToast(
        added
          ? `Đã lưu "${productName || 'mẫu hoa'}" vào danh sách yêu thích`
          : `Đã bỏ "${productName || 'mẫu hoa'}" khỏi danh sách yêu thích`,
        added ? 'success' : 'info'
      );
    },
    [showToast]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.soLuong) || 1), 0);

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
        updateCartItemQty,
        removeCartItem,
        clearEntireCart,
        wishlistIds,
        toggleWishlist: handleToggleWishlist,
        wishlistOpen,
        setWishlistOpen,
        showToast,
        backendOffline,
        setBackendOffline,
      }}
    >
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : t.type === 'error' ? (
                <AlertTriangle size={18} />
              ) : (
                <Info size={18} />
              )}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Đóng thông báo"
              className="toast-close"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
