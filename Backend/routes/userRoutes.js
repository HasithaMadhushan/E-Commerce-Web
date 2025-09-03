import express from 'express';
import { 
    loginUser, 
    registerUser, 
    loginAdmin, 
    getProfile, 
    updateProfile, 
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    getAddresses,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    updateEmailPreferences
} from '../controllers/userController.js';
import authUser from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateUserRegistration, validateUserLogin, validateProfileUpdate } from '../middleware/validation.js';

const userRouter = express.Router();

// Authentication routes with rate limiting and validation
userRouter.post('/login', authLimiter, validateUserLogin, loginUser)
userRouter.post('/register', authLimiter, validateUserRegistration, registerUser)
userRouter.post('/admin/login', authLimiter, validateUserLogin, loginAdmin)

// Profile management routes (require authentication)
userRouter.get('/profile', authUser, getProfile)
userRouter.put('/profile', authUser, validateProfileUpdate, updateProfile)
userRouter.post('/change-password', authUser, changePassword)

// Address management routes (require authentication)
userRouter.get('/addresses', authUser, getAddresses)
userRouter.post('/addresses', authUser, addAddress)
userRouter.put('/addresses', authUser, updateAddress)
userRouter.delete('/addresses', authUser, deleteAddress)

// Wishlist management routes (require authentication)
userRouter.get('/wishlist', authUser, getWishlist)
userRouter.post('/wishlist/add', authUser, addToWishlist)
userRouter.post('/wishlist/remove', authUser, removeFromWishlist)
userRouter.post('/wishlist/toggle', authUser, toggleWishlist)

// Email preferences route (require authentication)
userRouter.put('/email-preferences', authUser, updateEmailPreferences)

// Keep backward compatibility
userRouter.get('/me', authUser, getProfile)
userRouter.put('/me', authUser, updateProfile)

export default userRouter;
