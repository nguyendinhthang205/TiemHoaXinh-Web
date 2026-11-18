import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { formatVND, getFlowerImage } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product, similarityScore }) {
  const { addToCart } = useApp();
  const id = product.maSanPham;
  const imgUrl = getFlowerImage(product);

  return (
    <div className="product-card">
      <Link to={`/product/${id}`} className="product-img-wrap">
        <img
          src={imgUrl}
          alt={product.tenSanPham}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80';
          }}
        />
        {product.tongMauSac && (
          <span
            className="badge badge-rose"
            style={{ position: 'absolute', top: 12, left: 12, backdropFilter: 'blur(6px)' }}
          >
            Tông {product.tongMauSac}
          </span>
        )}
        {typeof similarityScore === 'number' && (
          <span
            className="badge badge-sage"
            style={{ position: 'absolute', bottom: 12, left: 12 }}
          >
            <Sparkles size={13} /> Tương đồng {(similarityScore * 100).toFixed(0)}%
          </span>
        )}
      </Link>

      <div className="product-body">
        <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500 }}>
          {product.tenDanhMuc || 'Hoa Tươi Thiết Kế'}
        </div>

        <Link to={`/product/${id}`} className="product-title">
          {product.tenSanPham}
        </Link>

        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
          Còn lại: <b>{product.soLuongTon ?? 15}</b> bó
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: 12,
            gap: 8,
          }}
        >
          <div className="product-price" style={{ paddingTop: 0 }}>
            {formatVND(product.giaBan)}
          </div>
          <button
            type="button"
            onClick={() => addToCart(id, 1)}
            className="btn btn-primary btn-sm"
            disabled={product.soLuongTon === 0}
          >
            <ShoppingCart size={15} />
            <span>Thêm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
