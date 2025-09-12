import ProductModel from '../models/productModel.js';
import {v2 as cloudinary } from "cloudinary";
import { json } from 'express';
import { invalidateProductCache } from '../middleware/cache.js';




//function to add product
const addProduct = async (req, res) => {
   try {
    const { name, description, price, category, subCategory, sizes, bestseller, stock } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !subCategory || !sizes) {
        return res.status(400).json({success: false, message: 'Missing required fields'})
    }

    const image1 = req.files.image1 && req.files.image1[0]
    const image2 = req.files.image2 && req.files.image2[0]
    const image3 = req.files.image3 && req.files.image3[0]
    const image4 = req.files.image4 && req.files.image4[0]

    const images = [image1, image2, image3, image4].filter((item) => item !== undefined)
    
    if (images.length === 0) {
        return res.status(400).json({success: false, message: 'At least one product image is required'})
    }
    
    let imageUrls = await Promise.all(images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
            resource_type: 'image'
        })
        return result.secure_url
    }))

    const productData = {
        name,
        description,
        price: Number(price),
        stock: Number(stock) || 0,
        image: imageUrls,
        category,
        subCategory,
        sizes: JSON.parse(sizes),
        date: Date.now(),
        bestseller: bestseller === 'true' ? true : false

    }

    console.log(productData);
    const product = new ProductModel(productData);
    await product.save()

    res.status(201).json({success: true, message: 'Product added successfully'})

   } catch (error) {
    console.log(error);
    res.status(500).json({success: false, message:error.message})
   }
}




//function to get total product list
const listProducts = async (req, res) => {
    try {
        const products = await ProductModel.find({});

        res.status(200).json({success: true, products})
        
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message:error.message})
    }
}





//function to remove product
const removeProduct = async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        
        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }
        
        const product = await ProductModel.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Invalidate cache for this product and product lists
        invalidateProductCache(id);
        
        // TODO: Clean up associated images from Cloudinary
        // TODO: Update any related orders/carts
        
        res.status(200).json({ success: true, message: 'Product removed successfully' });
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}





//function for  single product details
const singleProduct = async (req, res) => {
    try {
        // Support both body and params for flexibility
        const productId = req.body.productId || req.params.productId;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        
        // Validate ObjectId format
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }
        
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        res.status(200).json({ success: true, product });
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}



