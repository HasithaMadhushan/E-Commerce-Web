import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'

const OrderTracking = ({ orderId, onClose }) => {
  const { backendUrl, token, currency } = useContext(ShopContext)
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (orderId) {
      loadTracking()
    }
  }, [orderId])

  const loadTracking = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/order/tracking/${orderId}`, { headers: { token } })
      
      if (res.data.success) {
        setTracking(res.data.tracking)
      } else {
        console.error('Failed to load tracking information:', res.data.message)
      }
    } catch (error) {
      console.error('Error loading tracking:', error)
      // Loading errors should be handled with inline error states
    } finally {
      setLoading(false)
    }
  }

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusSteps = () => {
    const allSteps = [
      { key: 'pending', label: 'Order Placed', icon: '📝' },
      { key: 'confirmed', label: 'Confirmed', icon: '✅' },
      { key: 'processing', label: 'Processing', icon: '⚙️' },
      { key: 'shipped', label: 'Shipped', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '📦' }
    ]

    const currentStatusIndex = allSteps.findIndex(step => step.key === tracking?.status)
    
    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentStatusIndex,
      current: index === currentStatusIndex
    }))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading tracking information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tracking) {
    return null
  }

  const statusSteps = getStatusSteps()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Order Tracking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Order Header */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Order Number</h3>
              <p className="text-gray-600">{tracking.orderNumber}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Order Date</h3>
              <p className="text-gray-600">{formatDate(tracking.createdAt)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Total Amount</h3>
              <p className="text-gray-600">{currency}{tracking.total}</p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mb-8">
          <h3 className="font-medium text-gray-900 mb-4">Order Status</h3>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  step.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    step.completed ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={`absolute h-0.5 w-full mt-5 ${
                    step.completed ? 'bg-green-200' : 'bg-gray-200'
                  }`} style={{ 
                    left: `${(100 / statusSteps.length) * (index + 0.5)}%`,
                    width: `${100 / statusSteps.length}%`,
                    zIndex: -1
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Current Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Order Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(tracking.status)}`}>
                  {tracking.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(tracking.paymentStatus)}`}>
                  {tracking.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Delivery Information</h3>
            <div className="space-y-2 text-sm">
              {tracking.estimatedDelivery && (
                <div>
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <span className="ml-2 font-medium">{formatDate(tracking.estimatedDelivery)}</span>
                </div>
              )}
              {tracking.actualDelivery && (
                <div>
                  <span className="text-gray-600">Delivered On:</span>
                  <span className="ml-2 font-medium">{formatDate(tracking.actualDelivery)}</span>
                </div>
              )}
              {tracking.shipping?.trackingNumber && (
                <div>
                  <span className="text-gray-600">Tracking Number:</span>
                  <span className="ml-2 font-medium">{tracking.shipping.trackingNumber}</span>
                </div>
              )}
              {tracking.shipping?.carrier && (
                <div>
                  <span className="text-gray-600">Carrier:</span>
                  <span className="ml-2 font-medium">{tracking.shipping.carrier}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status History */}
        {tracking.statusHistory && tracking.statusHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Status History</h3>
            <div className="space-y-3">
              {tracking.statusHistory.slice().reverse().map((history, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(history.status).split(' ')[1]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{history.status}</span>
                      <span className="text-sm text-gray-500">{formatDate(history.timestamp)}</span>
                    </div>
                    {history.note && (
                      <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {tracking.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <div className="text-sm text-gray-600">
                    Size: {item.size} • Quantity: {item.quantity}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {currency}{item.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderTracking