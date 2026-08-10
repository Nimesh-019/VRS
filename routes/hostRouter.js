const express = require('express');
const hostRouter = express.Router();
const path = require('path');
const rootDir = require('../utils/pathutils');

// GET method to render form
hostRouter.get('/add-vehicle', (req, res, next) => {
    res.sendFile(path.join(rootDir, 'vehicle/addVehicle.ejs'));
});

const vehicles = [];

hostRouter.post('/add-vehicle', (req, res) => {

    const vehicle = {

        vehicleNumber: req.body.vehicleNumber,

        vehicleName: req.body.vehicleName,

        ownerName: req.body.ownerName,

        mobileNumber: req.body.mobileNumber,

        rentPerDay: req.body.rentPerDay

    };

    vehicles.push(vehicle);

    console.log(vehicle);

    res.sendFile(path.join(rootDir, 'vehicle/vehicleAdded.ejs'));

});

exports.hostRouter = hostRouter;
exports.vehicles = vehicles;