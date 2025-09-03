import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        trim: true
    },
    type: { 
        type: String, 
        required: true,
        enum: ['percentage', 'fixed']
    },
    value: { 
        type: Number, 
        required: true,
        min: 0
    },
    description: { 
        type: String, 
        required: true 
    },
    minOrderAmount: { 
        type: Number, 
        default: 0 
    },
    maxDiscount: { 
        type: Number 
    }, // For percentage coupons
    usageLimit: { 
        type: Number, 
        default: null 
    }, // null means unlimited
    usedCount: { 
        type: Number, 
        default: 0 
    },
    validFrom: { 
        type: Date, 
        required: true 
    },
    validUntil: { 
        type: Date, 
        required: true 
    },
    applicableCategories: [{ 
        type: String 
    }],
    applicableProducts: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }],
    excludedProducts: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }],
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdBy: { 
        type: String, 
        required: true 
    }, // Admin email who created the coupon
    usedBy: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        usedAt: { 
            type: Date, 
            default: Date.now 
        },
        orderAmount: { 
            type: Number 
        },
        discountAmount: { 
            type: Number 
        }
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });

// Virtual to check if coupon is currently valid
couponSchema.virtual('isValid').get(function() {
    const now = new Date();
    return this.isActive && 
           this.validFrom <= now && 
           this.validUntil >= now &&
           (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
    if (!this.isValid || orderAmount < this.minOrderAmount) {
        return 0;
    }
    
    let discount = 0;
    if (this.type === 'percentage') {
        discount = (orderAmount * this.value) / 100;
        if (this.maxDiscount && discount > this.maxDiscount) {
            discount = this.maxDiscount;
        }
    } else if (this.type === 'fixed') {
        discount = this.value;
    }
    
    return Math.min(discount, orderAmount);
};

const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default CouponModel;