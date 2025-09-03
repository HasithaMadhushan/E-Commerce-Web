import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { assets } from '../assets/assets'
import Title from '../components/Title'
import { ShopContext } from '../context/ShopContext'
import RelatedProduct from '../components/RelatedProduct'
import ProductReviews from '../components/ProductReviews'
import WishlistButton from '../components/WishlistButton'

const Product = () => {
  const { productID } = useParams()
  const { products: contextProducts, currency, addToCart, getProductData, backendUrl } = useContext(ShopContext)
  const navigate = useNavigate()
  const allProducts = contextProducts || []

  const product = useMemo(() => allProducts.find(p => p._id === productID), [allProducts, productID])
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Function to refresh product data when reviews are updated
  const handleReviewUpdate = async () => {
    // To avoid rate limiting issues, we'll use a delayed refresh
    // and only refresh if it's been more than 5 seconds since the last refresh
    const lastRefresh = localStorage.getItem('lastProductRefresh')
    const now = Date.now()
    
    if (!lastRefresh || now - parseInt(lastRefresh) > 5000) {
      setTimeout(() => {
        if (getProductData) {
          localStorage.setItem('lastProductRefresh', now.toString())
          getProductData()
        }
      }, 1500) // 1.5 second delay to avoid rapid requests
    }
  }

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [productID])

  if (!product) {
    return (
      <div className="py-8">
        <Title title="Product not found" subTitle="Oops" />
      </div>
    )
  }

  const images = product.image && product.image.length > 0 ? product.image : []
  // related moved to RelatedProduct component

  return (
    <div className="py-6">
      {/* Main section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Images */}
        <div>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {images.length > 1 && (
              <div className="order-2 col-span-6 lg:order-1 lg:col-span-1 flex lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-x-visible">
                {images.map((src, idx) => (
                  <button key={idx} className={`aspect-square rounded-lg overflow-hidden border flex-shrink-0 w-16 sm:w-auto ${idx === activeImageIdx ? 'border-gray-900' : 'border-gray-200'}`} onClick={() => setActiveImageIdx(idx)}>
                    <img src={src} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className={`order-1 col-span-6 ${images.length > 1 ? 'lg:order-2 lg:col-span-5' : ''}`}>
              <div className="aspect-square bg-gray-50 rounded-xl lg:rounded-2xl overflow-hidden relative">
                {images.length > 0 ? (
                  <img 
                    src={images[activeImageIdx]} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`absolute inset-0 flex items-center justify-center ${images.length > 0 ? 'hidden' : 'flex'}`}
                  style={{ display: images.length > 0 ? 'none' : 'flex' }}
                >
                  <div className="text-center">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm">No image available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{product.name}</h1>
          <div className="mt-1 text-gray-500">{product.category} • {product.subCategory}</div>

          {/* Rating */}
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <img
                key={star}
                src={star <= Math.floor(product.reviews?.average || 0) ? assets.star_icon : assets.star_dull_icon}
                alt=""
                className="w-4 h-4"
              />
            ))}
            <p className="pl-2 text-sm text-gray-500">
              {product.reviews?.average ? `${product.reviews.average.toFixed(1)} ` : ''}
              ({product.reviews?.count || 0} review{product.reviews?.count !== 1 ? 's' : ''})
            </p>
          </div>

          <p className="mt-4 text-2xl font-semibold">{currency}{product.price}</p>
          {/* Stock display - check both old and new inventory fields */}
          {(typeof product.stock !== 'undefined' || product.inventory?.available !== undefined) && (
            <div className="mt-1 text-sm">
              {(() => {
                const available = product.inventory?.available ?? product.stock ?? 0
                if (available > 0) {
                  return <span className="text-green-600">In stock: {available}</span>
                } else {
                  return <span className="text-red-600">Out of stock</span>
                }
              })()}
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mt-5">
              <div className="text-sm text-gray-600 mb-2">Select size</div>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} className={`px-3 py-1.5 border rounded-md text-sm ${selectedSize === s ? 'border-gray-900 bg-gray-100' : 'border-gray-300'}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + CTA */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-md w-fit">
              <button className="px-3 py-2 touch-target" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
              <span className="px-4 select-none">{quantity}</span>
              <button className="px-3 py-2 touch-target" onClick={() => setQuantity(q => {
                const max = Number(product?.inventory?.available ?? product?.stock ?? 99)
                return Math.min(q + 1, max)
              })}>+</button>
            </div>
            <button
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-md bg-gray-900 text-white text-sm disabled:opacity-60 touch-target"
              disabled={product.sizes?.length > 0 && !selectedSize}
              onClick={() => {
                const sizeToUse = selectedSize || (product.sizes?.[0] || '')
                if (!sizeToUse) return
                addToCart(product._id, sizeToUse, quantity)
                navigate('/cart')
              }}
            >
              Add to cart
            </button>
          </div>

          {/* Wishlist Button */}
          <div className="mt-3">
            <WishlistButton productId={product._id} className="border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50" />
          </div>

          {/* Policies row removed as requested */}

          <div className="mt-5 text-sm text-gray-600">
            {product.description}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews productId={product._id} onReviewUpdate={handleReviewUpdate} />

      {/* Related */}
      <RelatedProduct category={product.category} subCategory={product.subCategory} excludeId={product._id} />
    </div>
  )
}

export default Product
