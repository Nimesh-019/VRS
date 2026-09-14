const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{10}$/
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['admin', 'owner', 'user'],
        required: true
    }

});

const User = mongoose.model('User', userSchema);

module.exports = User;