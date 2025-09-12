import OrderModel from '../models/orderModel.js'
import ProductModel from '../models/productModel.js'
import UserModel from '../models/userModel.js'
import ReviewModel from '../models/reviewModel.js'

// Get dashboard overview stats
const getDashboardStats = async (req, res) => {
  try {
    const { period = '30' } = req.query
    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Total orders and revenue
    const totalOrders = await OrderModel.countDocuments()
    const totalRevenue = await OrderModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])

    // Period stats
    const periodOrders = await OrderModel.countDocuments({
      createdAt: { $gte: startDate }
    })

    const periodRevenue = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])

    // Customer stats
    const totalCustomers = await UserModel.countDocuments()
    const newCustomers = await UserModel.countDocuments({
      createdAt: { $gte: startDate }
    })

    // Product stats
    const totalProducts = await ProductModel.countDocuments()
    const lowStockProducts = await ProductModel.countDocuments({
      'inventory.available': { $lte: 10 }
    })

    // Average order value
    const avgOrderValue = await OrderModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, avg: { $avg: '$total' } } }
    ])

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        periodOrders,
        periodRevenue: periodRevenue[0]?.total || 0,
        totalCustomers,
        newCustomers,
        totalProducts,
        lowStockProducts,
        avgOrderValue: avgOrderValue[0]?.avg || 0
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    })
  }
}

// Get sales analytics
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query
    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let groupFormat
    switch (groupBy) {
      case 'hour':
        groupFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } }
        break
      case 'day':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        break
      case 'week':
        groupFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
        break
      case 'month':
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
        break
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
    }

    const salesData = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Order status distribution
    const statusDistribution = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Payment method distribution
    const paymentMethods = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        salesData,
        statusDistribution,
        paymentMethods
      }
    })
  } catch (error) {
    console.error('Sales analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics'
    })
  }
}

// Get product analytics
const getProductAnalytics = async (req, res) => {
  try {
    const { period = '30', limit = '10' } = req.query
    const days = parseInt(period)
    const limitNum = parseInt(limit)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Top selling products
    const topProducts = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limitNum }
    ])

    // Category performance
    const categoryPerformance = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          revenue: 1,
          orders: { $size: '$orders' }
        }
      },
      { $sort: { revenue: -1 } }
    ])

    // Low stock products
    const lowStockProducts = await ProductModel.find({
      'inventory.available': { $lte: 10 }
    }).select('name inventory category price').limit(limitNum)

    // Product reviews summary
    const reviewStats = await ReviewModel.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        topProducts,
        categoryPerformance,
        lowStockProducts,
        reviewStats: reviewStats[0] || { totalReviews: 0, avgRating: 0, ratingDistribution: [] }
      }
    })
  } catch (error) {
    console.error('Product analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics'
    })
  }
}

// Get customer analytics
const getCustomerAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query
    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Customer acquisition
    const customerAcquisition = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          newCustomers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Top customers by orders
    const topCustomers = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          customerInfo: { $first: '$address' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ])

    // Customer lifetime value distribution
    const clvDistribution = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$total' }
        }
      },
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 100, 500, 1000, 5000, 10000],
          default: '10000+',
          output: {
            count: { $sum: 1 },
            avgSpent: { $avg: '$totalSpent' }
          }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        customerAcquisition,
        topCustomers,
        clvDistribution
      }
    })
  } catch (error) {
    console.error('Customer analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics'
    })
  }
}

export {
  getDashboardStats,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics
}