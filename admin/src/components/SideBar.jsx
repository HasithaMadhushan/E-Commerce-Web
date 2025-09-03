import React from 'react'
import { NavLink } from 'react-router-dom'
import {assets} from '../assets/assets'

const SideBar = () => {
  return (
    <div className='w-[18%] min-h-screen border-r-2'>
      <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>
        
          <NavLink className='flex item-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1' to = "/analytics">
            <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className='hidden md:block'>Analytics</p>
          </NavLink>

          <NavLink className='flex item-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1' to = "/add">
            <img className='w-5 h-5' src={assets.add_icon} alt="" />
            <p className='hidden md:block'>Add Items</p>
          </NavLink>

          <NavLink className='flex item-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1' to = "/list">
            <img className='w-5 h-5' src={assets.order_icon} alt="" />
            <p className='hidden md:block'>Inventory</p>
          </NavLink>

          <NavLink className='flex item-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1' to = "/orders">
            <img className='w-5 h-5' src={assets.order_icon} alt="" />
            <p className='hidden md:block'>Orders</p>
          </NavLink>

          <NavLink className='flex item-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1' to = "/coupons">
            <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className='hidden md:block'>Coupons</p>
          </NavLink>

          <NavLink className='flex item-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1' to = "/reviews">
            <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className='hidden md:block'>Reviews</p>
          </NavLink>
        
      
      </div>
      
    </div>
  )
}

export default SideBar
