const crypto = require('crypto');

const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { syncBookingStatus } = require('../utils/bookingLifecycle');

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;

const PAYU_URL = 'https://test.payu.in/_payment';

// =====================================================
// CORE PAYMENT DATA GENERATOR (REUSED BY EJS & REACT API)
// =====================================================

const generatePaymentData = async ({ bookingId, userId, source = 'react', req = null }) => {
    // =================================================
    // FIND BOOKING
    // =================================================
    const booking = await Booking.findOne({
        _id: bookingId,
        userId: userId
    })
        .populate('userId')
        .populate('vehicleId');

    if (!booking) {
        const error = new Error('Booking not found');
        error.statusCode = 404;
        throw error;
    }

    // Sync lifecycle status
    await syncBookingStatus(booking);

    // =================================================
    // ONLY CONFIRMED OR ONGOING BOOKINGS CAN BE PAID
    // =================================================
    if (booking.status !== 'confirmed' && booking.status !== 'ongoing') {
        const error = new Error('Payment is only allowed for confirmed or ongoing bookings');
        error.statusCode = 400;
        throw error;
    }

    // =================================================
    // PREVENT DUPLICATE PAYMENT
    // =================================================
    if (booking.paymentStatus === 'paid') {
        const error = new Error('Payment has already been completed');
        error.statusCode = 400;
        throw error;
    }

    // =================================================
    // CHECK USER INFORMATION
    // =================================================
    if (!booking.userId || !booking.userId.name || !booking.userId.email) {
        const error = new Error('User information is incomplete');
        error.statusCode = 400;
        throw error;
    }

    // =================================================
    // CHECK VEHICLE INFORMATION
    // =================================================
    if (!booking.vehicleId) {
        const error = new Error('Vehicle information not found');
        error.statusCode = 400;
        throw error;
    }

    // =================================================
    // GENERATE UNIQUE TRANSACTION ID
    // =================================================
    const txnid = 'VRS_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    // =================================================
    // PAYMENT AMOUNT
    // =================================================
    const amount = Number(booking.totalAmount).toFixed(2);

    // =================================================
    // CUSTOMER INFORMATION
    // =================================================
    const firstname = booking.userId.name;
    const email = booking.userId.email;
    const phone = booking.userId.phone || '9999999999';

    // =================================================
    // PRODUCT INFORMATION
    // =================================================
    const productinfo = `Vehicle Rental - ${booking.vehicleId.brand} ${booking.vehicleId.model}`;

    // =================================================
    // UDF VALUES (udf1 tracks origin e.g. 'react' or '')
    // =================================================
    const udf1 = source === 'react' ? 'react' : '';
    const udf2 = '';
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';

    // =================================================
    // GENERATE PAYU REQUEST HASH
    // =================================================
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PAYU_SALT}`;

    const hash = crypto
        .createHash('sha512')
        .update(hashString)
        .digest('hex');

    console.log('--------------------------------');
    console.log('PAYU PAYMENT INITIALIZED');
    console.log('Transaction ID:', txnid);
    console.log('Amount:', amount);
    console.log('Product:', productinfo);
    console.log('Source (udf1):', udf1);
    console.log('--------------------------------');

    // =================================================
    // SAVE TRANSACTION ID IN BOOKING
    // =================================================
    booking.paymentTxnId = txnid;
    await booking.save();

    // Extract client origin if present (e.g. from React frontend origin/referer)
    let clientOrigin = '';
    if (req) {
        const originHeader = req.headers.origin || req.headers.referer || '';
        if (originHeader) {
            try {
                const parsed = new URL(originHeader);
                clientOrigin = parsed.origin;
            } catch (e) {}
        }
    }

    // =================================================
    // CREATE PAYMENT RECORD
    // =================================================
    await Payment.create({
        bookingId: booking._id,
        userId: userId,
        amount: Number(amount),
        transactionId: txnid,
        status: 'pending',
        clientOrigin
    });

    let backendUrl = process.env.BACKEND_URL;
    if (!backendUrl && req) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        let host = req.headers['x-forwarded-host'] || (req.get ? req.get('host') : req.headers.host);

        // If host was masked by a local dev proxy (e.g. Vite proxying to 127.0.0.1:3000), but clientOrigin is a LAN IP or custom domain:
        if ((!host || host.includes('localhost') || host.includes('127.0.0.1')) && clientOrigin) {
            try {
                const parsedOrigin = new URL(clientOrigin);
                if (parsedOrigin.hostname !== 'localhost' && parsedOrigin.hostname !== '127.0.0.1') {
                    const backendPort = process.env.PORT || '3000';
                    host = `${parsedOrigin.hostname}:${backendPort}`;
                }
            } catch (e) {}
        }

        if (host) {
            backendUrl = `${protocol}://${host}`;
        }
    }
    backendUrl = (backendUrl || 'http://localhost:3000').replace(/\/+$/, '');
    const surl = `${backendUrl}/payment/success`;
    const furl = `${backendUrl}/payment/failure`;

    return {
        booking,
        payuUrl: PAYU_URL,
        key: PAYU_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        hash,
        surl,
        furl
    };
};

