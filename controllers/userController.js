const User = require('../models/User');
// const session = require('express-session');
// const mongoose = require('mongoose');
// const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
exports.showLogin = (req, res) => {
    if (req.user) {
        if (req.user.role === 'owner') {
            return res.redirect('/owner/dashboard');
        } else if (req.user.role === 'user') {
            return res.redirect('/user/dashboard');
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
            return res.render('user/login', { error: 'Role mismatch', email, role });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET_KEY || 'MYKEY123KEY', { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour

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
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
        }
        res.redirect('/login');
    });
};
exports.showSignup = (req, res) => {
    res.render('user/signup');
}

exports.signup = async (req, res) => {

    try {

        // console.log("Received data:");
        // console.log(req.body);

        const { name, email, phone, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role
        });

        await user.save();

        // console.log("User inserted successfully:");
        // console.log(savedUser);

        res.render('user/login');

    } catch (error) {

        // console.log("ERROR CREATING USER:");
        console.log(error);

        res.status(500).send("Error creating user");

    }
};