import React from 'react'
import { assets } from '../assets/assets'

const PolicyCard = ({ icon, title, description }) => (
  <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl bg-white">
    <img src={icon} alt="" className="w-10 h-10" />
    <div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </div>
  </div>
)

const OurPolicy = () => {
  return (
    <section className="py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PolicyCard icon={assets.quality_icon} title="Top Quality" description="Premium fabrics and craftsmanship" />
        <PolicyCard icon={assets.exchange_icon} title="Easy Exchange" description="Hassle-free returns and exchanges" />
        <PolicyCard icon={assets.support_img} title="24/7 Support" description="We’re here whenever you need us" />
      </div>
    </section>
  )
}

export default OurPolicy

