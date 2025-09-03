import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import WishlistButton from './WishlistButton'

const ProductItem = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

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

  return (
    <div className="group relative h-full">
      <article className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow bg-white h-full flex flex-col">
        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <WishlistButton productId={product._id} className="bg-white shadow-md hover:shadow-lg" />
        </div>

        <Link to={`/product/${product._id}`} className="block">
          <div ref={imgRef} className="aspect-[4/5] bg-gray-50 overflow-hidden relative">
            {isVisible && product.image?.[0] && (
              <img 
                src={product.image[0]} 
                alt={product.name} 
                className={`w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                loading="lazy"
              />
            )}
            {!imageLoaded && isVisible && product.image?.[0] && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}
            {(!product.image?.[0] || (isVisible && imageLoaded && !product.image?.[0])) && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Stock Status Badge */}
            {(() => {
              const available = product.inventory?.available ?? product.stock ?? 0
              if (available === 0) {
                return (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Out of Stock
                    </span>
                  </div>
                )
              }
              return null
            })()}
          </div>
          
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-medium text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">{product.name}</h3>
              {product.bestseller && (
                <span className="ml-1 shrink-0 text-[10px] uppercase tracking-wide bg-gray-900 text-white px-1.5 py-0.5 rounded">Hot</span>
              )}
            </div>
            
            <div className="mt-1 text-sm text-gray-500">{product.category} • {product.subCategory}</div>
            
            {/* Rating - Fixed height container */}
            <div className="mt-1 h-4 flex items-center">
              {product.reviews?.average > 0 ? (
                <div className="flex items-center gap-1">
                  {renderStars(product.reviews.average)}
                  <span className="text-xs text-gray-500">
                    ({product.reviews.count})
                  </span>
                </div>
              ) : (
                <div></div>
              )}
            </div>
            
            <div className="mt-auto pt-2">
              <div className="font-semibold">${product.price}</div>
              
              {/* Stock indicator - Fixed height container */}
              <div className="h-4 mt-1">
                {(() => {
                  const available = product.inventory?.available ?? product.stock ?? 0
                  if (available > 0 && available <= (product.inventory?.lowStockThreshold ?? 10)) {
                    return <div className="text-xs text-orange-600">Only {available} left</div>
                  }
                  return null
                })()}
              </div>
            </div>
          </div>
        </Link>
      </article>
    </div>
  )
}

export default ProductItem

