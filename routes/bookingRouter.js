const express = require('express');
const router = express.Router();
const {showBookingForm,bookVehicle,showBookings,showOwnerBookingHistory} = require('../controllers/bookingController');
const { isLoggedIn, isUser, isOwner } = require('../middleware/auth');

router.get('/book/:vehicleId', isLoggedIn, isUser, showBookingForm);
router.post('/book/:vehicleId', isLoggedIn, isUser, bookVehicle);
router.get('/bookings', isLoggedIn, isUser, showBookings);

module.exports = router;