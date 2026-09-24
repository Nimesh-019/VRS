const Vehicle = require('../models/vehicle');
const multer = require('multer');
const upload = require('../middleware/upload');

const resolveImageUrl = (req, fallbackUrl = '') => {
    if (req.file) {
        if (req.file.path) return req.file.path; // Cloudinary URL
        if (req.file.buffer) {
            return `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
    }
    if (req.body && req.body.image && typeof req.body.image === 'string' && req.body.image.trim()) {
        return req.body.image.trim();
    }
    return fallbackUrl;
};

// ==================== OWNER DASHBOARD ====================

const getOwnerDashboard = async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;

        const {
            search = '',
            type = '',
            availability = '',
            sort = ''
        } = req.query;

        // Always restrict vehicles to logged-in owner
        const filter = {
            ownerId: ownerId
        };

        // Search by brand, model, or vehicle number
        if (search.trim() !== '') {
            filter.$or = [
                { brand: { $regex: search.trim(), $options: 'i' } },
                { model: { $regex: search.trim(), $options: 'i' } },
                { vehicleNumber: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Filter by vehicle type
        if (type !== '') {
            filter.type = type;
        }

        // Filter by availability
        if (availability === 'available') {
            filter.availability = true;
        }
        else if (availability === 'unavailable') {
            filter.availability = false;
        }

        // Sorting
        let sortOption = { _id: -1 };

        if (sort === 'priceAsc') {
            sortOption = { pricePerDay: 1 };
        }
        else if (sort === 'priceDesc') {
            sortOption = { pricePerDay: -1 };
        }
        else if (sort === 'nameAsc') {
            sortOption = { brand: 1, model: 1 };
        }

        const vehicles = await Vehicle
            .find(filter)
            .sort(sortOption);

        res.render('owner/dashboard', {
            user: req.user,
            vehicles,

            // Send current filter values to EJS
            search,
            selectedType: type,
            selectedAvailability: availability,
            selectedSort: sort
        });

    } catch (error) {
        console.error('Error fetching owner dashboard:', error);
        res.status(500).send('Server Error');
    }
};


// ==================== ADD VEHICLE PAGE ====================

const getAddVehicle = (req, res) => {
    res.render('owner/addVehicle', {
        user: req.user,
        error: null
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

        const imageUrl = resolveImageUrl(req);

        if (!imageUrl) {
            return res.render('owner/addVehicle', {
                user: req.user,
                error: 'Vehicle image is required'
            });
        }

        const newVehicle = new Vehicle({
            ownerId: req.user._id || req.user.id,
            vehicleNumber,
            brand,
            model,
            type,
            pricePerDay,
            description,
            image: imageUrl,
            availability: true
        });

        await newVehicle.save();

        res.redirect('/owner/dashboard');

    } catch (error) {

        console.error('Error adding vehicle:', error);

        res.render('owner/addVehicle', {
            user: req.user,
            error: error.message || 'Error adding vehicle'
        });
    }
};

// ==================== OWNER VEHICLES ====================

const getVehicles = async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;

        const vehicles = await Vehicle.find({ ownerId });

        res.render('owner/vehicles', {
            user: req.user,
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

        const vehicle = await Vehicle.findOne({
            _id: id,
            ownerId: req.user._id || req.user.id
        });

        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }

        res.render('owner/editVehicle', {
            user: req.user,
            vehicle,
            error: null
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


// ==================== EDIT VEHICLE ====================

const editvehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const existingVehicle = await Vehicle.findOne({
            _id: id,
            ownerId: req.user._id || req.user.id
        });

        if (!existingVehicle) {
            return res.status(404).send('Vehicle not found');
        }

        const {
            vehicleNumber,
            brand,
            model,
            type,
            pricePerDay,
            description,
            availability
        } = req.body;

        const imageUrl = resolveImageUrl(req, existingVehicle.image);

        existingVehicle.vehicleNumber = vehicleNumber || existingVehicle.vehicleNumber;
        existingVehicle.brand = brand || existingVehicle.brand;
        existingVehicle.model = model || existingVehicle.model;
        existingVehicle.type = type || existingVehicle.type;
        existingVehicle.pricePerDay = pricePerDay !== undefined ? pricePerDay : existingVehicle.pricePerDay;
        existingVehicle.description = description !== undefined ? description : existingVehicle.description;
        if (availability !== undefined) {
            existingVehicle.availability = availability === 'true' || availability === true;
        }
        existingVehicle.image = imageUrl;

        await existingVehicle.save();

        res.redirect('/owner/dashboard');

    } catch (error) {
        console.error('Error editing vehicle:', error);
        const vehicle = await Vehicle.findById(req.params.id);
        res.render('owner/editVehicle', {
            user: req.user,
            vehicle: vehicle || {},
            error: error.message || 'Vehicle details are invalid'
        });
    }
};

// ==================== DELETE VEHICLE ====================

const deletevehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedVehicle = await Vehicle.findOneAndDelete({
            _id: id,
            ownerId: req.user._id || req.user.id
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

// ==================== USER DASHBOARD ====================

// ==================== USER DASHBOARD ====================

const getUserDashboard = async (req, res) => {
    try {

        const {
            search = '',
            type = '',
            minPrice = '',
            maxPrice = '',
            sort = ''
        } = req.query;


        // ==================== BUILD QUERY ====================

        const query = {
    approvalStatus: 'approved',
    availability: true
};


        // Search by brand, model or vehicle number
        if (search.trim()) {

            query.$or = [
                {
                    brand: {
                        $regex: search.trim(),
                        $options: 'i'
                    }
                },
                {
                    model: {
                        $regex: search.trim(),
                        $options: 'i'
                    }
                },
                {
                    vehicleNumber: {
                        $regex: search.trim(),
                        $options: 'i'
                    }
                }
            ];

        }


        // Filter by vehicle type
        if (type) {
            query.type = type;
        }


        // Filter by price range
        if (minPrice || maxPrice) {

            query.pricePerDay = {};

            if (minPrice) {
                query.pricePerDay.$gte = Number(minPrice);
            }

            if (maxPrice) {
                query.pricePerDay.$lte = Number(maxPrice);
            }

        }


        // ==================== SORT ====================

        let sortOption = {};

        if (sort === 'priceLow') {

            sortOption.pricePerDay = 1;

        } else if (sort === 'priceHigh') {

            sortOption.pricePerDay = -1;

        }


        // ==================== GET VEHICLES ====================

        const vehicles = await Vehicle.find(query)
            .populate('ownerId', 'name email phone')
            .sort(sortOption);


        // ==================== RENDER ====================

        res.render('user/dashboard', {

            user: req.user,
            vehicles,

            // Keep filter values in the form
            search,
            type,
            minPrice,
            maxPrice,
            sort

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