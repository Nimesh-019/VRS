const vehicles = require('./vehicleModel');


// ==========================================
// SHOW ADD VEHICLE PAGE
// ==========================================

exports.showAddVehicle = (req, res) => {

    res.render('vehicle/addVehicle');

};


// ==========================================
// ADD VEHICLE
// ==========================================

exports.addVehicle = (req, res) => {

    const vehicle = {

        id: Date.now(),

        vehicleNumber: req.body.vehicleNumber,

        vehicleName: req.body.vehicleName,

        ownerName: req.body.ownerName,

        mobileNumber: req.body.mobileNumber,

        rentPerDay: req.body.rentPerDay,

        status: 'Available'

    };


    vehicles.push(vehicle);


    console.log('Vehicle Added:');
    console.log(vehicle);


    res.render('vehicle/vehicleAdded', {

        vehicle: vehicle

    });

};


// ==========================================
// SHOW ALL VEHICLES
// ==========================================

exports.getVehicles = (req, res) => {

    res.render('vehicle/vehicles', {

        vehicles: vehicles

    });

};


// ==========================================
// SHOW EDIT PAGE
// ==========================================

exports.showEditVehicle = (req, res) => {

    const id = Number(req.params.id);


    const vehicle = vehicles.find(
        vehicle => vehicle.id === id
    );


    if (!vehicle) {

        return res.status(404).render('404');

    }


    res.render('vehicle/editVehicle', {

        vehicle: vehicle

    });

};


// ==========================================
// UPDATE VEHICLE
// ==========================================

exports.updateVehicle = (req, res) => {

    const id = Number(req.params.id);


    const vehicle = vehicles.find(
        vehicle => vehicle.id === id
    );


    if (!vehicle) {

        return res.status(404).render('404');

    }


    vehicle.vehicleNumber = req.body.vehicleNumber;

    vehicle.vehicleName = req.body.vehicleName;

    vehicle.ownerName = req.body.ownerName;

    vehicle.mobileNumber = req.body.mobileNumber;

    vehicle.rentPerDay = req.body.rentPerDay;


    res.redirect('/vehicles');

};


// ==========================================
// DELETE VEHICLE
// ==========================================

exports.deleteVehicle = (req, res) => {

    const id = Number(req.params.id);


    const index = vehicles.findIndex(
        vehicle => vehicle.id === id
    );


    if (index === -1) {

        return res.status(404).render('404');

    }


    vehicles.splice(index, 1);


    res.redirect('/vehicles');

};