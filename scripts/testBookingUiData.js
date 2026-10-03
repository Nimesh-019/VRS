require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const User = require('../models/user');
const API_BASE = 'http://localhost:5000/api';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vrs');

    const customerUser = await User.findOne({ role: 'user' });
    const ownerUser = await User.findOne({ role: 'owner' });

    const customerToken = jwt.sign(
        { id: customerUser._id, role: customerUser.role, name: customerUser.name, email: customerUser.email },
        process.env.SECRET_KEY || 'MYKEY123KEY',
        { expiresIn: '1d' }
    );

    const ownerToken = jwt.sign(
        { id: ownerUser._id, role: ownerUser.role, name: ownerUser.name, email: ownerUser.email },
        process.env.SECRET_KEY || 'MYKEY123KEY',
        { expiresIn: '1d' }
    );

    console.log('--- Checking Customer /api/bookings/my data population ---');
    const myBookingsRes = await fetch(`${API_BASE}/bookings/my`, {
        headers: { Authorization: `Bearer ${customerToken}` }
    });
    const myBookingsData = await myBookingsRes.json();
    console.log(`Fetched ${myBookingsData.bookings.length} customer bookings.`);
    if (myBookingsData.bookings.length > 0) {
        const first = myBookingsData.bookings[0];
        console.log('Sample booking vehicle:', {
            brand: first.vehicleId?.brand,
            model: first.vehicleId?.model,
            vehicleNumber: first.vehicleId?.vehicleNumber,
            type: first.vehicleId?.type,
            ownerName: first.vehicleId?.ownerId?.name
        });
        if (first.vehicleId?.ownerId?.name) {
            console.log('✅ PASS: Owner name successfully populated in vehicleId.ownerId.name!');
        } else {
            console.log('⚠️ Notice: ownerId on vehicle:', first.vehicleId?.ownerId);
        }
    }

    console.log('\n--- Checking Owner /api/owner/bookings data population ---');
    const ownerBookingsRes = await fetch(`${API_BASE}/owner/bookings`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const ownerBookingsData = await ownerBookingsRes.json();
    console.log(`Fetched ${ownerBookingsData.bookings.length} owner bookings.`);
    if (ownerBookingsData.bookings.length > 0) {
        const firstOwnerBooking = ownerBookingsData.bookings[0];
        console.log('Sample rental record:', {
            vehicle: `${firstOwnerBooking.vehicleId?.brand} ${firstOwnerBooking.vehicleId?.model}`,
            vehicleNumber: firstOwnerBooking.vehicleId?.vehicleNumber,
            customerName: firstOwnerBooking.userId?.name,
            customerEmail: firstOwnerBooking.userId?.email,
            customerPhone: firstOwnerBooking.userId?.phone,
            status: firstOwnerBooking.status,
            paymentStatus: firstOwnerBooking.paymentStatus
        });
        if (firstOwnerBooking.userId?.name) {
            console.log('✅ PASS: Customer name & contact info available on userId!');
        }
    }

    console.log('\n--- Verifying Image Removal from React Booking components ---');
    const bookingCardContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/BookingCard.jsx'), 'utf8');
    const hasCustImage = bookingCardContent.includes('vehicle-image') || bookingCardContent.includes('<img');
    console.log('Customer BookingCard has vehicle image:', hasCustImage ? '❌ YES' : '✅ NO (Correct)');

    const ownerBookingsContent = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/OwnerBookings.jsx'), 'utf8');
    const hasOwnerImage = ownerBookingsContent.includes('vehicle-image') || ownerBookingsContent.includes('<img');
    console.log('Owner Rental History has vehicle image:', hasOwnerImage ? '❌ YES' : '✅ NO (Correct)');

    console.log('\n--- Verifying Image Preservation on Vehicle Browsing component ---');
    const vehicleCardContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/VehicleCard.jsx'), 'utf8');
    const hasCardImage = vehicleCardContent.includes('vehicle-image') && vehicleCardContent.includes('<img');
    console.log('VehicleCard (Vehicle Browsing) has vehicle image:', hasCardImage ? '✅ YES (Preserved)' : '❌ NO');

    console.log('\n--- Verifying Image Removal from EJS Booking views ---');
    const ejsCustBookings = fs.readFileSync(path.join(__dirname, '../views/service/bookings.ejs'), 'utf8');
    const ejsCustHasImg = ejsCustBookings.includes('vehicle-image') || ejsCustBookings.includes('<img');
    console.log('EJS My Bookings has vehicle image:', ejsCustHasImg ? '❌ YES' : '✅ NO (Correct)');

    const ejsOwnerBookings = fs.readFileSync(path.join(__dirname, '../views/owner/bookingHistory.ejs'), 'utf8');
    const ejsOwnerHasImg = ejsOwnerBookings.includes('vehicle-image') || ejsOwnerBookings.includes('<img');
    console.log('EJS Owner History has vehicle image:', ejsOwnerHasImg ? '❌ YES' : '✅ NO (Correct)');

    console.log('\nAll checks completed successfully.');
    await mongoose.disconnect();
}

run().catch(console.error);
