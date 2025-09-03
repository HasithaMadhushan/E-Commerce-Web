import React,{useEffect,useContext,useState} from 'react'
import Title from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../context/ShopContext'

const BestSeller = () => {
  const { products } = useContext(ShopContext)
  const best = (products || []).filter(p => p.bestseller).slice(0, 8)
  return (
    <section className="py-4">
      <Title title="Best Sellers" subTitle="Popular Right Now" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
        {best.map(p => (
          <ProductItem key={p._id} product={p} />
        ))}
      </div>
    </section>
  )
}

export default BestSeller

