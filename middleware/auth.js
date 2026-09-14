const jwt = require('jsonwebtoken');
const User = require('../models/user');

const isLoggedIn = async (req, res, next) => {
    const token = req.cookies ? req.cookies.token : null;
    if (!token) {
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        return res.status(401).send("Access denied. No token provided.");
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'MYKEY123KEY');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            res.clearCookie('token');
            if (req.accepts('html')) {
                return res.redirect('/login');
            }
            return res.status(401).send("User not found.");
        }
        req.user = user;
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };
        next();
    } catch (error) {
        res.clearCookie('token');
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        return res.status(401).send("Invalid token.");
    }
};

const isOwner = (req, res, next) => {
    if (req.user && req.user.role === 'owner') {
        return next();
    }
    return res.status(403).send("Access denied. Owner access required.");
};

const isUser = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
        return next();
    }
    return res.status(403).send("Access denied. User access required.");
};

module.exports = {
    isLoggedIn,
    isOwner,
    isUser
};

