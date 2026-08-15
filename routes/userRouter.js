const express = require('express');
const { showLogin, login, showSignup, signup, logout } = require('../controllers/userController');
const userRouter = express.Router();

userRouter.get('/', showLogin);
userRouter.get('/login', showLogin);
userRouter.post('/login', login);

userRouter.get('/signup', showSignup);
userRouter.post('/signup', signup);

userRouter.get('/logout', logout);

module.exports = userRouter;