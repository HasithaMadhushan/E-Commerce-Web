import CouponModel from '../models/couponModel.js';
import ProductModel from '../models/productModel.js';

// Validate and apply coupon
export const validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount, items = [] } = req.body;
        const { userId } = req.body;
        
        if (!code || !orderAmount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Coupon code and order amount are required' 
            });
        }
        
        // Find the coupon
        const coupon = await CouponModel.findOne({ 
            code: code.toUpperCase(),
            isActive: true 
        });
        
        if (!coupon) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid coupon code' 
            });
        }
        
        // Check if coupon is currently valid
        if (!coupon.isValid) {
            let message = 'Coupon is not valid';
            const now = new Date();
            
            if (coupon.validFrom > now) {
                message = 'Coupon is not yet active';
            } else if (coupon.validUntil < now) {
                message = 'Coupon has expired';
            } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                message = 'Coupon usage limit reached';
            }
            
            return res.status(422).json({ success: false, message });
        }
        
        // Check minimum order amount
        if (orderAmount < coupon.minOrderAmount) {
            return res.status(422).json({ 
                success: false, 
                message: `Minimum order amount of $${coupon.minOrderAmount} required` 
            });
        }
        
        // Check if coupon applies to specific categories or products
        if (coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0) {
            let applicable = false;
            
            for (const item of items) {
                const product = await ProductModel.findById(item.productId);
                if (!product) continue;
                
                // Check if product is excluded
                if (coupon.excludedProducts.includes(item.productId)) {
                    continue;
                }
                
                // Check category applicability
                if (coupon.applicableCategories.length > 0) {
                    if (coupon.applicableCategories.includes(product.category)) {
                        applicable = true;
                        break;
                    }
                }
                
                // Check product applicability
                if (coupon.applicableProducts.length > 0) {
                    if (coupon.applicableProducts.includes(item.productId)) {
                        applicable = true;
                        break;
                    }
                }
            }
            
            if (!applicable) {
                return res.status(422).json({ 
                    success: false, 
                    message: 'Coupon is not applicable to items in your cart' 
                });
            }
        }
        
        // Calculate discount
        const discountAmount = coupon.calculateDiscount(orderAmount);
        const finalAmount = orderAmount - discountAmount;
        
        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                description: coupon.description
            },
            discount: {
                amount: discountAmount,
                percentage: Math.round((discountAmount / orderAmount) * 100)
            },
            orderAmount,
            finalAmount
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new coupon (admin only)
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            type,
            value,
            description,
            minOrderAmount = 0,
            maxDiscount,
            usageLimit,
            validFrom,
            validUntil,
            applicableCategories = [],
            applicableProducts = [],
            excludedProducts = []
        } = req.body;
        
        // Validate required fields
        if (!code || !type || !value || !description || !validFrom || !validUntil) {
            return res.status(400).json({ 
                success: false, 
                message: 'Code, type, value, description, validFrom, and validUntil are required' 
            });
        }
        
        // Validate type
        if (!['percentage', 'fixed'].includes(type)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Type must be either "percentage" or "fixed"' 
            });
        }
        
        // Validate value
        if (value <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Value must be greater than 0' 
            });
        }
        
        if (type === 'percentage' && value > 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Percentage value cannot exceed 100' 
            });
        }
        
        // Validate dates
        const fromDate = new Date(validFrom);
        const untilDate = new Date(validUntil);
        
        if (fromDate >= untilDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid until date must be after valid from date' 
            });
        }
        
        // Check if coupon code already exists
        const existingCoupon = await CouponModel.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(409).json({ 
                success: false, 
                message: 'Coupon code already exists' 
            });
        }
        
        // Create coupon
        const coupon = new CouponModel({
            code: code.toUpperCase(),
            type,
            value,
            description,
            minOrderAmount,
            maxDiscount,
            usageLimit,
            validFrom: fromDate,
            validUntil: untilDate,
            applicableCategories,
            applicableProducts,
            excludedProducts,
            createdBy: 'admin' // In a real app, this would be the admin's email
        });
        
        await coupon.save();
        
        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            coupon
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all coupons (admin only)
export const getAllCoupons = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'all' } = req.query;
        
        let filter = {};
        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }
        
        const skip = (page - 1) * limit;
        
        const coupons = await CouponModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const totalCoupons = await CouponModel.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            coupons,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCoupons / limit),
                totalCoupons,
                hasNext: skip + coupons.length < totalCoupons,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update coupon (admin only)
export const updateCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const updates = req.body;
        
        // Remove fields that shouldn't be updated
        delete updates._id;
        delete updates.usedCount;
        delete updates.usedBy;
        delete updates.createdAt;
        delete updates.updatedAt;
        
        // Validate code if being updated
        if (updates.code) {
            const existingCoupon = await CouponModel.findOne({ 
                code: updates.code.toUpperCase(),
                _id: { $ne: couponId }
            });
            if (existingCoupon) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Coupon code already exists' 
                });
            }
            updates.code = updates.code.toUpperCase();
        }
        
        // Validate dates if being updated
        if (updates.validFrom || updates.validUntil) {
            const coupon = await CouponModel.findById(couponId);
            const fromDate = new Date(updates.validFrom || coupon.validFrom);
            const untilDate = new Date(updates.validUntil || coupon.validUntil);
            
            if (fromDate >= untilDate) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid until date must be after valid from date' 
                });
            }
        }
        
        const updatedCoupon = await CouponModel.findByIdAndUpdate(
            couponId, 
            updates, 
            { new: true }
        );
        
        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        
        res.status(200).json({
            success: true,
            message: 'Coupon updated successfully',
            coupon: updatedCoupon
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle coupon status (admin only)
export const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.params;
        
        const coupon = await CouponModel.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        
        res.status(200).json({
            success: true,
            message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
            coupon
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete coupon (admin only)
export const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        
        const coupon = await CouponModel.findByIdAndDelete(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        
        res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get coupon usage statistics (admin only)
export const getCouponStats = async (req, res) => {
    try {
        const { couponId } = req.params;
        
        const coupon = await CouponModel.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        
        const totalDiscount = coupon.usedBy.reduce((sum, usage) => sum + usage.discountAmount, 0);
        const averageOrderAmount = coupon.usedBy.length > 0 
            ? coupon.usedBy.reduce((sum, usage) => sum + usage.orderAmount, 0) / coupon.usedBy.length 
            : 0;
        
        res.status(200).json({
            success: true,
            stats: {
                code: coupon.code,
                usedCount: coupon.usedCount,
                usageLimit: coupon.usageLimit,
                totalDiscount,
                averageOrderAmount,
                isActive: coupon.isActive,
                isValid: coupon.isValid,
                recentUsage: coupon.usedBy.slice(-10) // Last 10 uses
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};