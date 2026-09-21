const express = require('express');

const router = express.Router();

const {
    showComplaintForm,
    submitComplaint,
    showMyComplaints
} = require('../controllers/complaintController');

const {
    isLoggedIn,
    isUser
} = require('../middleware/auth');


// ======================================================
// CUSTOMER COMPLAINT ROUTES
// ======================================================

// Show complaint form
router.get(
    '/complaint/:vehicleId',
    isLoggedIn,
    isUser,
    showComplaintForm
);


// Submit complaint
router.post(
    '/complaint/:vehicleId',
    isLoggedIn,
    isUser,
    submitComplaint
);


// Customer's complaints
router.get(
    '/complaints',
    isLoggedIn,
    isUser,
    showMyComplaints
);


module.exports = router;