import React from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import Home from "./pages/home"
import About from "./pages/About"
import Contact from "./pages/contact"
import Collection from "./pages/collection"
import Login from "./pages/Login"
import Product from "./pages/product"
import PlaceOder from "./pages/PlaceOder"
import Orders from "./pages/Orders"
import Cart from "./pages/Cart"
import Verify from "./pages/verify"
import Profile from "./pages/Profile"
import Wishlist from "./pages/Wishlist"
import NavBar from "./components/NavBar"
import SearchBar from "./components/SearchBar"
import Footer from "./components/Footer"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/notifications.css";


const App = () => {
  const location = useLocation()
  const hideFooter = location.pathname === '/login'
  const hideHeader = location.pathname === '/login'
  return( 
  <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
    <ToastContainer 
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      limit={3}
      toastClassName="custom-toast"
      bodyClassName="custom-toast-body"
      progressClassName="custom-toast-progress"
    />
       {!hideHeader && <NavBar/>}
       {!hideHeader && <SearchBar/>}

       <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:productID" element={<Product />} />
        <Route path="/place-order" element={<PlaceOder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/verify" element={<Verify />} />
       </Routes>
       {!hideFooter && <Footer/>}
       
  </div>
  )
}

export default App
