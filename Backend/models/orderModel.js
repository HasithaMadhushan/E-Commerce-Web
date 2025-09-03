import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { 
        type: String, 
        unique: true,
        required: true
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: String, required: true },
        image: { type: String, required: true }
    }],
    subtotal: { type: Number, required: true },
    discount: {
        couponCode: { type: String },
        amount: { type: Number, default: 0 }
    },
    shipping: {
        cost: { type: Number, required: true },
        method: { type: String, default: 'Standard' },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true }
        },
        trackingNumber: { type: String },
        carrier: { type: String }
    },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { 
        type: String, 
        required: true, 
        default: 'pending',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    },
    statusHistory: [{
        status: { 
            type: String, 
            required: true,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        },
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
    }],
    paymentMethod: { type: String, required: true },
    paymentStatus: { 
        type: String, 
        required: true, 
        default: 'pending',
        enum: ['pending', 'paid', 'failed', 'refunded']
    },
    paymentDetails: {
        stripeSessionId: { type: String },
        transactionId: { type: String },
        paidAt: { type: Date }
    },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    notes: { type: String },
    
    // Keep original fields for backward compatibility
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    payment: { type: Boolean, required: true, default: false },
    date: { type: Number, required: true }
}, {
    timestamps: true
});

// Indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
    }
    
    // Sync backward compatibility fields
    if (this.isModified('total')) {
        this.amount = this.total;
    }
    if (this.isModified('shipping.address')) {
        this.address = this.shipping.address;
    }
    if (this.isModified('paymentStatus')) {
        this.payment = this.paymentStatus === 'paid';
    }
    if (this.isModified('createdAt')) {
        this.date = this.createdAt.getTime();
    }
    
    next();
});

// Pre-save middleware to update status history
orderSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: `Status updated to ${this.status}`
        });
    }
    next();
});

const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default OrderModel;