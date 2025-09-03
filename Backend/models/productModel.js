import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name:{ type : String, required: true },
    description:{ type : String, required: true },
    price:{ type : Number, required: true },
    image:{ type : Array, required: true },
    category:{ type : String, required: true },
    subCategory:{ type : String, required: true },
    sizes:{ type : Array, required: true },
    date:{ type : Number, required: true },
    bestseller:{ type : Boolean, default: false },
    featured: { type: Boolean, default: false },
    inventory: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        lowStockThreshold: { type: Number, default: 10 }
    },
    reviews: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 },
        distribution: {
            5: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            1: { type: Number, default: 0 }
        }
    },
    seo: {
        metaTitle: { type: String },
        metaDescription: { type: String },
        keywords: [{ type: String }]
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    },
    // Keep stock field for backward compatibility
    stock: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Indexes for better query performance
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'reviews.average': -1 });
productSchema.index({ bestseller: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
    return this.inventory.available > 0;
});

// Virtual for checking if stock is low
productSchema.virtual('lowStock').get(function() {
    return this.inventory.available <= this.inventory.lowStockThreshold;
});

// Middleware to sync stock with inventory.available for backward compatibility
productSchema.pre('save', function(next) {
    if (this.isModified('stock')) {
        this.inventory.available = this.stock;
        this.inventory.total = this.stock;
    }
    if (this.isModified('inventory.available')) {
        this.stock = this.inventory.available;
    }
    next();
});

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema)

export default ProductModel;