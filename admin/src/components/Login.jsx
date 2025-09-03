import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../config'
import { toast } from 'react-toastify'

const Login = ({setToken}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmitHandler=async (e)=>{
    try {
      e.preventDefault();
        const response=await axios.post(backendUrl + '/api/user/admin/login', {
          email,password
        })
       if(response.data.success)
        setToken(response.data.token)
      else{
       toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Panel</h1>
        <form onSubmit={onSubmitHandler}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">Email Address</label>
            <input onChange={(e) => setEmail(e.target.value)} value={email}
              id="email"
              type="email"
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
            <input onChange={(e) => setPassword(e.target.value)} value={password}
              id="password"
              type="password"
              placeholder="********"
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
