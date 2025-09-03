import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const ProductReviews = ({ productId, onReviewUpdate }) => {
  const { backendUrl, token, navigate, authInitialized } = useContext(ShopContext)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('newest')
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    orderId: ''
  })
  
  // User's orders for review verification
  const [userOrders, setUserOrders] = useState([])
  
  // Current user info for review ownership check
  const [currentUserId, setCurrentUserId] = useState(null)
  
  // Admin reply state
  const [showReplyForm, setShowReplyForm] = useState(null) // reviewId when showing reply form
  const [replyMessage, setReplyMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const loadReviews = async (page = 1, sort = 'newest') => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/reviews/product/${productId}?page=${page}&sort=${sort}&limit=10`)
      
      if (res.data.success) {
        setReviews(res.data.reviews)
        setPagination(res.data.pagination)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserInfo = async () => {
    if (!token) {
      setCurrentUserId(null)
      setIsAdmin(false)
      return
    }
    
    try {
      // Get current user info to check review ownership and admin status
      const userRes = await axios.get(`${backendUrl}/api/user/profile`, { headers: { token } })
      if (userRes.data.success) {
        setCurrentUserId(userRes.data.user._id)
        // Check if user is admin (you might need to adjust this based on your user model)
        setIsAdmin(userRes.data.user.role === 'admin' || userRes.data.user.isAdmin === true)
      }
    } catch (error) {
      console.log('Error loading user info:', error.message)
      setCurrentUserId(null)
      setIsAdmin(false)
    }
  }

  const loadUserOrders = async () => {
    if (!token) {
      setUserOrders([])
      return
    }
    
    try {
      const res = await axios.get(`${backendUrl}/api/order/user-orders`, { headers: { token } })
      if (res.data.success) {
        // Filter orders that contain this product and are paid
        const relevantOrders = res.data.orders.filter(order => {
          // Check if order is paid (handle both old and new payment status)
          const isPaid = order.payment === true || order.paymentStatus === 'paid'
          
          if (!isPaid) return false
          
          const hasProduct = order.items.some(item => {
            // Handle both string and object productId (populated vs non-populated)
            const itemProductId = typeof item.productId === 'object' ? item.productId._id : item.productId
            return itemProductId === productId
          })
          
          console.log('Order has product:', hasProduct, 'Order ID:', order._id)
          return hasProduct
        })
        
        setUserOrders(relevantOrders)
      }
    } catch (error) {
      console.log('Error loading user orders:', error.message)
      setUserOrders([])
    }
  }

  useEffect(() => {
    loadReviews(currentPage, sortBy)
  }, [productId, currentPage, sortBy])

  useEffect(() => {
    if (authInitialized && token && productId) {
      loadUserInfo()
      loadUserOrders()
    } else if (authInitialized) {
      setCurrentUserId(null)
      setIsAdmin(false)
      setUserOrders([])
    }
  }, [token, productId, authInitialized])

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Please login to submit a review')
      return
    }
    
    if (!reviewForm.orderId) {
      toast.error('Please select an order')
      return
    }
    
    try {
      setLoading(true)
      
      const res = await axios.post(`${backendUrl}/api/reviews/create`, {
        productId,
        orderId: reviewForm.orderId,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      }, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Review submitted successfully!')
        setShowReviewForm(false)
        setReviewForm({ rating: 5, title: '', comment: '', orderId: '' })
        loadReviews(1, sortBy) // Reload reviews
        
        // Notify parent component to refresh product data
        if (onReviewUpdate) {
          try {
            onReviewUpdate()
          } catch (error) {
            console.log('Product refresh skipped due to rate limiting')
          }
        }
      } else {
        toast.error(res.data.message || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      if (error.response?.status >= 500) {
        toast.error('Server error occurred')
      } else {
        toast.error('Failed to submit review')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHelpfulClick = async (reviewId) => {
    if (!token) {
      // Redirect to login instead of showing toast
      navigate('/login')
      return
    }
    
    try {
      const res = await axios.put(`${backendUrl}/api/reviews/${reviewId}/helpful`, {}, { headers: { token } })
      
      if (res.data.success) {
        // Update the review in the list
        setReviews(reviews.map(review => 
          review._id === reviewId 
            ? { ...review, helpful: res.data.isHelpful 
                ? [...review.helpful, 'current-user'] 
                : review.helpful.filter(id => id !== 'current-user'),
                helpfulCount: res.data.helpfulCount }
            : review
        ))
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error)
      // Visual state change provides sufficient feedback
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!token) {
      navigate('/login')
      return
    }

    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeletingReviewId(reviewId)
      const res = await axios.delete(`${backendUrl}/api/reviews/${reviewId}`, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Review deleted successfully')
        loadReviews(currentPage, sortBy) // Reload reviews
        
        // Notify parent component to refresh product data
        if (onReviewUpdate) {
          try {
            onReviewUpdate()
          } catch (error) {
            console.log('Product refresh skipped due to rate limiting')
          }
        }
      } else {
        toast.error(res.data.message || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      if (error.response?.status === 403) {
        toast.error('You can only delete your own reviews')
      } else if (error.response?.status >= 500) {
        toast.error('Server error occurred')
      } else {
        toast.error('Failed to delete review')
      }
    } finally {
      setDeletingReviewId(null)
    }
  }

  const handleReplySubmit = async (reviewId) => {
    if (!token || !isAdmin) {
      // Admin access should be handled at route level
      return
    }

    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message')
      return
    }
    
    try {
      const res = await axios.post(`${backendUrl}/api/reviews/${reviewId}/reply`, {
        message: replyMessage
      }, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Reply added successfully')
        setShowReplyForm(null)
        setReplyMessage('')
        loadReviews(currentPage, sortBy) // Reload reviews
      } else {
        toast.error(res.data.message || 'Failed to add reply')
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    }
  }

  const handleDeleteReply = async (reviewId) => {
    if (!token || !isAdmin) {
      // Admin access should be handled at route level
      return
    }

    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return
    }
    
    try {
      const res = await axios.delete(`${backendUrl}/api/reviews/${reviewId}/reply`, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Reply deleted successfully')
        loadReviews(currentPage, sortBy) // Reload reviews
      } else {
        toast.error(res.data.message || 'Failed to delete reply')
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
      toast.error('Failed to delete reply')
    }
  }

  const renderStars = (rating, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <img
            key={star}
            src={star <= rating ? assets.star_icon : assets.star_dull_icon}
            alt=""
            className={size}
          />
        ))}
      </div>
    )
  }

  const canWriteReview = token && userOrders.length > 0
  
  // Only show review button if user is authenticated and has purchased this product

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        {canWriteReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Sort and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm text-gray-600">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-200 pb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-gray-900">{review.userId?.name || 'Anonymous'}</span>
                    {review.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified Purchase</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Delete button for user's own reviews */}
                {token && currentUserId && review.userId?._id === currentUserId && (
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    disabled={deletingReviewId === review._id}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                    title="Delete your review"
                  >
                    {deletingReviewId === review._id ? '⏳ Deleting...' : '🗑️ Delete'}
                  </button>
                )}
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              <p className="text-gray-700 mb-3">{review.comment}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleHelpfulClick(review._id)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    disabled={!token}
                  >
                    👍 Helpful ({review.helpful?.length || 0})
                  </button>
                  
                  {/* Admin reply button */}
                  {isAdmin && !review.adminReply?.message && (
                    <button
                      onClick={() => setShowReplyForm(review._id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      💬 Reply
                    </button>
                  )}
                </div>
                
                {/* Additional actions for own reviews */}
                {token && currentUserId && review.userId?._id === currentUserId && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">Your Review</span>
                  </div>
                )}
              </div>

              {/* Admin Reply */}
              {review.adminReply?.message && (
                <div className="mt-4 ml-6 p-3 bg-blue-50 border-l-4 border-blue-200 rounded-r-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-900">
                          {review.adminReply.repliedBy?.name || 'Admin'}
                        </span>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Store Reply</span>
                        <span className="text-xs text-blue-600">
                          {new Date(review.adminReply.repliedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{review.adminReply.message}</p>
                    </div>
                    
                    {/* Delete reply button for admin */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteReply(review._id)}
                        className="text-red-600 hover:text-red-800 text-xs ml-2"
                        title="Delete reply"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              {showReplyForm === review._id && (
                <div className="mt-4 ml-6 p-3 border border-blue-200 rounded-md bg-blue-50">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-blue-900 mb-1">Admin Reply</label>
                    <textarea
                      className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Write your reply to this review..."
                      maxLength={500}
                    />
                    <p className="text-xs text-blue-600 mt-1">{replyMessage.length}/500 characters</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReplySubmit(review._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                      disabled={!replyMessage.trim()}
                    >
                      Post Reply
                    </button>
                    <button
                      onClick={() => {
                        setShowReplyForm(null)
                        setReplyMessage('')
                      }}
                      className="border border-blue-300 text-blue-600 px-3 py-1 rounded-md text-sm hover:bg-blue-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          {[...Array(pagination.totalPages)].map((_, i) => {
            const page = i + 1
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  currentPage === page
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Write a Review</h3>
            
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Order</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={reviewForm.orderId}
                  onChange={(e) => setReviewForm({ ...reviewForm, orderId: e.target.value })}
                  required
                >
                  <option value="">Choose an order...</option>
                  {userOrders.map((order) => (
                    <option key={order._id} value={order._id}>
                      Order #{order._id.slice(-6)} - {new Date(order.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">You can only review products you've purchased</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <img
                        src={star <= reviewForm.rating ? assets.star_icon : assets.star_dull_icon}
                        alt=""
                        className="w-6 h-6"
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''})</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Summarize your review..."
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your thoughts about this product..."
                  required
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">{reviewForm.comment.length}/1000 characters</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-60 hover:bg-gray-800"
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false)
                    setReviewForm({ rating: 5, title: '', comment: '', orderId: '' })
                  }}
                  className="border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductReviews