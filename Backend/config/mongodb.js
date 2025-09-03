import mongoose from 'mongoose';

const connectDB = async () => {
    // Check if already connected (important for serverless)
    if (mongoose.connections[0].readyState) {
        return true;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, { 
            dbName: 'e-commerce'
        });
        
        mongoose.connection.on('connected', () => {
            console.log("MongoDB connected!");
        });
        
        mongoose.connection.on('error', (err) => {
            console.log("MongoDB connection error:", err);
        });
        
        return true;
    } catch (error) {
        console.log("DB Connection Error:", error);
        return false;
    }
}

export default connectDB;
