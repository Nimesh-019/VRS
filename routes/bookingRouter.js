const express = require('express');
const router = express.Router();
const {showBookingForm,bookVehicle,showBookings,showOwnerBookingHistory} = require('../controllers/bookingController');
const { isLoggedIn, isUser } = require('../middleware/auth');

// Apply authentication middleware to all booking routes
router.get('/book/:vehicleId', isLoggedIn, isUser, showBookingForm);
router.post('/book/:vehicleId', isLoggedIn, isUser, bookVehicle);
router.get('/bookings', isLoggedIn, isUser, showBookings);
router.get('/owner/rentals/history', isLoggedIn,showOwnerBookingHistory);
// router.post()



// router.use(isLoggedIn);
// router.use(isUser);
// router.get('/book/:vehicleId', showBookingForm);
// router.post('/book/:vehicleId', bookVehicle);
// router.get('/bookings', showBookings);
module.exports = router;