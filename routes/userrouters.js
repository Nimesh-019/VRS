const express = require('express');

const userRouter = express.Router();

const vehicles = require('../modules/vehicle/vehicleModel');


// ==========================================
// HOME PAGE
// ==========================================

userRouter.get('/', (req, res) => {

    res.render('home', {
        vehicles: vehicles
    });

});


module.exports = {
    userRouter
};