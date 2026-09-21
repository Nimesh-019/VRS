const express = require('express');
const {
    getOwnerDashboard,
    getAddVehicle,
    addVehicle,
    getVehicles,
    getEditVehicle,
    editvehicle,
    deletevehicle,
    getUserDashboard
} = require('../controllers/vehicleController');

const { isLoggedIn, isOwner, isUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

const vehicleRouter = express.Router();

// Owner Routes
vehicleRouter.get('/owner/dashboard', isLoggedIn, isOwner, getOwnerDashboard);
vehicleRouter.get('/owner/vehicles', isLoggedIn, isOwner, getVehicles);
vehicleRouter.get('/owner/vehicles/add', isLoggedIn, isOwner, getAddVehicle);
vehicleRouter.post('/owner/vehicles/add', isLoggedIn, isOwner, addVehicle);
vehicleRouter.get('/owner/vehicles/edit/:id', isLoggedIn, isOwner, getEditVehicle);
vehicleRouter.post('/owner/vehicles/edit/:id', isLoggedIn, isOwner, upload.single('image'), editvehicle);
vehicleRouter.post('/owner/vehicles/delete/:id', isLoggedIn, isOwner, deletevehicle);

// Customer / User Routes
vehicleRouter.get('/user/dashboard', isLoggedIn, isUser, getUserDashboard);

module.exports = vehicleRouter;