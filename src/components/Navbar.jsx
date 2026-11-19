import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Flower2,
  ShoppingCart,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  Search,
  ChevronDown,
  ClipboardList,
  Ticket,
  Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const STORE_CATEGORY_MENU = [
  {
    id: '',
    label: 'TẤT CẢ HOA',
    subItems: [],
  },
  {
    id: 'sinh-nhat',
    label: 'HOA SINH NHẬT',
    subItems: [
      { label: 'HOA SINH NHẬT SANG TRỌNG', query: 'sang trọng' },
      { label: 'HOA SINH NHẬT TẶNG NGƯỜI YÊU', query: 'pastel' },
      { label: 'HOA SINH NHẬT TẶNG MẸ', query: 'giỏ hoa' },
      { label: 'BÓ HOA SINH NHẬT TƯƠI TẮN', query: 'hướng dương' },
    ],
  },
  {
    id: 'khai-truong',
    label: 'HOA KHAI TRƯƠNG',
    subItems: [
      { label: 'KỆ HOA KHAI TRƯƠNG', query: 'kệ hoa' },
      { label: 'LẴNG HOA KHAI TRƯƠNG', query: 'lẵng hoa' },
      { label: 'GIỎ HOA KHAI TRƯƠNG ĐỂ BÀN', query: 'giỏ hoa' },
      { label: 'HOA KHAI TRƯƠNG HỒNG PHÁT', query: 'hồng phát' },
    ],
  },
  {
    id: 'lan-ho-diep',
    label: 'LAN HỒ ĐIỆP',
    subItems: [
      { label: 'LAN HỒ ĐIỆP TRẮNG SANG TRỌNG', query: 'lan hồ điệp' },
      { label: 'GIỎ LAN HỒ ĐIỆP CHÚC MỪNG', query: 'lan' },
    ],
  },
  {
    id: 'chu-de',
    label: 'CHỦ ĐỀ',
    subItems: [
      { label: 'HOA TÌNH YÊU & KỶ NIỆM', query: 'tình yêu' },
      { label: 'HOA CHÚC MỪNG TRI ÂN', query: 'tri ân' },
      { label: 'HOA CƯỚI CẦM TAY CÔ DÂU', query: 'cưới' },
    ],
  },
  {
    id: 'thiet-ke',
    label: 'THIẾT KẾ',
    subItems: [
      { label: 'BÓ HOA TƯƠI NGHỆ THUẬT', dm: '1' },
      { label: 'GIỎ HOA CHÚC MỪNG', dm: '2' },
      { label: 'LẴNG HOA KHAI TRƯƠNG', dm: '3' },
      { label: 'HỘP HOA CAO CẤP', dm: '4' },
      { label: 'HOA CƯỚI CẦM TAY', dm: '5' },
    ],
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const appCtx = useApp() || {};
  const { user, cartItems = [], logout, setUser } = appCtx;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState('');
  const [hoveredCat, setHoveredCat] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const isAdminRoute = location.pathname.toLowerCase().startsWith('/admin');

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

  const activeCat = searchParams.get('cat') || '';

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setHoveredCat(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  const handleSelectCategory = (catId, subObj = null) => {
    setMobileMenuOpen(false);
    setHoveredCat(null);

    const params = new URLSearchParams();
    if (catId) params.set('cat', catId);
    if (subObj?.dm) params.set('dm', subObj.dm);
    if (subObj?.query) params.set('sub', subObj.query);
    if (subObj?.label) params.set('subLabel', subObj.label);

    const qs = params.toString();
    navigate(qs ? `/?${qs}#catalog` : '/#catalog');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleaned = searchQuery.trim();
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    if (cleaned) {
      navigate(`/?q=${encodeURIComponent(cleaned)}#catalog`);
    } else {
      navigate('/#catalog');
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

    if (typeof logout === 'function') logout();
    if (typeof setUser === 'function') setUser(null);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // Khi vào màn hình Quản trị & Dự báo AI: Cắt toàn bộ banner cửa hàng phía trên
  if (isAdminRoute) {
    return (
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #fce7f3',
          position: 'sticky',
          top: 0,
          zIndex: 60,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 46,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#111827',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
              }}
            >
              <Store size={15} />
              <span>Xem trang cửa hàng</span>
            </Link>

            <span style={{ color: '#e5e7eb' }}>|</span>

            <Link
              to="/admin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#e11d48',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                borderBottom: '2px solid #e11d48',
                paddingBottom: 2,
              }}
            >
              <LayoutDashboard size={15} />
              <span>Quản trị &amp; AI Dự báo</span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.84rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 700,
                color: '#111827',
              }}
            >
              <ShieldCheck size={15} color="#e11d48" />
              <span>Quản trị viên</span>
            </span>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: '#111827',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.84rem',
              }}
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #f3f4f6',
          position: 'sticky',
          top: 0,
          zIndex: 60,
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
        }}
      >
        <style>{`
          .thx-top-utility {
            background: #fffafb;
            border-bottom: 1px solid #fce7f3;
            font-size: 0.78rem;
            color: #111827;
          }
          .thx-top-utility-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 34px;
            gap: 12px;
          }
          .thx-util-links {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .thx-util-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: #111827;
            text-decoration: none;
            font-weight: 600;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            font-size: 0.78rem;
            transition: color 0.15s ease;
          }
          .thx-util-item:hover,
          .thx-util-item:active {
            color: #e11d48 !important;
          }
          .thx-main-header-row {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 16px;
            height: 70px;
          }
          .thx-header-tagline {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.8rem;
            color: #6b7280;
          }
          .thx-header-right-tools {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
          }
          .thx-search-box {
            position: relative;
            width: 240px;
          }
          .thx-pink-cart-btn {
            position: relative;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: #e11d48;
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            flex-shrink: 0;
            transition: background 0.15s ease;
          }
          .thx-pink-cart-btn:hover {
            background: #be123c;
          }
          .thx-pink-cart-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            min-width: 19px;
            height: 19px;
            padding: 0 5px;
            border-radius: 999px;
            background: #ffffff;
            color: #e11d48;
            border: 1.5px solid #e11d48;
            font-size: 0.7rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .thx-cat-bar-wrap {
            border-top: 1px solid #f3f4f6;
            background: #ffffff;
          }
          .thx-cat-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 28px;
            height: 44px;
          }
          .thx-cat-item {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
          }
          .thx-cat-trigger {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            height: 100%;
            background: transparent;
            border: none;
            border-bottom: 2.5px solid transparent;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            cursor: pointer;
            padding: 0 2px;
            white-space: nowrap;
            transition: color 0.15s ease, border-color 0.15s ease;
          }
          .thx-cat-trigger:hover,
          .thx-cat-trigger:active {
            color: #e11d48 !important;
          }
          .thx-cat-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            min-width: 245px;
            background: #ffffff;
            border: 1px solid #f3f4f6;
            border-top: 2px solid #e11d48;
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
            padding: 6px 0;
            z-index: 80;
            animation: thxDropFade 0.14s ease-out;
          }
          .thx-cat-sub-btn {
            display: block;
            width: 100%;
            text-align: left;
            padding: 10px 16px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #f9fafb;
            font-size: 0.78rem;
            font-weight: 600;
            color: #111827;
            cursor: pointer;
            transition: all 0.14s ease;
          }
          .thx-cat-sub-btn:last-child {
            border-bottom: none;
          }
          .thx-cat-sub-btn:hover {
            background: #fff1f2;
            color: #e11d48;
            padding-left: 20px;
          }
          .thx-mobile-header-bar {
            display: none;
          }
          .thx-overlay-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(2px);
            z-index: 98;
          }
          .thx-overlay-drawer {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(320px, 85vw);
            background: #ffffff;
            z-index: 99;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 16px;
            overflow-y: auto;
            box-shadow: -12px 0 36px rgba(15, 23, 42, 0.16);
          }
          @keyframes thxDropFade {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (max-width: 960px) {
            .thx-top-utility,
            .thx-main-header-row,
            .thx-cat-bar-wrap {
              display: none;
            }
            .thx-mobile-header-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              height: 60px;
              gap: 10px;
            }
          }
        `}</style>

        {/* 1. Thanh tiện ích trên cùng */}
        <div className="thx-top-utility">
          <div className="container thx-top-utility-inner">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#be123c',
                fontWeight: 600,
              }}
            >
              <Ticket size={14} />
              <span>Ưu đãi hôm nay: Chọn Voucher giảm đến 50K trực tiếp tại giỏ hàng</span>
            </span>

            <div className="thx-util-links">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="thx-util-item"
                  style={{
                    color: isAdminRoute ? '#e11d48' : '#111827',
                    fontWeight: 700,
                  }}
                >
                  <LayoutDashboard size={13} />
                  <span>Quản trị &amp; AI Dự báo</span>
                </Link>
              )}

              {user && !isAdmin && (
                <Link to="/my-orders" className="thx-util-item">
                  <ClipboardList size={13} />
                  <span>Đơn hàng của tôi</span>
                </Link>
              )}

              {!isAdmin && (
                <Link to="/cart" className="thx-util-item">
                  <ShoppingCart size={13} />
                  <span>Giỏ hàng ({cartCount})</span>
                </Link>
              )}

              {user ? (
                <>
                  <span className="thx-util-item" style={{ cursor: 'default', fontWeight: 700 }}>
                    {isAdmin ? <ShieldCheck size={13} color="#e11d48" /> : <User size={13} />}
                    <span>{isAdmin ? 'Quản trị viên' : user.hoTen || user.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="thx-util-item"
                  >
                    <LogOut size={13} />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="thx-util-item" style={{ fontWeight: 700 }}>
                  <LogIn size={13} />
                  <span>Tài khoản / Đăng nhập</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 2. Hàng thương hiệu giữa + Tìm kiếm & Giỏ hàng */}
        <div className="container thx-main-header-row">
          <div className="thx-header-tagline">
            <span
              style={{
                background: '#fff1f2',
                color: '#be123c',
                padding: '4px 10px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.74rem',
              }}
            >
              Hoa tươi tuyển chọn mỗi sáng
            </span>
          </div>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '2px solid #e11d48',
                background: '#fff1f2',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flower2 size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: '#e11d48',
                  letterSpacing: '0.03em',
                  lineHeight: 1.1,
                }}
              >
                TIỆM HOA XINH
              </div>
              <div
                style={{
                  fontSize: '0.73rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                }}
              >
                Say it with Fresh Flowers &amp; Smart AI
              </div>
            </div>
          </Link>

          <div className="thx-header-right-tools">
            <form onSubmit={handleSearchSubmit} className="thx-search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm mẫu hoa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  height: 38,
                  paddingRight: 36,
                  fontSize: '0.85rem',
                  borderRadius: 10,
                  background: '#f9fafb',
                }}
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 7,
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <Search size={17} />
              </button>
            </form>

            {!isAdmin && (
              <Link
                to="/cart"
                className="thx-pink-cart-btn"
                title="Giỏ hàng của bạn"
                aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}
              >
                <ShoppingCart size={19} />
                <span className="thx-pink-cart-badge">{cartCount}</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3. Thanh danh mục ngang 6 mục chuẩn (Chữ từ đen chuyển sang đỏ khi bấm chọn) */}
        <nav className="thx-cat-bar-wrap" aria-label="Danh mục hoa tươi">
          <div className="container thx-cat-bar">
            {STORE_CATEGORY_MENU.map((cat) => {
              const isSelected =
                (location.pathname === '/' || location.pathname === '/shop') &&
                activeCat === cat.id;

              return (
                <div
                  key={cat.id || 'all'}
                  className="thx-cat-item"
                  onMouseEnter={() => setHoveredCat(cat.id)}
                  onMouseLeave={() => setHoveredCat(null)}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className="thx-cat-trigger"
                    style={{
                      color: isSelected ? '#e11d48' : '#111827',
                      borderBottomColor: isSelected ? '#e11d48' : 'transparent',
                    }}
                  >
                    <span>{cat.label}</span>
                    {cat.subItems.length > 0 && <ChevronDown size={13} />}
                  </button>

                  {cat.subItems.length > 0 && hoveredCat === cat.id && (
                    <div className="thx-cat-dropdown">
                      {cat.subItems.map((sub) => (
                        <button
                          key={sub.label}
                          type="button"
                          onClick={() => handleSelectCategory(cat.id, sub)}
                          className="thx-cat-sub-btn"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* 4. Thanh Header gọn 1 hàng trên điện thoại */}
        <div className="container thx-mobile-header-bar">
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#e11d48',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flower2 size={19} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  color: '#e11d48',
                  lineHeight: 1.15,
                }}
              >
                Tiệm Hoa Xinh
              </div>
              <div style={{ fontSize: '0.67rem', color: '#6b7280' }}>
                Fresh Floral &amp; Smart AI
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Tìm kiếm"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#111827',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Search size={17} />
            </button>

            {!isAdmin && (
              <Link
                to="/cart"
                className="thx-pink-cart-btn"
                style={{ width: 36, height: 36 }}
                aria-label={`Giỏ hàng (${cartCount})`}
              >
                <ShoppingCart size={17} />
                <span className="thx-pink-cart-badge">{cartCount}</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="btn btn-outline btn-sm"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  color: isAdminRoute ? '#e11d48' : '#111827',
                  borderColor: isAdminRoute ? '#e11d48' : '#e5e7eb',
                  fontWeight: 700,
                }}
              >
                Quản trị
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở danh mục"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid #fecdd3',
                background: '#fffafb',
                color: '#be123c',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="container" style={{ paddingBottom: 12 }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                autoFocus
                className="form-control"
                placeholder="Nhập tên hoa cần tìm..."
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

      {/* Ngăn kéo danh mục & tài khoản trên điện thoại */}
      {mobileMenuOpen && (
        <>
          <div
            className="thx-overlay-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <aside className="thx-overlay-drawer" aria-label="Danh mục hoa di động">
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 12,
                  marginBottom: 10,
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#e11d48' }}>
                  DANH MỤC HOA TƯƠI
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={17} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {STORE_CATEGORY_MENU.map((cat) => {
                  const isExpanded = expandedMobileCat === cat.id;
                  const isSelected = activeCat === cat.id;
                  return (
                    <div key={cat.id || 'm-all'}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: 10,
                          background: isSelected ? '#fff1f2' : 'transparent',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            padding: '10px 12px',
                            background: 'transparent',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: isSelected ? '#e11d48' : '#111827',
                            cursor: 'pointer',
                          }}
                        >
                          {cat.label}
                        </button>

                        {cat.subItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMobileCat(isExpanded ? '' : cat.id)
                            }
                            style={{
                              padding: '10px 12px',
                              background: 'transparent',
                              border: 'none',
                              color: '#6b7280',
                              cursor: 'pointer',
                            }}
                          >
                            <ChevronDown
                              size={16}
                              style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.15s ease',
                              }}
                            />
                          </button>
                        )}
                      </div>

                      {cat.subItems.length > 0 && isExpanded && (
                        <div
                          style={{
                            paddingLeft: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            marginBottom: 6,
                          }}
                        >
                          {cat.subItems.map((sub) => (
                            <button
                              key={sub.label}
                              type="button"
                              onClick={() => handleSelectCategory(cat.id, sub)}
                              style={{
                                textAlign: 'left',
                                padding: '8px 10px',
                                background: '#fafafa',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#4b5563',
                                cursor: 'pointer',
                              }}
                            >
                              • {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(user || isAdmin) && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {user && !isAdmin && (
                    <Link
                      to="/my-orders"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        textDecoration: 'none',
                        color: '#111827',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <ClipboardList size={16} color="#e11d48" />
                      <span>Đơn hàng của tôi</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: isAdminRoute ? '#fff1f2' : '#ffffff',
                        textDecoration: 'none',
                        color: isAdminRoute ? '#e11d48' : '#111827',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <LayoutDashboard size={16} />
                      <span>Quản trị &amp; AI Dự báo</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                paddingTop: 12,
                marginTop: 14,
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {user ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: '#f9fafb',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    <User size={16} color="#e11d48" />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isAdmin ? 'Quản trị viên' : user.hoTen || user.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center', color: '#111827' }}
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