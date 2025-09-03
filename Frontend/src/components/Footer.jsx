import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <footer className="mt-14 border-t border-gray-800 -mx-4 sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw] bg-black">
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand + blurb */}
          <div className="md:col-span-4">
            <img src={assets.logo} alt="Forever" className="w-36 mb-4 filter brightness-0 invert" />
            <p className="text-sm leading-6 text-gray-300 max-w-md">
              Everyday essentials and curated pieces designed to last. Thoughtful materials, timeless silhouettes, and comfort‑first fits.
            </p>
            <div className="mt-6 flex items-center gap-5">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="opacity-70 hover:opacity-100 transition">
                <img src={assets.facebook_icon} alt="Facebook" className="w-7 h-7" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="opacity-70 hover:opacity-100 transition">
                <img src={assets.instagram_icon} alt="Instagram" className="w-7 h-7" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="opacity-70 hover:opacity-100 transition">
                <img src={assets.tiktok_icon} alt="TikTok" className="w-7 h-7" />
              </a>

            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xs tracking-widest text-gray-400 mb-4">SHOP</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="/collection" className="hover:text-white transition">Collection</a></li>
                <li><a href="/" className="hover:text-white transition">Home</a></li>
                <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs tracking-widest text-gray-400 mb-4">COMPANY</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="/about" className="hover:text-white transition">About us</a></li>
                <li><a href="/privacy" className="hover:text-white transition">Privacy policy</a></li>
                <li><a href="/contact" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs tracking-widest text-gray-400 mb-4">RESOURCES</h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><a href="/profile" className="hover:text-white transition">My account</a></li>
                <li><a href="/orders" className="hover:text-white transition">Orders</a></li>
                <li><a href="/cart" className="hover:text-white transition">Cart</a></li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h4 className="text-xs tracking-widest text-gray-400 mb-4">GET IN TOUCH</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>+1-212-456-7890</li>
              <li>vervesupport@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="my-10 h-px bg-gray-700" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Forever. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-white transition">Privacy</a>
            <span className="h-3 w-px bg-gray-600" />
            <a href="/terms" className="hover:text-white transition">Terms</a>
            <span className="h-3 w-px bg-gray-600" />
            <a href="/contact" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

