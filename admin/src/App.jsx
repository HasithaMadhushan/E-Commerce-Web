
import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import Login from './components/Login'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SideBar from './components/SideBar';
import Add from './pages/add';
import List from './pages/list';
import Orders from './pages/orders';
import Coupons from './pages/coupons';
import Analytics from './pages/analytics';
import Reviews from './pages/reviews';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken')?localStorage.getItem('adminToken'):'')

  useEffect(() => {
    localStorage.setItem('adminToken',token) 
  },[token])     
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer/>
      {token === '' ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <NavBar setToken={setToken}/>
          <hr/>
          <div className='flex w-full'>
            <SideBar/>
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path="/" element={<Navigate to="/analytics" replace />} />
                <Route path="/add" element={<Add token={token}/>}/>
                <Route path="/list" element={<List token={token}/>}/>
                <Route path="/orders" element={<Orders token={token}/>}/>
                <Route path="/coupons" element={<Coupons token={token}/>}/>
                <Route path="/reviews" element={<Reviews token={token}/>}/>
                <Route path="/analytics" element={<Analytics token={token}/>}/>
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App