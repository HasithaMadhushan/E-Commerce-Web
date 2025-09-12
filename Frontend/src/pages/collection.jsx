import React, { useContext, useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { ShopContext } from "../context/ShopContext"
import Title from "../components/Title"
import ProductItem from "../components/ProductItem"

const collection = () => {
  const { search, setSearch, setShowSearch, backendUrl } = useContext(ShopContext)
  
  // State for products and filters
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedSubCategories, setSelectedSubCategories] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')
  const [inStock, setInStock] = useState('')
  const [bestseller, setBestseller] = useState('')
  const [featured, setFeatured] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  
  // Available filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    subCategories: [],
    sizes: [],
    priceRange: { minPrice: 0, maxPrice: 0 }
  })

  // Load filter options on collection page
  useEffect(() => { 
    loadFilterOptions()
  }, [])

  // Load available filter options
  const loadFilterOptions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/product/filters`)
      if (res.data.success) {
        setFilterOptions(res.data.filters)
      }
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }

  // Search products with filters
  const searchProducts = async (page = 1) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (search.trim()) params.append('q', search.trim())
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','))
      if (selectedSubCategories.length > 0) params.append('subCategory', selectedSubCategories.join(','))
      if (selectedSizes.length > 0) params.append('sizes', selectedSizes.join(','))
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (minRating) params.append('minRating', minRating)
      if (inStock) params.append('inStock', inStock)
      if (bestseller) params.append('bestseller', bestseller)
      if (featured) params.append('featured', featured)
      if (sortBy) params.append('sort', sortBy)
      
      const res = await axios.get(`${backendUrl}/api/product/search?${params.toString()}`)
      
      if (res.data.success) {
        setProducts(res.data.products)
        setPagination(res.data.pagination)
      } else {
        // Fallback to context products if search fails
        console.log('Search failed, using context products...')
        const contextProducts = await new Promise(resolve => {
          // Get products from context
          setTimeout(() => resolve(products), 100)
        })
        setProducts(contextProducts)
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: contextProducts.length,
          hasNext: false,
          hasPrev: false
        })
      }
    } catch (error) {
      console.error('Error searching products:', error)
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment before searching again.')
        // Use context products as fallback
        setProducts(products)
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: products.length,
          hasNext: false,
          hasPrev: false
        })
      } else {
        // For other errors, try context products
        try {
          setProducts(products)
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalProducts: products.length,
            hasNext: false,
            hasPrev: false
          })
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
          setProducts([])
          toast.error('Unable to load products. Please refresh the page.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      searchProducts(1)
    }, 800) // Increased debounce to reduce API calls

    return () => clearTimeout(timeoutId)
  }, [search, selectedCategories, selectedSubCategories, selectedSizes, minPrice, maxPrice, minRating, inStock, bestseller, featured, sortBy])

  // Search when page changes
  useEffect(() => {
    if (currentPage > 1) {
      searchProducts(currentPage)
    }
  }, [currentPage])

  const clearAll = () => {
    setSearch('')
    setSelectedCategories([])
    setSelectedSubCategories([])
    setSelectedSizes([])
    setMinPrice('')
    setMaxPrice('')
    setMinRating('')
    setInStock('')
    setBestseller('')
    setFeatured('')
    setSortBy('relevance')
    setCurrentPage(1)
  }

  const toggleInArray = (arr, value, setter) => {
    setter(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value])
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [showMobileFilters, setShowMobileFilters] = useState(false)

  return (
    <div className="py-6">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg bg-white"
        >
          <span className="font-medium">Filters & Sort</span>
          <svg className={`w-5 h-5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Filters sidebar */}
        <aside className={`md:w-64 w-full md:sticky md:top-6 md:self-start border border-gray-200 rounded-xl p-4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={clearAll} className="text-xs text-gray-600 hover:text-gray-900 underline">Clear all</button>
          </div>

        {/* Removed page-level search: using global navbar search */}

        {/* Category */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Category</div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.categories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleInArray(selectedCategories, cat, setSelectedCategories)}
                className={`px-3 py-1 rounded-full text-xs border ${selectedCategories.includes(cat) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Subcategory</div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => toggleInArray(selectedSubCategories, sub, setSelectedSubCategories)}
                className={`px-3 py-1 rounded-full text-xs border ${selectedSubCategories.includes(sub) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Sizes</div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.sizes.map(sz => (
              <button
                key={sz}
                onClick={() => toggleInArray(selectedSizes, sz, setSelectedSizes)}
                className={`px-2.5 py-1 rounded-md text-xs border ${selectedSizes.includes(sz) ? 'bg-gray-100 border-gray-900 text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Price Range</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 border border-gray-300 rounded-md px-2 py-1 text-sm"
              placeholder={`Min (${filterOptions.priceRange.minPrice})`}
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 border border-gray-300 rounded-md px-2 py-1 text-sm"
              placeholder={`Max (${filterOptions.priceRange.maxPrice})`}
            />
          </div>
        </div>

        {/* Rating */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Minimum Rating</div>
          <div className="flex gap-2">
            {[4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                onClick={() => setMinRating(minRating === rating.toString() ? '' : rating.toString())}
                className={`px-2 py-1 rounded-md text-xs border flex items-center gap-1 ${
                  minRating === rating.toString() 
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800' 
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <span>{rating}</span>
                <span className="text-yellow-500">★</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Availability</div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stock"
                checked={inStock === ''}
                onChange={() => setInStock('')}
                className="text-gray-600"
              />
              <span className="text-sm">All Products</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stock"
                checked={inStock === 'true'}
                onChange={() => setInStock('true')}
                className="text-gray-600"
              />
              <span className="text-sm">In Stock</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stock"
                checked={inStock === 'false'}
                onChange={() => setInStock('false')}
                className="text-gray-600"
              />
              <span className="text-sm">Out of Stock</span>
            </label>
          </div>
        </div>

        {/* Special Filters */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Special</div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bestseller === 'true'}
                onChange={(e) => setBestseller(e.target.checked ? 'true' : '')}
                className="text-gray-600"
              />
              <span className="text-sm">Bestsellers</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={featured === 'true'}
                onChange={(e) => setFeatured(e.target.checked ? 'true' : '')}
                className="text-gray-600"
              />
              <span className="text-sm">Featured</span>
            </label>
          </div>
        </div>
      </aside>

      {/* Right content */}
      <section className="flex-1">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex-1"><Title title="Latest Collections" subTitle="Latest" /></div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="relevance">Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Results info */}
        <div className="text-sm text-gray-500 mb-3">
          {loading ? 'Searching...' : `${pagination.totalProducts || 0} items`}
          {search && (
            <span className="ml-2">
              for "<span className="font-medium">{search}</span>"
            </span>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Searching products...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {search 
                ? `No products match your search for "${search}"`
                : 'No products match your current filters'
              }
            </p>
            <button
              onClick={clearAll}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 auto-rows-fr">
            {products.map(p => (
              <ProductItem key={p._id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-1">
              {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
                let page
                if (pagination.totalPages <= 7) {
                  page = i + 1
                } else if (currentPage <= 4) {
                  page = i + 1
                } else if (currentPage >= pagination.totalPages - 3) {
                  page = pagination.totalPages - 6 + i
                } else {
                  page = currentPage - 3 + i
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-md text-sm ${
                      currentPage === page
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
      </div>
    </div>
  )
}

export default collection
