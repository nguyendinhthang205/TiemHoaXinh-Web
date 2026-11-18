import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Flower2,
  ShoppingBag,
  User,
  LogOut,
  LogIn,
  MessageCircle,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const appCtx = useApp() || {};
  const { user, cartItems = [], logout, setUser } = appCtx;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleStr = String(
    user?.vaiTro || user?.role || user?.quyen || ''
  ).toLowerCase();
  const isAdmin =
    Boolean(user) &&
    (roleStr.includes('admin') ||
      roleStr.includes('quản trị') ||
      String(user?.email || '').toLowerCase().includes('admin') ||
      String(user?.hoTen || '').trim().toLowerCase() === 'admin');

  const cartCount = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + (Number(item.soLuong) || 1), 0)
    : 0;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
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
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const openChatBox = () => {
    setMobileMenuOpen(false);
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

  const mobileLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 600,
    fontSize: '0.94rem',
    color: isActive ? '#e11d48' : '#1f2937',
    background: isActive ? '#fff1f2' : 'transparent',
  });

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #f3f4f6',
        position: 'sticky',
        top: 0,
        zIndex: 60,
      }}
    >
      <style>{`
        .thx-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          height: 70px;
        }
        .thx-desktop-nav {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .thx-desktop-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .thx-mobile-actions {
          display: none;
          align-items: center;
          gap: 8px;
        }
        .thx-mobile-drawer {
          display: none;
        }

        @media (max-width: 860px) {
          .thx-nav-bar {
            height: 62px;
          }
          .thx-desktop-nav,
          .thx-desktop-actions {
            display: none;
          }
          .thx-mobile-actions {
            display: flex;
          }
          .thx-mobile-drawer {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 12px 16px 18px;
            background: #ffffff;
            border-top: 1px solid #f3f4f6;
            box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
          }
        }
      `}</style>

      <div className="container thx-nav-bar">
        {/* Logo thương hiệu */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: '#e11d48',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flower2 size={21} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '1.1rem',
                color: '#be123c',
                lineHeight: 1.15,
              }}
            >
              Tiệm Hoa Xinh
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
              Fresh Floral &amp; Smart AI
            </div>
          </div>
        </Link>

        {/* Menu điều hướng trên máy tính */}
        <nav className="thx-desktop-nav">
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
                whiteSpace: 'nowrap',
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

        {/* Cụm nút tài khoản & giỏ hàng trên máy tính */}
        <div className="thx-desktop-actions">
          {!isAdmin && (
            <Link
              to="/cart"
              className="btn btn-outline btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
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
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#be123c',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Quản trị viên</span>
                </span>
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

        {/* Thanh hành động gọn 1 hàng trên điện thoại */}
        <div className="thx-mobile-actions">
          {!isAdmin && (
            <Link
              to="/cart"
              className="btn btn-outline btn-sm"
              aria-label="Giỏ hàng"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
              }}
            >
              <ShoppingBag size={16} />
              {cartCount > 0 && (
                <span
                  style={{
                    background: '#e11d48',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: '1px 6px',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                fontSize: '0.8rem',
              }}
            >
              <LayoutDashboard size={15} />
              <span>Quản trị</span>
            </Link>
          )}

          {!user && (
            <Link
              to="/login"
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 11px', fontSize: '0.82rem' }}
            >
              Đăng nhập
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="btn btn-outline btn-sm"
            aria-label="Mở menu điều hướng"
            style={{ padding: '6px 9px' }}
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Ngăn menu thả xuống gọn gàng trên điện thoại */}
      {mobileMenuOpen && (
        <div className="thx-mobile-drawer">
          <NavLink to="/" end style={mobileLinkStyle}>
            <span>Trang chủ</span>
          </NavLink>

          <NavLink to="/shop" style={mobileLinkStyle}>
            <span>Bộ sưu tập hoa</span>
          </NavLink>

          {user && !isAdmin && (
            <NavLink to="/my-orders" style={mobileLinkStyle}>
              <span>Đơn hàng của tôi</span>
            </NavLink>
          )}

          {!isAdmin && (
            <button
              type="button"
              onClick={openChatBox}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 14px',
                borderRadius: 12,
                border: 'none',
                background: '#fff1f2',
                color: '#e11d48',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <MessageCircle size={17} />
              <span>Nhắn tin tư vấn với Admin</span>
            </button>
          )}

          {isAdmin && (
            <NavLink to="/admin" style={mobileLinkStyle}>
              <span>Quản trị &amp; AI Dự báo</span>
            </NavLink>
          )}

          <div
            style={{
              marginTop: 6,
              paddingTop: 10,
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            {user ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  {isAdmin ? (
                    <ShieldCheck size={17} color="#e11d48" />
                  ) : (
                    <User size={17} color="#e11d48" />
                  )}
                  <span>
                    {isAdmin
                      ? 'Tài khoản Quản trị viên'
                      : user.hoTen || user.email || 'Khách hàng'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#e11d48', borderColor: '#fecdd3' }}
                >
                  <LogOut size={15} />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogIn size={15} />
                <span>Đăng nhập / Đăng ký tài khoản</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}