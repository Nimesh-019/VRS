const express = require('express');

const router = express.Router();

const {
    isLoggedIn,
    isAdmin
} = require('../middleware/auth');

const {
    getAdminDashboard,
    approveVehicle,
    rejectVehicle,
    getOwnerVehicles
} = require('../controllers/adminController');

const {
    getAdminComplaints,
    respondToComplaint
} = require('../controllers/complaintController');


// ======================================================
// ADMIN DASHBOARD
// ======================================================

router.get(
    '/dashboard',
    isLoggedIn,
    isAdmin,
    getAdminDashboard
);

router.get(
    '/owners/:ownerId/vehicles',
    isLoggedIn,
    isAdmin,
    getOwnerVehicles
);

router.get(
    '/owner/:ownerId/vehicles',
    isLoggedIn,
    isAdmin,
    getOwnerVehicles
);


// ======================================================
// VEHICLE APPROVAL
// ======================================================

router.post(
    '/vehicles/:id/approve',
    isLoggedIn,
    isAdmin,
    approveVehicle
);

router.post(
    '/vehicle/:id/approve',
    isLoggedIn,
    isAdmin,
    approveVehicle
);

router.post(
    '/vehicles/:id/reject',
    isLoggedIn,
    isAdmin,
    rejectVehicle
);

router.post(
    '/vehicle/:id/reject',
    isLoggedIn,
    isAdmin,
    rejectVehicle
);


// ======================================================
// COMPLAINTS
// ======================================================

router.get(
    '/complaints',
    isLoggedIn,
    isAdmin,
    getAdminComplaints
);

router.post(
    '/complaints/:id/respond',
    isLoggedIn,
    isAdmin,
    respondToComplaint
);


module.exports = router;