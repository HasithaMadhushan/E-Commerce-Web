import React from 'react'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const NavBar = ({ setToken }) => {
  const handleLogout = () => {
    // Clear admin token
    setToken("")
    localStorage.removeItem('adminToken')
    toast.success('Logged out successfully')
  }

  return (
    <div className='flex items-center justify-between px-[4%] py-2'>
      {/* assets imported from src/assets/assets */}
      <img className='w-[max(10%,80px)]' src={assets.logo} alt="" />
      <button
        onClick={handleLogout}
        className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm hover:bg-gray-700 transition-colors'
      >
        Logout
      </button>
    </div>
  )
}

export default NavBar