exports.generatePaymentData = generatePaymentData;

// =====================================================
// INITIATE PAYMENT (EJS VIEW ROUTE)
// =====================================================

exports.initiatePayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id || req.user.id;
        const source = req.query.source || '';

        const paymentData = await generatePaymentData({ bookingId, userId, source, req });

        res.render('payment/payu', paymentData);
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(error.statusCode || 500).send(error.message || 'Payment initialization failed');
    }
};

// =====================================================
// PAYU SUCCESS
// =====================================================

exports.payuSuccess = async (req, res) => {
    try {
        const response = req.body;

        console.log('--------------------------------');
        console.log('PAYU SUCCESS RESPONSE:');
        console.log(response);
        console.log('--------------------------------');

        const {
            status,
            txnid,
            amount,
            productinfo,
            firstname,
            email,
            key,
            hash
        } = response;

        // Basic validation
        if (
            !status ||
            !txnid ||
            !amount ||
            !productinfo ||
            !firstname ||
            !email ||
            !key ||
            !hash
        ) {
            return res.status(400).send('Invalid payment response');
        }

        // Verify PayU reverse hash
        const reverseHashString =
            `${PAYU_SALT}|${status}||||||` +
            `${response.udf5 || ''}|` +
            `${response.udf4 || ''}|` +
            `${response.udf3 || ''}|` +
            `${response.udf2 || ''}|` +
            `${response.udf1 || ''}|` +
            `${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

        const calculatedHash = crypto
            .createHash('sha512')
            .update(reverseHashString)
            .digest('hex');

        if (calculatedHash !== hash) {
            console.error('PayU response hash mismatch');
            return res.status(400).send('Payment verification failed');
        }

        // Find booking
        const booking = await Booking.findOne({ paymentTxnId: txnid });
        if (!booking) {
            return res.status(404).send('Booking for this payment not found');
        }

        // Payment record update
        const payment = await Payment.findOne({ transactionId: txnid });
        if (payment) {
            payment.status = 'paid';
            await payment.save();
        }

        let clientUrl = process.env.CLIENT_URL;
        if (!clientUrl && payment && payment.clientOrigin) {
            clientUrl = payment.clientOrigin;
        }
        if (!clientUrl) {
            const hostHeader = (req.get ? req.get('host') : req.headers.host) || '';
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const hostname = hostHeader.split(':')[0];
            if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
                const frontendPort = process.env.FRONTEND_PORT || '5174';
                clientUrl = `${protocol}://${hostname}:${frontendPort}`;
            } else {
                clientUrl = 'http://localhost:5173';
            }
        }
        clientUrl = clientUrl.replace(/\/+$/, '');

        const isReactOrigin = response.udf1 === 'react';

        // Payment success
        if (status === 'success') {
            booking.paymentStatus = 'paid';
            await booking.save();

            console.log('Payment successful for booking:', booking._id);

            if (isReactOrigin) {
                return res.redirect(`${clientUrl}/bookings?payment=success`);
            }

            return res.redirect('/bookings?payment=success');
        }

        // Payment not successful
        if (isReactOrigin) {
            return res.redirect(`${clientUrl}/bookings?payment=failed`);
        }

        return res.redirect('/bookings?payment=failed');

    } catch (error) {
        console.error('PayU success handler error:', error);
        res.status(500).send('Payment verification error');
    }
};

// =====================================================
// PAYU FAILURE
// =====================================================

exports.payuFailure = async (req, res) => {
    try {
        console.log('--------------------------------');
        console.log('PAYU FAILURE RESPONSE:');
        console.log(req.body);
        console.log('--------------------------------');

        const txnid = req.body ? req.body.txnid : null;
        let payment = null;

        if (txnid) {
            const booking = await Booking.findOne({ paymentTxnId: txnid });
            if (booking) {
                booking.paymentStatus = 'pending';
                await booking.save();
            }

            payment = await Payment.findOne({ transactionId: txnid });
            if (payment) {
                payment.status = 'failed';
                await payment.save();
            }
        }

        let clientUrl = process.env.CLIENT_URL;
        if (!clientUrl && payment && payment.clientOrigin) {
            clientUrl = payment.clientOrigin;
        }
        if (!clientUrl) {
            const hostHeader = (req.get ? req.get('host') : req.headers.host) || '';
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const hostname = hostHeader.split(':')[0];
            if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
                const frontendPort = process.env.FRONTEND_PORT || '5174';
                clientUrl = `${protocol}://${hostname}:${frontendPort}`;
            } else {
                clientUrl = 'http://localhost:5173';
            }
        }
        clientUrl = clientUrl.replace(/\/+$/, '');

        const isReactOrigin = req.body && req.body.udf1 === 'react';

        if (isReactOrigin) {
            return res.redirect(`${clientUrl}/bookings?payment=failed`);
        }

        return res.redirect('/bookings?payment=failed');

    } catch (error) {
        console.error('PayU failure handler error:', error);
        res.status(500).send('Payment failed');
    }
};
