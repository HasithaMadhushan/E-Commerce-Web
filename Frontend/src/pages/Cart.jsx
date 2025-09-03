import React, { useContext, useState } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { useLocation, useNavigate } from 'react-router-dom'

const Cart = () => {
  const { cartItems, removeFromCart, setItemQuantity, currency, cartSubtotal, delivery_fee, products, token, backendUrl } = useContext(ShopContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const entries = Object.entries(cartItems)
  const lineItems = entries.flatMap(([id, sizeMap]) => {
    const product = products.find(p => p._id === id)
    if (!product) return []
    return Object.entries(sizeMap).map(([size, qty]) => ({ product, size, qty }))
  })

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    if (!token) {
      toast.error('Please login to apply coupon')
      return
    }

    try {
      setCouponLoading(true)

      // Prepare items for coupon validation
      const items = lineItems.map(({ product, size, qty }) => ({
        productId: product._id,
        quantity: qty,
        price: product.price
      }))

      const res = await axios.post(`${backendUrl}/api/coupons/validate`, {
        code: couponCode.trim(),
        orderAmount: cartSubtotal,
        items
      }, { headers: { token } })

      if (res.data.success) {
        setAppliedCoupon({
          code: res.data.coupon.code,
          description: res.data.coupon.description,
          discount: res.data.discount,
          finalAmount: res.data.finalAmount
        })
        const discount = `$${(res.data.originalAmount - res.data.finalAmount).toFixed(2)}`
        toast.success(`Coupon applied! You saved ${discount}`)
      } else {
        if (res.data.message?.includes('expired')) {
          toast.error('Coupon has expired')
        } else {
          toast.error('Invalid coupon code')
        }
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      if (error.response?.status >= 500) {
        toast.error('Server error occurred')
      } else {
        toast.error('Failed to apply coupon')
      }
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    // Visual price update provides sufficient feedback
  }

  const discountAmount = appliedCoupon?.discount?.amount || 0
  const finalTotal = appliedCoupon ? appliedCoupon.finalAmount + delivery_fee : cartSubtotal + delivery_fee

  return (
    <div className="py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
      <section className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-display text-2xl font-semibold uppercase">Your Cart</h1>
          <span className="h-[2px] w-16 bg-gray-900" />
        </div>

        {lineItems.length === 0 && (
          <div className="text-gray-500">Your cart is empty.</div>
        )}

        <div className="space-y-6">
          {lineItems.map(({ product, size, qty }) => (
            <div key={`${product._id}-${size}`} className="border-b pb-6">
              {/* Mobile Layout */}
              <div className="sm:hidden">
                <div className="flex gap-4">
                  {product.image?.[0] ? (
                    <img
                      src={product.image[0]}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 ${product.image?.[0] ? 'hidden' : 'flex'}`}
                    style={{ display: product.image?.[0] ? 'none' : 'flex' }}
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm leading-tight">{product.name}</div>
                    <div className="mt-1 text-sm text-gray-600">{currency}{product.price}</div>
                    <div className="mt-2 inline-flex items-center border rounded px-2 py-0.5 text-xs">{size}</div>
                  </div>
                  <button onClick={() => removeFromCart(product._id, size)} aria-label="Remove" className="self-start">
                    <img src={assets.bin_icon} alt="Remove" className="w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center border rounded">
                    <button className="px-3 py-1 text-sm" onClick={() => setItemQuantity(product._id, size, Math.max(1, qty - 1))}>-</button>
                    <span className="px-4 select-none text-sm">{qty}</span>
                    <button className="px-3 py-1 text-sm" onClick={() => {
                      const maxStock = Number(product?.inventory?.available ?? product?.stock ?? 99)
                      setItemQuantity(product._id, size, Math.min(maxStock, qty + 1))
                    }}>+</button>
                  </div>
                  <div className="font-medium text-sm">{currency}{(product.price * qty).toFixed(2)}</div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:grid grid-cols-[90px_1fr_auto_auto] items-center gap-6">
                {product.image?.[0] ? (
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="w-[90px] h-[90px] object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-[90px] h-[90px] bg-gray-100 rounded flex items-center justify-center ${product.image?.[0] ? 'hidden' : 'flex'}`}
                  style={{ display: product.image?.[0] ? 'none' : 'flex' }}
                >
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{currency}{product.price}</div>
                  <div className="mt-2 inline-flex items-center border rounded px-2 py-0.5 text-xs">{size}</div>
                </div>

                {/* Quantity stepper */}
                <div className="flex items-center">
                  <div className="flex items-center border rounded">
                    <button className="px-3 py-1" onClick={() => setItemQuantity(product._id, size, Math.max(1, qty - 1))}>-</button>
                    <span className="px-4 select-none">{qty}</span>
                    <button className="px-3 py-1" onClick={() => {
                      const maxStock = Number(product?.inventory?.available ?? product?.stock ?? 99)
                      setItemQuantity(product._id, size, Math.min(maxStock, qty + 1))
                    }}>+</button>
                  </div>
                </div>

                {/* Remove */}
                <button className="justify-self-end" onClick={() => removeFromCart(product._id, size)} aria-label="Remove">
                  <img src={assets.bin_icon} alt="Remove" className="w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="lg:col-span-1 space-y-4 lg:space-y-6">
        {/* Coupon Section */}
        <div className="border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-lg font-semibold uppercase">Coupon Code</h2>
            <span className="h-[2px] w-12 bg-gray-900" />
          </div>

          {appliedCoupon ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <p className="text-sm text-green-700">{appliedCoupon.description}</p>
              <p className="text-sm font-medium text-green-800 mt-1">
                You saved {currency}{discountAmount.toFixed(2)}!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Enter a valid coupon code to get a discount on your order
              </p>
            </div>
          )}
        </div>

        {/* Cart Totals */}
        <div className="border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-xl font-semibold uppercase">Cart Totals</h2>
            <span className="h-[2px] w-12 bg-gray-900" />
          </div>

          <div className="text-sm divide-y border-y">
            <div className="flex justify-between py-3">
              <span>Subtotal</span>
              <span>{currency}{cartSubtotal.toFixed(2)}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between py-3 text-green-600">
                <span>Discount ({appliedCoupon.code})</span>
                <span>-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-3">
              <span>Shipping Fee</span>
              <span>{currency}{delivery_fee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3 font-semibold text-lg">
              <span>Total</span>
              <span>
                {appliedCoupon && cartSubtotal + delivery_fee !== finalTotal && (
                  <span className="text-sm text-gray-500 line-through mr-2">
                    {currency}{(cartSubtotal + delivery_fee).toFixed(2)}
                  </span>
                )}
                {currency}{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            className="mt-5 w-full bg-gray-900 text-white rounded-md py-2.5 text-sm disabled:opacity-60 hover:bg-gray-800"
            disabled={lineItems.length === 0}
            onClick={() => {
              // Always check authentication before proceeding
              const currentToken = localStorage.getItem('token')
              if (!token || !currentToken) {
                navigate(`/login?next=${encodeURIComponent('/place-order')}`)
              } else {
                // Pass coupon data to checkout
                const checkoutData = appliedCoupon ? {
                  coupon: {
                    code: appliedCoupon.code,
                    discount: discountAmount,
                    finalAmount: appliedCoupon.finalAmount
                  }
                } : {}

                navigate('/place-order', { state: checkoutData })
              }
            }}
          >
            Proceed to checkout
          </button>

          {appliedCoupon && (
            <p className="text-xs text-center text-green-600 mt-2">
              🎉 You're saving {currency}{discountAmount.toFixed(2)} with coupon {appliedCoupon.code}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}

export default Cart
