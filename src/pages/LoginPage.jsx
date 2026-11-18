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
} from 'lucide-react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const appCtx = useApp() || {};
  const { setUser, login, fetchCart, showToast } = appCtx;

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Đăng nhập
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Form Đăng ký tài khoản mới
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
      const res = await api.post('/Auth/login', {
        email: cleanEmail,
        matKhau: password,
        password: password,
      });

      const data = res.data || {};
      const token = data.token || data.accessToken || data.jwtToken || '';
      const rawUser = data.user || data.nguoiDung || data;
      const userData = {
        maNguoiDung: rawUser.maNguoiDung ?? data.maNguoiDung,
        hoTen: rawUser.hoTen || data.hoTen || cleanEmail.split('@')[0],
        email: rawUser.email || data.email || cleanEmail,
        vaiTro: rawUser.vaiTro || rawUser.role || data.vaiTro || data.role || 'KhachHang',
        soDienThoai: rawUser.soDienThoai || data.soDienThoai || '',
        diaChi: rawUser.diaChi || data.diaChi || '',
      };

      if (token) {
        localStorage.setItem('thx_token', token);
        localStorage.setItem('token', token);
      }
      localStorage.setItem('thx_user', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));

      if (typeof setUser === 'function') {
        setUser(userData);
      } else if (typeof login === 'function') {
        login({ token, user: userData, ...userData });
      }
      window.dispatchEvent(new Event('storage'));

      if (typeof fetchCart === 'function') {
        await fetchCart().catch(() => {});
      }

      const roleStr = String(
        userData?.vaiTro || userData?.role || userData?.quyen || ''
      ).toLowerCase();
      const isAdmin =
        roleStr.includes('admin') ||
        roleStr.includes('quản trị') ||
        String(userData?.email || '').toLowerCase() === 'admin@tiemhoaxinh.vn';

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
          'Không kết nối được máy chủ Backend (cổng 44320). Vui lòng mở Visual Studio và nhấn Ctrl + F5 để chạy API.'
        );
      } else if (err.response.status >= 500) {
        setErrorMsg(
          'Lỗi hệ thống máy chủ (500). Vui lòng kiểm tra kết nối SQL Server trong Backend.'
        );
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
      await api.post('/Auth/register', {
        hoTen: regForm.hoTen.trim(),
        email: regForm.email.trim(),
        soDienThoai: regForm.soDienThoai.trim(),
        diaChi: regForm.diaChi.trim(),
        matKhau: regForm.matKhau,
        vaiTro: 'KhachHang',
      });

      if (typeof showToast === 'function') {
        showToast('Đăng ký tài khoản thành công! Mời bạn đăng nhập.');
      }

      setEmail(regForm.email.trim());
      setPassword('');
      setMode('login');
    } catch (err) {
      if (!err.response) {
        setErrorMsg(
          'Không kết nối được máy chủ Backend (cổng 44320). Vui lòng mở Visual Studio và nhấn Ctrl + F5 để chạy API.'
        );
      } else if (err.response.status >= 500) {
        setErrorMsg(
          'Lỗi hệ thống máy chủ (500). Vui lòng kiểm tra kết nối SQL Server trong Backend.'
        );
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
        minHeight: 'calc(100vh - 180px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
      }}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: mode === 'login' ? 440 : 500,
          padding: '34px 32px',
          borderRadius: 24,
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* Logo & Tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 8px 20px rgba(225, 29, 72, 0.25)',
            }}
          >
            <Flower2 size={28} />
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: 6 }}>
            {mode === 'login' ? 'Đăng Nhập Hệ Thống' : 'Tạo Tài Khoản Mới'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#6b7280', lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'Vui lòng nhập thông tin tài khoản Khách hàng hoặc Quản trị viên để tiếp tục.'
              : 'Đăng ký thành viên Tiệm Hoa Xinh để đặt hoa nhanh và theo dõi đơn hàng.'}
          </p>
        </div>

        {/* Thanh chuyển tab Đăng nhập / Đăng ký */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#f3f4f6',
            padding: 4,
            borderRadius: 12,
            marginBottom: 22,
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
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#e11d48' : '#6b7280',
              boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
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
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? '#e11d48' : '#6b7280',
              boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Đăng ký thành viên
          </button>
        </div>

        {/* Khung hiển thị thông báo lỗi chi tiết */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '11px 14px',
              borderRadius: 12,
              fontSize: '0.86rem',
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

        {/* FORM ĐĂNG NHẬP */}
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
                    border: 'none',
                    color: '#6b7280',
                    padding: 4,
                    cursor: 'pointer',
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
              style={{
                width: '100%',
                height: 46,
                fontSize: '0.96rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <LogIn size={18} />
              <span>{submitting ? 'Đang xác thực tài khoản...' : 'Đăng nhập'}</span>
            </button>
          </form>
        ) : (
          /* FORM ĐĂNG KÝ THÀNH VIÊN MỚI */
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
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={regForm.matKhau}
                  onChange={(e) => setRegForm({ ...regForm, matKhau: e.target.value })}
                  style={{ height: 42 }}
                />
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
              style={{
                width: '100%',
                height: 46,
                fontSize: '0.96rem',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <UserPlus size={18} />
              <span>{submitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}