import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Flower2,
  ShoppingBag,
  LayoutGrid,
  User,
  LogOut,
  LogIn,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const navigate = useNavigate();
  const appCtx = useApp() || {};
  const { user, cartItems = [], logout, setUser } = appCtx;

  const roleStr = String(
    user?.vaiTro || user?.role || user?.quyen || ''
  ).toLowerCase();
  const isAdmin =
    Boolean(user) &&
    (roleStr.includes('admin') ||
      roleStr.includes('quản trị') ||
      String(user?.email || '').toLowerCase() === 'admin@tiemhoaxinh.vn');

  const cartCount = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + (Number(item.soLuong) || 1), 0)
    : 0;

  const handleLogout = () => {
    // Xóa sạch toàn bộ key lưu phiên để không bao giờ tự nhảy sang tài khoản cũ khi F5
    localStorage.removeItem('thx_token');
    localStorage.removeItem('thx_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (typeof logout === 'function') {
      logout();
    }
    if (typeof setUser === 'function') {
      setUser(null);
    }
    navigate('/login');
  };

  const openChatBox = () => {
    window.dispatchEvent(new Event('thx_open_customer_chat'));
  };

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 500,
    fontSize: '0.94rem',
    color: isActive ? '#e11d48' : '#374151',
    padding: '8px 4px',
    borderBottom: isActive ? '2.5px solid #e11d48' : '2.5px solid transparent',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  });

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #f3f4f6',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 72,
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#e11d48',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flower2 size={22} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                color: '#be123c',
                lineHeight: 1.15,
              }}
            >
              Tiệm Hoa Xinh
            </div>
            <div style={{ fontSize: '0.73rem', color: '#6b7280' }}>
              Fresh Floral &amp; Smart AI
            </div>
          </div>
        </Link>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            flexWrap: 'wrap',
          }}
        >
          <NavLink to="/" end style={navLinkStyle}>
            Trang chủ
          </NavLink>

          <NavLink to="/shop" style={navLinkStyle}>
            Bộ sưu tập hoa
          </NavLink>

          {user && !isAdmin && (
            <NavLink to="/my-orders" style={navLinkStyle}>
              Đơn hàng của tôi
            </NavLink>
          )}

          {!isAdmin && (
            <button
              type="button"
              onClick={openChatBox}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e11d48',
                fontWeight: 600,
                fontSize: '0.94rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                padding: '8px 4px',
              }}
            >
              <MessageCircle size={16} />
              <span>Nhắn tin Admin</span>
            </button>
          )}

          {isAdmin && (
            <NavLink to="/admin" style={navLinkStyle}>
              Quản trị &amp; AI Dự báo
            </NavLink>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isAdmin && (
            <Link
              to="/cart"
              className="btn btn-outline btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
              }}
            >
              <ShoppingBag size={16} />
              <span>Giỏ hàng</span>
              {cartCount > 0 && (
                <span
                  style={{
                    background: '#e11d48',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: '1px 7px',
                    marginLeft: 2,
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <LayoutGrid size={15} />
                  <span>Admin</span>
                </Link>
              ) : (
                <Link
                  to="/my-orders"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <User size={15} />
                  <span>{user.hoTen || user.email || 'Khách hàng'}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Đăng xuất"
                style={{ padding: '7px 10px' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <LogIn size={15} />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}