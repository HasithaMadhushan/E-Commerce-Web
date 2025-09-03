import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
    try {
        const {token} = req.headers;
        if(!token){
            return res.status(401).json({success: false, message: 'Unauthorized - No admin token provided'})
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        // Check if the decoded token payload matches admin credentials
        if (token_decode.admin !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD){
            return res.status(403).json({success: false, message: 'Forbidden - Invalid admin credentials'})
        }
        
        next()

    } catch (error) {
        console.log(error)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Admin token expired" })
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid admin token" })
        }
        res.status(500).json({success: false, message: "Admin authentication error"})
    }
}

export default adminAuth