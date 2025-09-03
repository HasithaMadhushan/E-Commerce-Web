import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'

const Profile = () => {
  const { backendUrl, token, navigate, authInitialized } = useContext(ShopContext)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  })
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Email preferences state
  const [emailPrefs, setEmailPrefs] = useState({
    marketing: true,
    orderUpdates: true,
    promotions: true
  })
  
  // Addresses state
  const [addresses, setAddresses] = useState([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState({
    type: 'shipping',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false
  })

  const loadProfile = async () => {
    if (!token) {
      navigate('/login?next=/profile')
      return
    }
      
    try {
      setProfileLoading(true)
      const res = await axios.get(`${backendUrl}/api/user/profile`, { headers: { token } })
      if (res.data.success && res.data.user) {
        const u = res.data.user
        setUser(u)
        
        // Parse name
        const full = (u.name || '').trim()
        const parts = full.split(/\s+/)
        const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : full
        const last = parts.length > 1 ? parts.slice(-1).join(' ') : ''
        
        setProfileForm({
          firstName: first,
          lastName: last,
          email: u.email || '',
          phone: u.phone || '',
          dateOfBirth: u.profile?.dateOfBirth ? new Date(u.profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: u.profile?.gender || ''
        })
        
        setEmailPrefs({
          marketing: u.emailPreferences?.marketing ?? true,
          orderUpdates: u.emailPreferences?.orderUpdates ?? true,
          promotions: u.emailPreferences?.promotions ?? true
        })
        
        setAddresses(u.addresses || [])
      }
    } catch (error) {
      console.log('Error loading profile:', error.message)
      toast.error('Failed to load profile information')
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => { 
    if (!authInitialized) return
    
    if (token) {
      loadProfile()
    } else {
      navigate('/login?next=/profile')
    }
  }, [token, navigate, authInitialized])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Construct name properly - ensure we have at least first name
      const firstName = profileForm.firstName?.trim() || ''
      const lastName = profileForm.lastName?.trim() || ''
      const fullName = `${firstName} ${lastName}`.trim()
      
      if (!firstName) {
        toast.error('First name is required')
        setLoading(false)
        return
      }
      
      const updateData = {
        name: fullName,
        phone: profileForm.phone?.trim() || '',
        profile: {
          dateOfBirth: profileForm.dateOfBirth || null,
          gender: profileForm.gender || null
        },
        emailPreferences: emailPrefs
      }
      
      console.log('Sending profile update data:', updateData)
      
      const res = await axios.put(`${backendUrl}/api/user/profile`, updateData, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Profile updated successfully')
        loadProfile() // Reload to get updated data
      } else {
        toast.error(res.data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      if (error.response?.data?.errors) {
        // Show specific validation errors
        error.response.data.errors.forEach(err => toast.error(err))
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.response?.status >= 500) {
        toast.error('Server error occurred')
      } else {
        toast.error('Failed to update profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    
    try {
      setLoading(true)
      
      const res = await axios.post(`${backendUrl}/api/user/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, { headers: { token } })
      
      if (res.data.success) {
        toast.success('Password changed successfully')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(res.data.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      if (error.response?.status >= 500) {
        toast.error('Server error occurred')
      } else {
        toast.error('Failed to change password')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      if (editingAddress) {
        // Update existing address
        const res = await axios.put(`${backendUrl}/api/user/addresses`, {
          addressId: editingAddress._id,
          address: addressForm
        }, { headers: { token } })
        
        if (res.data.success) {
          toast.success('Address updated successfully')
          setAddresses(res.data.addresses)
        }
      } else {
        // Add new address
        const res = await axios.post(`${backendUrl}/api/user/addresses`, {
          address: addressForm
        }, { headers: { token } })
        
        if (res.data.success) {
          toast.success('Address added successfully')
          setAddresses(res.data.addresses)
        }
      }
      
      setShowAddressForm(false)
      setEditingAddress(null)
      setAddressForm({
        type: 'shipping',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
      })
    } catch (error) {
      console.error('Error saving address:', error)
      if (error.response?.status >= 500) {
        toast.error('Server error occurred')
      } else {
        toast.error('Failed to save address')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    
    try {
      const res = await axios.delete(`${backendUrl}/api/user/addresses`, {
        data: { addressId },
        headers: { token }
      })
      
      if (res.data.success) {
        toast.success('Address deleted successfully')
        setAddresses(res.data.addresses)
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      if (error.response?.status >= 500) {
        toast.error('Server error occurred')
      } else {
        toast.error('Failed to delete address')
      }
    }
  }

  const startEditAddress = (address) => {
    setEditingAddress(address)
    setAddressForm({
      type: address.type,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault
    })
    setShowAddressForm(true)
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: '👤' },
    { id: 'password', label: 'Security', icon: '🔒' }
  ]

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your profile information and preferences</p>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">👤</span>
                  Personal Information
                </h3>
                <p className="text-sm text-gray-600 mt-1">Update your personal details and contact information</p>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      value={profileForm.firstName}
                      onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      value={profileForm.lastName}
                      onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                        value={profileForm.email}
                        readOnly
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Verified</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Email cannot be changed for security reasons</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      value={profileForm.dateOfBirth}
                      onChange={e => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      value={profileForm.gender}
                      onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving Changes...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                      onClick={() => navigate('/orders')}
                    >
                      View Order History
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Email Preferences Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📧</span>
                  Email Preferences
                </h3>
                <p className="text-sm text-gray-600 mt-1">Choose what emails you'd like to receive from us</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">Marketing Communications</h4>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Get notified about new products, sales, and exclusive offers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.marketing}
                        onChange={e => setEmailPrefs({ ...emailPrefs, marketing: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">Order Updates</h4>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Essential
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Important updates about your orders and shipping status</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.orderUpdates}
                        onChange={e => setEmailPrefs({ ...emailPrefs, orderUpdates: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Promotional Offers</h4>
                      <p className="text-sm text-gray-500 mt-1">Special discounts, coupon codes, and limited-time deals</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.promotions}
                        onChange={e => setEmailPrefs({ ...emailPrefs, promotions: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          {/* Addresses Section */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Saved Addresses</h3>
              <button
                onClick={() => setShowAddressForm(true)}
                className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm hover:bg-gray-800"
              >
                Add New Address
              </button>
            </div>

            {/* Address List */}
            <div className="grid gap-4">
              {addresses.map((address) => (
                <div key={address._id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium capitalize">{address.type}</span>
                        {address.isDefault && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {address.street}<br />
                        {address.city}, {address.state} {address.zipCode}<br />
                        {address.country}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditAddress(address)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && (
                <p className="text-gray-500 text-center py-4">No addresses saved yet</p>
              )}
            </div>
          </div>

          {/* Address Form Modal */}
          {showAddressForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      value={addressForm.type}
                      onChange={e => setAddressForm({ ...addressForm, type: e.target.value })}
                    >
                      <option value="shipping">Shipping</option>
                      <option value="billing">Billing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      value={addressForm.street}
                      onChange={e => setAddressForm({ ...addressForm, street: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={addressForm.city}
                        onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={addressForm.state}
                        onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input
                        type="text"
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={addressForm.zipCode}
                        onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={addressForm.country}
                        onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      className="mr-2"
                      checked={addressForm.isDefault}
                      onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm disabled:opacity-60 hover:bg-gray-800"
                    >
                      {loading ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false)
                        setEditingAddress(null)
                        setAddressForm({
                          type: 'shipping',
                          street: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          country: '',
                          isDefault: false
                        })
                      }}
                      className="border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Password Change Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white rounded-md px-6 py-2 text-sm disabled:opacity-60 hover:bg-gray-800"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
      </div>
    </div>
  )
}

export default Profile