// Check product stock availability
const checkStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity = 1 } = req.query;
        
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        const available = product.inventory.available;
        const isAvailable = available >= parseInt(quantity);
        
        res.status(200).json({
            success: true,
            available,
            isAvailable,
            lowStock: product.lowStock,
            inStock: product.inStock
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reserve stock for cart (temporary hold)
const reserveStock = async (req, res) => {
    try {
        const { items } = req.body; // Array of {productId, quantity}
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Items array is required' });
        }
        
        const reservations = [];
        
        for (const item of items) {
            const { productId, quantity } = item;
            
            if (!productId || !quantity || quantity <= 0) {
                continue;
            }
            
            const product = await ProductModel.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${productId} not found` });
            }
            
            if (product.inventory.available < quantity) {
                return res.status(422).json({ 
                    success: false, 
                    message: `Insufficient stock for ${product.name}. Available: ${product.inventory.available}, Requested: ${quantity}` 
                });
            }
            
            // Reserve the stock
            await ProductModel.findByIdAndUpdate(productId, {
                $inc: {
                    'inventory.available': -quantity,
                    'inventory.reserved': quantity
                }
            });
            
            reservations.push({ productId, quantity });
        }
        
        res.status(200).json({
            success: true,
            message: 'Stock reserved successfully',
            reservations
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Release reserved stock (if cart is abandoned)
const releaseStock = async (req, res) => {
    try {
        const { items } = req.body; // Array of {productId, quantity}
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Items array is required' });
        }
        
        for (const item of items) {
            const { productId, quantity } = item;
            
            if (!productId || !quantity || quantity <= 0) {
                continue;
            }
            
            // Release the reserved stock
            await ProductModel.findByIdAndUpdate(productId, {
                $inc: {
                    'inventory.available': quantity,
                    'inventory.reserved': -quantity
                }
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Reserved stock released successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update stock levels (admin only)
const updateStock = async (req, res) => {
    try {
        const { productId, total, available, lowStockThreshold } = req.body;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        
        // Validate ObjectId format
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }
        
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        const update = {};
        
        // Update inventory fields and ensure both new and legacy fields are synced
        if (typeof total !== 'undefined') {
            const totalStock = Math.max(0, parseInt(total));
            update['inventory.total'] = totalStock;
        }
        if (typeof available !== 'undefined') {
            const availableStock = Math.max(0, parseInt(available));
            update['inventory.available'] = availableStock;
            // Also update legacy stock field for backward compatibility
            update['stock'] = availableStock;
        }
        if (typeof lowStockThreshold !== 'undefined') {
            update['inventory.lowStockThreshold'] = Math.max(0, parseInt(lowStockThreshold));
        }
        
        // If total is updated but available isn't specified, sync available to total
        if (typeof total !== 'undefined' && typeof available === 'undefined') {
            const totalStock = Math.max(0, parseInt(total));
            update['inventory.available'] = totalStock;
            update['stock'] = totalStock;
        }
        
        console.log('Updating product stock:', { productId, update });
        
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId, 
            update, 
            { new: true, runValidators: true }
        );
        
        console.log('Updated product:', {
            id: updatedProduct._id,
            stock: updatedProduct.stock,
            inventory: updatedProduct.inventory
        });
        
        // Invalidate cache for this product and product lists
        invalidateProductCache(productId);
        
        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            product: {
                _id: updatedProduct._id,
                stock: updatedProduct.stock,
                inventory: updatedProduct.inventory
            }
        });
    } catch (error) {
        console.log('Error updating stock:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get low stock products (admin only)
const getLowStockProducts = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        // Find products where available stock is less than or equal to threshold
        // Also include products using the legacy 'stock' field
        const products = await ProductModel.find({
            $or: [
                {
                    $expr: {
                        $lte: ['$inventory.available', '$inventory.lowStockThreshold']
                    }
                },
                {
                    stock: { $lte: 10 } // Legacy stock field check
                }
            ]
        })
        .select('name inventory category subCategory price stock')
        .limit(parseInt(limit))
        .sort({ 'inventory.available': 1, stock: 1 });
        
        res.status(200).json({
            success: true,
            products,
            count: products.length
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Advanced product search with filters and sorting
const searchProducts = async (req, res) => {
    try {
        const {
            q = '', // Search query
            category = '',
            subCategory = '',
            minPrice = 0,
            maxPrice = 999999,
            minRating = 0,
            inStock = '',
            bestseller = '',
            featured = '',
            sort = 'relevance',
            page = 1,
            limit = 20
        } = req.query;
        
        // Build search filter
        let filter = { 
            $or: [
                { status: 'active' },
                { status: { $exists: false } } // Include products without status field
            ]
        };
        
        // Text search
        if (q.trim()) {
            filter.$text = { $search: q.trim() };
        }
        
        // Category filters
        if (category) {
            filter.category = new RegExp(category, 'i');
        }
        if (subCategory) {
            filter.subCategory = new RegExp(subCategory, 'i');
        }
        
        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        
        // Rating filter
        if (minRating) {
            filter['reviews.average'] = { $gte: parseFloat(minRating) };
        }
        
        // Stock filter
        if (inStock === 'true') {
            filter['inventory.available'] = { $gt: 0 };
        } else if (inStock === 'false') {
            filter['inventory.available'] = { $lte: 0 };
        }
        
        // Bestseller filter
        if (bestseller === 'true') {
            filter.bestseller = true;
        }
        
        // Featured filter
        if (featured === 'true') {
            filter.featured = true;
        }
        
        // Build sort options
        let sortOption = {};
        switch (sort) {
            case 'price_low':
                sortOption = { price: 1 };
                break;
            case 'price_high':
                sortOption = { price: -1 };
                break;
            case 'rating':
                sortOption = { 'reviews.average': -1, 'reviews.count': -1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'name_asc':
                sortOption = { name: 1 };
                break;
            case 'name_desc':
                sortOption = { name: -1 };
                break;
            case 'popularity':
                sortOption = { 'reviews.count': -1, 'reviews.average': -1 };
                break;
            case 'relevance':
            default:
                if (q.trim()) {
                    sortOption = { score: { $meta: 'textScore' } };
                } else {
                    sortOption = { featured: -1, bestseller: -1, 'reviews.average': -1 };
                }
                break;
        }
        
        const skip = (page - 1) * limit;
        
        // Execute search
        let query = ProductModel.find(filter);
        
        // Add text score for relevance sorting
        if (q.trim() && sort === 'relevance') {
            query = query.select({ score: { $meta: 'textScore' } });
        }
        
        const products = await query
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const totalProducts = await ProductModel.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalProducts / limit),
                totalProducts,
                hasNext: skip + products.length < totalProducts,
                hasPrev: page > 1
            },
            filters: {
                query: q,
                category,
                subCategory,
                priceRange: { min: minPrice, max: maxPrice },
                minRating,
                inStock,
                bestseller,
                featured,
                sort
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get search suggestions/autocomplete
const getSearchSuggestions = async (req, res) => {
    try {
        const { q = '', limit = 10 } = req.query;
        
        if (!q.trim()) {
            return res.status(200).json({ success: true, suggestions: [] });
        }
        
        // Get product name suggestions
        const productSuggestions = await ProductModel.find({
            name: new RegExp(q.trim(), 'i'),
            status: 'active'
        })
        .select('name')
        .limit(parseInt(limit))
        .lean();
        
        // Get category suggestions
        const categorySuggestions = await ProductModel.distinct('category', {
            category: new RegExp(q.trim(), 'i'),
            status: 'active'
        });
        
        // Get subcategory suggestions
        const subCategorySuggestions = await ProductModel.distinct('subCategory', {
            subCategory: new RegExp(q.trim(), 'i'),
            status: 'active'
        });
        
        const suggestions = [
            ...productSuggestions.map(p => ({ type: 'product', value: p.name })),
            ...categorySuggestions.map(c => ({ type: 'category', value: c })),
            ...subCategorySuggestions.map(sc => ({ type: 'subcategory', value: sc }))
        ].slice(0, parseInt(limit));
        
        res.status(200).json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get available filter options
const getFilterOptions = async (req, res) => {
    try {
        const { category = '', subCategory = '' } = req.query;
        
        let filter = { 
            $or: [
                { status: 'active' },
                { status: { $exists: false } } // Include products without status field
            ]
        };
        if (category) filter.category = category;
        if (subCategory) filter.subCategory = subCategory;
        
        // Get available categories
        const categories = await ProductModel.distinct('category', filter);
        
        // Get available subcategories
        const subCategories = await ProductModel.distinct('subCategory', filter);
        
        // Get price range
        const priceRange = await ProductModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);
        
        // Get available sizes
        const sizes = await ProductModel.distinct('sizes', filter);
        const allSizes = [...new Set(sizes.flat())];
        
        res.status(200).json({
            success: true,
            filters: {
                categories,
                subCategories,
                priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
                sizes: allSizes,
                ratings: [5, 4, 3, 2, 1]
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update product (admin): name, price, stock
const updateProduct = async (req, res) => {
    try {
        const { id, name, price, stock } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'Product id is required' });
        }
        
        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }
        
        const update = {};
        if (typeof name !== 'undefined' && name.trim()) {
            update.name = name.trim();
        }
        if (typeof price !== 'undefined' && !isNaN(price) && price >= 0) {
            update.price = Number(price);
        }
        if (typeof stock !== 'undefined' && !isNaN(stock) && stock >= 0) {
            update.stock = Number(stock);
            // Also update inventory for consistency
            update['inventory.available'] = Number(stock);
            update['inventory.total'] = Number(stock);
        }
        
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }
        
        const updated = await ProductModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Invalidate cache for this product and product lists
        invalidateProductCache(id);
        
        res.status(200).json({ success: true, message: 'Product updated successfully', product: updated });
    } catch (error) {
        console.log(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}

// Debug function to check product data (admin only)
const debugProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        res.status(200).json({
            success: true,
            debug: {
                _id: product._id,
                name: product.name,
                stock: product.stock,
                inventory: product.inventory,
                rawData: product.toObject()
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct, checkStock, reserveStock, releaseStock, updateStock, getLowStockProducts, searchProducts, getSearchSuggestions, getFilterOptions, debugProduct }
