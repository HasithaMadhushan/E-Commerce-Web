import React, { useState, useContext, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOder = () => {
  // Single formData state declaration
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: ''
  })

  const [payment, setPayment] = useState('stripe')
  const [loading, setLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Single context destructuring
  const { backendUrl, token, cartItems, setCartItems, cartSubtotal, delivery_fee, currency, products, placeOrder, authInitialized } = useContext(ShopContext)
  
  // Single navigate declaration
  const navigate = useNavigate()
  
  const total = useMemo(() => cartSubtotal + delivery_fee, [cartSubtotal, delivery_fee])
  const isCartEmpty = useMemo(() => Object.keys(cartItems || {}).length === 0, [cartItems])

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setFormData(data => ({ ...data, [name]: value }))
  }

  // Redirect if not authenticated or prefill from profile if available
  useEffect(() => {
    // Wait for auth to be initialized before checking
    if (!authInitialized) return
    
    const storedToken = localStorage.getItem('token')
    
    if (!token || !storedToken) {
      navigate('/login?next=/place-order')
      return
    }

    const loadProfile = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${backendUrl}/api/user/me`, { headers: { token } })
        if (res.data.success && res.data.user) {
          const u = res.data.user
          setFormData(d => ({
            ...d,
            firstName: u.name?.split(' ')?.slice(0, -1).join(' ') || u.name || d.firstName,
            lastName: u.name?.split(' ')?.slice(-1).join(' ') || d.lastName,
            email: u.email || d.email,
            phone: u.phone || d.phone,
            street: u.address?.street || d.street,
            city: u.address?.city || d.city,
            state: u.address?.state || d.state,
            zipcode: u.address?.zipcode || d.zipcode,
            country: u.address?.country || d.country,
          }))
          setProfileLoaded(true)
        }
      } catch (error) {
        console.log('Error loading profile:', error.message)
        // If profile loading fails, user might not be properly authenticated
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          navigate('/login?next=/place-order')
        }
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [token, backendUrl, navigate, authInitialized])

  const onPlaceOrder = (e) => {
    e.preventDefault()
    // very light validation
    const required = ['firstName','lastName','email','street','city','state','zipcode','country','phone']
    const missing = required.some(k => !String(formData[k] || '').trim())
    if (missing || isCartEmpty) return
    placeOrder(formData, payment)
    navigate('/orders')
  }



  const onSubmitHandler = async(event) => {
  event.preventDefault()
  try {
    let orderItems=[]
    for(const items in cartItems){
      for (const item in cartItems[items]){
        if(cartItems[items][item] > 0) {
         const itemInfo = structuredClone(products.find(product => product._id === items))
         if(itemInfo){
          itemInfo.size = item
          itemInfo.quantity = cartItems[items][item]
          orderItems.push(itemInfo)
         }
        }
      }
    }
  let orderData = {
    address: formData,
    items: orderItems,
    amount: cartSubtotal + delivery_fee
  }
   switch(payment){
    case 'cod':
      const response = await axios.post(`${backendUrl}/api/order/place`, orderData, { headers: { token } })
      if(response.data.success){
        setCartItems({})
        const orderNumber = response.data.orderId || 'N/A'
        toast.success(`Order placed successfully! Order #${orderNumber}`)
        navigate('/orders')
      }else{
        toast.error('Payment failed. Please try again.')
      }
      break;
      case 'stripe':
        const responseStripe = await axios.post(`${backendUrl}/api/order/stripe`, orderData, { headers: { token } })
        if(responseStripe.data.success){
          const {session_url} = responseStripe.data;
          window.location.href = session_url;
        }else{
          toast.error(responseStripe.data.message)
        }
        break;
      default:
        break;
   }
  // Send orderItems to the backend
  
} catch (error) {
    console.log(error)
    toast.error(error.message)
  }
  }

  // Show loading state while checking authentication
  if (!authInitialized || loading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated (shouldn't reach here due to useEffect, but safety check)
  if (!token) {
    navigate('/login?next=/place-order')
    return null
  }

  return (
    <div className="py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
      {/* Delivery information */}
      <section className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-xl font-semibold uppercase">Delivery Information</h2>
          <span className="h-[2px] w-16 bg-gray-900" />
        </div>
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="firstName" value={formData.firstName} onChange={onChangeHandler} placeholder="First name" className="form-input border rounded-lg px-3 py-3 text-sm" required />
            <input name="lastName" value={formData.lastName} onChange={onChangeHandler} placeholder="Last name" className="form-input border rounded-lg px-3 py-3 text-sm" required />
          </div>
          <input name="email" type="email" value={formData.email} readOnly placeholder="Email address" className="form-input w-full border rounded-lg px-3 py-3 text-sm bg-gray-50" required />
          <input name="street" value={formData.street} onChange={onChangeHandler} placeholder="Street" className="form-input w-full border rounded-lg px-3 py-3 text-sm" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="city" value={formData.city} onChange={onChangeHandler} placeholder="City" className="form-input border rounded-lg px-3 py-3 text-sm" required />
            <input name="state" value={formData.state} onChange={onChangeHandler} placeholder="State" className="form-input border rounded-lg px-3 py-3 text-sm" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="zipcode" value={formData.zipcode} onChange={onChangeHandler} placeholder="Zip code" className="form-input border rounded-lg px-3 py-3 text-sm" required />
            <input name="country" value={formData.country} onChange={onChangeHandler} placeholder="Country" className="form-input border rounded-lg px-3 py-3 text-sm" required />
          </div>
          <input name="phone" value={formData.phone} onChange={onChangeHandler} placeholder="Phone" className="form-input w-full border rounded-lg px-3 py-3 text-sm" required />
        </form>
      </section>

      {/* Totals & payment */}
      <aside className="lg:col-span-1">
        <div className="border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-display text-xl font-semibold uppercase">Cart Totals</h3>
            <span className="h-[2px] w-12 bg-gray-900" />
          </div>
          <div className="text-sm divide-y border-y">
            <div className="flex justify-between py-3"><span>Subtotal</span><span>{currency}{cartSubtotal.toFixed(2)}</span></div>
            <div className="flex justify-between py-3"><span>Shipping Fee</span><span>{currency}{delivery_fee.toFixed(2)}</span></div>
            <div className="flex justify-between py-3 font-semibold"><span>Total</span><span>{currency}{total.toFixed(2)}</span></div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-sm font-medium uppercase">Payment Method</h4>
              <span className="h-[2px] w-10 bg-gray-900" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" checked={payment==='stripe'} onChange={() => setPayment('stripe')} />
                <img src={assets.stripe_logo} alt="Stripe" className="h-4" />
              </label>
              <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" checked={payment==='cod'} onChange={() => setPayment('cod')} />
                <span className="text-xs">Cash on Delivery</span>
              </label>
            </div>
          </div>

          <button type="button"
            onClick={onSubmitHandler}
            className="mt-5 w-full bg-gray-900 text-white rounded-md py-2.5 text-sm disabled:opacity-60"
            disabled={isCartEmpty}
          >
            Place Order
          </button>
        </div>
      </aside>
    </div>
  )
}

export default PlaceOder
