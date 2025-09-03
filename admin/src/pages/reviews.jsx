import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../config'

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected
  const [replyForm, setReplyForm] = useState({ reviewId: null, message: '' })

  const loadReviews = async (page = 1, status = 'all') => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      setLoading(true)
      let url = `${backendUrl}/api/reviews/admin/list?page=${page}&limit=10`
      if (status !== 'all') {
        url += `&status=${status}`
      }
      
      const res = await axios.get(url, { headers: { token } })
      
      if (res.data.success) {
        setReviews(res.data.reviews || [])
        setPagination(res.data.pagination || {})
      } else {
        toast.error(res.data.message || 'Failed to load reviews')
        setReviews([])
        setPagination({})
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.')
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to load reviews')
      }
      setReviews([])
      setPagination({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews(currentPage, filter)
  }, [token, currentPage, filter])

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const res = await axios.put(`${backendUrl}/api/reviews/admin/${reviewId}/status`, {
        status: newStatus
      }, { headers: { token } })
      
      if (res.data.success) {
        toast.success(`Review ${newStatus} successfully`)
        loadReviews(currentPage, filter)
      }
    } catch (error) {
      console.error('Error updating review status:', error)
      toast.error('Failed to update review status')
    }
  }

  const handleReplySubmit = async (reviewId) => {
    if (!replyForm.message.trim()) {
      toast.error('Please enter a reply message')
      return
    }
    
    try {
      const res = await axios.post(`${backendUrl}/api/reviews/${reviewId}/reply`, {
        message: replyForm.message
      }, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Reply added successfully')
        setReplyForm({ reviewId: null, message: '' })
        loadReviews(currentPage, filter)
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    }
  }

  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return
    }
    
    try {
      const res = await axios.delete(`${backendUrl}/api/reviews/${reviewId}/reply`, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Reply deleted successfully')
        loadReviews(currentPage, filter)
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
      toast.error('Failed to delete reply')
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Review Management</h1>
        
        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{review.userId?.name || 'Anonymous'}</span>
                    {renderStars(review.rating)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      review.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Product: {review.productId?.name || 'Unknown Product'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Status Actions */}
                <div className="flex gap-2">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(review._id, 'approved')}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">{review.title}</h4>
                <p className="text-gray-700">{review.comment}</p>
              </div>

              {/* Admin Reply Section */}
              {review.adminReply?.message ? (
                <div className="bg-blue-50 border-l-4 border-blue-200 p-3 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-blue-900">
                          {review.adminReply.repliedBy?.name || 'Admin'}
                        </span>
                        <span className="text-xs text-blue-600">
                          {new Date(review.adminReply.repliedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{review.adminReply.message}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteReply(review._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  {replyForm.reviewId === review._id ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        value={replyForm.message}
                        onChange={(e) => setReplyForm({ ...replyForm, message: e.target.value })}
                        placeholder="Write your reply..."
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplySubmit(review._id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          Post Reply
                        </button>
                        <button
                          onClick={() => setReplyForm({ reviewId: null, message: '' })}
                          className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyForm({ reviewId: review._id, message: '' })}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      💬 Reply to Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-500 mb-2">
            {filter !== 'all' 
              ? `No ${filter} reviews available`
              : 'No reviews have been submitted yet'
            }
          </p>
          <p className="text-xs text-gray-400">
            Reviews will appear here once customers submit product reviews
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
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
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )
          })}
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Reviews