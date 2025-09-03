import React,{useEffect,useContext,useState} from 'react'
import Title from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../context/ShopContext'

const LatestCollection = () => {
  const {products} = useContext(ShopContext)
  const [latest, setLatest] = useState([])

  useEffect(()=>{
    setLatest(products.slice(0, 10))
  },[products])
  return (
    <section className="py-4">
      <Title title="Latest Collection" subTitle="New Arrivals" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
        {latest.map(p => (
          <ProductItem key={p._id} product={p} />
        ))}
      </div>
    </section>
  )
}

export default LatestCollection

