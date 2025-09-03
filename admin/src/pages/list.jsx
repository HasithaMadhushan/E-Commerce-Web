import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../config'
import { toast } from 'react-toastify'

const list = ({token}) => {
  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({ 
    name: '', 
    price: '', 
    total: '', 
    available: '', 
    lowStockThreshold: '' 
  })
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all') // all, in-stock, low-stock, out-of-stock
  const [sortBy, setSortBy] = useState('name') // name, price, stock, category
  const [sortOrder, setSortOrder] = useState('asc')
  
  // Low stock products
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [showLowStockAlert, setShowLowStockAlert] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginatedList, setPaginatedList] = useState([])
  const [totalPages, setTotalPages] = useState(1)

  const fetchList = useCallback(async () => {
    try {
      const response = await axios.get(backendUrl+"/api/product/list")
      if (response?.data?.success){
        setList(response.data.products)
        setFilteredList(response.data.products)
      }
      else{
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error(error.message)
    }
  }, [])

  const fetchLowStockProducts = useCallback(async () => {
    try {
      const response = await axios.get(backendUrl+"/api/product/stock/low", { headers: { token } })
      if (response?.data?.success){
        setLowStockProducts(response.data.products)
        if (response.data.products.length > 0) {
          setShowLowStockAlert(true)
        }
      }
    } catch (error) {
      console.error('Error fetching low stock products:', error)
    }
  }, [token])
  // Filter and search logic
  useEffect(() => {
    let filtered = [...list]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory)
    }
    
    // Stock filter
    if (filterStock !== 'all') {
      filtered = filtered.filter(item => {
        const available = item.inventory?.available ?? item.stock ?? 0
        const threshold = item.inventory?.lowStockThreshold ?? 10
        
        switch (filterStock) {
          case 'in-stock':
            return available > threshold
          case 'low-stock':
            return available > 0 && available <= threshold
          case 'out-of-stock':
            return available === 0
          default:
            return true
        }
      })
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'stock':
          aVal = a.inventory?.available ?? a.stock ?? 0
          bVal = b.inventory?.available ?? b.stock ?? 0
          break
        case 'category':
          aVal = a.category
          bVal = b.category
          break
        default: // name
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
      }
      
      if (sortOrder === 'desc') {
        return aVal < bVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
    
    setFilteredList(filtered)
    
    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    setTotalPages(totalPages)
    
    // Reset to page 1 if current page is beyond total pages
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
    
    // Calculate paginated results
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedList(filtered.slice(startIndex, endIndex))
  }, [list, searchTerm, filterCategory, filterStock, sortBy, sortOrder, currentPage, itemsPerPage])

  const startEdit = (item) => {
    setEditing(item._id)
    setDraft({ 
      name: item.name, 
      price: String(item.price), 
      total: String(item.inventory?.total ?? item.stock ?? 0),
      available: String(item.inventory?.available ?? item.stock ?? 0),
      lowStockThreshold: String(item.inventory?.lowStockThreshold ?? 10)
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft({ name: '', price: '', total: '', available: '', lowStockThreshold: '' })
  }

  const saveEdit = async () => {
    try {
      
      
      // Update basic product info
      const updateResponse = await axios.put(backendUrl + '/api/product/update', {
        id: editing,
        name: draft.name,
        price: Number(draft.price)
      }, { headers: { token } })
      
      // Update stock levels
      const stockResponse = await axios.put(backendUrl + '/api/product/stock/update', {
        productId: editing,
        total: Number(draft.total),
        available: Number(draft.available),
        lowStockThreshold: Number(draft.lowStockThreshold)
      }, { headers: { token } })
      
      if (updateResponse.data.success && stockResponse.data.success) {
        toast.success('Product updated successfully')
        await fetchList()
        await fetchLowStockProducts()
        cancelEdit()
      } else {
        toast.error('Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error.message)
    }
  }
const removeProduct = async (id) => {
  try {
    const response = await axios.post(backendUrl+"/api/product/remove",{id},{headers:{token}})
    if (response.data.success){
      toast.success(response.data.message)
      await fetchList();
    }
    else{
      toast.error(response.data.message)
    }
  } catch (error) {
    console.error('Error removing product:', error)
    toast.error(error.message)
  }
}



  useEffect(() => {
    fetchList()
    fetchLowStockProducts()
  }, [fetchList, fetchLowStockProducts])

  const getStockStatus = (item) => {
    const available = item.inventory?.available ?? item.stock ?? 0
    const threshold = item.inventory?.lowStockThreshold ?? 10
    
    if (available === 0) {
      return { status: 'out-of-stock', color: 'text-red-600 bg-red-100', text: 'Out of Stock' }
    } else if (available <= threshold) {
      return { status: 'low-stock', color: 'text-orange-600 bg-orange-100', text: 'Low Stock' }
    } else {
      return { status: 'in-stock', color: 'text-green-600 bg-green-100', text: 'In Stock' }
    }
  }

  const getUniqueCategories = () => {
    return [...new Set(list.map(item => item.category))]
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your product inventory and stock levels</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Total Products: {list.length}</span>
          <span>|</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Low Stock Alert */}
      {showLowStockAlert && lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-orange-600">⚠️</span>
              <span className="font-medium text-orange-800">
                {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low on stock
              </span>
            </div>
            <button
              onClick={() => setShowLowStockAlert(false)}
              className="text-orange-600 hover:text-orange-800"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 text-sm text-orange-700">
            {lowStockProducts.slice(0, 3).map(product => product.name).join(', ')}
            {lowStockProducts.length > 3 && ` and ${lowStockProducts.length - 3} more`}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Products</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="category">Category</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Items Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} products
      </div>

      {/* Products Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1fr_1fr_120px] items-center py-3 px-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
          <span>Image</span>
          <span>Product Name</span>
          <span>Category</span>
          <span>Price</span>
          <span>Total Stock</span>
          <span>Available</span>
          <span>Status</span>
          <span>Threshold</span>
          <span className="text-center">Actions</span>
        </div>

        {/* Product Rows */}
        <div className="divide-y divide-gray-200">
          {paginatedList.map((item) => {
            const stockStatus = getStockStatus(item)
            const available = item.inventory?.available ?? item.stock ?? 0
            const total = item.inventory?.total ?? item.stock ?? 0
            const threshold = item.inventory?.lowStockThreshold ?? 10

            return (
              <div
                key={item._id}
                className="grid grid-cols-1 lg:grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1fr_1fr_120px] items-center gap-2 lg:gap-4 p-4 hover:bg-gray-50"
              >
                {/* Image */}
                <img 
                  className="w-16 h-16 object-cover rounded-lg" 
                  src={item.image?.[0]} 
                  alt={item.name} 
                />

                {/* Product Name */}
                <div className="min-w-0">
                  {editing === item._id ? (
                    <input 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={draft.name} 
                      onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} 
                    />
                  ) : (
                    <div>
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">ID: {item._id.slice(-6)}</p>
                    </div>
                  )}
                </div>

                {/* Category */}
                <span className="text-sm text-gray-600">{item.category}</span>

                {/* Price */}
                <div>
                  {editing === item._id ? (
                    <input 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      type="number" 
                      step="0.01"
                      value={draft.price} 
                      onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} 
                    />
                  ) : (
                    <span className="font-medium">{currency}{item.price}</span>
                  )}
                </div>

                {/* Total Stock */}
                <div>
                  {editing === item._id ? (
                    <input 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      type="number" 
                      min="0"
                      value={draft.total} 
                      onChange={e => setDraft(d => ({ ...d, total: e.target.value }))} 
                    />
                  ) : (
                    <span>{total}</span>
                  )}
                </div>

                {/* Available Stock */}
                <div>
                  {editing === item._id ? (
                    <input 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      type="number" 
                      min="0"
                      max={draft.total}
                      value={draft.available} 
                      onChange={e => setDraft(d => ({ ...d, available: e.target.value }))} 
                    />
                  ) : (
                    <span className="font-medium">{available}</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>

                {/* Low Stock Threshold */}
                <div>
                  {editing === item._id ? (
                    <input 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      type="number" 
                      min="0"
                      value={draft.lowStockThreshold} 
                      onChange={e => setDraft(d => ({ ...d, lowStockThreshold: e.target.value }))} 
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{threshold}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  {editing === item._id ? (
                    <>
                      <button 
                        onClick={saveEdit} 
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => startEdit(item)} 
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => removeProduct(item._id)} 
                        className="px-3 py-1 border border-red-300 text-red-600 rounded-md text-sm hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {paginatedList.length === 0 && filteredList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchTerm || filterCategory !== 'all' || filterStock !== 'all'
                ? 'No products match your current filters'
                : 'No products available'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {(() => {
                const pages = []
                const startPage = Math.max(1, currentPage - 2)
                const endPage = Math.min(totalPages, currentPage + 2)
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        currentPage === i
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i}
                    </button>
                  )
                }
                return pages
              })()}
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default list
