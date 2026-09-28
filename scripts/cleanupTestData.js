const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const connectDB = require('../config/db');

async function cleanup() {
    await connectDB();

    console.log('--- CLEANING UP TEST DATA ---');

    // 1. Delete test bookings for test vehicle
    const testVehicle = await Vehicle.findOne({ vehicleNumber: 'MH12AB1234' });
    if (testVehicle) {
        const deletedBookings = await Booking.deleteMany({ vehicleId: testVehicle._id });
        console.log(`Deleted ${deletedBookings.deletedCount} test bookings.`);

        await Vehicle.deleteOne({ _id: testVehicle._id });
        console.log('Deleted test vehicle (MH12AB1234).');
    }

    // 2. Delete test customer accounts
    const deletedUsers = await User.deleteMany({
        email: { $in: [
            'owner_test@vrs.com',
            'cust1@test.com',
            'cust2@test.com',
            ...Array.from({ length: 100 }, (_, i) => `cust_${i + 1}@scale.com`)
        ]}
    });

    console.log(`Deleted ${deletedUsers.deletedCount} test user accounts.`);

    console.log('Cleanup completed successfully.');
    mongoose.connection.close();
}

cleanup().catch(err => {
    console.error('Cleanup error:', err);
    process.exit(1);
});
