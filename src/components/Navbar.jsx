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
  Heart,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isAdminAccount } from '../utils/storeUtils';

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
      { label: 'LAN HỒ ĐIỆP TRẮNG SANG TRỌNG', query: 'lan hồ điệp trắng' },
      { label: 'LAN HỒ ĐIỆP VÀNG HOÀNG KIM', query: 'lan hồ điệp vàng' },
      { label: 'LAN HỒ ĐIỆP TÍM QUÝ PHÁI', query: 'lan hồ điệp tím' },
      { label: 'GIỎ LAN HỒ ĐIỆP CHÚC MỪNG', query: 'giỏ hoa lan' },
    ],
  },
  {
    id: 'chu-de',
    label: 'CHỦ ĐỀ',
    subItems: [
      { label: 'HOA TÌNH YÊU & KỶ NIỆM', query: 'tình yêu' },
      { label: 'HOA CHÚC MỪNG TRI ÂN & TẶNG MẸ', query: 'tri ân' },
      { label: 'HOA CƯỚI CẦM TAY CÔ DÂU', query: 'cưới' },
      { label: 'HOA SEN & PHONG CÁCH Á ĐÔNG', query: 'hoa sen' },
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
  const {
    user,
    cartCount = 0,
    wishlistIds = [],
    setWishlistOpen,
    logout,
    setUser,
  } = appCtx;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState('');
  const [hoveredCat, setHoveredCat] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const isAdminRoute = location.pathname.toLowerCase().startsWith('/admin');
  const isAdmin = isAdminAccount(user);
  const activeCat = searchParams.get('cat') || '';

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

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
    if (typeof logout === 'function') logout();
    if (typeof setUser === 'function') setUser(null);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  if (isAdminRoute) {
    return (
      <header className="thx-navbar-shell">
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 52,
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
                gap: 7,
                color: '#181316',
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
                gap: 7,
                color: '#e11d48',
                fontWeight: 700,
                fontSize: '0.84rem',
                borderBottom: '2px solid #e11d48',
                paddingBottom: 2,
              }}
            >
              <LayoutDashboard size={15} />
              <span>Trung tâm Quản trị &amp; AI Dự báo</span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.84rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 700,
                color: '#181316',
              }}
            >
              <ShieldCheck size={15} color="#e11d48" />
              <span>{user?.hoTen || 'Quản trị viên'}</span>
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="thx-util-item"
              style={{ fontSize: '0.84rem' }}
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
      <header className="thx-navbar-shell">
        {/* 1. Thanh tiện ích trên cùng */}
        <div className="thx-top-utility">
          <div className="container thx-top-utility-inner">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#9f1239',
                fontWeight: 600,
              }}
            >
              <Ticket size={14} />
              <span>Ưu đãi hôm nay: Chọn Voucher giảm đến 80K trực tiếp tại giỏ hàng</span>
            </span>

            <div className="thx-util-links">
              {isAdmin && (
                <Link to="/admin" className="thx-util-item" style={{ fontWeight: 700 }}>
                  <LayoutDashboard size={13} color="#e11d48" />
                  <span>Quản trị &amp; AI Dự báo</span>
                </Link>
              )}

              {user && !isAdmin && (
                <Link to="/my-orders" className="thx-util-item">
                  <ClipboardList size={13} />
                  <span>Đơn hàng của tôi</span>
                </Link>
              )}

              {user ? (
                <>
                  <span className="thx-util-item" style={{ cursor: 'default', fontWeight: 700 }}>
                    {isAdmin ? <ShieldCheck size={13} color="#e11d48" /> : <User size={13} />}
                    <span>{isAdmin ? 'Quản trị viên' : user.hoTen || user.email}</span>
                  </span>
                  <button type="button" onClick={handleLogout} className="thx-util-item">
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

        {/* 2. Hàng thương hiệu giữa + Tìm kiếm + Yêu thích + Giỏ hàng */}
        <div className="container thx-main-header-row">
          <div className="thx-header-tagline">
            <span
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#9f1239',
                padding: '5px 12px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.73rem',
              }}
            >
              Hoa tươi tuyển chọn 5AM • Đà Nẵng
            </span>
          </div>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 11,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                border: '2px solid #e11d48',
                background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
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
                className="serif-title"
                style={{
                  fontWeight: 700,
                  fontSize: '1.42rem',
                  color: '#be123c',
                  letterSpacing: '0.02em',
                  lineHeight: 1.08,
                }}
              >
                TIỆM HOA XINH
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                }}
              >
                Fresh Floral Atelier &amp; Smart AI
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
                  height: 40,
                  paddingRight: 38,
                  fontSize: '0.85rem',
                  borderRadius: 12,
                  background: '#faf8f9',
                }}
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  background: 'transparent',
                  color: '#6b7280',
                }}
              >
                <Search size={17} />
              </button>
            </form>

            {!isAdmin && (
              <button
                type="button"
                onClick={() => setWishlistOpen?.(true)}
                className="thx-icon-action-btn"
                title="Mẫu hoa đã yêu thích"
                aria-label={`Mẫu hoa yêu thích (${wishlistIds.length})`}
              >
                <Heart size={18} fill={wishlistIds.length > 0 ? '#e11d48' : 'none'} color="#e11d48" />
                {wishlistIds.length > 0 && (
                  <span className="thx-pink-cart-badge">{wishlistIds.length}</span>
                )}
              </button>
            )}

            {!isAdmin && (
              <Link
                to="/cart"
                className="thx-pink-cart-btn"
                title="Giỏ hàng của bạn"
                aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}
              >
                <ShoppingCart size={18} />
                <span className="thx-pink-cart-badge">{cartCount}</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3. Thanh danh mục ngang 6 mục + Smart AI Concierge */}
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
                      color: isSelected ? '#e11d48' : '#181316',
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

            <Link to="/shop?goiY=dip#ai-concierge" className="thx-cat-ai-pill">
              <Sparkles size={13} />
              <span>Smart AI Chọn Hoa</span>
            </Link>
          </div>
        </nav>

        {/* 4. Thanh Header gọn trên điện thoại */}
        <div className="container thx-mobile-header-bar">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flower2 size={18} />
            </div>
            <div>
              <div
                className="serif-title"
                style={{
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: '#be123c',
                  lineHeight: 1.1,
                }}
              >
                Tiệm Hoa Xinh
              </div>
              <div style={{ fontSize: '0.66rem', color: '#6b7280' }}>
                Fresh Floral &amp; Smart AI
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Tìm kiếm"
              className="thx-icon-action-btn"
              style={{ width: 36, height: 36, borderColor: '#e5e7eb', color: '#181316' }}
            >
              <Search size={16} />
            </button>

            {!isAdmin && (
              <button
                type="button"
                onClick={() => setWishlistOpen?.(true)}
                aria-label="Mẫu hoa yêu thích"
                className="thx-icon-action-btn"
                style={{ width: 36, height: 36 }}
              >
                <Heart size={16} fill={wishlistIds.length > 0 ? '#e11d48' : 'none'} color="#e11d48" />
                {wishlistIds.length > 0 && (
                  <span className="thx-pink-cart-badge">{wishlistIds.length}</span>
                )}
              </button>
            )}

            {!isAdmin && (
              <Link
                to="/cart"
                className="thx-pink-cart-btn"
                style={{ width: 36, height: 36 }}
                aria-label={`Giỏ hàng (${cartCount})`}
              >
                <ShoppingCart size={16} />
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
                  color: '#be123c',
                  borderColor: '#fecdd3',
                }}
              >
                Quản trị
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở danh mục"
              className="thx-icon-action-btn"
              style={{ width: 36, height: 36, background: '#fffafb' }}
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
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#be123c' }}>
                  DANH MỤC HOA TƯƠI
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Đóng danh mục"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={17} />
                </button>
              </div>

              <Link
                to="/shop?goiY=dip#ai-concierge"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginBottom: 12 }}
              >
                <Sparkles size={15} />
                <span>Smart AI Chọn Hoa Theo Dịp</span>
              </Link>

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
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            color: isSelected ? '#e11d48' : '#181316',
                          }}
                        >
                          {cat.label}
                        </button>

                        {cat.subItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedMobileCat(isExpanded ? '' : cat.id)}
                            aria-label="Mở danh mục con"
                            style={{
                              padding: '10px 12px',
                              background: 'transparent',
                              color: '#6b7280',
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
                                borderRadius: 8,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#4b5563',
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
                        color: '#181316',
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
                        background: '#fff1f2',
                        color: '#be123c',
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
                    style={{ width: '100%' }}
                  >
                    <LogOut size={15} />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
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
