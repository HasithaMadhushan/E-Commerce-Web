import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{ type : String, required: true },
    email:{ type : String, required: true, unique: true },
    password:{ type : String, required: true },
    phone:{ type : String },
    address:{ type : Object, default: {} },
    cartData:{ type : Object, default: {} },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    profile: {
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        preferences: {
            categories: [{ type: String }],
            brands: [{ type: String }],
            priceRange: {
                min: { type: Number, default: 0 },
                max: { type: Number, default: 10000 }
            }
        }
    },
    addresses: [{
        type: { type: String, enum: ['shipping', 'billing'], default: 'shipping' },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],
    emailPreferences: {
        marketing: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
        promotions: { type: Boolean, default: true }
    },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true }
}, {
    minimize: false,
    timestamps: true
})

// Index for better query performance
userSchema.index({ wishlist: 1 });

const UserModel = mongoose.models.User || mongoose.model('User', userSchema)

export default UserModel;