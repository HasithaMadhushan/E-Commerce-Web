import UserModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import emailService from '../services/emailService.js';


const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

//route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        //checking user exists or not
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User does not exist' })
        }

        //comparing password
        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {

            //creating token
            const token = createToken(user._id)
            res.status(200).json({ success: true, token })
        }
        else {
            res.status(401).json({ success: false, message: 'Invalid Credentials' })
        }


    } catch (error) {
        res.status(500).json({ success: false, message: error.message })

    }
}



//route for user register
const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        //checking user already exists or not
        const exists = await UserModel.findOne({ email })
        if (exists) {
            return res.status(409).json({ success: false, message: 'User already exists' })
        }
        //validating email format and strong password
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email!' })
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password is not strong enough!' })
        }


        //hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)


        //creating new user
        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword
        })

        //saving user
        const User = await newUser.save()

        // Send welcome email (don't block registration if email fails)
        try {
            await emailService.sendWelcomeEmail(email, name)
        } catch (emailError) {
            console.log('Welcome email failed:', emailError.message)
        }

        const token = createToken(User._id)
        res.status(201).json({ success: true, token })


    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message })
    }
}



//route for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ admin: email + password }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.status(200).json({ success: true, token })

        } else {
            res.status(401).json({ success: false, message: 'Invalid admin credentials' })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message })
    }
}



// Get user wishlist
export const getWishlist = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await UserModel.findById(userId).populate('wishlist', 'name price image category subCategory reviews.average reviews.count stock inventory sizes');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Add product to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check if product is already in wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(409).json({ success: false, message: 'Product already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();

        res.status(200).json({ success: true, message: 'Product added to wishlist successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const index = user.wishlist.indexOf(productId);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in wishlist' });
        }

        user.wishlist.splice(index, 1);
        await user.save();

        res.status(200).json({ success: true, message: 'Product removed from wishlist successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Toggle product in wishlist (add if not present, remove if present)
export const toggleWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const index = user.wishlist.indexOf(productId);
        let message = '';

        if (index === -1) {
            // Add to wishlist
            user.wishlist.push(productId);
            message = 'Product added to wishlist successfully';
        } else {
            // Remove from wishlist
            user.wishlist.splice(index, 1);
            message = 'Product removed from wishlist successfully';
        }

        await user.save();

        res.status(200).json({
            success: true,
            message,
            inWishlist: index === -1
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get current user profile with enhanced fields
export const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await UserModel.findById(userId).select('-password -cartData');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update current user profile with enhanced fields
export const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, profile, emailPreferences } = req.body;
        const update = {}

        if (typeof name !== 'undefined') update.name = String(name);
        if (typeof phone !== 'undefined') update.phone = String(phone);
        if (profile) {
            if (profile.dateOfBirth) update['profile.dateOfBirth'] = new Date(profile.dateOfBirth);
            if (profile.gender) update['profile.gender'] = profile.gender;
            if (profile.preferences) update['profile.preferences'] = profile.preferences;
        }
        if (emailPreferences) {
            if (typeof emailPreferences.marketing !== 'undefined') update['emailPreferences.marketing'] = emailPreferences.marketing;
            if (typeof emailPreferences.orderUpdates !== 'undefined') update['emailPreferences.orderUpdates'] = emailPreferences.orderUpdates;
            if (typeof emailPreferences.promotions !== 'undefined') update['emailPreferences.promotions'] = emailPreferences.promotions;
        }

        const updated = await UserModel.findByIdAndUpdate(userId, update, { new: true }).select('-password -cartData');
        if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, user: updated, message: 'Profile updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Change user password
export const changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });
        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Add new address
export const addAddress = async (req, res) => {
    try {
        const { userId, address } = req.body;

        if (!address || !address.street || !address.city || !address.state || !address.zipCode || !address.country) {
            return res.status(400).json({ success: false, message: 'All address fields are required' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // If this is the first address or marked as default, make it default
        if (user.addresses.length === 0 || address.isDefault) {
            // Remove default from other addresses
            user.addresses.forEach(addr => addr.isDefault = false);
            address.isDefault = true;
        }

        user.addresses.push(address);
        await user.save();

        res.status(201).json({ success: true, message: 'Address added successfully', addresses: user.addresses });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update address
export const updateAddress = async (req, res) => {
    try {
        const { userId, addressId, address } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        // If setting as default, remove default from others
        if (address.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Update address
        Object.assign(user.addresses[addressIndex], address);
        await user.save();

        res.status(200).json({ success: true, message: 'Address updated successfully', addresses: user.addresses });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Delete address
export const deleteAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If deleted address was default, make first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.status(200).json({ success: true, message: 'Address deleted successfully', addresses: user.addresses });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get user addresses
export const getAddresses = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await UserModel.findById(userId).select('addresses');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, addresses: user.addresses });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
// Update email preferences
export const updateEmailPreferences = async (req, res) => {
    try {
        const { userId } = req.body
        const { orderUpdates, promotions, newsletter, productRecommendations } = req.body

        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                'emailPreferences.orderUpdates': orderUpdates,
                'emailPreferences.promotions': promotions,
                'emailPreferences.newsletter': newsletter,
                'emailPreferences.productRecommendations': productRecommendations
            },
            { new: true }
        )

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        res.json({ success: true, message: 'Email preferences updated successfully', emailPreferences: user.emailPreferences })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

export { loginUser, registerUser, loginAdmin }