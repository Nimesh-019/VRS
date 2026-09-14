const express = require('express');
const {confirmBooking,rejectBooking}=require('../controllers/ownerController');
const { isLoggedIn, isOwner } = require('../middleware/auth');
const { showOwnerBookingHistory } = require('../controllers/bookingController');
const router = express.Router();

router.get('/history', isLoggedIn, isOwner, showOwnerBookingHistory);
router.post('/booking/:id/confirm', isLoggedIn, isOwner, confirmBooking);
router.post('/booking/:id/reject', isLoggedIn, isOwner, rejectBooking);
module.exports = router;