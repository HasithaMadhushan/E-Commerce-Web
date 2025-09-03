import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import OrderTracking from '../components/OrderTracking'

const formatDate = (iso) => {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

const Orders = () => {
  const { backendUrl, token, currency, navigate, authInitialized } = useContext(ShopContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const loadOrders = async () => {
    if (!token) {
      navigate('/login?next=/orders')
      return
    }
      
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/order/user-orders`, { headers: { token } })
      if (res.data.success) {
        setOrders(res.data.orders || [])
      } else {
        console.log('Failed to load orders')
      }
    } catch (error) {
      console.log('Error loading orders:', error.message)
      // Loading errors should be handled with inline error states
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (!authInitialized) return
    
    if (token) {
      loadOrders()
    } else {
      navigate('/login?next=/orders')
    }
  }, [token, navigate, authInitialized])

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

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true
    return order.status === filterStatus
  })

  const isEmpty = !filteredOrders || filteredOrders.length === 0

  return (
    <div className="py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl font-semibold uppercase">My Orders</h1>
        <span className="h-[2px] w-16 bg-gray-900" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'pending', label: 'Pending' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'processing', label: 'Processing' },
          { key: 'shipped', label: 'Shipped' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterStatus(filter.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filterStatus === filter.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading orders...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && isEmpty && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filterStatus === 'all' 
              ? "You haven't placed any orders yet. Start shopping to see your orders here."
              : `You don't have any ${filterStatus} orders.`
            }
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => navigate('/collection')}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800"
            >
              Start Shopping
            </button>
          )}
        </div>
      )}

      {/* Orders List */}
      {!loading && !isEmpty && (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border rounded-lg p-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Order #{order.orderNumber || order._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt || order.date)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(order.paymentStatus || (order.payment ? 'paid' : 'pending'))}`}>
                      {order.paymentStatus || (order.payment ? 'paid' : 'pending')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedOrderId(order._id)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"
                  >
                    Track Order
                  </button>
                  <button
                    onClick={loadOrders}
                    className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 ${item.image ? 'hidden' : 'flex'}`}
                      style={{ display: item.image ? 'none' : 'flex' }}
                    >
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>{currency}{item.price} • Qty: {item.quantity}</div>
                        <div>Size: {item.size}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium text-gray-900">
                        {currency}{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="text-sm text-gray-600">
                    Payment Method: {order.paymentMethod}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    Total: {currency}{order.total || order.amount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Tracking Modal */}
      {selectedOrderId && (
        <OrderTracking
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

export default Orders
