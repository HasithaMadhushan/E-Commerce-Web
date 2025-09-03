import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../config'
import { toast } from 'react-toastify'

const Analytics = ({ token }) => {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [salesData, setSalesData] = useState(null)
  const [productData, setProductData] = useState(null)
  const [customerData, setCustomerData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30') // days
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [activeTab, setActiveTab] = useState('overview')

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/analytics/dashboard?period=${period}`, { headers: { token } })
      if (response.data.success) {
        setDashboardStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const fetchSalesAnalytics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/analytics/sales?period=${period}&groupBy=day`, { headers: { token } })
      if (response.data.success) {
        setSalesData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching sales analytics:', error)
    }
  }

  const fetchProductAnalytics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/analytics/products?period=${period}`, { headers: { token } })
      if (response.data.success) {
        setProductData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching product analytics:', error)
    }
  }

  const fetchCustomerAnalytics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/analytics/customers?period=${period}`, { headers: { token } })
      if (response.data.success) {
        setCustomerData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching customer analytics:', error)
    }
  }

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      try {
        setLoading(true)
        await Promise.all([
          fetchDashboardStats(),
          fetchSalesAnalytics(),
          fetchProductAnalytics(),
          fetchCustomerAnalytics()
        ])
      } catch (error) {
        toast.error('Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAllAnalytics()
  }, [period, token])

  const formatCurrency = (amount) => {
    return `${currency}${amount?.toFixed(2) || '0.00'}`
  }

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0'
  }



  const MetricCard = ({ title, value, subtitle, icon, color = 'bg-blue-500' }) => (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`${color} rounded-full p-3`}>
          {icon}
        </div>
      </div>
    </div>
  )

  const StatusCard = ({ status, count, color }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">{count}</span>
    </div>
  )

  if (loading && !dashboardStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'sales', name: 'Sales' },
            { id: 'products', name: 'Products' },
            { id: 'customers', name: 'Customers' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {dashboardStats ? (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={formatCurrency(dashboardStats.totalRevenue)}
                  subtitle={`${formatNumber(dashboardStats.totalOrders)} orders`}
                  color="bg-green-500"
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Total Orders"
                  value={formatNumber(dashboardStats.totalOrders)}
                  subtitle={`Avg: ${formatCurrency(dashboardStats.avgOrderValue)}`}
                  color="bg-blue-500"
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Total Customers"
                  value={formatNumber(dashboardStats.totalCustomers)}
                  subtitle={`+${dashboardStats.newCustomers} new`}
                  color="bg-purple-500"
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Products"
                  value={formatNumber(dashboardStats.totalProducts)}
                  subtitle={`${dashboardStats.lowStockProducts} low stock`}
                  color="bg-orange-500"
                  icon={
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                />
              </div>

              {/* Period Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Revenue (Last {period} days)</span>
                      <span className="font-semibold text-green-600">{formatCurrency(dashboardStats.periodRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Orders (Last {period} days)</span>
                      <span className="font-semibold text-blue-600">{formatNumber(dashboardStats.periodOrders)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">New Customers</span>
                      <span className="font-semibold text-purple-600">{formatNumber(dashboardStats.newCustomers)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Order Value</span>
                      <span className="font-semibold">{formatCurrency(dashboardStats.avgOrderValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Low Stock Products</span>
                      <span className="font-semibold text-orange-600">{dashboardStats.lowStockProducts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Products</span>
                      <span className="font-semibold">{formatNumber(dashboardStats.totalProducts)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && salesData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Breakdown */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
                  <div className="space-y-3">
                    {salesData.statusDistribution.map((status) => {
                      const colors = {
                        pending: 'bg-yellow-400',
                        confirmed: 'bg-blue-400',
                        processing: 'bg-purple-400',
                        shipped: 'bg-indigo-400',
                        delivered: 'bg-green-400',
                        cancelled: 'bg-red-400',
                        refunded: 'bg-gray-400'
                      }
                      return (
                        <StatusCard
                          key={status._id}
                          status={status._id}
                          count={status.count}
                          color={colors[status._id] || 'bg-gray-400'}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                  <div className="space-y-3">
                    {salesData.paymentMethods.map((method) => (
                      <div key={method._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">{method._id}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{method.count} orders</div>
                          <div className="text-xs text-gray-500">{formatCurrency(method.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sales Trend Chart */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sales Trends</h3>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="orders">Orders</option>
                  </select>
                </div>

                {salesData.salesData.length > 0 ? (
                  <div className="space-y-2">
                    {salesData.salesData.slice(-10).map((day, index) => {
                      const value = selectedMetric === 'revenue' ? day.revenue : day.orders
                      const maxValue = Math.max(...salesData.salesData.map(d => selectedMetric === 'revenue' ? d.revenue : d.orders))
                      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-gray-600">
                            {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-24 text-right text-sm font-medium text-gray-900">
                            {selectedMetric === 'revenue' ? formatCurrency(value) : formatNumber(value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No sales data available for the selected period</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && productData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                  <div className="space-y-3">
                    {productData.topProducts.map((product, index) => (
                      <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.totalSold} sold</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Performance */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                  <div className="space-y-3">
                    {productData.categoryPerformance.map((category) => (
                      <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 capitalize">{category._id}</div>
                          <div className="text-xs text-gray-500">{category.totalSold} items sold</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatCurrency(category.revenue)}</div>
                          <div className="text-xs text-gray-500">{category.orders} orders</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              {productData.lowStockProducts.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productData.lowStockProducts.map((product) => (
                      <div key={product._id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600 capitalize">{product.category}</div>
                        <div className="text-sm text-orange-600 font-medium mt-1">
                          {product.inventory?.available || 0} left in stock
                        </div>
                        <div className="text-xs text-gray-500">{formatCurrency(product.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && customerData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Customers */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
                  <div className="space-y-3">
                    {customerData.topCustomers.map((customer, index) => (
                      <div key={customer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.customerInfo?.firstName} {customer.customerInfo?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{customer.totalOrders} orders</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</div>
                          <div className="text-xs text-gray-500">Avg: {formatCurrency(customer.avgOrderValue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Acquisition */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Acquisition</h3>
                  <div className="space-y-2">
                    {customerData.customerAcquisition.slice(-7).map((day, index) => {
                      const maxValue = Math.max(...customerData.customerAcquisition.map(d => d.newCustomers))
                      const percentage = maxValue > 0 ? (day.newCustomers / maxValue) * 100 : 0

                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-gray-600">
                            {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-16 text-right text-sm font-medium text-gray-900">
                            {day.newCustomers}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Customer Lifetime Value */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Lifetime Value Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {customerData.clvDistribution.map((bucket, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{bucket.count}</div>
                      <div className="text-xs text-gray-600">customers</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {typeof bucket._id === 'number'
                          ? `$${bucket._id}+`
                          : bucket._id
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
          <p className="text-gray-500">Analytics data will appear here once you have orders</p>
        </div>
      )}
    </div>
  )
}

export default Analytics