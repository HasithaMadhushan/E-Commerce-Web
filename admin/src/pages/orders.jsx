import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl, currency } from '../config'
import { assets } from '../assets/assets'
import * as XLSX from 'xlsx'

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: '',
    note: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false
  })
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const fetchAllOrders = useCallback(async () => {
    if (!token) {
      return null
    }
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        sort: sortBy,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })

      if (search.trim()) params.append('search', search.trim())
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (paymentFilter !== 'all') {
        params.append('paymentStatus', paymentFilter === 'paid' ? 'paid' : 'pending')
      }
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await axios.get(`${backendUrl}/api/order/admin/list?${params.toString()}`, { headers: { token } })

      if (response.data.success) {
        setOrders(response.data.orders)
        setPagination({
          totalPages: response.data.pagination?.totalPages || 1,
          totalOrders: response.data.pagination?.totalOrders || response.data.orders.length,
          hasNext: response.data.pagination?.hasNext || false,
          hasPrev: response.data.pagination?.hasPrev || false
        })
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [token, sortBy, statusFilter, paymentFilter, dateFrom, dateTo, search, currentPage, itemsPerPage])

  const statusHandler = async (event, orderId) => {
    try {
      const newStatus = event.target.value
      const currentOrder = orders.find(o => o._id === orderId)

      // Status workflow validation
      if (!isValidStatusTransition(currentOrder.status, newStatus)) {
        toast.error(`Cannot change status from ${currentOrder.status} to ${newStatus}`)
        return
      }

      const response = await axios.put(
        backendUrl + '/api/order/admin/status',
        {
          orderId,
          status: newStatus,
          note: `Status updated to ${newStatus}`,
          ...trackingForm
        },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Order status updated successfully')
        await fetchAllOrders()
      } else {
        toast.error(response.data.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const isValidStatusTransition = (currentStatus, newStatus) => {
    const statusFlow = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['refunded'],
      'cancelled': [],
      'refunded': []
    }

    return statusFlow[currentStatus]?.includes(newStatus) || currentStatus === newStatus
  }

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedOrders.length === 0) {
      toast.error('Please select orders and status')
      return
    }

    try {
      const response = await axios.put(
        backendUrl + '/api/order/admin/bulk-status',
        {
          orderIds: selectedOrders,
          status: bulkStatus,
          note: `Bulk status update to ${bulkStatus}`
        },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success(response.data.message)
        setSelectedOrders([])
        setShowBulkUpdate(false)
        setBulkStatus('')
        await fetchAllOrders()
      } else {
        toast.error(response.data.message || 'Failed to update orders')
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update orders')
    }
  }

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const selectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(order => order._id))
    }
  }

  const handleOrderDetails = (order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
    setTrackingForm({
      trackingNumber: order.shipping?.trackingNumber || '',
      carrier: order.shipping?.carrier || '',
      estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
      note: ''
    })
  }

  const updateOrderTracking = async (orderId, trackingData) => {
    if (!orderId) {
      // Update from modal
      if (!selectedOrder) return

      try {
        const response = await axios.put(
          backendUrl + '/api/order/admin/status',
          {
            orderId: selectedOrder._id,
            status: selectedOrder.status,
            trackingNumber: trackingForm.trackingNumber,
            carrier: trackingForm.carrier,
            estimatedDelivery: trackingForm.estimatedDelivery,
            note: trackingForm.note || 'Tracking information updated'
          },
          { headers: { token } }
        )

        if (response.data.success) {
          toast.success('Tracking information updated successfully')
          setShowOrderDetails(false)
          await fetchAllOrders()
        } else {
          toast.error(response.data.message || 'Failed to update tracking')
        }
      } catch (error) {
        console.error('Error updating tracking:', error)
        toast.error('Failed to update tracking information')
      }
    } else {
      // Quick update from order list
      try {
        const response = await axios.put(
          backendUrl + '/api/order/admin/status',
          {
            orderId,
            ...trackingData,
            note: 'Tracking number updated'
          },
          { headers: { token } }
        )

        if (response.data.success) {
          toast.success('Tracking number updated')
          await fetchAllOrders()
        } else {
          toast.error(response.data.message || 'Failed to update tracking')
        }
      } catch (error) {
        console.error('Error updating tracking:', error)
        toast.error('Failed to update tracking number')
      }
    }
  }


  useEffect(() => {
    fetchAllOrders()
  }, [fetchAllOrders])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== undefined) {
        fetchAllOrders()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, fetchAllOrders])

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'confirmed': return 'text-blue-600 bg-blue-100'
      case 'processing': return 'text-purple-600 bg-purple-100'
      case 'shipped': return 'text-indigo-600 bg-indigo-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'refunded': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'refunded': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const exportToExcel = () => {
    try {
      const rows = orders.map(o => ({
        OrderNumber: o.orderNumber || o._id.slice(-6),
        OrderID: o._id,
        Date: new Date(o.createdAt || o.date).toLocaleString(),
        PaymentMethod: o.paymentMethod,
        PaymentStatus: o.paymentStatus || (o.payment ? 'paid' : 'pending'),
        Status: o.status,
        Amount: o.total || o.amount,
        Customer: `${o.address?.firstName || ''} ${o.address?.lastName || ''}`.trim(),
        Phone: o.address?.phone || '',
        Email: o.address?.email || '',
        Address: `${o.address?.street || ''}, ${o.address?.city || ''}, ${o.address?.state || ''}, ${o.address?.country || ''}, ${o.address?.zipcode || ''}`,
        TrackingNumber: o.shipping?.trackingNumber || '',
        Carrier: o.shipping?.carrier || '',
        Items: (o.items || []).map(i => `${i.name} x${i.quantity} [${i.size || ''}]`).join('; ')
      }))
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
      XLSX.writeFile(workbook, `orders_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Orders exported successfully')
    } catch (e) {
      console.error('Export error:', e)
      toast.error('Failed to export Excel')
    }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage customer orders and tracking</p>
        </div>
        <div className="flex items-center gap-4">
          {selectedOrders.length > 0 && (
            <button
              onClick={() => setShowBulkUpdate(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Bulk Update ({selectedOrders.length})
            </button>
          )}
          <div className="text-sm text-gray-500">
            Total Orders: {pagination.totalOrders} | Page {currentPage} of {pagination.totalPages}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Highest Amount</option>
              <option value="amount_low">Lowest Amount</option>
              <option value="status">By Status</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <button
              onClick={exportToExcel}
              className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">No orders match your current filters</p>
          </div>
        ) : (
          <div>
            {/* Bulk Selection Header */}
            {orders.length > 0 && (
              <div className="bg-gray-50 border-b px-6 py-3 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={selectAllOrders}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {selectedOrders.length > 0
                    ? `${selectedOrders.length} of ${orders.length} selected`
                    : 'Select all orders'
                  }
                </span>
              </div>
            )}

            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order._id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => toggleOrderSelection(order._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Order #{order.orderNumber || order._id.slice(-6)}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus || (order.payment ? 'paid' : 'pending'))}`}>
                            {order.paymentStatus || (order.payment ? 'paid' : 'pending')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Customer:</span> {order.address?.firstName} {order.address?.lastName}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(order.createdAt || order.date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> {currency}{order.total || order.amount}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderDetails(order)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                      <h4 className="font-medium text-gray-900 mb-2">Items ({order.items?.length || 0})</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <img
                              src={item.image || assets.parcel_icon}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-gray-500">
                                Qty: {item.quantity} • Size: {item.size} • {currency}{item.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Update Status</h4>
                      <select
                        onChange={(event) => statusHandler(event, order._id)}
                        value={order.status}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending" disabled={!isValidStatusTransition(order.status, 'pending')}>
                          Pending
                        </option>
                        <option value="confirmed" disabled={!isValidStatusTransition(order.status, 'confirmed')}>
                          Confirmed
                        </option>
                        <option value="processing" disabled={!isValidStatusTransition(order.status, 'processing')}>
                          Processing
                        </option>
                        <option value="shipped" disabled={!isValidStatusTransition(order.status, 'shipped')}>
                          Shipped
                        </option>
                        <option value="delivered" disabled={!isValidStatusTransition(order.status, 'delivered')}>
                          Delivered
                        </option>
                        <option value="cancelled" disabled={!isValidStatusTransition(order.status, 'cancelled')}>
                          Cancelled
                        </option>
                        <option value="refunded" disabled={!isValidStatusTransition(order.status, 'refunded')}>
                          Refunded
                        </option>
                      </select>

                      {/* Quick Tracking Input */}
                      {order.status === 'shipped' && (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            placeholder="Enter tracking number"
                            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onBlur={(e) => {
                              if (e.target.value) {
                                updateOrderTracking(order._id, { trackingNumber: e.target.value })
                              }
                            }}
                          />
                        </div>
                      )}

                      {order.shipping?.trackingNumber && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Tracking:</span> {order.shipping.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalOrders)} of {pagination.totalOrders} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {(() => {
                const pages = []
                const startPage = Math.max(1, currentPage - 2)
                const endPage = Math.min(pagination.totalPages, currentPage + 2)

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-3 py-1 border rounded-md text-sm ${currentPage === i
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {i}
                    </button>
                  )
                }
                return pages
              })()}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  Order Details - #{selectedOrder.orderNumber || selectedOrder._id.slice(-6)}
                </h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedOrder.address?.firstName} {selectedOrder.address?.lastName}</div>
                    <div><span className="font-medium">Email:</span> {selectedOrder.address?.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedOrder.address?.phone}</div>
                    <div>
                      <span className="font-medium">Address:</span><br />
                      {selectedOrder.address?.street}<br />
                      {selectedOrder.address?.city}, {selectedOrder.address?.state}<br />
                      {selectedOrder.address?.country} {selectedOrder.address?.zipcode}
                    </div>
                  </div>
                </div>

                {/* Tracking Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Tracking Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                      <input
                        type="text"
                        value={trackingForm.trackingNumber}
                        onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                      <input
                        type="text"
                        value={trackingForm.carrier}
                        onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., FedEx, UPS, DHL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                      <input
                        type="date"
                        value={trackingForm.estimatedDelivery}
                        onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                      <textarea
                        value={trackingForm.note}
                        onChange={(e) => setTrackingForm({ ...trackingForm, note: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Add a note about this update..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <img
                        src={item.image || assets.parcel_icon}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <div className="text-sm text-gray-600">
                          Size: {item.size} • Quantity: {item.quantity} • Price: {currency}{item.price}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {currency}{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={updateOrderTracking}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Update Tracking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Update Modal */}
        {showBulkUpdate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Bulk Status Update</h2>
                <button
                  onClick={() => setShowBulkUpdate(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Update status for {selectedOrders.length} selected orders
                  </p>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select new status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800">
                        This action will update all selected orders. Status workflow rules will be applied.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBulkUpdate(false)}
                  className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkStatus}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Orders
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Update Modal */}
        {showBulkUpdate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Bulk Status Update</h2>
                <button
                  onClick={() => setShowBulkUpdate(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Update status for {selectedOrders.length} selected orders
                  </p>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select new status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800">
                        This action will update all selected orders. Status workflow rules will be applied.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBulkUpdate(false)}
                  className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkStatus}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Orders
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
