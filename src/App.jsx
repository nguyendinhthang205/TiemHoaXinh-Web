import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useInRouterContext,
} from 'react-router-dom';
import * as AppCtxModule from './context/AppContext';
import Navbar from './components/Navbar';
import CustomerChatWidget from './components/CustomerChatWidget';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminDashboard from './pages/admin/AdminDashboard';

function AppLayout() {
  const existingCtx =
    typeof AppCtxModule.useApp === 'function' ? AppCtxModule.useApp() : null;

  const ProviderComponent =
    AppCtxModule.AppProvider ||
    AppCtxModule.AppContextProvider ||
    AppCtxModule.default;

  const content = (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fffafb',
      }}
    >
      <Navbar />
      <CustomerChatWidget />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer
        style={{
          background: '#ffffff',
          borderTop: '1px solid #f3f4f6',
          padding: '20px 0',
          marginTop: 40,
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#6b7280',
        }}
      >
        <div className="container">
          <strong style={{ color: '#be123c' }}>Tiệm Hoa Xinh</strong> &mdash; Hoa Tươi Nghệ
          Thuật &amp; Hệ Thống Dự Báo Nhập Hàng AI &bull; 120 Lê Duẩn, Hải Châu, Đà Nẵng
        </div>
      </footer>
    </div>
  );

  if (!existingCtx && ProviderComponent) {
    return <ProviderComponent>{content}</ProviderComponent>;
  }
  return content;
}

export default function App() {
  const isInsideRouter = useInRouterContext();
  if (isInsideRouter) {
    return <AppLayout />;
  }
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}