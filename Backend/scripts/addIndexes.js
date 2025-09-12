import mongoose from 'mongoose';
import 'dotenv/config';

// Import models
import OrderModel from '../models/orderModel.js';
import ProductModel from '../models/productModel.js';
import UserModel from '../models/userModel.js';
import ReviewModel from '../models/reviewModel.js';

const addDatabaseIndexes = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Adding database indexes for better performance...');

        // Order collection indexes
        await OrderModel.collection.createIndex({ createdAt: -1 });
        await OrderModel.collection.createIndex({ status: 1 });
        await OrderModel.collection.createIndex({ paymentStatus: 1 });
        await OrderModel.collection.createIndex({ userId: 1 });
        await OrderModel.collection.createIndex({ orderNumber: 1 });
        await OrderModel.collection.createIndex({ 
            createdAt: -1, 
            status: 1, 
            paymentStatus: 1 
        }); // Compound index for common queries

        // Product collection indexes
        await ProductModel.collection.createIndex({ category: 1 });
        await ProductModel.collection.createIndex({ subCategory: 1 });
        await ProductModel.collection.createIndex({ bestseller: 1 });
        await ProductModel.collection.createIndex({ featured: 1 });
        await ProductModel.collection.createIndex({ status: 1 });
        await ProductModel.collection.createIndex({ 'inventory.available': 1 });
        await ProductModel.collection.createIndex({ 
            category: 1, 
            subCategory: 1, 
            status: 1 
        }); // Compound index for filtering

        // User collection indexes
        await UserModel.collection.createIndex({ email: 1 });
        await UserModel.collection.createIndex({ createdAt: -1 });

        // Review collection indexes
        await ReviewModel.collection.createIndex({ productId: 1 });
        await ReviewModel.collection.createIndex({ userId: 1 });
        await ReviewModel.collection.createIndex({ status: 1 });
        await ReviewModel.collection.createIndex({ createdAt: -1 });
        await ReviewModel.collection.createIndex({ 
            productId: 1, 
            status: 1 
        }); // Compound index for product reviews

        console.log('✅ All database indexes created successfully!');
        console.log('Query performance should be significantly improved.');
        
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run the script
addDatabaseIndexes();
