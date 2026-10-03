const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const Complaint = require('../models/Complaint');
const Payment = require('../models/Payment');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('====================================================');
    console.log('STARTING VRS COMPLAINT & PAYMENT COMPREHENSIVE TESTS');
    console.log('====================================================\n');

    await mongoose.connect(process.env.MONGO_URI);

    // 1. Fetch our test users
    const admin = await User.findOne({ role: 'admin' });
    const customer = await User.findOne({ role: 'user' });
    const owners = await User.find({ role: 'owner' });

    if (!admin || !customer || owners.length < 2) {
        console.error('Missing required users for testing.');
        process.exit(1);
    }

    const owner1 = owners[0];
    const owner2 = owners[1];

    console.log('Test Accounts:');
    console.log(`- Admin: ${admin.email} (${admin._id})`);
    console.log(`- Customer: ${customer.email} (${customer._id})`);
    console.log(`- Owner 1: ${owner1.email} (${owner1._id})`);
    console.log(`- Owner 2: ${owner2.email} (${owner2._id})\n`);

    // Helper to generate JWT token for requests
    const signToken = (user) => {
        return jwt.sign(
            { id: user._id, role: user.role },
            process.env.SECRET_KEY || 'MYKEY123KEY',
            { expiresIn: '1h' }
        );
    };

    const adminToken = signToken(admin);
    const customerToken = signToken(customer);
    const owner1Token = signToken(owner1);
    const owner2Token = signToken(owner2);

    let passedTests = 0;
    let totalTests = 0;

    function assert(condition, message) {
        totalTests++;
        if (condition) {
            console.log(`  [PASS] Test ${totalTests}: ${message}`);
            passedTests++;
        } else {
            console.error(`  [FAIL] Test ${totalTests}: ${message}`);
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // =========================================================================
    // SECTION A: COMPLAINT RESOLUTION (OWNER-ONLY & AUTHORIZATION TESTS)
    // =========================================================================
    console.log('----------------------------------------------------');
    console.log('SECTION A: COMPLAINT WORKFLOW & PERMISSION TESTS');
    console.log('----------------------------------------------------');

    // Setup: Ensure Owner 1 has an approved vehicle and customer has a confirmed booking
    let vehicle = await Vehicle.findOne({ ownerId: owner1._id });
    if (!vehicle) {
        vehicle = new Vehicle({
            ownerId: owner1._id,
            vehicleNumber: 'MH-12-AB-1234',
            brand: 'Hyundai',
            model: 'Creta',
            type: 'SUV',
            pricePerDay: 2500,
            image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
            city: owner1.city || 'Mumbai',
            approvalStatus: 'approved',
            availability: true
        });
        await vehicle.save();
    }

    let booking = await Booking.findOne({ userId: customer._id, vehicleId: vehicle._id });
    if (!booking) {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 3);
        booking = new Booking({
            userId: customer._id,
            vehicleId: vehicle._id,
            startDate: start,
            endDate: end,
            totalAmount: 7500,
            status: 'confirmed',
            paymentStatus: 'pending'
        });
        await booking.save();
    } else {
        booking.status = 'confirmed';
        await booking.save();
    }

    // Clean up any existing complaint for this booking to test cleanly
    await Complaint.deleteMany({ bookingId: booking._id });

    // Test 1: Customer creates complaint
    console.log('\nSubmitting complaint as Customer...');
    const createComplaintRes = await fetch(`${BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
            bookingId: booking._id.toString(),
            subject: 'AC cooling issue during rental',
            message: 'The AC was not cooling properly in the afternoon.'
        })
    });
    const createComplaintData = await createComplaintRes.json();
    assert(createComplaintRes.status === 201, 'Customer successfully creates complaint (HTTP 201)');
    const complaintId = createComplaintData.complaint._id;
    assert(createComplaintData.complaint.status === 'pending', 'Newly created complaint has status "pending"');

    // Test 2: Owner 1 can see complaint
    const owner1ComplaintsRes = await fetch(`${BASE_URL}/api/owner/complaints`, {
        headers: { 'Authorization': `Bearer ${owner1Token}` }
    });
    const owner1ComplaintsData = await owner1ComplaintsRes.json();
    const foundByOwner1 = owner1ComplaintsData.complaints.some(c => c._id === complaintId);
    assert(foundByOwner1, 'Vehicle Owner 1 can see the complaint filed for their vehicle');

    // Test 3: Admin can see complaint
    const adminComplaintsRes = await fetch(`${BASE_URL}/api/admin/complaints`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminComplaintsData = await adminComplaintsRes.json();
    const foundByAdmin = adminComplaintsData.complaints.some(c => c._id === complaintId);
    assert(foundByAdmin, 'Admin can see the complaint for monitoring');

    // Test 4: Admin CANNOT resolve complaint via API (MUST return 403)
    const adminResolveAttemptRes = await fetch(`${BASE_URL}/api/admin/complaints/${complaintId}/respond`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            adminReply: 'Admin resolution override attempt.'
        })
    });
    assert(adminResolveAttemptRes.status === 403, 'Admin attempt to resolve complaint returns 403 Forbidden on API');

    // Test 5: Admin CANNOT resolve complaint via EJS route (MUST return 403)
    const adminEjsResolveAttemptRes = await fetch(`${BASE_URL}/admin/complaints/${complaintId}/respond`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `token=${adminToken}`
        },
        body: new URLSearchParams({ adminReply: 'Admin EJS attempt' }).toString(),
        redirect: 'manual'
    });
    assert(adminEjsResolveAttemptRes.status === 403, 'Admin attempt to resolve complaint returns 403 Forbidden on EJS route');

    // Test 6: Owner 2 (different owner) CANNOT resolve Owner 1's complaint (MUST return 403)
    const owner2ResolveAttemptRes = await fetch(`${BASE_URL}/api/owner/complaints/${complaintId}/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${owner2Token}`
        },
        body: JSON.stringify({
            ownerReply: 'Malicious response from wrong owner.'
        })
    });
    assert(owner2ResolveAttemptRes.status === 403, 'Owner 2 attempt to resolve Owner 1 complaint returns 403 Forbidden');

    // Test 7: Customer CANNOT resolve their own complaint (MUST return 403)
    const customerResolveAttemptRes = await fetch(`${BASE_URL}/api/owner/complaints/${complaintId}/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
            ownerReply: 'Customer trying to resolve own complaint.'
        })
    });
    assert(customerResolveAttemptRes.status === 403, 'Customer attempt to resolve complaint returns 403 Forbidden');

    // Test 8: Owner 1 (legitimate owner) CAN respond and resolve complaint
    const owner1ResolveRes = await fetch(`${BASE_URL}/api/owner/complaints/${complaintId}/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${owner1Token}`
        },
        body: JSON.stringify({
            ownerReply: 'Apologies for the AC issue. We have serviced the AC compressor and added a 10% discount on your next booking.'
        })
    });
    const owner1ResolveData = await owner1ResolveRes.json();
    assert(owner1ResolveRes.status === 200, 'Owner 1 successfully submits response (HTTP 200)');
    assert(owner1ResolveData.complaint.status === 'resolved', 'Complaint status is updated to "resolved"');
    assert(owner1ResolveData.complaint.ownerReply.includes('serviced the AC'), 'Complaint stores ownerReply');

    // Test 9: Customer sees Owner response
    const customerComplaintsRes = await fetch(`${BASE_URL}/api/complaints/my`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const customerComplaintsData = await customerComplaintsRes.json();
    const updatedComplaintForCustomer = customerComplaintsData.complaints.find(c => c._id === complaintId);
    assert(updatedComplaintForCustomer.status === 'resolved', 'Customer sees updated complaint status "resolved"');
    assert(updatedComplaintForCustomer.ownerReply.includes('serviced the AC'), 'Customer sees vehicle owner response message');

    // =========================================================================
    // SECTION B: PAYU PAYMENT INTEGRATION TESTS
    // =========================================================================
    console.log('\n----------------------------------------------------');
    console.log('SECTION B: PAYU PAYMENT INTEGRATION TESTS');
    console.log('----------------------------------------------------');

    // Reset booking paymentStatus
    booking.paymentStatus = 'pending';
    booking.status = 'confirmed';
    await booking.save();

    // Test 10: Payment initiation returns PayU parameters with valid hash
    const initiatePaymentRes = await fetch(`${BASE_URL}/api/payment/pay/${booking._id}`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const payData = await initiatePaymentRes.json();
    assert(initiatePaymentRes.status === 200, 'Customer initiates PayU payment via API (HTTP 200)');
    assert(payData.payuUrl === 'https://test.payu.in/_payment', 'payuUrl points to PayU test sandbox gateway');
    assert(payData.key === process.env.PAYU_KEY, 'PayU key matches configured PAYU_KEY');
    assert(payData.txnid.startsWith('VRS_'), 'Generated txnid has correct VRS_ prefix');
    assert(payData.amount === Number(booking.totalAmount).toFixed(2), 'Payment amount matches booking total');
    assert(payData.udf1 === 'react', 'udf1 is tagged as "react" for React redirect routing');

    // Verify hash integrity using server-side key and salt
    const udf1 = payData.udf1, udf2 = '', udf3 = '', udf4 = '', udf5 = '';
    const expectedHashString = `${process.env.PAYU_KEY}|${payData.txnid}|${payData.amount}|${payData.productinfo}|${payData.firstname}|${payData.email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${process.env.PAYU_SALT}`;
    const expectedHash = crypto.createHash('sha512').update(expectedHashString).digest('hex');
    assert(payData.hash === expectedHash, 'PayU SHA-512 request hash is verified and valid');

    // Test 11: Security check - PAYU_SALT is never returned to frontend
    assert(payData.salt === undefined, 'Security: PAYU_SALT is not exposed in the API response');
    assert(payData.PAYU_SALT === undefined, 'Security: PAYU_SALT constant is not exposed');

    // Test 12: PayU callback success handling
    console.log('\nTesting PayU success callback simulation...');
    // Construct valid reverse hash as PayU test gateway generates:
    // sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const successStatus = 'success';
    const reverseHashString = `${process.env.PAYU_SALT}|${successStatus}||||||||||${payData.udf1}|${payData.email}|${payData.firstname}|${payData.productinfo}|${payData.amount}|${payData.txnid}|${payData.key}`;
    const successHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');

    const payuSuccessCallbackRes = await fetch(`${BASE_URL}/payment/success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            status: successStatus,
            txnid: payData.txnid,
            amount: payData.amount,
            productinfo: payData.productinfo,
            firstname: payData.firstname,
            email: payData.email,
            key: payData.key,
            hash: successHash,
            udf1: payData.udf1
        }).toString(),
        redirect: 'manual'
    });

    assert(payuSuccessCallbackRes.status === 302, 'PayU success handler returns 302 Redirect');
    const redirectLocation = payuSuccessCallbackRes.headers.get('location');
    assert(redirectLocation.includes('localhost:5173/bookings?payment=success'), 'Redirects back to React frontend bookings page with payment=success');

    // Verify database record updated
    const updatedBooking = await Booking.findById(booking._id);
    assert(updatedBooking.paymentStatus === 'paid', 'Database: Booking paymentStatus updated to "paid"');

    const paymentRecord = await Payment.findOne({ transactionId: payData.txnid });
    assert(paymentRecord && paymentRecord.status === 'paid', 'Database: Payment record status updated to "paid"');

    // Test 13: PayU callback failure handling
    console.log('\nTesting PayU failure callback simulation...');
    // Create new pending booking to test failure
    const startF = new Date();
    const endF = new Date();
    endF.setDate(endF.getDate() + 2);
    const failBooking = new Booking({
        userId: customer._id,
        vehicleId: vehicle._id,
        startDate: startF,
        endDate: endF,
        totalAmount: 5000,
        status: 'confirmed',
        paymentStatus: 'pending'
    });
    await failBooking.save();

    const failPayInitRes = await fetch(`${BASE_URL}/api/payment/pay/${failBooking._id}`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const failPayData = await failPayInitRes.json();

    const payuFailureCallbackRes = await fetch(`${BASE_URL}/payment/failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            status: 'failure',
            txnid: failPayData.txnid,
            amount: failPayData.amount,
            productinfo: failPayData.productinfo,
            firstname: failPayData.firstname,
            email: failPayData.email,
            key: failPayData.key,
            udf1: 'react'
        }).toString(),
        redirect: 'manual'
    });

    assert(payuFailureCallbackRes.status === 302, 'PayU failure handler returns 302 Redirect');
    const failRedirectLocation = payuFailureCallbackRes.headers.get('location');
    assert(failRedirectLocation.includes('localhost:5173/bookings?payment=failed'), 'Redirects back to React frontend with payment=failed');

    const failedBookingInDb = await Booking.findById(failBooking._id);
    assert(failedBookingInDb.paymentStatus === 'pending', 'Database: Booking paymentStatus remains "pending" after failure');

    const failedPaymentInDb = await Payment.findOne({ transactionId: failPayData.txnid });
    assert(failedPaymentInDb && failedPaymentInDb.status === 'failed', 'Database: Payment record marked as "failed"');

    // =========================================================================
    // SECTION C: REGRESSION TESTS (EJS VIEWS STILL ACCESSIBLE)
    // =========================================================================
    console.log('\n----------------------------------------------------');
    console.log('SECTION C: EJS REGRESSION TESTS');
    console.log('----------------------------------------------------');

    // Test 14: EJS login page accessible
    const ejsLoginRes = await fetch(`${BASE_URL}/login`);
    assert(ejsLoginRes.status === 200, 'EJS login page is accessible (HTTP 200)');

    // Test 15: EJS admin complaints page accessible with admin cookie
    const ejsAdminComplaintsRes = await fetch(`${BASE_URL}/admin/complaints`, {
        headers: { 'Cookie': `token=${adminToken}` }
    });
    assert(ejsAdminComplaintsRes.status === 200, 'EJS admin complaints page is accessible (HTTP 200)');
    const adminComplaintsHtml = await ejsAdminComplaintsRes.text();
    assert(!adminComplaintsHtml.includes('action="/admin/complaints/'), 'EJS admin complaints page does NOT have respond/resolve form');
    assert(adminComplaintsHtml.includes('Monitoring Only') || adminComplaintsHtml.includes('Vehicle Owner Response'), 'EJS admin complaints page shows monitoring view');

    // Test 16: EJS owner complaints page accessible with owner cookie
    const ejsOwnerComplaintsRes = await fetch(`${BASE_URL}/owner/complaints`, {
        headers: { 'Cookie': `token=${owner1Token}` }
    });
    assert(ejsOwnerComplaintsRes.status === 200, 'EJS owner complaints page is accessible (HTTP 200)');

    // Test 17: EJS customer complaints page accessible
    const ejsCustomerComplaintsRes = await fetch(`${BASE_URL}/complaints`, {
        headers: { 'Cookie': `token=${customerToken}` }
    });
    assert(ejsCustomerComplaintsRes.status === 200, 'EJS customer complaints page is accessible (HTTP 200)');

    console.log('\n====================================================');
    console.log(`ALL TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED (100%)`);
    console.log('====================================================\n');

    process.exit(0);
}

runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
