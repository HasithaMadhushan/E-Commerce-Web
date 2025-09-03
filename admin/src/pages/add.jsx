import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../config'
import { toast } from 'react-toastify'


const add = ({token}) => {

  const[image1,setImage1] = useState(false)
  const[image2,setImage2] = useState(false)
  const[image3,setImage3] = useState(false)
  const[image4,setImage4] = useState(false)

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Men');
  const [subCategory, setSubCategory] = useState('Topwear');
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [stock, setStock] = useState('0');
  const onSubmitHandler = async (e) => {
e.preventDefault();

try {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('category', category);
  formData.append('subCategory', subCategory);
  formData.append('bestseller', bestseller);
  formData.append('stock', stock);
  formData.append('sizes', JSON.stringify(sizes));

  image1 && formData.append('image1', image1);
  image2 && formData.append('image2', image2);
  image3 && formData.append('image3', image3);
  image4 && formData.append('image4', image4);

  const response = await axios.post(backendUrl+"/api/product/add", formData,{headers:{token}})

if (response?.data?.success){
  toast.success(response.data.message)
  setName('')
  setDescription('')
  setPrice('')
  setStock('0')
  setSizes([])
  setImage1(false)
  setImage2(false)
  setImage3(false)
  setImage4(false)

}else{
  toast.error(response.data.message)
}
  
} catch (error) {
  console.error('Error adding product:', error);
  toast.error(error.message)
}
  }


  return (
    <form onSubmit = {onSubmitHandler} className='w-full'>
    <div className='bg-white rounded-lg shadow-sm border p-6'>
      <h2 className='text-xl font-semibold text-gray-800 mb-4'>Upload Image</h2>
      <div className='flex flex-wrap gap-3'>

        <label htmlFor='image1' className='cursor-pointer'>
        <img className='w-24 h-24 rounded-md border object-cover' src={!image1 ? assets.upload_area:URL.createObjectURL(image1)} alt="" />
        <input onChange={(e)=>setImage1(e.target.files[0])} type="file" id="image1" hidden />
        </label>

        <label htmlFor='image2' className='cursor-pointer'>
        <img className='w-24 h-24 rounded-md border object-cover' src={!image2 ? assets.upload_area:URL.createObjectURL(image2)} alt="" />
        <input onChange={(e)=>setImage2(e.target.files[0])} type="file" id="image2" hidden />
        </label>

        <label htmlFor='image3' className='cursor-pointer'>
        <img className='w-24 h-24 rounded-md border object-cover' src={!image3 ? assets.upload_area:URL.createObjectURL(image3)} alt="" />
        <input onChange={(e)=>setImage3(e.target.files[0])} type="file" id="image3" hidden />
        </label>

        <label htmlFor='image4' className='cursor-pointer'>
        <img className='w-24 h-24 rounded-md border object-cover' src={!image4 ? assets.upload_area:URL.createObjectURL(image4)} alt="" />
        <input onChange={(e)=>setImage4(e.target.files[0])} type="file" id="image4" hidden />
        </label>
      </div>
    </div>
    <div className='w-full bg-white rounded-lg shadow-sm border p-6 mt-6'>
      <label className='block text-sm text-gray-600 mb-2'>Product Name</label>
      <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[600px] px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-300' type="text" placeholder='type here'/>
    </div>
    <div className='w-full bg-white rounded-lg shadow-sm border p-6 mt-6'>
      <label className='block text-sm text-gray-600 mb-2'>Description</label>
      <textarea onChange={(e)=>setDescription(e.target.value)} value={description} className='w-full max-w-[600px] px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-300' type="text" placeholder='Write' />
    </div>

    <div className='w-full grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-lg shadow-sm border p-6 mt-6'>

      <div>
      <label className='block text-sm text-gray-600 mb-2'>Product category</label>
      <select onChange={(e)=>setCategory(e.target.value)} className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-300'>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
        <option value="Kids">Kids</option>
      </select>

      </div>
      <div>
      <label className='block text-sm text-gray-600 mb-2'>Sub Category</label>
      <select onChange={(e)=>setSubCategory(e.target.value)} className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-300'>
        <option value="Topwear">Topwear</option>
        <option value="Bottomwear">Bottomwear</option>
        <option value="Winterwear">Winterwear</option>
      </select>
      </div>

      <div>
        <label className='block text-sm text-gray-600 mb-2'>Product Price</label>
        <input  onChange={(e)=>setPrice(e.target.value)} value={price} className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-300' type='number' placeholder='25'/>
        </div>
      <div>
        <label className='block text-sm text-gray-600 mb-2'>Stock</label>
        <input onChange={(e)=>setStock(e.target.value)} value={stock} className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-300' type='number' min='0' placeholder='0'/>
      </div>
    </div>

    <div className='bg-white rounded-lg shadow-sm border p-6 mt-6'>
    <p className='mb-3 text-sm text-gray-600'>Product Sizes</p>
    <div className='flex flex-wrap gap-3'>
      <div onClick={()=>setSizes(prev=>prev.includes('S')?prev.filter(item=>item!=='S'): [...prev,'S'])}>
        <p className={`${sizes.includes('S') ? 'bg-pink-100 border-pink-300' : 'bg-slate-200 border-slate-300'} px-3 py-1 cursor-pointer rounded border`}>S</p>
        </div>
      <div onClick={()=>setSizes(prev=>prev.includes('M')?prev.filter(item=>item!=='M'): [...prev,'M'])}>
        <p className={`${sizes.includes('M') ? 'bg-pink-100 border-pink-300' : 'bg-slate-200 border-slate-300'} px-3 py-1 cursor-pointer rounded border`}>M</p>      
        </div>
      <div onClick={()=>setSizes(prev=>prev.includes('L')?prev.filter(item=>item!=='L'): [...prev,'L'])}>
        <p className={`${sizes.includes('L') ? 'bg-pink-100 border-pink-300' : 'bg-slate-200 border-slate-300'} px-3 py-1 cursor-pointer rounded border`}>L</p>      
        </div>
        <div onClick={()=>setSizes(prev=>prev.includes('XL')?prev.filter(item=>item!=='XL'): [...prev,'XL'])}>
          <p className={`${sizes.includes('XL') ? 'bg-pink-100 border-pink-300' : 'bg-slate-200 border-slate-300'} px-3 py-1 cursor-pointer rounded border`}>XL</p>      
        </div>
        <div onClick={()=>setSizes(prev=>prev.includes('XXL')?prev.filter(item=>item!=='XXL'): [...prev,'XXL'])}>
          <p className={`${sizes.includes('XXL') ? 'bg-pink-100 border-pink-300' : 'bg-slate-200 border-slate-300'} px-3 py-1 cursor-pointer rounded border`}>XXL</p>      
        </div>
      </div>
    </div>

      <div className='flex items-center gap-2 mt-6 bg-white rounded-lg shadow-sm border p-4'>
        <input  onChange={(e)=>setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestSeller' />
        <label className='cursor-pointer text-sm text-gray-700' htmlFor="bestSeller">Add to Bestseller</label>
    </div>
    
    <div className='mt-6'>
      <button type ='submit' className='w-36 bg-gray-900 hover:bg-black transition text-white py-3 rounded-md'>Add Product</button>
    </div>

  </form>
  )

}

export default add
