const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const connectDB = require('../config/db');

async function cleanup200() {
    await connectDB();

    console.log('--- CLEANING UP 200 TEST DATA ---');

    // 1. Delete test vehicle & bookings
    const vehicle = await Vehicle.findOne({ vehicleNumber: 'MH12AB5678' });
    if (vehicle) {
        const deletedBookings = await Booking.deleteMany({ vehicleId: vehicle._id });
        console.log(`Deleted ${deletedBookings.deletedCount} test bookings.`);

        await Vehicle.deleteOne({ _id: vehicle._id });
        console.log('Deleted test vehicle (MH12AB5678).');
    }

    // 2. Delete test users
    const deletedUsers = await User.deleteMany({
        $or: [
            { email: 'owner_200test@vrs.com' },
            { email: /@scale200\.com$/ }
        ]
    });

    console.log(`Deleted ${deletedUsers.deletedCount} test user accounts.`);
    console.log('Cleanup finished.');

    mongoose.connection.close();
}

cleanup200().catch(console.error);
