const crypto = require('crypto');

const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;

const PAYU_URL = 'https://test.payu.in/_payment';


// =====================================================
// INITIATE PAYMENT
// =====================================================

exports.initiatePayment = async (req, res) => {

    try {

        const { bookingId } = req.params;

        const userId = req.user._id || req.user.id;


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

            return res.status(404).send(
                'Booking not found'
            );

        }


        // =================================================
        // ONLY CONFIRMED BOOKINGS CAN BE PAID
        // =================================================

        if (booking.status !== 'confirmed') {

            return res.status(400).send(
                'Only confirmed bookings can be paid'
            );

        }


        // =================================================
        // PREVENT DUPLICATE PAYMENT
        // =================================================

        if (booking.paymentStatus === 'paid') {

            return res.status(400).send(
                'Payment has already been completed'
            );

        }


        // =================================================
        // CHECK USER INFORMATION
        // =================================================

        if (
            !booking.userId ||
            !booking.userId.name ||
            !booking.userId.email
        ) {

            return res.status(400).send(
                'User information is incomplete'
            );

        }


        // =================================================
        // CHECK VEHICLE INFORMATION
        // =================================================

        if (!booking.vehicleId) {

            return res.status(400).send(
                'Vehicle information not found'
            );

        }


        // =================================================
        // GENERATE UNIQUE TRANSACTION ID
        // =================================================

        const txnid =
            'VRS_' +
            Date.now() +
            '_' +
            Math.floor(Math.random() * 1000);


        // =================================================
        // PAYMENT AMOUNT
        // =================================================

        const amount =
            Number(booking.totalAmount).toFixed(2);


        // =================================================
        // CUSTOMER INFORMATION
        // =================================================

        const firstname =
            booking.userId.name;

        const email =
            booking.userId.email;

        const phone =
            booking.userId.phone || '9999999999';


        // =================================================
        // PRODUCT INFORMATION
        // =================================================

        const productinfo =
            `Vehicle Rental - ${booking.vehicleId.brand} ${booking.vehicleId.model}`;


        // =================================================
        // UDF VALUES
        // =================================================

        const udf1 = '';
        const udf2 = '';
        const udf3 = '';
        const udf4 = '';
        const udf5 = '';


        // =================================================
        // GENERATE PAYU REQUEST HASH
        // =================================================

        const hashString =
            `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PAYU_SALT}`;


        const hash =
            crypto
                .createHash('sha512')
                .update(hashString)
                .digest('hex');


        console.log('--------------------------------');
        console.log('PAYU PAYMENT INITIALIZED');
        console.log('Transaction ID:', txnid);
        console.log('Amount:', amount);
        console.log('Product:', productinfo);
        console.log('--------------------------------');


        // =================================================
        // SAVE TRANSACTION ID IN BOOKING
        // =================================================

        booking.paymentTxnId = txnid;

        await booking.save();


        // =================================================
        // CREATE PAYMENT RECORD
        // =================================================

        await Payment.create({
            bookingId: booking._id,
            userId: userId,
            amount: Number(amount),
            transactionId: txnid,
            status: 'pending'
        });


        // =================================================
        // RENDER PAYU PAYMENT FORM
        // =================================================

        res.render('payment/payu', {

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

            hash

        });


    } catch (error) {

        console.error(
            'Error initiating payment:',
            error
        );

        res.status(500).send(
            'Payment initialization failed'
        );

    }

};



// =====================================================
// PAYU SUCCESS
// =====================================================

exports.payuSuccess = async (req, res) => {

    try {

        const response = req.body;


        console.log(
            '--------------------------------'
        );

        console.log(
            'PAYU SUCCESS RESPONSE:'
        );

        console.log(response);

        console.log(
            '--------------------------------'
        );


        // =================================================
        // EXTRACT RESPONSE VALUES
        // =================================================

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


        // =================================================
        // BASIC VALIDATION
        // =================================================

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

            return res.status(400).send(
                'Invalid payment response'
            );

        }


        // =================================================
        // VERIFY PAYU RESPONSE HASH
        // =================================================

        const reverseHashString =
            `${PAYU_SALT}|${status}||||||` +
            `${response.udf5 || ''}|` +
            `${response.udf4 || ''}|` +
            `${response.udf3 || ''}|` +
            `${response.udf2 || ''}|` +
            `${response.udf1 || ''}|` +
            `${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;


        const calculatedHash =
            crypto
                .createHash('sha512')
                .update(reverseHashString)
                .digest('hex');


        // =================================================
        // COMPARE HASH
        // =================================================

        if (calculatedHash !== hash) {

            console.error(
                'PayU response hash mismatch'
            );

            return res.status(400).send(
                'Payment verification failed'
            );

        }


        // =================================================
        // FIND BOOKING
        // =================================================

        const booking =
            await Booking.findOne({
                paymentTxnId: txnid
            });


        if (!booking) {

            return res.status(404).send(
                'Booking for this payment not found'
            );

        }


        // =================================================
        // PAYMENT SUCCESS
        // =================================================

        if (status === 'success') {

            booking.paymentStatus = 'paid';

            await booking.save();


            // UPDATE PAYMENT RECORD STATUS TO PAID
            const payment = await Payment.findOne({
                transactionId: txnid
            });

            if (payment) {
                payment.status = 'paid';
                await payment.save();
            }


            console.log(
                'Payment successful for booking:',
                booking._id
            );


            return res.redirect(
                '/bookings?payment=success'
            );

        }


        // =================================================
        // PAYMENT NOT SUCCESSFUL
        // =================================================

        return res.redirect(
            '/bookings?payment=failed'
        );


    } catch (error) {

        console.error(
            'PayU success handler error:',
            error
        );

        res.status(500).send(
            'Payment verification error'
        );

    }

};



// =====================================================
// PAYU FAILURE
// =====================================================

exports.payuFailure = async (req, res) => {

    try {

        console.log(
            '--------------------------------'
        );

        console.log(
            'PAYU FAILURE RESPONSE:'
        );

        console.log(req.body);

        console.log(
            '--------------------------------'
        );


        const txnid =
            req.body.txnid;


        // =================================================
        // FIND BOOKING
        // =================================================

        if (txnid) {

            const booking =
                await Booking.findOne({
                    paymentTxnId: txnid
                });


            if (booking) {

                booking.paymentStatus =
                    'pending';

                await booking.save();

            }


            // UPDATE PAYMENT RECORD STATUS TO FAILED
            const payment =
                await Payment.findOne({
                    transactionId: txnid
                });

            if (payment) {

                payment.status = 'failed';

                await payment.save();

            }

        }


        // =================================================
        // REDIRECT TO BOOKINGS
        // =================================================

        return res.redirect(
            '/bookings?payment=failed'
        );


    } catch (error) {

        console.error(
            'PayU failure handler error:',
            error
        );

        res.status(500).send(
            'Payment failed'
        );

    }

};