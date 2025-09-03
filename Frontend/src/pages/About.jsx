import React from 'react'
import { assets } from '../assets/assets'
import Title from '../components/Title'


const About = () => {
  return (
    <div className="py-6">
      <Title subTitle="About" title="Who we are" />

      <section className="grid md:grid-cols-2 gap-6 items-center">
        <img
          src={assets.about_img}
          alt="About our brand"
          className="w-full rounded-2xl border border-gray-200"
        />

        <div>
          <p className="text-gray-600 mt-2 leading-7 capitalize">
            Forever Was Born Out Of A Passion For Innovation And A Desire To Revolutionize The Way
            People Shop Online. Our Journey Began With A Simple Idea: To Provide A Platform Where
            Customers Can Easily Discover, Explore, And Purchase A Wide Range Of Products From The
            Comfort Of Their Homes.
          </p>

          <p className="text-gray-600 mt-5 leading-7 capitalize">
            Since Our Inception, We've Worked Tirelessly To Curate A Diverse Selection Of High-Quality
            Products That Cater To Every Taste And Preference. From Fashion And Beauty To Electronics
            And Home Essentials, We Offer An Extensive Collection Sourced From Trusted Brands And
            Suppliers.
          </p>

          <h3 className="text-base sm:text-lg font-medium mt-6">Our Mission</h3>
          <p className="text-gray-600 mt-2 leading-7 capitalize">
            Our Mission At Forever Is To Empower Customers With Choice, Convenience, And Confidence.
            We're Dedicated To Providing A Seamless Shopping Experience That Exceeds Expectations,
            From Browsing And Ordering To Delivery And Beyond.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-3">
          <h3 className="font-display uppercase tracking-widest text-sm sm:text-base font-semibold">Why choose us</h3>
          <span className="h-[2px] w-10 bg-gray-900" />
        </div>
        <div className="mt-4 rounded-2xl border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="p-6 sm:p-8 bg-white">
              <div className="uppercase font-medium text-sm">Quality assurance:</div>
              <p className="text-gray-600 text-sm mt-2 leading-7 capitalize">
                We Meticulously Select And Vet Each Product To Ensure It Meets Our Stringent Quality Standards.
              </p>
            </div>
            <div className="p-6 sm:p-8 bg-white">
              <div className="uppercase font-medium text-sm">Convenience:</div>
              <p className="text-gray-600 text-sm mt-2 leading-7 capitalize">
                With Our User-Friendly Interface And Hassle-Free Ordering Process, Shopping Has Never Been Easier.
              </p>
            </div>
            <div className="p-6 sm:p-8 bg-white">
              <div className="uppercase font-medium text-sm">Exceptional customer service:</div>
              <p className="text-gray-600 text-sm mt-2 leading-7 capitalize">
                Our Team Of Dedicated Professionals Is Here To Assist You The Way, Ensuring Your Satisfaction Is Our Top Priority.
              </p>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  )
}

export default About
