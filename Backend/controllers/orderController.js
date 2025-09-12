import OrderModel from '../models/orderModel.js';
import UserModel from '../models/userModel.js';
import ProductModel from '../models/productModel.js';
import Stripe from 'stripe';
import emailService from '../services/emailService.js';



//global variables
const deliveryFee = 10; // Fixed delivery fee of $10
const currency = 'USD';

//gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Validate Stripe configuration on startup
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured in environment variables');
} else {
    console.log('Stripe initialized with key:', process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...');
}


//Placing orders using COD method

const placeOrder = async (req, res) => {

    try {
        const { userId, items, amount, address } = req.body;
        // Validate and decrement stock for COD orders immediately
        const updated = []
        for (const item of items) {
            const productId = item._id
            const qty = Number(item.quantity) || 0
            if (!productId || qty <= 0) continue
            
            // Check stock availability using both new and legacy fields
            const product = await ProductModel.findById(productId);
            const availableStock = product.inventory?.available ?? product.stock ?? 0;
            
            if (availableStock < qty) {
                // rollback previous decrements
                for (const u of updated) {
                    await ProductModel.findByIdAndUpdate(u.productId, { 
                        $inc: { 
                            stock: u.qty,
                            'inventory.available': u.qty,
                            'inventory.reserved': -u.qty
                        } 
                    })
                }
                return res.status(422).json({ success: false, message: `Insufficient stock for ${item.name || 'an item'}. Available: ${availableStock}, Requested: ${qty}` })
            }
            
            // Decrement stock from both fields
            const updatedDoc = await ProductModel.findByIdAndUpdate(
                productId,
                { 
                    $inc: { 
                        stock: -qty,
                        'inventory.available': -qty,
                        'inventory.reserved': qty
                    } 
                },
                { new: true }
            )
            
            if (!updatedDoc) {
                // rollback previous decrements
                for (const u of updated) {
                    await ProductModel.findByIdAndUpdate(u.productId, { 
                        $inc: { 
                            stock: u.qty,
                            'inventory.available': u.qty,
                            'inventory.reserved': -u.qty
                        } 
                    })
                }
                return res.status(422).json({ success: false, message: `Failed to update stock for ${item.name || 'an item'}` })
            }
            updated.push({ productId, qty })
        }
        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = deliveryFee;
        const total = subtotal + shippingCost;

        // Generate order number
        const orderCount = await OrderModel.countDocuments();
        const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

        const orderData = {
            userId,
            orderNumber,
            items: items.map(item => {
                const imageUrl = Array.isArray(item.image) && item.image.length > 0 
                    ? item.image[0] 
                    : (typeof item.image === 'string' && item.image.trim() !== '' 
                        ? item.image 
                        : '');
                console.log(`COD Order - Processing item ${item.name}: image array=${JSON.stringify(item.image)}, final imageUrl=${imageUrl}`);
                return {
                    productId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size || 'N/A',
                    image: imageUrl
                };
            }),
            subtotal,
            shipping: {
                cost: shippingCost,
                method: 'Standard',
                address: {
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipcode,
                    country: address.country
                }
            },
            total,
            paymentMethod: 'COD',
            paymentStatus: 'paid', // COD is considered paid on delivery
            // Backward compatibility fields
            amount: total,
            address,
            payment: true, // COD orders are marked as paid
            date: Date.now()
        }

        const newOrder = new OrderModel(orderData);
        await newOrder.save();

        // Send order confirmation email
        try {
            const user = await UserModel.findById(userId)
            if (user && user.email) {
                await emailService.sendOrderConfirmationEmail(newOrder, user.email, user.name)
            }
        } catch (emailError) {
            console.log('Order confirmation email failed:', emailError.message)
        }

        await UserModel.findByIdAndUpdate(userId, { cartData: {} })
        res.status(201).json({ success: true, message: 'Order placed successfully' })


    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message })
    }

}



//Placing orders using Stripe method

