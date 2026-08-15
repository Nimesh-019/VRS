const isLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login');
};

const isOwner = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'owner') {
        return next();
    }
    return res.status(403).send("Access denied. Owner access required.");
};

const isUser = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'user') {
        return next();
    }
    return res.status(403).send("Access denied. User access required.");
};

module.exports = {
    isLoggedIn,
    isOwner,
    isUser
};
