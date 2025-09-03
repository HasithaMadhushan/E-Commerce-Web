import React from 'react'
import { assets } from '../assets/assets'

const Hero = () => {
  return (
    <section
      className="hero-section relative overflow-hidden min-h-[75vh] sm:min-h-[85vh] lg:min-h-[95vh]"
      style={{
        backgroundImage: `url(${assets.hero_img}), radial-gradient(1200px 800px at 80% 50%, rgba(59,130,246,0.18), rgba(16,185,129,0.18) 45%, rgba(15,23,42,0.08) 100%)`,
        backgroundSize: undefined,
        backgroundPosition: undefined,
        backgroundRepeat: undefined
      }}
    >
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-14 sm:py-20 lg:py-28 flex min-h-[inherit] items-end">
        {/* Mobile: bottom-centered single CTA */}
        <div className="w-full sm:hidden flex justify-center">
          <a href="/collection" className="mb-6 px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium shadow-md">
            Shop Now
          </a>
        </div>

        {/* Desktop/tablet: full headline, description, and actions */}
        <div className="max-w-2xl hidden sm:block">
          <h1 className="font-display text-black text-3xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
          Your Signature Style Starts Here
          </h1>
          <p className="mt-4 text-black/90">
          Verve brings effortless fashion for every moment.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="/collection" className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-black transition">
              Shop Now
            </a>
            <a href="/about" className="px-5 py-2.5 rounded-full border border-black text-black text-sm backdrop-blur-sm bg-white/10 hover:bg-white/20 transition">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero