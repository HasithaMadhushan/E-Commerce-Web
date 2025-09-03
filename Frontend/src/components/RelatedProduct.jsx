import React, { useContext, useMemo } from 'react'
import Title from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../context/ShopContext'

const RelatedProduct = ({ category, subCategory, excludeId }) => {
  const { products } = useContext(ShopContext)

  const related = useMemo(() => {
    if (!products || products.length === 0) return []
    const filtered = products.filter(item =>
      item._id !== excludeId &&
      item.category === category &&
      item.subCategory === subCategory
    )
    return filtered.slice(0, 5)
  }, [products, category, subCategory, excludeId])

  if (related.length === 0) return null

  return (
    <section className="mt-10">
      <Title title="Related Products" subTitle="Related" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
        {related.map((item) => (
          <ProductItem key={item._id} product={item} />
        ))}
      </div>
    </section>
  )
}

export default RelatedProduct

