import express from 'express';
import {
    addProduct,
    listProducts,
    removeProduct,
    singleProduct,
    updateProduct,
    checkStock,
    reserveStock,
    releaseStock,
    updateStock,
    getLowStockProducts,
    searchProducts,
    getSearchSuggestions,
    getFilterOptions,
    debugProduct
} from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import { cacheProductList, cacheProduct, cacheCategories, cacheSearch } from '../middleware/cache.js';

const productRouter = express.Router();

// Product CRUD routes
productRouter.post('/add', adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), addProduct);
productRouter.get('/list', listProducts); // Temporarily removed cache middleware
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.put('/update', adminAuth, updateProduct);
productRouter.post('/single', singleProduct); // Temporarily removed cache middleware

// Inventory management routes - specific routes must come before parameterized routes
productRouter.get('/stock/low', adminAuth, getLowStockProducts);
productRouter.post('/stock/reserve', reserveStock);
productRouter.post('/stock/release', releaseStock);
productRouter.put('/stock/update', adminAuth, updateStock);
productRouter.get('/stock/:productId', checkStock);

// Search and filter routes
productRouter.get('/search', searchProducts); // Temporarily removed cache middleware
productRouter.get('/suggestions', getSearchSuggestions);
productRouter.get('/filters', getFilterOptions); // Temporarily removed cache middleware

// Debug route (admin only)
productRouter.get('/debug/:productId', adminAuth, debugProduct);

// Parameterized routes must come last to avoid conflicts
productRouter.get('/:productId', cacheProduct, singleProduct);

export default productRouter;