import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flower2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  AlertCircle,
  LogIn,
  UserPlus,
  Sparkles,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isAdminAccount } from '../utils/storeUtils';

export default function LoginPage() {
  const navigate = useNavigate();
  const appCtx = useApp() || {};
  const { login, register, fetchCart, showToast } = appCtx;

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [regForm, setRegForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    matKhau: '',
    xacNhanMatKhau: '',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Địa chỉ Email và Mật khẩu.');
      return;
    }

    try {
      setSubmitting(true);
      const userData = await login(cleanEmail, password, rememberMe);

      if (typeof fetchCart === 'function') {
        await fetchCart().catch(() => {});
      }

      const isAdmin = isAdminAccount(userData);
      if (typeof showToast === 'function') {
        showToast(
          isAdmin
            ? `Chào mừng Quản trị viên ${userData.hoTen || 'Admin'} quay trở lại!`
            : `Đăng nhập thành công! Xin chào ${userData.hoTen || 'bạn'}.`
        );
      }

      navigate(isAdmin ? '/admin' : '/');
    } catch (err) {
      if (!err.response) {
        setErrorMsg(
          'Không kết nối được tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau vài giây.'
        );
      } else if (err.response.status >= 500) {
        setErrorMsg('Hệ thống máy chủ đang bảo trì tạm thời (500). Vui lòng thử lại sau ít phút.');
      } else {
        const serverMsg =
          (typeof err.response?.data === 'string' && err.response.data) ||
          err.response?.data?.message ||
          'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
        setErrorMsg(serverMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (regForm.matKhau.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regForm.matKhau !== regForm.xacNhanMatKhau) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        hoTen: regForm.hoTen.trim(),
        email: regForm.email.trim(),
        soDienThoai: regForm.soDienThoai.trim(),
        diaChi: regForm.diaChi.trim(),
        matKhau: regForm.matKhau,
        vaiTro: 'KhachHang',
      });

      showToast?.('Đăng ký tài khoản thành công! Mời bạn đăng nhập.');
      setEmail(regForm.email.trim());
      setPassword('');
      setMode('login');
    } catch (err) {
      if (!err.response) {
        setErrorMsg('Không kết nối được tới máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else if (err.response.status >= 500) {
        setErrorMsg('Lỗi hệ thống máy chủ (500). Vui lòng thử lại sau ít phút.');
      } else {
        const serverMsg =
          (typeof err.response?.data === 'string' && err.response.data) ||
          err.response?.data?.message ||
          'Không thể đăng ký tài khoản. Email có thể đã được sử dụng.';
        setErrorMsg(serverMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '38px 16px',
      }}
    >
      <div className="thx-login-shell">
        {/* Cột trái: Showcase thương hiệu */}
        <div className="thx-login-visual">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Flower2 size={22} />
              </div>
              <div>
                <div className="serif-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Tiệm Hoa Xinh
                </div>
                <div style={{ fontSize: '0.73rem', opacity: 0.78 }}>
                  Fresh Floral Atelier &amp; Smart AI
                </div>
              </div>
            </div>

            <h2
              style={{
                fontSize: '2rem',
                lineHeight: 1.22,
                color: '#ffffff',
                marginBottom: 14,
              }}
            >
              Mỗi Bó Hoa Là Một{' '}
              <span style={{ color: '#fda4af', fontStyle: 'italic' }}>Lời Chúc Tinh Tế</span>
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.82)', lineHeight: 1.65 }}>
              Đăng nhập để lưu mẫu hoa yêu thích, nhận gợi ý phối hoa từ Smart AI, áp dụng Voucher ưu đãi và theo dõi đơn hàng theo thời gian thực.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem' }}>
              <Sparkles size={16} color="#fda4af" />
              <span>Smart AI gợi ý mẫu hoa chuẩn gu theo từng dịp tặng</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem' }}>
              <Truck size={16} color="#fda4af" />
              <span>Giao hỏa tốc 2 giờ tại Đà Nẵng &bull; Gửi ảnh duyệt trước</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem' }}>
              <ShieldCheck size={16} color="#fda4af" />
              <span>Thanh toán VietQR minh bạch &amp; theo dõi tiến độ 4 bước</span>
            </div>
          </div>
        </div>

        {/* Cột phải: Form Đăng nhập / Đăng ký */}
        <div style={{ padding: '34px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1 style={{ fontSize: '1.7rem', marginBottom: 6 }}>
              {mode === 'login' ? 'Đăng Nhập Hệ Thống' : 'Tạo Tài Khoản Mới'}
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#6b7280', lineHeight: 1.5 }}>
              {mode === 'login'
                ? 'Nhập thông tin tài khoản Khách hàng hoặc Quản trị viên để tiếp tục.'
                : 'Đăng ký thành viên Tiệm Hoa Xinh để đặt hoa nhanh và theo dõi đơn.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#f3f4f6',
              padding: 4,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: '0.87rem',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#e11d48' : '#6b7280',
                boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Đăng nhập
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: '0.87rem',
                background: mode === 'register' ? '#ffffff' : 'transparent',
                color: mode === 'register' ? '#e11d48' : '#6b7280',
                boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Đăng ký thành viên
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '11px 14px',
                borderRadius: 12,
                fontSize: '0.85rem',
                lineHeight: 1.45,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} autoComplete="on">
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Địa chỉ Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={17}
                    color="#9ca3af"
                    style={{ position: 'absolute', left: 13, top: 13 }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    className="form-control"
                    required
                    placeholder="Nhập email tài khoản của bạn..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: 40, height: 44 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    color="#9ca3af"
                    style={{ position: 'absolute', left: 13, top: 13 }}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    required
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: 40, paddingRight: 42, height: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: 9,
                      background: 'transparent',
                      color: '#6b7280',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                  fontSize: '0.84rem',
                  color: '#4b5563',
                }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#e11d48', width: 15, height: 15 }}
                  />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', height: 46, fontSize: '0.96rem' }}
              >
                <LogIn size={18} />
                <span>{submitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={17}
                    color="#9ca3af"
                    style={{ position: 'absolute', left: 13, top: 13 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Nguyễn Văn A"
                    value={regForm.hoTen}
                    onChange={(e) => setRegForm({ ...regForm, hoTen: e.target.value })}
                    style={{ paddingLeft: 40, height: 42 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Email đăng nhập</label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="#9ca3af"
                      style={{ position: 'absolute', left: 12, top: 13 }}
                    />
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="email@gmail.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      style={{ paddingLeft: 38, height: 42 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={16}
                      color="#9ca3af"
                      style={{ position: 'absolute', left: 12, top: 13 }}
                    />
                    <input
                      type="tel"
                      className="form-control"
                      required
                      placeholder="0905xxxxxx"
                      value={regForm.soDienThoai}
                      onChange={(e) =>
                        setRegForm({ ...regForm, soDienThoai: e.target.value })
                      }
                      style={{ paddingLeft: 38, height: 42 }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ giao hoa mặc định</label>
                <div style={{ position: 'relative' }}>
                  <MapPin
                    size={17}
                    color="#9ca3af"
                    style={{ position: 'absolute', left: 13, top: 13 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Số nhà, đường, quận/huyện, thành phố..."
                    value={regForm.diaChi}
                    onChange={(e) => setRegForm({ ...regForm, diaChi: e.target.value })}
                    style={{ paddingLeft: 40, height: 42 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Mật khẩu</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={regForm.matKhau}
                      onChange={(e) => setRegForm({ ...regForm, matKhau: e.target.value })}
                      style={{ height: 42, paddingRight: 36 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      style={{
                        position: 'absolute',
                        right: 9,
                        top: 10,
                        background: 'transparent',
                        color: '#6b7280',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={regForm.xacNhanMatKhau}
                    onChange={(e) =>
                      setRegForm({ ...regForm, xacNhanMatKhau: e.target.value })
                    }
                    style={{ height: 42 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', height: 46, fontSize: '0.96rem', marginTop: 4 }}
              >
                <UserPlus size={18} />
                <span>{submitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
