import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
    const token = req.headers.token
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized - No token provided" })
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        // ensure body exists for GET or routes without payload
        if (!req.body) req.body = {}
        req.body.userId = token_decode.id
        req.userId = token_decode.id
        next()
    } catch (error) {
        console.log(error)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token expired" })
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" })
        }
        res.status(500).json({ success: false, message: "Authentication error" })
    }
}

export default authUser
