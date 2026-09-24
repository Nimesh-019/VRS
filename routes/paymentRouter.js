const express = require('express');

const router = express.Router();

const {
    initiatePayment,
    payuSuccess,
    payuFailure
} = require('../controllers/paymentController');

const {
    isLoggedIn,
    isUser
} = require('../middleware/auth');

router.get(
    '/pay/:bookingId',
    isLoggedIn,
    isUser,
    initiatePayment
);

router.post(
    '/success',
    payuSuccess
);

router.post(
    '/failure',
    payuFailure
);

module.exports = router;