import React, { useContext, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import { useLocation } from 'react-router-dom'

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch, backendUrl, navigate } = useContext(ShopContext)
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    if (location.pathname.includes('collection') && showSearch) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [location, showSearch])

  // Hide search bar when navigating away from collection page
  useEffect(() => {
    if (!location.pathname.includes('collection')) {
      setShowSearch(false)
    }
  }, [location.pathname, setShowSearch])

  // Debounced search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search.trim() && search.length >= 2) {
        fetchSuggestions(search.trim())
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (query) => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/product/suggestions?q=${encodeURIComponent(query)}&limit=8`)
      
      if (res.data.success) {
        setSuggestions(res.data.suggestions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion.value)
    setShowSuggestions(false)
    
    // Navigate to collection page if not already there
    if (!location.pathname.includes('collection')) {
      navigate('/collection')
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    
    // Navigate to collection page if not already there
    if (!location.pathname.includes('collection')) {
      navigate('/collection')
    }
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return showSearch && visible ? (
    <div className="border-t border-b bg-gray-50 text-center relative">
      <form onSubmit={handleSearchSubmit} className="inline-block relative">
        <div 
          ref={searchRef}
          className="inline-flex items-center justify-center border border-gray-400 px-3 py-2 my-3 rounded-full gap-2 bg-white w-full max-w-md"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleInputFocus}
            className="flex-1 outline-none bg-transparent text-sm min-w-0"
            placeholder="Search products, categories..."
            autoComplete="off"
          />
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
            <button type="submit">
              <img className="w-4" src={assets.search_icon} alt="Search" />
            </button>
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-shrink-0">
                  {suggestion.type === 'product' && (
                    <img className="w-4 h-4" src={assets.search_icon} alt="" />
                  )}
                  {suggestion.type === 'category' && (
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs text-blue-600">C</span>
                    </div>
                  )}
                  {suggestion.type === 'subcategory' && (
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs text-green-600">S</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{suggestion.value}</div>
                  <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      <img
        onClick={() => {
          setShowSearch(false)
          setShowSuggestions(false)
        }}
        className="inline w-3 cursor-pointer ml-3 align-middle"
        src={assets.cross_icon}
        alt="close"
      />
    </div>
  ) : null
}

export default SearchBar