const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address, amount } = req.body;
        const { origin } = req.headers;

        console.log('Stripe order request:', { 
            userId, 
            itemsCount: items?.length, 
            items: items?.map(i => ({ id: i._id, name: i.name, qty: i.quantity })),
            address, 
            amount, 
            origin 
        });

        // Validate required fields
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Order items are required' });
        }
        if (!address) {
            return res.status(400).json({ success: false, message: 'Delivery address is required' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Order amount is required' });
        }

        // Validate stock availability before creating order
        for (const item of items) {
            const productId = item._id
            const qty = Number(item.quantity) || 0
            console.log(`Checking stock for product ${productId}, quantity: ${qty}`);
            
            if (!productId || qty <= 0) {
                console.log(`Skipping invalid item: productId=${productId}, qty=${qty}`);
                continue;
            }
            
            const product = await ProductModel.findById(productId)
            if (!product) {
                console.log(`Product not found: ${productId}`);
                return res.status(422).json({ success: false, message: `Product not found: ${item.name || 'an item'}` })
            }
            
            const availableStock = product.inventory?.available ?? product.stock ?? 0;
            console.log(`Product ${product.name}: available=${availableStock}, requested=${qty}, legacy_stock=${product.stock}`);
            
            if (availableStock < qty) {
                console.log(`Insufficient stock for ${product.name}: available=${availableStock}, requested=${qty}`);
                return res.status(422).json({ 
                    success: false, 
                    message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${qty}` 
                })
            }
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = deliveryFee;
        const total = subtotal + shippingCost;

        // Generate order number
        const orderCount = await OrderModel.countDocuments();
        const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

        const orderData = {
            userId,
            orderNumber,
            items: items.map(item => {
                const imageUrl = Array.isArray(item.image) && item.image.length > 0 
                    ? item.image[0] 
                    : (typeof item.image === 'string' && item.image.trim() !== '' 
                        ? item.image 
                        : '');
                console.log(`Stripe Order - Processing item ${item.name}: image array=${JSON.stringify(item.image)}, final imageUrl=${imageUrl}`);
                return {
                    productId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size || 'N/A',
                    image: imageUrl
                };
            }),
            subtotal,
            shipping: {
                cost: shippingCost,
                method: 'Standard',
                address: {
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipcode,
                    country: address.country
                }
            },
            total,
            paymentMethod: 'Stripe',
            paymentStatus: 'pending',
            // Backward compatibility fields
            amount: total,
            address,
            payment: false,
            date: Date.now()
        };

        console.log('Creating order with data:', orderData);
        const newOrder = new OrderModel(orderData);
        await newOrder.save();
        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100,

            },
            quantity: item.quantity
        }))
        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Fee",
                },
                unit_amount: deliveryFee * 100, // Assuming a fixed delivery fee 
            },
            quantity: 1 // Assuming quantity is 1 for delivery fee
        })
        console.log('Creating Stripe session with line_items:', line_items);
        
        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        });
        
        console.log('Stripe session created successfully:', session.id);
        res.status(200).json({ success: true, session_url: session.url })

    } catch (error) {
        console.error('Stripe order error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' })
    }
}
//Verify Stripe
const verifyStripe = async (req, res) => {
    try {
        console.log('VerifyStripe - Full request body:', req.body);
        console.log('VerifyStripe - Auth userId from middleware:', req.body.userId);
        
        const { orderId, success, userId } = req.body;
        console.log('Verifying Stripe payment:', { orderId, success, userId });
        
        if (!orderId) {
            console.log('ERROR: Missing orderId in request');
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        
        if (!userId) {
            console.log('ERROR: Missing userId in request');
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        if (success === "true") {
            const order = await OrderModel.findById(orderId)
            if (!order) {
                console.log('Order not found:', orderId);
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            
            console.log('Order found:', { 
                id: order._id, 
                payment: order.payment, 
                paymentStatus: order.paymentStatus,
                itemsCount: order.items?.length 
            });
            if (!order.payment) {
                // decrement stock on successful payment
                for (const item of order.items) {
                    const productId = item.productId || item._id // Support both new and old format
                    const qty = Number(item.quantity) || 0
                    if (!productId || qty <= 0) continue
                    
                    // Check current stock availability
                    const product = await ProductModel.findById(productId);
                    if (!product) {
                        console.log(`Product not found during verification: ${productId}`);
                        continue; // Skip if product doesn't exist
                    }
                    
                    const availableStock = product.inventory?.available ?? product.stock ?? 0;
                    if (availableStock < qty) {
                        console.log(`Insufficient stock during verification for ${product.name}: available=${availableStock}, requested=${qty}`);
                        return res.status(422).json({ 
                            success: false, 
                            message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${qty}` 
                        });
                    }
                    
                    // Update stock using both new and legacy fields
                    const updatedDoc = await ProductModel.findByIdAndUpdate(
                        productId,
                        { 
                            $inc: { 
                                stock: -qty,
                                'inventory.available': -qty,
                                'inventory.reserved': qty
                            } 
                        },
                        { new: true }
                    );
                    
                    if (!updatedDoc) {
                        return res.status(422).json({ success: false, message: `Failed to update stock for ${item.name || 'an item'}` });
                    }
                }
            }
            await OrderModel.findByIdAndUpdate(orderId, { 
                payment: true,
                paymentStatus: 'paid',
                'paymentDetails.paidAt': new Date()
            });
            await UserModel.findByIdAndUpdate(userId, { cartData: {} });
            res.status(200).json({ success: true, message: 'Payment verified successfully' });

        } else {
            await OrderModel.findByIdAndDelete(orderId);
            res.status(200).json({ success: false, message: 'Payment cancelled' });
        }


    } catch (error) {
        console.error('VerifyStripe ERROR:', error);
        console.error('VerifyStripe ERROR Stack:', error.stack);
        console.error('VerifyStripe Request Body:', req.body);
        res.status(500).json({ success: false, message: error.message, details: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error' });
    }

};

//All ORDERS DATA FOR ADMIN PANEL

const allOrders = async (req, res) => {
    try {
        const orders = await OrderModel.find({});
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }

}



//User Order Data For Frontend

const userOrders = async (req, res) => {
    try {
        const { userId } = req.body;
        const orders = await OrderModel.find({ userId }).populate('items.productId', 'name image price');
        
        // Enhance orders with current product data for images
        const enhancedOrders = orders.map(order => {
            const enhancedItems = order.items.map(item => {
                // If we have populated product data and the stored image is empty, use current product image
                if (item.productId && (!item.image || item.image.trim() === '')) {
                    const currentImage = Array.isArray(item.productId.image) && item.productId.image.length > 0 
                        ? item.productId.image[0] 
                        : '';
                    return {
                        ...item.toObject(),
                        image: currentImage || item.image
                    };
                }
                return item;
            });
            
            return {
                ...order.toObject(),
                items: enhancedItems
            };
        });
        
        res.status(200).json({ success: true, orders: enhancedOrders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }

}



//update order status from Admin Panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status, note } = req.body;
        const order = await OrderModel.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Send status update email
        try {
            const user = await UserModel.findById(order.userId)
            if (user && user.email) {
                await emailService.sendOrderStatusUpdateEmail(order, user.email, user.name, status, note)
            }
        } catch (emailError) {
            console.log('Status update email failed:', emailError.message)
        }

        res.status(200).json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }

}




// Get order tracking information
export const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId } = req.body;

        const order = await OrderModel.findOne({
            $or: [
                { _id: orderId },
                { orderNumber: orderId }
            ]
        }).populate('items.productId', 'name image');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if user owns this order (for user requests)
        if (userId && order.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const trackingInfo = {
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            statusHistory: order.statusHistory,
            estimatedDelivery: order.estimatedDelivery,
            actualDelivery: order.actualDelivery,
            shipping: {
                trackingNumber: order.shipping?.trackingNumber,
                carrier: order.shipping?.carrier,
                method: order.shipping?.method
            },
            items: order.items,
            total: order.total,
            createdAt: order.createdAt
        };

        res.status(200).json({
            success: true,
            tracking: trackingInfo
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update order status with tracking (admin only)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, note, trackingNumber, carrier, estimatedDelivery } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and status are required'
            });
        }

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order fields
        const updates = { status };

        if (trackingNumber) {
            updates['shipping.trackingNumber'] = trackingNumber;
        }
        if (carrier) {
            updates['shipping.carrier'] = carrier;
        }
        if (estimatedDelivery) {
            updates.estimatedDelivery = new Date(estimatedDelivery);
        }
        if (status === 'delivered') {
            updates.actualDelivery = new Date();
        }

        // Add to status history
        const statusUpdate = {
            status,
            timestamp: new Date(),
            note: note || `Status updated to ${status}`
        };

        updates.$push = { statusHistory: statusUpdate };

        const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updates, { new: true });

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: {
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                statusHistory: updatedOrder.statusHistory,
                shipping: updatedOrder.shipping
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get orders with advanced filtering (admin) - Optimized for performance
export const getOrdersWithFilters = async (req, res) => {
    try {
        console.log('getOrdersWithFilters - Query params:', req.query);
        const {
            status = '',
            paymentStatus = '',
            dateFrom = '',
            dateTo = '',
            search = '',
            page = 1,
            limit = 20,
            sort = 'newest'
        } = req.query;

        let filter = {};

        // Status filters
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        // Date range filter
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }

        // Search filter (optimized - only search order number for performance)
        if (search) {
            // Use simple string matching instead of regex for better performance
            filter.orderNumber = { $regex: search, $options: 'i' };
        }

        // Sort options
        let sortOption = { createdAt: -1 }; // Default: newest first
        switch (sort) {
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'amount_high':
                sortOption = { total: -1 };
                break;
            case 'amount_low':
                sortOption = { total: 1 };
                break;
            case 'status':
                sortOption = { status: 1, createdAt: -1 };
                break;
        }

        const skip = (page - 1) * limit;

        // Optimize query by removing expensive populate and using lean for better performance
        const [orders, totalOrders] = await Promise.all([
            OrderModel.find(filter)
                .select('orderNumber userId items amount total status paymentStatus payment createdAt shipping')
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(), // Use lean for better performance
            OrderModel.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                hasNext: skip + orders.length < totalOrders,
                hasPrev: page > 1
            },
            filters: {
                status,
                paymentStatus,
                dateFrom,
                dateTo,
                search,
                sort
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get order analytics (admin)
export const getOrderAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));

        // Total orders and revenue
        const totalStats = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' }
                }
            }
        ]);

        // Orders by status
        const statusStats = await OrderModel.aggregate([
            {
                $match: { createdAt: { $gte: daysAgo } }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Daily order trends
        const dailyStats = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                summary: totalStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
                statusBreakdown: statusStats,
                dailyTrends: dailyStats,
                period: parseInt(period)
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk update order status (admin only)
export const bulkUpdateOrderStatus = async (req, res) => {
    try {
        const { orderIds, status, note } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order IDs array is required'
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const updatePromises = orderIds.map(async (orderId) => {
            try {
                const order = await OrderModel.findById(orderId);
                if (!order) {
                    return { orderId, success: false, message: 'Order not found' };
                }

                // Status workflow validation
                const statusFlow = {
                    'pending': ['confirmed', 'cancelled'],
                    'confirmed': ['processing', 'cancelled'],
                    'processing': ['shipped', 'cancelled'],
                    'shipped': ['delivered', 'cancelled'],
                    'delivered': ['refunded'],
                    'cancelled': [],
                    'refunded': []
                };

                const isValidTransition = statusFlow[order.status]?.includes(status) || order.status === status;
                if (!isValidTransition) {
                    return { 
                        orderId, 
                        success: false, 
                        message: `Cannot change status from ${order.status} to ${status}` 
                    };
                }

                // Update order
                const updates = { status };
                const statusUpdate = {
                    status,
                    timestamp: new Date(),
                    note: note || `Bulk status update to ${status}`
                };
                updates.$push = { statusHistory: statusUpdate };

                if (status === 'delivered') {
                    updates.actualDelivery = new Date();
                }

                await OrderModel.findByIdAndUpdate(orderId, updates);

                // Send status update email
                try {
                    const user = await UserModel.findById(order.userId);
                    if (user && user.email) {
                        await emailService.sendOrderStatusUpdateEmail(order, user.email, user.name, status, note);
                    }
                } catch (emailError) {
                    console.log('Status update email failed:', emailError.message);
                }

                return { orderId, success: true };
            } catch (error) {
                return { orderId, success: false, message: error.message };
            }
        });

        const results = await Promise.all(updatePromises);
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        res.status(200).json({
            success: true,
            message: `${successful.length} orders updated successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
            results: {
                successful: successful.length,
                failed: failed.length,
                details: failed.length > 0 ? failed : undefined
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    placeOrder,
    placeOrderStripe,
    allOrders,
    userOrders,
    updateStatus,
    verifyStripe
}

