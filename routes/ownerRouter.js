const express = require('express');
const {confirmBooking,rejectBooking}=require('../controllers/ownerController');
const { isLoggedIn, isOwner } = require('../middleware/auth');
const { showOwnerBookingHistory } = require('../controllers/bookingController');
const {getOwnerComplaints, ownerRespondToComplaint} = require('../controllers/complaintController');
const router = express.Router();

router.get('/history', isLoggedIn, isOwner, showOwnerBookingHistory);
router.get('/complaints', isLoggedIn, isOwner, getOwnerComplaints);
router.post('/complaint/:id/reply', isLoggedIn, isOwner, ownerRespondToComplaint);
router.post('/booking/:id/confirm', isLoggedIn, isOwner, confirmBooking);
router.post('/booking/:id/reject', isLoggedIn, isOwner, rejectBooking);
module.exports = router;