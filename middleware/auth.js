const jwt = require('jsonwebtoken');
const isLoggedIn = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }
    try{
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'MYKEY123KEY');
        req.user = decoded;
        next();
    } catch (error) {
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
