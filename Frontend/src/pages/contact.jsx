import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <div className="py-6">
      <div className="flex items-center gap-3">
        <h3 className="font-display uppercase tracking-widest text-sm sm:text-base font-semibold">Contact us</h3>
        <span className="h-[2px] w-10 bg-gray-900" />
      </div>

      <section className="mt-4 grid md:grid-cols-2 gap-6 items-start">
        <img
          src={assets.contact_img}
          alt="Contact"
          className="w-full rounded-2xl border border-gray-200"
        />

        <div>
          <div>
            <div className="uppercase tracking-wide text-sm font-medium">Our store</div>
            <div className="mt-3 space-y-2 text-gray-600">
              <p>43/1a Kandy Road</p>
              <p>Yakkala, Sri Lanka</p>
              <p>Tel: (415) 555-0132</p>
              <p>Email: vervesupport@gmail.com</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="uppercase tracking-wide text-sm font-medium">Careers at Forever</div>
            <p className="text-gray-600 mt-2">Interested in joining our team? Send us your CV via WhatsApp and we'll get back to you.</p>
            {(() => {
              const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '')
              const message = encodeURIComponent('Hello! I would like to apply for a job. Here is my CV.')
              const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${message}` : null
              return (
                <div className="inline-flex items-center mt-4 gap-3">
                  <a
                    href={whatsappUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-4 py-2 rounded-lg border text-sm ${whatsappUrl ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}
                    aria-disabled={!whatsappUrl}
                  >
                    <img src={assets.whatsapp_icon} alt="WhatsApp" className="w-5 h-5 mr-2" />
                    WhatsApp
                  </a>
                  
                </div>
              )
            })()}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
