const express = require('express');

const vehicleRouter = express.Router();

const vehicleController = require('./vehicleController');


// ==========================================
// ADD VEHICLE
// ==========================================

vehicleRouter.get(
    '/add',
    vehicleController.showAddVehicle
);


vehicleRouter.post(
    '/add',
    vehicleController.addVehicle
);


// ==========================================
// VIEW ALL VEHICLES
// ==========================================

vehicleRouter.get(
    '/',
    vehicleController.getVehicles
);


// ==========================================
// UPDATE VEHICLE
// ==========================================

vehicleRouter.get(
    '/edit/:id',
    vehicleController.showEditVehicle
);


vehicleRouter.post(
    '/edit/:id',
    vehicleController.updateVehicle
);


// ==========================================
// DELETE VEHICLE
// ==========================================

vehicleRouter.post(
    '/delete/:id',
    vehicleController.deleteVehicle
);


module.exports = vehicleRouter;