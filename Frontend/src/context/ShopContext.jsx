import React, { createContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'


export const ShopContext = createContext()

const ShopContextProvider = (props) => {
  const currency = '$'
  const delivery_fee = 10
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [cartItems, setCartItems] = useState({}) // { [productId]: { [size]: qty } }
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [token, setToken] = useState('')
  const [authInitialized, setAuthInitialized] = useState(false)
  const [productsLoaded, setProductsLoaded] = useState(false)
  const [lastProductsFetch, setLastProductsFetch] = useState(0)
  // hydrate cart from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart-v1')
      if (raw) setCartItems(JSON.parse(raw))
    } catch {}
  }, [])

  // persist cart
  useEffect(() => {
    try {
      localStorage.setItem('cart-v1', JSON.stringify(cartItems))
    } catch {}
  }, [cartItems])

  const addToCart = async (itemId, size, qty = 1) => {
    if (!itemId || !size || qty <= 0) return
    const product = products.find(p => p._id === itemId)
    const stock = Number(product?.inventory?.available ?? product?.stock ?? Infinity)
    const currentTotal = Object.values(cartItems[itemId] || {}).reduce((s, n) => s + n, 0)
    if (currentTotal + qty > stock) {
      const remaining = Math.max(0, stock - currentTotal)
      toast.error(`Only ${remaining} items left in stock`)
      return
    }
    setCartItems(prev => {
      const next = { ...prev }
      if (next[itemId]) {
        next[itemId] = { ...next[itemId] }
        next[itemId][size] = (next[itemId][size] || 0) + qty
      } else {
        next[itemId] = { [size]: qty }
      }
      return next
    })
    //you can also make an API call to update the cart on the server
    if (token) {
      try {
        await axios.post(backendUrl+'/api/cart/add', {itemId, size},{headers:{token}} )
      } catch (error) {
        console.log(error)
        // Cart operations should show visual feedback instead
      }

    }
  }

  const removeFromCart = (itemId, size) => {
    setCartItems(prev => {
      const next = { ...prev }
      if (!next[itemId]) return next
      const sizes = { ...next[itemId] }
      delete sizes[size]
      if (Object.keys(sizes).length === 0) {
        delete next[itemId]
      } else {
        next[itemId] = sizes
      }
      return next
    })
  }

  const setItemQuantity = (itemId, size, qty) => {
    const product = products.find(p => p._id === itemId)
    const maxStock = Number(product?.inventory?.available ?? product?.stock ?? 99)
    const quantity = Math.max(1, Math.min(Number(qty) || 1, maxStock))
    setCartItems(prev => {
      const next = { ...prev }
      const sizes = { ...(next[itemId] || {}) }
      sizes[size] = quantity
      next[itemId] = sizes
      return next
    })
  }

  const cartCount = useMemo(() => (
    Object.values(cartItems).reduce((sum, sizeMap) => sum + Object.values(sizeMap).reduce((s, n) => s + n, 0), 0)
  ), [cartItems])
  
  const clearCart = () => setCartItems({})

  const placeOrder = (shippingInfo, paymentMethod) => {
    const items = Object.entries(cartItems).flatMap(([id, sizeMap]) => (
      Object.entries(sizeMap).map(([size, qty]) => ({ id, size, qty }))
    ))
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items,
      paymentMethod,
      shippingInfo,
      status: 'Ready to ship',
      subtotal: cartSubtotal,
      shipping: delivery_fee,
      total: cartSubtotal + delivery_fee,
    }
    setOrders(prev => [newOrder, ...prev])
    clearCart()
  }

  const cartSubtotal = useMemo(() => (
    Object.entries(cartItems).reduce((sum, [id, sizeMap]) => {
      const product = products.find(p => p._id === id)
      if (!product) return sum
      const qty = Object.values(sizeMap).reduce((s, n) => s + n, 0)
      return sum + product.price * qty
    }, 0)
  ), [cartItems, products])
  
  const getProductData = async (force = false) => {
    // Cache products for 5 minutes to prevent excessive API calls
    const now = Date.now()
    const cacheTime = 5 * 60 * 1000 // 5 minutes
    
    if (!force && productsLoaded && (now - lastProductsFetch) < cacheTime) {
      return // Use cached data
    }

    try {
      const response = await axios.get(`${backendUrl}/api/product/list`)
      if (response.data.success) {
        setProducts(response.data.products)
        setProductsLoaded(true)
        setLastProductsFetch(now)
        
        // Cache products in localStorage for offline access
        try {
          localStorage.setItem('products-cache', JSON.stringify({
            data: response.data.products,
            timestamp: now
          }))
        } catch (e) {
          // Ignore localStorage errors
        }
      } else {
        console.error('Failed to load products:', response.data.message)
      }
    } catch (error) {
      console.log(error)
      
      // Try to load from cache if API fails
      try {
        const cached = localStorage.getItem('products-cache')
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          // Use cache if it's less than 1 hour old
          if ((now - timestamp) < 60 * 60 * 1000) {
            setProducts(data)
            setProductsLoaded(true)
            console.log('Loaded products from cache due to API error')
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    }
  }

  // Load products on app start with cache check
  useEffect(() => {
    // Try to load from cache first for instant display
    try {
      const cached = localStorage.getItem('products-cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const now = Date.now()
        // Use cache if it's less than 5 minutes old
        if ((now - timestamp) < 5 * 60 * 1000) {
          setProducts(data)
          setProductsLoaded(true)
          setLastProductsFetch(timestamp)
          // Still fetch fresh data in background
          setTimeout(() => getProductData(true), 1000)
          return
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    
    getProductData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Initialize authentication on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    }
    setAuthInitialized(true)
  }, [])

  // Simple logout function
  const logout = async (showMessage = true) => {
    // Always perform client-side cleanup
    setToken('')
    localStorage.removeItem('token')
    
    // Show success message
    if (showMessage) {
      toast.success('You have been logged out successfully. Thank you for shopping with us!', {
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    setCartItems,
    cartCount,
    removeFromCart,
    setItemQuantity,
    cartSubtotal,
    orders,
    placeOrder,
    navigate,
    backendUrl,
    setToken,
    token,
    authInitialized,
    getProductData,
    productsLoaded,
    logout
  }

  return (
    <ShopContext.Provider value={value}>
      {props.children}
    </ShopContext.Provider>
  )
}

export default ShopContextProvider