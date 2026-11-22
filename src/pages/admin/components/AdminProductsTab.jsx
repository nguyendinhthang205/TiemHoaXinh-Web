import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Upload,
  Palette,
} from 'lucide-react';
import { formatVND, getFlowerImage } from '../../../services/api';
import {
  FLOWER_CATEGORIES,
  HOMEPAGE_NAV_CATEGORIES,
  STANDARD_COLOR_TONES,
} from '../adminUtils';

export default function AdminProductsTab({
  filteredProducts,
  productSearch,
  setProductSearch,
  openCreateProduct,
  openEditProduct,
  onRequestDeleteProduct,
  productModal,
  setProductModal,
  productForm,
  setProductForm,
  savingProduct,
  onSaveProduct,
  imageFileName,
  setImageFileName,
  fileInputRef,
  onSelectImageFile,
}) {
  const [stockFilter, setStockFilter] = useState('ALL');

  const displayProducts = filteredProducts.filter((sp) => {
    const stock = Number(sp.soLuongTon ?? 20);
    if (stockFilter === 'LOW') return stock <= 10;
    return true;
  });

  return (
    <>
      <div className="panel" style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
            Danh Mục Hoa Tươi ({displayProducts.length})
          </h2>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setStockFilter('ALL')}
                className={stockFilter === 'ALL' ? 'btn btn-dark btn-sm' : 'btn btn-outline btn-sm'}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('LOW')}
                className={stockFilter === 'LOW' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              >
                Tồn thấp (&le;10)
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="#9ca3af"
                style={{ position: 'absolute', left: 11, top: 11 }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Tìm tên hoa, tông màu..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ paddingLeft: 34, height: 36, fontSize: '0.86rem', width: 220 }}
              />
            </div>

            <button type="button" onClick={openCreateProduct} className="btn btn-primary btn-sm">
              <Plus size={16} /> Thêm mẫu hoa mới
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid #f3f4f6',
                  textAlign: 'left',
                  color: '#6b7280',
                  fontSize: '0.82rem',
                }}
              >
                <th style={{ padding: '12px 10px' }}>Hình ảnh</th>
                <th style={{ padding: '12px 10px' }}>Tên bó hoa</th>
                <th style={{ padding: '12px 10px' }}>Kiểu dáng</th>
                <th style={{ padding: '12px 10px' }}>Tông màu</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Giá bán</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Tồn kho</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayProducts.map((sp) => {
                const catName =
                  sp.tenDanhMuc ||
                  FLOWER_CATEGORIES.find((c) => c.id === sp.maDanhMuc)?.name ||
                  'Bó hoa tươi nghệ thuật';
                const stock = Number(sp.soLuongTon ?? 15);
                const isLow = stock <= 10;

                return (
                  <tr key={sp.maSanPham} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px' }}>
                      <img
                        src={getFlowerImage(sp)}
                        alt={sp.tenSanPham}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 10,
                          objectFit: 'cover',
                          border: '1px solid #f3f4f6',
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{sp.tenSanPham}</td>
                    <td style={{ padding: '10px', color: '#4b5563', fontSize: '0.84rem' }}>
                      {catName}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        className="thx-nowrap"
                        style={{
                          background: '#fff1f2',
                          color: '#be123c',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {sp.tongMauSac || 'Hồng Pastel'}
                      </span>
                    </td>
                    <td
                      className="thx-nowrap tabular-nums"
                      style={{ padding: '10px', fontWeight: 700, color: '#181316' }}
                    >
                      {formatVND(sp.giaBan)}
                    </td>
                    <td className="thx-nowrap tabular-nums" style={{ padding: '10px' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: stock === 0 ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                          color: stock === 0 ? '#b91c1c' : isLow ? '#92400e' : '#166534',
                        }}
                      >
                        {stock} bó
                      </span>
                    </td>
                    <td className="thx-nowrap" style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openEditProduct(sp)}
                          className="btn btn-outline btn-sm"
                        >
                          <Edit2 size={14} /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteProduct(sp)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#e11d48' }}
                          title="Xóa mẫu hoa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa sản phẩm */}
      {productModal && (
        <div className="modal-backdrop">
          <div
            className="modal-box"
            style={{
              maxWidth: 550,
              width: '94%',
              position: 'relative',
              padding: 26,
            }}
          >
            <button
              type="button"
              onClick={() => setProductModal(null)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
            <h2 style={{ marginBottom: 16 }}>
              {productModal.mode === 'create' ? 'Thêm Mẫu Hoa Mới' : 'Cập Nhật Mẫu Hoa'}
            </h2>

            <form onSubmit={onSaveProduct}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ImageIcon size={15} color="#e11d48" />
                  <span>Hình ảnh bó hoa (Tải trực tiếp từ thiết bị hoặc dán link ảnh)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onSelectImageFile}
                  style={{ display: 'none' }}
                />

                <div
                  style={{
                    border: '1.5px dashed #fecdd3',
                    background: '#fffafb',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  {productForm.hinhAnhChinh ? (
                    <img
                      src={productForm.hinhAnhChinh}
                      alt="Xem trước mẫu hoa"
                      style={{
                        width: 78,
                        height: 78,
                        borderRadius: 12,
                        objectFit: 'cover',
                        border: '1px solid #f3f4f6',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 78,
                        height: 78,
                        borderRadius: 12,
                        background: '#ffe4e6',
                        color: '#e11d48',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ImageIcon size={28} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-outline btn-sm"
                        style={{ background: '#ffffff' }}
                      >
                        <Upload size={14} />
                        <span>
                          {productForm.hinhAnhChinh ? 'Đổi ảnh từ thiết bị' : 'Chọn ảnh từ thiết bị'}
                        </span>
                      </button>

                      {productForm.hinhAnhChinh && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFileName('');
                            setProductForm((prev) => ({ ...prev, hinhAnhChinh: '' }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#e11d48', background: '#ffffff' }}
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      className="form-control"
                      placeholder="Hoặc dán URL hình ảnh (https://...)"
                      value={
                        productForm.hinhAnhChinh?.startsWith('data:image/')
                          ? ''
                          : productForm.hinhAnhChinh || ''
                      }
                      onChange={(e) => {
                        setImageFileName('');
                        setProductForm((prev) => ({ ...prev, hinhAnhChinh: e.target.value }));
                      }}
                      style={{ height: 34, fontSize: '0.8rem' }}
                    />

                    {imageFileName && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginTop: 5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Đã chọn: {imageFileName}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tên bó hoa</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ví dụ: Bó Hồng Kem Dâu Nghệ Thuật"
                  value={productForm.tenSanPham}
                  onChange={(e) =>
                    setProductForm({ ...productForm, tenSanPham: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kiểu thiết kế hoa</label>
                <select
                  className="form-control"
                  value={productForm.maDanhMuc}
                  onChange={(e) =>
                    setProductForm({ ...productForm, maDanhMuc: Number(e.target.value) })
                  }
                >
                  {FLOWER_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Hiển thị trên thanh danh mục Trang chủ (Chọn 1 hoặc nhiều)
                </label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {HOMEPAGE_NAV_CATEGORIES.map((navCat) => {
                    const currentList = Array.isArray(productForm.danhMucTrangChu)
                      ? productForm.danhMucTrangChu
                      : [];
                    const checked = currentList.includes(navCat.id);
                    return (
                      <button
                        key={navCat.id}
                        type="button"
                        onClick={() => {
                          const nextList = checked
                            ? currentList.filter((x) => x !== navCat.id)
                            : [...currentList, navCat.id];
                          setProductForm({ ...productForm, danhMucTrangChu: nextList });
                        }}
                        style={{
                          padding: '5px 11px',
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: checked ? '1.5px solid #e11d48' : '1px solid #e5e7eb',
                          background: checked ? '#fff1f2' : '#ffffff',
                          color: checked ? '#be123c' : '#4b5563',
                        }}
                      >
                        {checked ? '✓ ' : '+ '}
                        {navCat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min={1000}
                    step={1000}
                    value={productForm.giaBan}
                    onChange={(e) =>
                      setProductForm({ ...productForm, giaBan: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số lượng tồn</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min={0}
                    value={productForm.soLuongTon}
                    onChange={(e) =>
                      setProductForm({ ...productForm, soLuongTon: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Palette size={15} color="#e11d48" />
                  <span>Tông màu chủ đạo (6 màu chuẩn)</span>
                </label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {STANDARD_COLOR_TONES.map((tone) => {
                    const active = productForm.tongMauSac === tone;
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, tongMauSac: tone })}
                        style={{
                          fontSize: '0.78rem',
                          padding: '5px 12px',
                          borderRadius: 999,
                          border: active ? '1.5px solid #e11d48' : '1px solid #e5e7eb',
                          background: active ? '#fff1f2' : '#ffffff',
                          color: active ? '#be123c' : '#4b5563',
                          fontWeight: 600,
                        }}
                      >
                        {active ? '✓ ' : ''}
                        {tone}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả ngắn</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Mô tả ý nghĩa, loài hoa kết hợp và dịp tặng phù hợp..."
                  value={productForm.moTa}
                  onChange={(e) => setProductForm({ ...productForm, moTa: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={savingProduct}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {savingProduct ? 'Đang lưu & đồng bộ...' : 'Lưu thông tin hoa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
