import React, { useState, useContext, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'

const WishlistButton = ({ productId, className = '' }) => {
  const { backendUrl, token, navigate, authInitialized } = useContext(ShopContext)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if product is in wishlist on component mount
  useEffect(() => {
    if (authInitialized && token && productId) {
      checkWishlistStatus()
    }
  }, [token, productId, authInitialized])

  const checkWishlistStatus = async () => {
    if (!token) return
    
    try {
      const res = await axios.get(`${backendUrl}/api/user/wishlist`, { headers: { token } })
      if (res.data.success) {
        const isInList = res.data.wishlist.some(item => item._id === productId)
        setIsInWishlist(isInList)
      }
    } catch (error) {
      // Silently fail - wishlist status is not critical
      console.log('Wishlist check failed:', error.message)
    }
  }

  const toggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      
      const res = await axios.post(`${backendUrl}/api/user/wishlist/toggle`, {
        productId
      }, { headers: { token } })
      
      if (res.data.success) {
        setIsInWishlist(res.data.inWishlist)
        // Visual state change is sufficient feedback
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      toast.error('Failed to update wishlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`group relative p-2 rounded-full transition-colors ${
        isInWishlist 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
      } ${className}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className={`w-5 h-5 transition-all ${loading ? 'animate-pulse' : ''}`}
        fill={isInWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      </div>
    </button>
  )
}

export default WishlistButton