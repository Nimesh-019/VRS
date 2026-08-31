const Vehicle = require('../models/vehicle');

// ==================== OWNER DASHBOARD ====================

const getOwnerDashboard = async (req, res) => {
    try {
        const ownerId = req.user.id

        const vehicles = await Vehicle.find({ ownerId });

        res.render('owner/dashboard', {
            user: req.session.user,
            vehicles
        });

    } catch (error) {
        console.error('Error fetching owner dashboard:', error);
        res.status(500).send('Server Error');
    }
};


// ==================== ADD VEHICLE PAGE ====================

const getAddVehicle = (req, res) => {
    res.render('owner/addVehicle', {
        user: req.session.user
    });
};


// ==================== ADD VEHICLE ====================

const addVehicle = async (req, res) => {
    try {
        const {
            vehicleNumber,
            brand,
            model,
            type,
            pricePerDay,
            description
        } = req.body;

        const newVehicle = new Vehicle({
            ownerId: req.session.user.id,
            vehicleNumber,
            brand,
            model,
            type,
            pricePerDay,
            description,
            availability: true
        });

        await newVehicle.save();

        res.redirect('/owner/dashboard');

    } catch (error) {
        console.error('Error adding vehicle:', error);
        res.status(500).send('Error adding vehicle');
    }
};


// ==================== OWNER VEHICLES ====================

const getVehicles = async (req, res) => {
    try {
        const ownerId = req.session.user.id;

        const vehicles = await Vehicle.find({ ownerId });

        res.render('owner/vehicles', {
            user: req.session.user,
            vehicles
        });

    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).send('Server Error');
    }
};


// ==================== EDIT VEHICLE PAGE ====================

const getEditVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const foundVehicle = await Vehicle.findById(id);

        if (!foundVehicle) {
            return res.status(404).send('Vehicle not found');
        }

        res.render('owner/editVehicle', {
            user: req.session.user,
            vehicle: foundVehicle
        });

    } catch (error) {
        console.error('Error getting edit vehicle page:', error);
        res.status(500).send('Server Error');
    }
};


// ==================== EDIT VEHICLE ====================

const editvehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            vehicleNumber,
            brand,
            model,
            type,
            pricePerDay,
            description,
            availability
        } = req.body;

        const editedVehicle = await Vehicle.findOneAndUpdate(
            {
                _id: id,
                ownerId: req.user.id
            },
            {
                vehicleNumber,
                brand,
                model,
                type,
                pricePerDay,
                description,
                availability
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!editedVehicle) {
            return res.status(404).send('Vehicle not found');
        }

        res.redirect('/owner/dashboard');

    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).send('Server Error');
    }
};


// ==================== DELETE VEHICLE ====================

const deletevehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedVehicle = await Vehicle.findOneAndDelete({
            _id: id,
            ownerId: req.session.user.id
        });

        if (!deletedVehicle) {
            return res.status(404).send('Vehicle not found');
        }

        res.redirect('/owner/dashboard');

    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).send('Server Error');
    }
};


// ==================== USER DASHBOARD ====================

const getUserDashboard = async (req, res) => {
    try {
        // Fetch all vehicles listed for rent
        // and populate owner information
        const vehicles = await Vehicle.find()
            .populate('ownerId', 'name email phone');

        res.render('user/dashboard', {
            user: req.user,
            vehicles
        });

    } catch (error) {
        console.error('Error fetching customer dashboard:', error);
        res.status(500).send('Server Error');
    }
};


// ==================== EXPORT ====================

module.exports = {
    getOwnerDashboard,
    getAddVehicle,
    addVehicle,
    getVehicles,
    getEditVehicle,
    editvehicle,
    deletevehicle,
    getUserDashboard
};