const jwt = require('jsonwebtoken');
const User = require('../models/user');

const isApiLoggedIn = async (req, res, next) => {
    let token = req.cookies ? req.cookies.token : null;
    
    // Also check Authorization header (e.g. Bearer <token>) for API flexibility
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Access denied. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'MYKEY123KEY');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            res.clearCookie('token');
            return res.status(401).json({ message: "User session expired or user not found." });
        }

        req.user = user;
        if (req.session) {
            req.session.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                role: user.role
            };
        }
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.status(401).json({ message: "Invalid or expired session token." });
    }
};

const isApiOwner = (req, res, next) => {
    if (req.user && req.user.role === 'owner') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Owner access required." });
};

const isApiUser = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Customer/User access required." });
};

const isApiAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Admin access required." });
};

module.exports = {
    isApiLoggedIn,
    isApiOwner,
    isApiUser,
    isApiAdmin
};
