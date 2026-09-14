const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.showLogin = (req, res) => {
    const token = req.cookies ? req.cookies.token : null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY || 'MYKEY123KEY');
            if (decoded.role === 'owner') {
                return res.redirect('/owner/dashboard');
            } else if (decoded.role === 'user') {
                return res.redirect('/user/dashboard');
            }
        } catch (err) {
            res.clearCookie('token');
        }
    }
    res.render('user/login', { error: null, email: '', role: '' });
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('user/login', { error: 'User not found', email, role });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.render('user/login', { error: 'Wrong password', email, role });
        }
        if (user.role !== role) {
            return res.render('user/login', { error: `Account exists as '${user.role}', but tried logging in as '${role}'`, email, role });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET_KEY || 'MYKEY123KEY', { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        if (user.role === 'owner') {
            return res.redirect('/owner/dashboard');
        }

        if (user.role === 'user') {
            return res.redirect('/user/dashboard');
        }
        return res.render('user/login', { error: 'Invalid role', email, role });

    } catch (error) {
        console.error("Login error:", error);
        res.render('user/login', { error: 'Server error. Please try again.', email: req.body.email || '', role: req.body.role || '' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
            }
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
};

exports.showSignup = (req, res) => {
    res.render('user/signup', { error: null });
};

exports.signup = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'Email' : 'Phone number';
            return res.render('user/signup', { error: `${field} is already registered.` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role
        });

        await user.save();

        res.render('user/login', {
            error: null,
            email: email,
            role: role
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.render('user/signup', { error: error.message || "Error creating account" });
    }
};