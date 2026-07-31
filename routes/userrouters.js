const express = require('express');
const userRouter = express.Router();
const path = require('path');
const rootDir = require('../utils/pathutils');
const { houses } = require('./hostRouter');

userRouter.get('/', (req, res, next) => {
    console.log(houses);
    console.log(req.url, req.method);
    res.sendFile(path.join(rootDir, 'views/home.html'));
});

exports.userRouter = userRouter;