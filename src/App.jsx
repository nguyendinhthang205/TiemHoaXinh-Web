import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useInRouterContext,
} from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import CustomerChatWidget from './components/CustomerChatWidget';
import WishlistDrawer from './components/WishlistDrawer';
import HomePage from './pages/HomePage';

const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function RouteLoadingFallback() {
  return (
    <div className="container" style={{ marginTop: 28, marginBottom: 48 }}>
      <div className="panel" style={{ padding: 36, textAlign: 'center', color: '#6b7280' }}>
        <div
          className="thx-skeleton"
          style={{ height: 24, width: '36%', margin: '0 auto 14px', borderRadius: 10 }}
        />
        <div
          className="thx-skeleton"
          style={{ height: 140, width: '100%', borderRadius: 16 }}
        />
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.toLowerCase().startsWith('/admin');
  const existingCtx = useApp();

  const content = (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-cream)',
      }}
    >
      <ScrollToTop />
      <Navbar />
      <WishlistDrawer />
      <CustomerChatWidget />

      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
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
          </Suspense>
        </ErrorBoundary>
      </main>

      {isAdminRoute ? (
        <footer
          style={{
            background: '#ffffff',
            borderTop: '1px solid #f1e6ea',
            padding: '14px 20px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#6b7280',
          }}
        >
          <strong style={{ color: '#9f1239' }}>Tiệm Hoa Xinh Admin</strong> &bull; Hệ Thống
          Quản Trị &amp; Dự Báo Nhập Hàng AI &bull; 120 Lê Duẩn, Hải Châu, Đà Nẵng
        </footer>
      ) : (
        <Footer />
      )}
    </div>
  );

  if (!existingCtx) {
    return <AppProvider>{content}</AppProvider>;
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
