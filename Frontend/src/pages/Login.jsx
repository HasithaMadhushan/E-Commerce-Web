import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, setToken, backendUrl } = useContext(ShopContext)
  const [mode, setMode] = useState(() => (new URLSearchParams(location.search).get('mode') === 'signup' ? 'Sign Up' : 'Login')) // 'Login' | 'Sign Up'
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password || (mode === 'Sign Up' && (!form.firstName || !form.lastName))) return
    setLoading(true)
    try {
      if (mode === 'Sign Up') {
        const res = await axios.post(`${backendUrl}/api/user/register`, { name: `${form.firstName} ${form.lastName}`.trim(), email: form.email, password: form.password })
        if (res.data.success && res.data.token) {
          setToken(res.data.token)
          localStorage.setItem('token', res.data.token)
          toast.success('Registration successful!')
          const next = new URLSearchParams(location.search).get('next')
          navigate(next || '/')
        } else {
          toast.error(res.data.message || 'Registration failed')
        }
      } else {
        const res = await axios.post(`${backendUrl}/api/user/login`, { email: form.email, password: form.password })
        if (res.data.success && res.data.token) {
          setToken(res.data.token)
          localStorage.setItem('token', res.data.token)
          toast.success('Logged in')
          const next = new URLSearchParams(location.search).get('next')
          navigate(next || '/')
        } else {
          toast.error(res.data.message || 'Login failed')
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      const next = new URLSearchParams(location.search).get('next')
      navigate(next || '/')
    }
  }, [token, navigate, location.search])

  return (
    <div className="min-h-[80vh] sm:min-h-[calc(100vh-0px)] flex items-center justify-center py-10">
      <form onSubmit={onSubmit} className="flex flex-col items-center w-[90%] sm:max-w-md m-auto gap-4 border rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 mb-1">
          <p className="font-display text-3xl">{mode}</p>
          <span className="border-none h-[2px] w-8 bg-gray-800" />
        </div>

        {mode === 'Login' ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              className="form-input w-full px-3 py-3 border border-gray-300 rounded"
              placeholder="First name"
            />
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              className="form-input w-full px-3 py-3 border border-gray-300 rounded"
              placeholder="Last name"
            />
          </div>
        )}

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          className="form-input w-full px-3 py-3 border border-gray-300 rounded"
          placeholder="Email address"
          required
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          className="form-input w-full px-3 py-3 border border-gray-300 rounded"
          placeholder="Password"
          required
        />

        <div className="w-full flex justify-between text-sm -mt-1">
          <span className="text-gray-600 cursor-pointer">Forgot your password?</span>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white rounded-md py-3 text-sm disabled:opacity-60 touch-target">
          {loading ? 'Please wait…' : (mode === 'Login' ? 'Login' : 'Create account')}
        </button>

        <div className="text-sm text-gray-700">
          {mode === 'Login' ? (
            <p onClick={() => setMode('Sign Up')} className="cursor-pointer">Create account</p>
          ) : (
            <p onClick={() => setMode('Login')} className="cursor-pointer">Login here</p>
          )}
        </div>
      </form>
    </div>
  )
}

export default Login
