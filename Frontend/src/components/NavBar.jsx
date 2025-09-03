import React, { useContext, useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useLocation } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const NavBar = () => {
  const linkBase = 'flex flex-col items-center gap-1'
  const linkText = 'text-[13px] tracking-widest'
  const underline = 'w-8 border-none h-[2px] bg-gray-900 scale-x-0 group-[.active]:scale-x-100 transition-transform'

  const { setShowSearch, cartCount, navigate, token, logout } = useContext(ShopContext)
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()
  
  const handleLogout = async () => {
    setAccountOpen(false)
    setMobileOpen(false)
    setLoggingOut(true)
    
    try {
      await logout()
      // Redirect to home page like real e-commerce platforms (Amazon, eBay, etc.)
      navigate('/')
    } finally {
      setLoggingOut(false)
    }
  }
  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <div className='relative flex items-center justify-between py-3 font-medium'>
      <img src={assets.logo} alt="Forever" className="w-32 sm:w-36 md:w-40" />

      <ul className='hidden sm:flex gap-8 text-sm text-gray-800'>
        <NavLink to="/" className={({ isActive }) => `${linkBase} group ${isActive ? 'active' : ''}`}>
          <p className={linkText}>HOME</p>
          <hr className={underline} />
        </NavLink>
        <NavLink to="/collection" className={({ isActive }) => `${linkBase} group ${isActive ? 'active' : ''}`}>
          <p className={linkText}>COLLECTION</p>
          <hr className={underline} />
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => `${linkBase} group ${isActive ? 'active' : ''}`}>
          <p className={linkText}>ABOUT</p>
          <hr className={underline} />
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => `${linkBase} group ${isActive ? 'active' : ''}`}>
          <p className={linkText}>CONTACT</p>
          <hr className={underline} />
        </NavLink>
      </ul>

      <div className='hidden sm:flex items-center gap-5 text-gray-800'>
        {location.pathname === '/collection' && (
          <button type='button' aria-label='Search' onClick={() => setShowSearch(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
        <div className='relative' ref={menuRef}>
          <button onClick={() => setAccountOpen(v => !v)} aria-label='Account'>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          {accountOpen && (
            <div className='absolute right-0 mt-3 w-48 bg-white border rounded-xl shadow p-2 z-50'>
              {token ? (
                <>
                  <button className='w-full text-left px-3 py-2 rounded hover:bg-gray-50' onClick={() => { setAccountOpen(false); navigate('/profile') }}>My Profile</button>
                  <button className='w-full text-left px-3 py-2 rounded hover:bg-gray-50' onClick={() => { setAccountOpen(false); navigate('/orders') }}>Orders</button>
                  <button className='w-full text-left px-3 py-2 rounded hover:bg-gray-50' onClick={() => { setAccountOpen(false); navigate('/wishlist') }}>Wishlist</button>
                  <button 
                    className='w-full text-left px-3 py-2 rounded hover:bg-gray-50 disabled:opacity-50' 
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <button className='w-full text-left px-3 py-2 rounded hover:bg-gray-50' onClick={() => { setAccountOpen(false); navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`) }}>Sign in</button>
                  <button className='w-full text-left px-3 py-2 rounded hover:bg-gray-50' onClick={() => { setAccountOpen(false); navigate(`/login?mode=signup&next=${encodeURIComponent(location.pathname + location.search)}`) }}>Create account</button>
                </>
              )}
            </div>
          )}
        </div>
        {/* Wishlist Icon */}
        {token && (
          <NavLink to='/wishlist' className='relative' aria-label='Wishlist'>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </NavLink>
        )}
        <NavLink to='/cart' className='relative' aria-label='Cart'>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19M7 13v4a2 2 0 002 2h8a2 2 0 002-2v-4m-8 6h.01M15 19h.01" />
          </svg>
          {cartCount > 0 && (
            <span className='absolute -right-2 -top-2 text-[10px] bg-black text-white rounded-full min-w-4 h-4 px-1 grid place-items-center'>
              {cartCount}
            </span>
          )}
        </NavLink>
      </div>

      {/* Mobile controls */}
      <div className='sm:hidden flex items-center gap-4'>
        {location.pathname === '/collection' && (
          <button type='button' aria-label='Search' onClick={() => setShowSearch(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
        <button type='button' aria-label='Menu' onClick={() => setMobileOpen(v => !v)}>
          {/* 3-lines hamburger */}
          <span className='block w-6 h-[2px] bg-gray-900'></span>
          <span className='block w-6 h-[2px] bg-gray-900 mt-1.5'></span>
          <span className='block w-6 h-[2px] bg-gray-900 mt-1.5'></span>
        </button>
      </div>

      {mobileOpen && (
        <div className='sm:hidden absolute left-0 right-0 top-full bg-white border-t shadow-md z-40'>
          <nav className='px-4 py-3 grid gap-2 text-gray-800'>
            <NavLink to='/' onClick={() => setMobileOpen(false)} className='py-2'>Home</NavLink>
            <NavLink to='/collection' onClick={() => setMobileOpen(false)} className='py-2'>Collection</NavLink>
            <NavLink to='/about' onClick={() => setMobileOpen(false)} className='py-2'>About</NavLink>
            <NavLink to='/contact' onClick={() => setMobileOpen(false)} className='py-2'>Contact</NavLink>
            <div className='h-px bg-gray-100 my-1' />
            {token ? (
              <>
                <button className='text-left py-2' onClick={() => { setMobileOpen(false); navigate('/profile') }}>My Profile</button>
                <button className='text-left py-2' onClick={() => { setMobileOpen(false); navigate('/orders') }}>Orders</button>
                <button className='text-left py-2' onClick={() => { setMobileOpen(false); navigate('/wishlist') }}>Wishlist</button>
                <button 
                  className='text-left py-2 disabled:opacity-50' 
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <button className='text-left py-2' onClick={() => { setMobileOpen(false); navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`) }}>Sign in</button>
                <button className='text-left py-2' onClick={() => { setMobileOpen(false); navigate(`/login?mode=signup&next=${encodeURIComponent(location.pathname + location.search)}`) }}>Create account</button>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}

export default NavBar
