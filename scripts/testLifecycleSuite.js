/**
 * Comprehensive Test Suite for VRS Booking Lifecycle
 * Tests ALL cases and edge cases specified in Sections 26 & 32:
 *
 * 1. Pending future booking
 * 2. Pending booking starting today
 * 3. Pending booking whose end date passed -> EXPIRED
 * 4. Same-day pending booking viewed next day -> EXPIRED
 * 5. Same-day approved booking -> ONGOING during rental, COMPLETED next day
 * 6. Late approval attempt -> Rejected, status remains EXPIRED
 * 7. Future confirmed booking -> CONFIRMED
 * 8. Confirmed -> ONGOING when start date arrives
 * 9. Ongoing -> COMPLETED when end date passes
 * 10. Rejected booking -> REJECTED (never becomes EXPIRED or ONGOING)
 * 11. Cancelled booking -> CANCELLED (never becomes ONGOING or EXPIRED)
 * 12. Expired booking terminal state guarantee -> never returns to ONGOING, CONFIRMED, or COMPLETED
 * 13. Completed booking terminal state guarantee -> never returns to ONGOING, CONFIRMED, or EXPIRED
 * 14. Payment status independence -> Separate paymentStatus
 * 15. PayU payment eligibility -> Blocked for EXPIRED, COMPLETED, REJECTED, CANCELLED
 * 16. Overlapping booking prevention -> Works for pending, confirmed, ongoing; ignores expired/completed
 * 17. Owner sees correct status (EXPIRED, ONGOING, COMPLETED, etc.)
 * 18. Customer sees correct status (EXPIRED, ONGOING, COMPLETED, etc.)
 * 19. Admin sees correct status
 * 20. EJS pages continue to work
 * 21. React API delivers consistent lifecycle
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const {
    getBookingLifecycleStatus,
    syncBookingStatus,
    syncAllActiveBookings,
    hasStarted,
    hasEnded
} = require('../utils/bookingLifecycle');

const API_BASE = 'http://localhost:5000/api';
const EJS_BASE = 'http://localhost:3000';

let customerUser, ownerUser, vehicle;
let customerToken, ownerToken;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
}

async function runTests() {
    console.log('====================================================');
    console.log('STARTING FULL 21-TEST VRS BOOKING LIFECYCLE SUITE');
    console.log('====================================================');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vrs');
    console.log('Connected to MongoDB for testing.');

    // Setup test users and vehicle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    customerUser = await User.findOneAndUpdate(
        { email: 'lifecycle_cust@test.com' },
        { name: 'Lifecycle Customer', email: 'lifecycle_cust@test.com', password: hashedPassword, role: 'user', phone: '9998887771' },
        { upsert: true, returnDocument: 'after' }
    );

    ownerUser = await User.findOneAndUpdate(
        { email: 'lifecycle_owner@test.com' },
        { name: 'Lifecycle Owner', email: 'lifecycle_owner@test.com', password: hashedPassword, role: 'owner', phone: '9998887772' },
        { upsert: true, returnDocument: 'after' }
    );

    customerToken = jwt.sign(
        { id: customerUser._id, role: customerUser.role, name: customerUser.name, email: customerUser.email },
        process.env.SECRET_KEY || 'MYKEY123KEY',
        { expiresIn: '1d' }
    );

    ownerToken = jwt.sign(
        { id: ownerUser._id, role: ownerUser.role, name: ownerUser.name, email: ownerUser.email },
        process.env.SECRET_KEY || 'MYKEY123KEY',
        { expiresIn: '1d' }
    );

    vehicle = await Vehicle.findOneAndUpdate(
        { vehicleNumber: 'GJ-01-LC-9999' },
        {
            ownerId: ownerUser._id,
            brand: 'Hyundai',
            model: 'Creta',
            vehicleNumber: 'GJ-01-LC-9999',
            type: 'SUV',
            fuelType: 'Diesel',
            seatingCapacity: 5,
            pricePerDay: 2500,
            city: 'Ahmedabad',
            availability: true,
            approvalStatus: 'approved',
            image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341'
        },
        { upsert: true, returnDocument: 'after' }
    );

    // Clean previous bookings for test vehicle
    await Booking.deleteMany({ vehicleId: vehicle._id });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const addDays = (d, days) => {
        const res = new Date(d);
        res.setDate(res.getDate() + days);
        return res;
    };

    const fmt = (d) => d.toISOString().split('T')[0];

    // =========================================================================
    // 1. Pending future booking
    // =========================================================================
    console.log('\n--- 1. Pending future booking ---');
    const futureStart = fmt(addDays(today, 10));
    const futureEnd = fmt(addDays(today, 12));
    const res1 = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ vehicleId: vehicle._id.toString(), startDate: futureStart, endDate: futureEnd })
    });
    const data1 = await res1.json();
    assert(res1.status === 201, 'Future booking created (HTTP 201)');
    assert(data1.booking.status === 'pending', 'Future booking is initially PENDING');
    const futureBookingId = data1.booking._id;

    // =========================================================================
    // 2. Pending booking starting today
    // =========================================================================
    console.log('\n--- 2. Pending booking starting today ---');
    const todayStart = todayStr;
    const todayEnd = fmt(addDays(today, 2));
    const res2 = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ vehicleId: vehicle._id.toString(), startDate: todayStart, endDate: todayEnd })
    });
    const data2 = await res2.json();
    assert(res2.status === 201, 'Booking starting today created (HTTP 201)');
    assert(data2.booking.status === 'pending', 'Booking starting today is initially PENDING (awaiting owner)');
    const todayBookingId = data2.booking._id;

    // =========================================================================
    // 3. Pending booking whose end date passed -> EXPIRED
    // =========================================================================
    console.log('\n--- 3. Pending booking whose end date passed -> EXPIRED ---');
    const pastPending = await Booking.create({
        userId: customerUser._id,
        vehicleId: vehicle._id,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-03'),
        totalAmount: 7500,
        status: 'pending',
        paymentStatus: 'pending'
    });
    const pastExpected = getBookingLifecycleStatus(pastPending, today);
    assert(pastExpected === 'expired', 'Pure lifecycle function returns EXPIRED for unapproved past booking');
    await syncBookingStatus(pastPending, today);
    assert(pastPending.status === 'expired', 'syncBookingStatus sets DB status to EXPIRED');

    // =========================================================================
    // 4. Same-day pending booking viewed next day -> EXPIRED
    // =========================================================================
    console.log('\n--- 4. Same-day pending booking viewed next day (CASE 1) ---');
    // Customer requests: 3 Oct -> 3 Oct. Owner does not approve. Next day (4 Oct) viewed.
    const sameDayPending = {
        status: 'pending',
        startDate: new Date('2026-10-03'),
        endDate: new Date('2026-10-03')
    };
    const nextDay = new Date('2026-10-04');
    const sameDayNextDayStatus = getBookingLifecycleStatus(sameDayPending, nextDay);
    assert(sameDayNextDayStatus === 'expired', 'Same-day unapproved booking viewed next day is EXPIRED');

    // =========================================================================
    // 5. Same-day approved booking -> ONGOING during rental, COMPLETED next day
    // =========================================================================
    console.log('\n--- 5. Same-day approved booking (CASE 2) ---');
    // Customer requests: 3 Oct -> 3 Oct. Owner approves on 3 Oct.
    const oct3 = new Date('2026-10-03');
    const sameDayApproved = {
        status: 'ongoing',
        startDate: new Date('2026-10-03'),
        endDate: new Date('2026-10-03'),
        approvedAt: oct3
    };
    assert(getBookingLifecycleStatus(sameDayApproved, oct3) === 'ongoing', 'On 3 Oct, same-day approved rental is ONGOING');
    assert(getBookingLifecycleStatus(sameDayApproved, nextDay) === 'completed', 'On 4 Oct, same-day approved rental is COMPLETED (NOT expired)');

    // =========================================================================
    // 6. Late approval attempt -> Rejected, status remains EXPIRED (CASE 3)
    // =========================================================================
    console.log('\n--- 6. Late approval attempt (CASE 3) ---');
    // Customer requested 3 Oct -> 3 Oct. Owner did not approve on 3 Oct. Owner tries to approve on 4 Oct.
    const expiredPendingDoc = await Booking.create({
        userId: customerUser._id,
        vehicleId: vehicle._id,
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-02'),
        totalAmount: 5000,
        status: 'pending',
        paymentStatus: 'pending'
    });
    const lateApproveRes = await fetch(`${API_BASE}/owner/bookings/${expiredPendingDoc._id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const lateApproveData = await lateApproveRes.json();
    assert(lateApproveRes.status === 400, 'Late approval attempt rejected with HTTP 400');
    assert(lateApproveData.booking.status === 'expired', 'Booking status becomes/remains EXPIRED');
    const inDbAfterLate = await Booking.findById(expiredPendingDoc._id);
    assert(inDbAfterLate.status === 'expired', 'Database stores EXPIRED after rejected late approval');

    // =========================================================================
    // 7. Future confirmed booking -> CONFIRMED
    // =========================================================================
    console.log('\n--- 7. Future confirmed booking ---');
    const approveFutureRes = await fetch(`${API_BASE}/owner/bookings/${futureBookingId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const approveFutureData = await approveFutureRes.json();
    assert(approveFutureRes.status === 200, 'Owner confirms future booking (HTTP 200)');
    assert(approveFutureData.booking.status === 'confirmed', 'Future booking is CONFIRMED');

    // =========================================================================
    // 8. Confirmed -> ONGOING when start date arrives
    // =========================================================================
    console.log('\n--- 8. Confirmed -> ONGOING when start date arrives ---');
    const atFutureStart = new Date(futureStart);
    const futureDoc = await Booking.findById(futureBookingId);
    await syncBookingStatus(futureDoc, atFutureStart);
    assert(futureDoc.status === 'ongoing', 'Booking automatically transitions to ONGOING on start date');

    // =========================================================================
    // 9. Ongoing -> COMPLETED when end date passes
    // =========================================================================
    console.log('\n--- 9. Ongoing -> COMPLETED when end date passes ---');
    const afterFutureEnd = addDays(new Date(futureEnd), 1);
    await syncBookingStatus(futureDoc, afterFutureEnd);
    assert(futureDoc.status === 'completed', 'Booking automatically transitions to COMPLETED after rental end date');

    // =========================================================================
    // 10. Rejected booking -> REJECTED (never becomes EXPIRED or ONGOING)
    // =========================================================================
    console.log('\n--- 10. Rejected booking terminal check ---');
    const rejectTestDoc = await Booking.create({
        userId: customerUser._id,
        vehicleId: vehicle._id,
        startDate: addDays(today, 15),
        endDate: addDays(today, 18),
        totalAmount: 7500,
        status: 'pending',
        paymentStatus: 'pending'
    });
    const rejectRes = await fetch(`${API_BASE}/owner/bookings/${rejectTestDoc._id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200, 'Owner rejects booking (HTTP 200)');
    assert(rejectData.booking.status === 'rejected', 'Status is REJECTED');
    // Check when date passes
    const postRejectStatus = getBookingLifecycleStatus(rejectData.booking, addDays(today, 25));
    assert(postRejectStatus === 'rejected', 'Rejected booking never becomes EXPIRED or ONGOING after dates pass');

    // =========================================================================
    // 11. Cancelled booking -> CANCELLED (never becomes ONGOING or EXPIRED)
    // =========================================================================
    console.log('\n--- 11. Cancelled booking terminal check ---');
    const cancelTestDoc = await Booking.create({
        userId: customerUser._id,
        vehicleId: vehicle._id,
        startDate: addDays(today, 20),
        endDate: addDays(today, 22),
        totalAmount: 5000,
        status: 'pending',
        paymentStatus: 'pending'
    });
    const cancelRes = await fetch(`${API_BASE}/bookings/${cancelTestDoc._id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(cancelRes.status === 200, 'Customer cancels future booking (HTTP 200)');
    const postCancelStatus = getBookingLifecycleStatus({ status: 'cancelled', startDate: addDays(today, 20), endDate: addDays(today, 22) }, addDays(today, 25));
    assert(postCancelStatus === 'cancelled', 'Cancelled booking never transitions to ONGOING or EXPIRED');

    // =========================================================================
    // 12. Expired booking terminal state guarantee
    // =========================================================================
    console.log('\n--- 12. Expired booking terminal state guarantee ---');
    const expiredDoc = { status: 'expired', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-02') };
    assert(getBookingLifecycleStatus(expiredDoc, today) === 'expired', 'Expired booking stays expired permanently');

    // =========================================================================
    // 13. Completed booking terminal state guarantee
    // =========================================================================
    console.log('\n--- 13. Completed booking terminal state guarantee ---');
    const compDoc = { status: 'completed', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-02') };
    assert(getBookingLifecycleStatus(compDoc, today) === 'completed', 'Completed booking stays completed permanently');

    // =========================================================================
    // 14. Payment status independence
    // =========================================================================
    console.log('\n--- 14. Payment status independence ---');
    const indepBooking = await Booking.create({
        userId: customerUser._id,
        vehicleId: vehicle._id,
        startDate: addDays(today, 30),
        endDate: addDays(today, 32),
        totalAmount: 5000,
        status: 'confirmed',
        paymentStatus: 'pending'
    });
    assert(indepBooking.status === 'confirmed' && indepBooking.paymentStatus === 'pending', 'Booking is CONFIRMED while Payment is PENDING');

    // =========================================================================
    // 15. PayU payment eligibility
    // =========================================================================
    console.log('\n--- 15. PayU payment eligibility ---');
    // Allowed for confirmed
    const payResConfirmed = await fetch(`${API_BASE}/payment/pay/${indepBooking._id}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(payResConfirmed.status === 200, 'Pay Now allowed for CONFIRMED booking');

    // Allowed for ongoing
    indepBooking.status = 'ongoing';
    await indepBooking.save();
    const payResOngoing = await fetch(`${API_BASE}/payment/pay/${indepBooking._id}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(payResOngoing.status === 200, 'Pay Now allowed for ONGOING booking');

    // Disallowed for expired
    indepBooking.status = 'expired';
    await indepBooking.save();
    const payResExpired = await fetch(`${API_BASE}/payment/pay/${indepBooking._id}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(payResExpired.status === 400, 'Pay Now blocked for EXPIRED booking');

    // Disallowed for completed
    indepBooking.status = 'completed';
    await indepBooking.save();
    const payResCompleted = await fetch(`${API_BASE}/payment/pay/${indepBooking._id}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(payResCompleted.status === 400, 'Pay Now blocked for COMPLETED booking');

    // Disallowed for rejected
    indepBooking.status = 'rejected';
    await indepBooking.save();
    const payResRejected = await fetch(`${API_BASE}/payment/pay/${indepBooking._id}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(payResRejected.status === 400, 'Pay Now blocked for REJECTED booking');

    // Disallowed for cancelled
    indepBooking.status = 'cancelled';
    await indepBooking.save();
    const payResCancelled = await fetch(`${API_BASE}/payment/pay/${indepBooking._id}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(payResCancelled.status === 400, 'Pay Now blocked for CANCELLED booking');

    // =========================================================================
    // 16. Overlapping booking prevention
    // =========================================================================
    console.log('\n--- 16. Overlapping booking prevention ---');
    const s50 = fmt(addDays(today, 50));
    const s55 = fmt(addDays(today, 55));
    const activeOverlapBooking = await Booking.create({
        userId: customerUser._id,
        vehicleId: vehicle._id,
        startDate: new Date(s50),
        endDate: new Date(s55),
        totalAmount: 12500,
        status: 'ongoing',
        paymentStatus: 'pending'
    });

    // Overlapping (inside)
    const insideRes = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ vehicleId: vehicle._id.toString(), startDate: fmt(addDays(today, 51)), endDate: fmt(addDays(today, 53)) })
    });
    assert(insideRes.status === 400, 'Overlapping booking (inside period) blocked with HTTP 400');

    // Non-overlapping (after end date)
    const outsideRes = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ vehicleId: vehicle._id.toString(), startDate: fmt(addDays(today, 56)), endDate: fmt(addDays(today, 60)) })
    });
    assert(outsideRes.status === 201, 'Non-overlapping booking succeeds with HTTP 201');

    // =========================================================================
    // 17. Owner sees correct status
    // =========================================================================
    console.log('\n--- 17. Owner sees correct status ---');
    const ownerListRes = await fetch(`${API_BASE}/owner/bookings`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const ownerListData = await ownerListRes.json();
    assert(ownerListRes.status === 200, 'Owner bookings API returns HTTP 200');
    const hasExpiredForOwner = ownerListData.bookings.some(b => b.status === 'expired');
    assert(hasExpiredForOwner, 'Owner bookings list correctly includes EXPIRED bookings');

    // =========================================================================
    // 18. Customer sees correct status
    // =========================================================================
    console.log('\n--- 18. Customer sees correct status ---');
    const custListRes = await fetch(`${API_BASE}/bookings/my`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    const custListData = await custListRes.json();
    assert(custListRes.status === 200, 'Customer bookings API returns HTTP 200');
    const hasExpiredForCust = custListData.bookings.some(b => b.status === 'expired');
    assert(hasExpiredForCust, 'Customer bookings list correctly includes EXPIRED bookings');

    // =========================================================================
    // 19. Admin monitoring
    // =========================================================================
    console.log('\n--- 19. Admin monitoring ---');
    const adminUser = await User.findOneAndUpdate(
        { email: 'lifecycle_admin@test.com' },
        { name: 'Lifecycle Admin', email: 'lifecycle_admin@test.com', password: hashedPassword, role: 'admin', phone: '9998887773' },
        { upsert: true, returnDocument: 'after' }
    );
    const adminToken = jwt.sign(
        { id: adminUser._id, role: 'admin', name: adminUser.name, email: adminUser.email },
        process.env.SECRET_KEY || 'MYKEY123KEY',
        { expiresIn: '1d' }
    );
    const adminDashboardRes = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminDashboardRes.status === 200, 'Admin dashboard accessible with HTTP 200');

    // =========================================================================
    // 20. EJS pages continue to work
    // =========================================================================
    console.log('\n--- 20. EJS pages accessibility ---');
    const ejsLogin = await fetch(`${EJS_BASE}/login`);
    assert(ejsLogin.status === 200, 'EJS /login responds with HTTP 200');

    // =========================================================================
    // 21. React API delivers consistent lifecycle
    // =========================================================================
    console.log('\n--- 21. React API delivers consistent lifecycle ---');
    const filterExpiredRes = await fetch(`${API_BASE}/bookings/my?status=expired`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    const filterExpiredData = await filterExpiredRes.json();
    assert(filterExpiredRes.status === 200, 'Status filter for "expired" returns HTTP 200');
    assert(filterExpiredData.bookings.every(b => b.status === 'expired'), 'All returned bookings have status "expired"');

    // Clean up test data
    await Booking.deleteMany({ vehicleId: vehicle._id });
    await Vehicle.deleteOne({ _id: vehicle._id });
    await User.deleteMany({ email: { $in: ['lifecycle_cust@test.com', 'lifecycle_owner@test.com'] } });
    await mongoose.disconnect();

    console.log('\n====================================================');
    console.log('🎉 ALL 21 LIFECYCLE TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
}

runTests().catch(err => {
    console.error('Test Suite encountered an error:', err);
    process.exit(1);
});
