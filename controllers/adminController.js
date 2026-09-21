const User = require('../models/user');
const Vehicle = require('../models/vehicle');


// ==================== ADMIN DASHBOARD ====================

const getAdminDashboard = async (req, res) => {

    try {

        // Get all vehicle owners
        const owners = await User.find({
            role: 'owner'
        }).select('-password');


        // Get all vehicles
        const vehicles = await Vehicle.find()
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });


        // Get vehicles waiting for admin approval
        const pendingVehicles = await Vehicle.find({
            approvalStatus: 'pending'
        })
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });


        // Render admin dashboard
        res.render('admin/dashboard', {

            user: req.user,

            owners: owners,

            vehicles: vehicles,

            pendingVehicles: pendingVehicles,

            totalOwners: owners.length,

            totalVehicles: vehicles.length,

            pendingVehiclesCount: pendingVehicles.length

        });

    } catch (error) {

        console.error('Error fetching admin dashboard:', error);

        res.status(500).send('Server Error');

    }

};

// ==================== APPROVE VEHICLE ====================

const approveVehicle = async (req, res) => {

    try {

        const { id } = req.params;

        const vehicle = await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }

        vehicle.approvalStatus = 'approved';
        vehicle.rejectionReason = '';

        await vehicle.save();

        res.redirect('/admin/dashboard');

    } catch (error) {

        console.error('Error approving vehicle:', error);

        res.status(500).send('Server Error');

    }

};


// ==================== REJECT VEHICLE ====================

const rejectVehicle = async (req, res) => {

    try {

        const { id } = req.params;

        const { rejectionReason } = req.body;

        const vehicle = await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }

        vehicle.approvalStatus = 'rejected';

        vehicle.rejectionReason =
            rejectionReason?.trim() || 'Vehicle rejected by admin.';

        await vehicle.save();

        res.redirect('/admin/dashboard');

    } catch (error) {

        console.error('Error rejecting vehicle:', error);

        res.status(500).send('Server Error');

    }

};

// ==================== GET OWNER VEHICLES ====================

const getOwnerVehicles = async (req, res) => {
    try {
        const { ownerId } = req.params;

        const owner = await User.findOne({ _id: ownerId, role: 'owner' }).select('-password');
        if (!owner) {
            return res.status(404).send('Owner not found');
        }

        const vehicles = await Vehicle.find({ ownerId }).sort({ createdAt: -1 });

        res.render('admin/vehicles', {
            user: req.user,
            owner,
            vehicles
        });

    } catch (error) {
        console.error('Error fetching owner vehicles:', error);
        res.status(500).send('Server Error');
    }
};

// ==================== EXPORT ====================

module.exports = {
    getAdminDashboard,
    approveVehicle,
    rejectVehicle,
    getOwnerVehicles
};