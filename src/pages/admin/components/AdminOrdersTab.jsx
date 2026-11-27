import React from 'react';
import {
  Search,
  Trash2,
  Truck,
  Store,
  Check,
  CreditCard,
  Eye,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  Gift,
  Printer,
} from 'lucide-react';
import { formatVND, getFlowerImage } from '../../../services/api';
import {
  PAGE_SIZE,
  extractRawStatus,
  normalizeAdminOrderStatus,
  formatDateOnly,
  formatDateTime,
} from '../adminUtils';

export default function AdminOrdersTab({
  activeOrders,
  filteredOrders,
  paginatedOrders,
  orderMetaMap,
  statusFilter,
  setStatusFilter,
  orderSearch,
  setOrderSearch,
  inProgressCount,
  unpaidActiveCount,
  selectedOrderIds,
  isAllPageSelected,
  toggleSelectPageOrders,
  toggleSelectOneOrder,
  deletingOrders,
  onRequestBulkDelete,
  onRequestDeleteSingle,
  oldDummyOrderIds,
  loadingOrders,
  openMenuOrderId,
  setOpenMenuOrderId,
  onChangeOrderStatus,
  onConfirmPayment,
  onOpenOrderDetail,
  loadingDetailId,
  safePage,
  totalPages,
  startIndex,
  setCurrentPage,
  selectedOrder,
  setSelectedOrder,
}) {
  return (
    <>
      <div className="panel" style={{ padding: 22 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Danh Sách Đơn Hàng Khách Đặt</h2>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                disabled={deletingOrders}
                onClick={() =>
                  onRequestBulkDelete(
                    selectedOrderIds,
                    `${selectedOrderIds.length} đơn hàng đang chọn`
                  )
                }
                className="btn btn-danger btn-sm"
              >
                <Trash2 size={14} />
                <span>
                  {deletingOrders
                    ? 'Đang xóa...'
                    : `Xóa (${selectedOrderIds.length}) đơn đã chọn`}
                </span>
              </button>
            )}

            {oldDummyOrderIds.length > 0 && (
              <button
                type="button"
                disabled={deletingOrders}
                onClick={() =>
                  onRequestBulkDelete(
                    oldDummyOrderIds,
                    `toàn bộ ${oldDummyOrderIds.length} đơn từ tháng trước`
                  )
                }
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#fecaca' }}
              >
                <Trash2 size={14} />
                <span>Dọn {oldDummyOrderIds.length} đơn tháng cũ</span>
              </button>
            )}

            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search
                size={15}
                color="#9ca3af"
                style={{ position: 'absolute', left: 11, top: 11 }}
              />
              <input
                type="text"
                className="form-control thx-admin-filter-input"
                placeholder="Tìm mã đơn, tên khách, SĐT..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ paddingLeft: 34, height: 38, fontSize: '0.86rem' }}
              />
            </div>

            <select
              className="form-control thx-admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: 38, fontSize: '0.86rem' }}
            >
              <option value="ALL">Tất cả trạng thái ({activeOrders.length})</option>
              <option value="IN_PROGRESS">Đang xử lý ({inProgressCount})</option>
              <option value="UNPAID">Chờ thu tiền ({unpaidActiveCount})</option>
              <option value="Pending">Chờ xác nhận</option>
              <option value="Confirmed">Đang cắm hoa</option>
              <option value="Shipping">Shipper đang giao / Sẵn sàng</option>
              <option value="Completed">Đã giao / Đã nhận hoa</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.89rem' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid #f3f4f6',
                  textAlign: 'left',
                  color: '#6b7280',
                  fontSize: '0.8rem',
                }}
              >
                <th style={{ padding: '12px 8px', width: 32 }}>
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả đơn trên trang"
                    checked={isAllPageSelected}
                    onChange={toggleSelectPageOrders}
                    style={{ cursor: 'pointer', width: 15, height: 15 }}
                  />
                </th>
                <th className="thx-nowrap" style={{ padding: '12px 8px' }}>Mã Đơn</th>
                <th style={{ padding: '12px 10px' }}>Khách nhận &amp; Hình thức</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Ngày đặt / Giao</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Tổng tiền</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Thanh toán</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px' }}>Trạng thái</th>
                <th className="thx-nowrap" style={{ padding: '12px 10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>
                    {loadingOrders
                      ? 'Đang tải danh sách đơn hàng...'
                      : 'Không tìm thấy đơn hàng nào phù hợp với điều kiện lọc.'}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const meta = orderMetaMap[order.maDonHang] || {};
                  const address =
                    order.diaChiGiao || order.diaChiGiaoHang || order.diaChi || '';
                  const isPickup =
                    meta.deliveryMethod === 'pickup' ||
                    address.toLowerCase().includes('tới cửa hàng lấy') ||
                    String(order.ghiChu || '').toLowerCase().includes('tới tiệm lấy');

                  const st = normalizeAdminOrderStatus(
                    extractRawStatus(order, meta),
                    isPickup
                  );

                  const rawPayment =
                    meta.paymentMethod ||
                    order.phuongThucThanhToan ||
                    order.hinhThucThanhToan ||
                    'VietQR';
                  const isVietQR = rawPayment.toLowerCase().includes('qr');
                  const isPaid =
                    meta.isPaid === true ||
                    order.daThanhToan === true ||
                    String(order.trangThaiThanhToan || '')
                      .toLowerCase()
                      .includes('đã thanh toán') ||
                    st.code === 'Completed';

                  const totalMoney =
                    meta.grandTotal ?? order.tongThanhToan ?? order.tongTien ?? 0;
                  const isChecked = selectedOrderIds.includes(order.maDonHang);
                  const isMenuOpen = openMenuOrderId === order.maDonHang;

                  return (
                    <tr
                      key={order.maDonHang}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        verticalAlign: 'middle',
                        background: isChecked ? '#fff1f2' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <input
                          type="checkbox"
                          aria-label={`Chọn đơn #${order.maDonHang}`}
                          checked={isChecked}
                          onChange={() => toggleSelectOneOrder(order.maDonHang)}
                          style={{ cursor: 'pointer', width: 15, height: 15 }}
                        />
                      </td>

                      <td className="thx-nowrap tabular-nums" style={{ padding: '12px 8px', fontWeight: 700 }}>
                        #{order.maDonHang}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#181316' }}>
                          {order.tenNguoiNhan || 'Khách hàng'}
                          {order.sdtNguoiNhan && (
                            <a
                              href={`tel:${order.sdtNguoiNhan}`}
                              style={{
                                color: '#4b5563',
                                fontWeight: 500,
                                marginLeft: 5,
                              }}
                            >
                              ({order.sdtNguoiNhan})
                            </a>
                          )}
                        </div>
                        <div
                          className="thx-nowrap"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.76rem',
                            marginTop: 3,
                            color: isPickup ? '#15803d' : '#be123c',
                            fontWeight: 600,
                          }}
                        >
                          {isPickup ? <Store size={12} /> : <Truck size={12} />}
                          <span>
                            {isPickup
                              ? 'Tới tiệm lấy (0 đ ship)'
                              : meta.distanceKm
                              ? `Ship tận nơi (${meta.distanceKm} km)`
                              : 'Ship tận nơi'}
                          </span>
                        </div>
                      </td>

                      <td
                        className="thx-nowrap"
                        style={{ padding: '12px 10px', fontSize: '0.82rem', color: '#4b5563' }}
                      >
                        <div>Đặt: {formatDateOnly(order.ngayDat)}</div>
                        {order.ngayGiao && (
                          <div style={{ fontWeight: 700, color: '#181316', marginTop: 2 }}>
                            Giao: {formatDateOnly(order.ngayGiao)}
                          </div>
                        )}
                      </td>

                      <td
                        className="thx-nowrap tabular-nums"
                        style={{ padding: '12px 10px', fontWeight: 800, color: '#181316' }}
                      >
                        {formatVND(totalMoney)}
                      </td>

                      <td className="thx-nowrap" style={{ padding: '12px 10px' }}>
                        <div style={{ fontSize: '0.79rem', fontWeight: 600, color: '#374151' }}>
                          {isVietQR ? 'Online (VietQR)' : 'Tiền mặt (COD)'}
                        </div>
                        <span
                          className="thx-nowrap"
                          style={{
                            display: 'inline-block',
                            marginTop: 3,
                            padding: '2px 9px',
                            borderRadius: 999,
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            background: isPaid ? '#dcfce7' : '#fef3c7',
                            color: isPaid ? '#166534' : '#92400e',
                          }}
                        >
                          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </td>

                      <td className="thx-nowrap" style={{ padding: '12px 10px' }}>
                        <select
                          aria-label={`Trạng thái đơn #${order.maDonHang}`}
                          value={st.code}
                          onChange={(e) =>
                            onChangeOrderStatus(order, e.target.value, isPickup, true)
                          }
                          style={{
                            background: st.bg,
                            color: st.color,
                            border: `1.5px solid ${st.border}`,
                            borderRadius: 999,
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            minWidth: 168,
                          }}
                        >
                          <option value="Pending" disabled={st.step > 0}>
                            Chờ xác nhận
                          </option>
                          <option value="Confirmed" disabled={st.step > 1}>
                            Đang cắm hoa
                          </option>
                          <option value="Shipping" disabled={st.step > 2}>
                            {isPickup ? 'Sẵn sàng tại tiệm' : 'Shipper đang giao'}
                          </option>
                          <option value="Completed">
                            {isPickup ? 'Khách đã nhận hoa' : 'Đã giao thành công'}
                          </option>
                          <option value="Cancelled">Đã hủy</option>
                        </select>
                      </td>

                      <td className="thx-nowrap" style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div
                          data-order-menu-root="true"
                          style={{
                            display: 'inline-flex',
                            gap: 6,
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            position: 'relative',
                          }}
                        >
                          {st.code === 'Pending' && (
                            <button
                              type="button"
                              onClick={() =>
                                onChangeOrderStatus(order, 'Confirmed', isPickup, false)
                              }
                              className="btn btn-primary btn-sm"
                            >
                              Xác nhận
                            </button>
                          )}

                          {st.code === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() =>
                                onChangeOrderStatus(order, 'Shipping', isPickup, false)
                              }
                              className="btn btn-primary btn-sm"
                            >
                              {isPickup ? 'Sẵn sàng lấy' : 'Giao Shipper'}
                            </button>
                          )}

                          {st.code === 'Shipping' && (
                            <button
                              type="button"
                              onClick={() =>
                                onChangeOrderStatus(order, 'Completed', isPickup, true)
                              }
                              className="btn btn-sage btn-sm"
                            >
                              <Check size={14} /> Hoàn tất
                            </button>
                          )}

                          {st.code === 'Completed' && !isPaid && (
                            <button
                              type="button"
                              onClick={() => onConfirmPayment(order)}
                              className="btn btn-outline btn-sm"
                            >
                              <CreditCard size={14} /> Thu tiền
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={loadingDetailId === order.maDonHang}
                            onClick={() => onOpenOrderDetail(order)}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye size={14} />
                            <span>Chi tiết</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuOrderId(isMenuOpen ? null : order.maDonHang)
                            }
                            aria-label="Thao tác khác"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '6px 8px' }}
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {isMenuOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: 4,
                                minWidth: 170,
                                background: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 12,
                                boxShadow: '0 12px 28px rgba(24, 19, 22, 0.14)',
                                padding: 6,
                                zIndex: 50,
                                textAlign: 'left',
                              }}
                            >
                              {!isPaid && st.code !== 'Cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => onConfirmPayment(order)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: 'transparent',
                                    borderRadius: 8,
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: '#166534',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                  }}
                                >
                                  <CreditCard size={14} />
                                  <span>Xác nhận thu tiền</span>
                                </button>
                              )}

                              {st.code !== 'Cancelled' && st.code !== 'Completed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChangeOrderStatus(order, 'Cancelled', isPickup, true)
                                  }
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: 'transparent',
                                    borderRadius: 8,
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: '#4b5563',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                  }}
                                >
                                  <X size={14} />
                                  <span>Hủy đơn hàng</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={deletingOrders}
                                onClick={() => onRequestDeleteSingle(order)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  background: 'transparent',
                                  borderRadius: 8,
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  color: '#dc2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 7,
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Xóa vĩnh viễn</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid #f3f4f6',
              fontSize: '0.85rem',
              color: '#6b7280',
            }}
          >
            <div>
              Hiển thị <b>{startIndex + 1}</b>–
              <b>{Math.min(startIndex + PAGE_SIZE, filteredOrders.length)}</b> trên tổng{' '}
              <b>{filteredOrders.length}</b> đơn hàng
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="btn btn-outline btn-sm"
              >
                <ChevronLeft size={15} /> Trước
              </button>
              <span style={{ fontWeight: 600, color: '#181316', padding: '0 6px' }}>
                Trang {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="btn btn-outline btn-sm"
              >
                Sau <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi tiết đơn hàng + In phiếu giao */}
      {selectedOrder && (() => {
        const meta = selectedOrder._meta || {};
        const address =
          selectedOrder.diaChiGiao || selectedOrder.diaChiGiaoHang || selectedOrder.diaChi || '';
        const isPickup =
          meta.deliveryMethod === 'pickup' ||
          address.toLowerCase().includes('tới cửa hàng lấy') ||
          String(selectedOrder.ghiChu || '').toLowerCase().includes('tới tiệm lấy');

        const st = normalizeAdminOrderStatus(
          extractRawStatus(selectedOrder, meta),
          isPickup
        );

        const rawPayment =
          meta.paymentMethod ||
          selectedOrder.phuongThucThanhToan ||
          selectedOrder.hinhThucThanhToan ||
          'VietQR';
        const isVietQR = rawPayment.toLowerCase().includes('qr');
        const isPaid =
          meta.isPaid === true ||
          selectedOrder.daThanhToan === true ||
          String(selectedOrder.trangThaiThanhToan || '')
            .toLowerCase()
            .includes('đã thanh toán') ||
          st.code === 'Completed';

        const itemsSubtotal = (selectedOrder._items || []).reduce(
          (sum, it) => sum + (it._lineTotal || 0),
          0
        );
        const grandTotal =
          meta.grandTotal ?? selectedOrder.tongThanhToan ?? selectedOrder.tongTien ?? itemsSubtotal;
        const discountAmount = Number(meta.discountAmount || 0);
        const shippingFee =
          typeof meta.shippingFee === 'number'
            ? meta.shippingFee
            : Math.max(0, grandTotal + discountAmount - itemsSubtotal);

        return (
          <div className="modal-backdrop">
            <div
              className="modal-box"
              style={{
                maxWidth: 650,
                width: '94%',
                padding: 28,
                position: 'relative',
              }}
            >
              <div
                className="thx-no-print"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline btn-sm"
                  title="In phiếu giao hoa"
                >
                  <Printer size={14} />
                  <span>In phiếu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  title="Đóng"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#f3f4f6',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 6,
                  paddingRight: 130,
                }}
              >
                <h2 style={{ fontSize: '1.45rem' }}>Chi Tiết Đơn Hàng #{selectedOrder.maDonHang}</h2>
                <span
                  style={{
                    background: st.bg,
                    color: st.color,
                    border: `1px solid ${st.border}`,
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {st.label}
                </span>
              </div>

              {selectedOrder.ngayDat && (
                <div style={{ fontSize: '0.84rem', color: '#6b7280', marginBottom: 16 }}>
                  Thời gian đặt đơn: <b>{formatDateTime(selectedOrder.ngayDat)}</b>
                </div>
              )}

              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: '0.9rem',
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <User size={15} color="#e11d48" />
                  <span>
                    Người nhận: <b>{selectedOrder.tenNguoiNhan || 'Khách hàng'}</b>
                  </span>
                  {selectedOrder.sdtNguoiNhan && (
                    <a
                      href={`tel:${selectedOrder.sdtNguoiNhan}`}
                      style={{
                        color: '#be123c',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Phone size={14} /> ({selectedOrder.sdtNguoiNhan})
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isPickup ? <Store size={15} color="#16a34a" /> : <Truck size={15} color="#e11d48" />}
                  <span>
                    Hình thức nhận:{' '}
                    <b style={{ color: isPickup ? '#15803d' : '#be123c' }}>
                      {isPickup
                        ? 'Tới tiệm lấy trực tiếp (0 đ ship)'
                        : meta.distanceKm
                        ? `Ship tận nơi (${meta.distanceKm} km)`
                        : 'Ship tận nơi'}
                    </b>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <MapPin size={15} color="#e11d48" style={{ marginTop: 3, flexShrink: 0 }} />
                  <span>
                    Địa chỉ: <b>{address || 'Chưa cập nhật'}</b>
                  </span>
                </div>

                {(selectedOrder.ngayGiao || selectedOrder.khungGioGiao) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={15} color="#e11d48" />
                    <span>
                      Thời gian giao:{' '}
                      <b>
                        {formatDateOnly(selectedOrder.ngayGiao)}
                        {selectedOrder.khungGioGiao ? ` • ${selectedOrder.khungGioGiao}` : ''}
                      </b>
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={15} color="#e11d48" />
                  <span>
                    Thanh toán:{' '}
                    <b>{isVietQR ? 'Chuyển khoản Online (VietQR)' : 'Tiền mặt khi nhận hàng (COD)'}</b>{' '}
                    —{' '}
                    <span style={{ color: isPaid ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </span>
                </div>

                {selectedOrder.ghiChu && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Gift size={15} color="#e11d48" style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>
                      Lời chúc &amp; ghi chú: <i>“{selectedOrder.ghiChu}”</i>
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: 10 }}>
                  Danh sách bó hoa ({selectedOrder._items?.length || 0} mẫu)
                </div>

                {selectedOrder._items && selectedOrder._items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedOrder._items.map((it, idx) => (
                      <div
                        key={it.maSanPham ?? idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: 10,
                          borderRadius: 12,
                          border: '1px solid #f3f4f6',
                          background: '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={getFlowerImage(it)}
                            alt={it.tenSanPham}
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 10,
                              objectFit: 'cover',
                              border: '1px solid #f3f4f6',
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                              {it.tenSanPham}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>
                              Đơn giá: <b>{formatVND(it._unitPrice)}</b> &times;{' '}
                              <b>{it.soLuong}</b> bó
                            </div>
                          </div>
                        </div>
                        <div className="tabular-nums" style={{ fontWeight: 700, color: '#181316', fontSize: '0.96rem' }}>
                          {formatVND(it._lineTotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '0.88rem' }}>
                    Không có dữ liệu chi tiết sản phẩm cho đơn hàng này.
                  </div>
                )}
              </div>

              <div
                style={{
                  borderTop: '1px dashed #e5e7eb',
                  paddingTop: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: '0.92rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Tạm tính tiền hoa:</span>
                  <b className="tabular-nums">{formatVND(itemsSubtotal)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Phí vận chuyển:</span>
                  <b className="tabular-nums">
                    {shippingFee === 0 ? 'Miễn phí (0 đ)' : formatVND(shippingFee)}
                  </b>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                    <span>Ưu đãi {meta.voucherCode ? `(${meta.voucherCode})` : ''}:</span>
                    <b className="tabular-nums">-{formatVND(discountAmount)}</b>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    paddingTop: 8,
                    borderTop: '1px solid #f3f4f6',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                  }}
                >
                  <span>Tổng thanh toán:</span>
                  <span className="tabular-nums" style={{ color: '#e11d48' }}>
                    {formatVND(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
