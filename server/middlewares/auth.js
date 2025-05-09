const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        // 1. Check if authorization header exists
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header missing",
                success: false
            });
        }

        // 2. Verify header format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                message: "Authorization format should be: Bearer <token>",
                success: false
            });
        }

        // 3. Verify and decode token
        const token = parts[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        
        // 4. Attach user to request
        req.user = { _id: decoded.userId };
        next();
    } catch (error) {
        let message = "Authentication failed";
        
        if (error.name === 'TokenExpiredError') {
            message = "Token expired";
        } else if (error.name === 'JsonWebTokenError') {
            message = "Invalid token";
        }

        return res.status(401).json({
            message,
            success: false,
            error: error.name
        });
    }
};
