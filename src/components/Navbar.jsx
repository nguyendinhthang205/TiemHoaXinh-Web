import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Flower2,
  ShoppingCart,
  User,
  LogOut,
  LogIn,
  MessageCircle,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const appCtx = useApp() || {};
  const { user, cartItems = [], logout, setUser } = appCtx;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleaned = searchQuery.trim();
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    if (cleaned) {
      navigate(`/shop?q=${encodeURIComponent(cleaned)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('thx_token');
    localStorage.removeItem('thx_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('thx_token');
    sessionStorage.removeItem('thx_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

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
    fontSize: '0.92rem',
    color: isActive ? '#e11d48' : '#374151',
    padding: '8px 2px',
    borderBottom: isActive ? '2.5px solid #e11d48' : '2.5px solid transparent',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  });

  const mobileLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 600,
    fontSize: '0.95rem',
    color: isActive ? '#e11d48' : '#1f2937',
    background: isActive ? '#fff1f2' : 'transparent',
    transition: 'background 0.15s ease',
  });

  return (
    <>
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
            gap: 12px;
            height: 70px;
          }
          .thx-desktop-search {
            display: flex;
            align-items: center;
            position: relative;
            width: 210px;
            flex-shrink: 1;
          }
          .thx-desktop-nav {
            display: flex;
            align-items: center;
            gap: 18px;
          }
          .thx-desktop-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .thx-mobile-actions {
            display: none;
            align-items: center;
            gap: 8px;
          }
          .thx-icon-square-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 11px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            color: #1f2937;
            text-decoration: none;
            cursor: pointer;
          }
          .thx-cart-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            border: 1.5px solid #ffffff;
          }
          .thx-mobile-search-bar {
            display: none;
            padding: 0 0 12px;
          }
          .thx-overlay-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(2px);
            z-index: 98;
            animation: thxFadeIn 0.18s ease-out;
          }
          .thx-overlay-drawer {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(310px, 84vw);
            background: #ffffff;
            z-index: 99;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 16px;
            box-shadow: -12px 0 36px rgba(15, 23, 42, 0.16);
            animation: thxSlideInRight 0.22s ease-out;
          }
          @keyframes thxFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes thxSlideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }

          @media (max-width: 1024px) {
            .thx-desktop-search {
              width: 170px;
            }
          }

          @media (max-width: 900px) {
            .thx-nav-bar {
              height: 60px;
            }
            .thx-desktop-search,
            .thx-desktop-nav,
            .thx-desktop-actions {
              display: none;
            }
            .thx-mobile-actions {
              display: flex;
            }
            .thx-mobile-search-bar {
              display: block;
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
              gap: 9,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background: '#e11d48',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flower2 size={20} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: '#be123c',
                  lineHeight: 1.15,
                }}
              >
                Tiệm Hoa Xinh
              </div>
              <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                Fresh Floral &amp; Smart AI
              </div>
            </div>
          </Link>

          {/* Thanh tìm kiếm trên máy tính */}
          <form onSubmit={handleSearchSubmit} className="thx-desktop-search">
            <Search
              size={15}
              color="#9ca3af"
              style={{ position: 'absolute', left: 11, pointerEvents: 'none' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm hoa hồng, tulip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: 36,
                paddingLeft: 32,
                paddingRight: 10,
                fontSize: '0.84rem',
                borderRadius: 999,
                background: '#f9fafb',
              }}
            />
          </form>

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
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  padding: '8px 2px',
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
                <ShoppingCart size={16} />
                <span>Giỏ hàng</span>
                <span
                  style={{
                    background: cartCount > 0 ? '#e11d48' : '#f3f4f6',
                    color: cartCount > 0 ? '#ffffff' : '#6b7280',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: '1px 7px',
                    marginLeft: 2,
                  }}
                >
                  {cartCount}
                </span>
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
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="thx-icon-square-btn"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search size={18} />
            </button>

            {!isAdmin && (
              <Link
                to="/cart"
                className="thx-icon-square-btn"
                aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}
              >
                <ShoppingCart size={18} />
                <span
                  className="thx-cart-badge"
                  style={{
                    background: cartCount > 0 ? '#e11d48' : '#6b7280',
                    color: '#ffffff',
                  }}
                >
                  {cartCount}
                </span>
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
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              >
                Đăng nhập
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu điều hướng"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 11,
                border: '1px solid #fecdd3',
                background: '#fffafb',
                color: '#be123c',
                cursor: 'pointer',
              }}
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm mở nhanh trên điện thoại */}
        {mobileSearchOpen && (
          <div className="container thx-mobile-search-bar">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                autoFocus
                className="form-control"
                placeholder="Nhập tên hoa cần tìm (hồng, hướng dương...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: 38, fontSize: '0.88rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: 38 }}>
                Tìm
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Overlay Drawer trượt đè lên nội dung kèm lớp phủ tối mờ */}
      {mobileMenuOpen && (
        <>
          <div
            className="thx-overlay-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <aside className="thx-overlay-drawer" aria-label="Menu điều hướng di động">
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 14,
                  marginBottom: 12,
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: '#e11d48',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Flower2 size={18} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#be123c' }}>
                    Tiệm Hoa Xinh
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Đóng menu"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <NavLink to="/" end style={mobileLinkStyle}>
                  <span>Trang chủ</span>
                  <ChevronRight size={16} opacity={0.5} />
                </NavLink>

                <NavLink to="/shop" style={mobileLinkStyle}>
                  <span>Bộ sưu tập hoa</span>
                  <ChevronRight size={16} opacity={0.5} />
                </NavLink>

                {user && !isAdmin && (
                  <NavLink to="/my-orders" style={mobileLinkStyle}>
                    <span>Đơn hàng của tôi</span>
                    <ChevronRight size={16} opacity={0.5} />
                  </NavLink>
                )}

                {isAdmin && (
                  <NavLink to="/admin" style={mobileLinkStyle}>
                    <span>Quản trị &amp; AI Dự báo</span>
                    <ChevronRight size={16} opacity={0.5} />
                  </NavLink>
                )}
              </nav>

              {/* Nút Nhắn tin với Admin dạng viền mảnh (tách biệt rõ với trạng thái Active State) */}
              {!isAdmin && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #f3f4f6' }}>
                  <button
                    type="button"
                    onClick={openChatBox}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 12,
                      border: '1.5px solid #fecdd3',
                      background: '#ffffff',
                      color: '#be123c',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <MessageCircle size={17} color="#e11d48" />
                    <span>Nhắn tin tư vấn với Admin</span>
                  </button>
                </div>
              )}
            </div>

            {/* Chân ngăn kéo: Thông tin tài khoản & Đăng xuất */}
            <div
              style={{
                paddingTop: 14,
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {user ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: '#f9fafb',
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
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isAdmin
                        ? 'Tài khoản Quản trị viên'
                        : user.hoTen || user.email || 'Khách hàng'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      color: '#e11d48',
                      borderColor: '#fecdd3',
                      background: '#ffffff',
                    }}
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
                  <span>Đăng nhập / Đăng ký</span>
                </Link>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}