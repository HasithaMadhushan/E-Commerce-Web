import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import Title from '../components/Title'

const Wishlist = () => {
  const { backendUrl, token, navigate, currency, addToCart, authInitialized } = useContext(ShopContext)
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)

  const loadWishlist = async () => {
    if (!token) {
      navigate('/login?next=/wishlist')
      return
    }

    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/user/wishlist`, { headers: { token } })
      
      if (res.data.success) {
        setWishlist(res.data.wishlist)
      }
    } catch (error) {
      console.log('Error loading wishlist:', error.message)
      // Loading errors should be handled with inline error states
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authInitialized) return
    
    if (token) {
      loadWishlist()
    } else {
      navigate('/login?next=/wishlist')
    }
  }, [token, navigate, authInitialized])

  const removeFromWishlist = async (productId) => {
    try {
      const res = await axios.post(`${backendUrl}/api/user/wishlist/remove`, {
        productId
      }, { headers: { token } })
      
      if (res.data.success) {
        setWishlist(wishlist.filter(item => item._id !== productId))
        // Item removal from list provides visual feedback
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove from wishlist')
    }
  }

  const handleAddToCart = (product) => {
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
    addToCart(product._id, defaultSize, 1)
    // Cart count update provides sufficient visual feedback
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <img
            key={star}
            src={star <= Math.floor(rating || 0) ? assets.star_icon : assets.star_dull_icon}
            alt=""
            className="w-3 h-3"
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-8">
        <Title title="My Wishlist" subTitle="Loading..." />
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <Title title="My Wishlist" subTitle="Your saved items" />
      
      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">Save items you love to buy them later</p>
          <button
            onClick={() => navigate('/collection')}
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {wishlist.map((product) => (
            <div key={product._id} className="group relative bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              {/* Remove button */}
              <button
                onClick={() => removeFromWishlist(product._id)}
                className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-50"
              >
                <img src={assets.cross_icon} alt="Remove" className="w-4 h-4" />
              </button>

              {/* Product Image */}
              <div className="aspect-square bg-gray-50 rounded-t-lg overflow-hidden relative">
                {product.image?.[0] ? (
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => navigate(`/product/${product._id}`)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`absolute inset-0 flex items-center justify-center cursor-pointer ${product.image?.[0] ? 'hidden' : 'flex'}`}
                  onClick={() => navigate(`/product/${product._id}`)}
                  style={{ display: product.image?.[0] ? 'none' : 'flex' }}
                >
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 
                  className="font-medium text-gray-900 mb-1 cursor-pointer hover:text-gray-700 line-clamp-2"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.name}
                </h3>
                
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                
                {/* Rating */}
                {product.reviews?.average > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(product.reviews.average)}
                    <span className="text-xs text-gray-500">
                      ({product.reviews.count})
                    </span>
                  </div>
                )}

                {/* Price */}
                <p className="text-lg font-semibold text-gray-900 mb-3">
                  {currency}{product.price}
                </p>

                {/* Stock Status */}
                <div className="mb-3">
                  {(() => {
                    const available = product.inventory?.available ?? product.stock ?? 0
                    if (available > 0) {
                      return <span className="text-xs text-green-600">In stock</span>
                    } else {
                      return <span className="text-xs text-red-600">Out of stock</span>
                    }
                  })()}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inventory?.available && !product.stock}
                    className="flex-1 bg-gray-900 text-white py-2 px-3 rounded-md text-xs sm:text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm hover:bg-gray-50 touch-target"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Continue Shopping */}
      {wishlist.length > 0 && (
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/collection')}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
          >
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  )
}

export default Wishlist