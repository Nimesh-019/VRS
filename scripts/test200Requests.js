const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const connectDB = require('../config/db');

async function run200ConcurrencyTest() {
    await connectDB();

    console.log('\n================ 1. SETTING UP TEST DATA FOR 200 REQUESTS ================');
    
    // 1. Create or Find Owner
    let owner = await User.findOne({ email: 'owner_200test@vrs.com' });
    if (!owner) {
        const hashedPassword = await bcrypt.hash('Owner@123', 10);
        owner = await User.create({
            name: 'Test Owner 200',
            email: 'owner_200test@vrs.com',
            phone: '9876543211',
            password: hashedPassword,
            role: 'owner'
        });
        console.log('Created Owner: owner_200test@vrs.com');
    }

    // 2. Create or Find Approved Vehicle
    let vehicle = await Vehicle.findOne({ vehicleNumber: 'MH12AB5678' });
    if (!vehicle) {
        vehicle = await Vehicle.create({
            ownerId: owner._id,
            vehicleNumber: 'MH12AB5678',
            brand: 'Hyundai',
            model: 'Creta',
            type: 'SUV',
            pricePerDay: 1800,
            description: '200 Requests Test Vehicle',
            image: 'creta.jpg',
            availability: true,
            approvalStatus: 'approved'
        });
        console.log('Created Vehicle: Hyundai Creta (MH12AB5678)');
    } else {
        vehicle.approvalStatus = 'approved';
        vehicle.availability = true;
        await vehicle.save();
    }

    // Clear previous bookings for this vehicle
    await Booking.deleteMany({ vehicleId: vehicle._id });

    // 3. Generate 200 Customer accounts and JWT tokens
    console.log('Generating 200 Customer Accounts & JWT Tokens...');
    const hashedPassword = await bcrypt.hash('User@123', 10);
    const secretKey = process.env.SECRET_KEY || 'MYKEY123KEY';
    
    const customerTokens = [];
    const usersToCreate = [];

    // Check existing
    const existingUsers = await User.find({ email: /@scale200\.com$/ });
    const existingEmailMap = new Set(existingUsers.map(u => u.email));

    for (let i = 1; i <= 200; i++) {
        const email = `cust_${i}@scale200.com`;
        if (!existingEmailMap.has(email)) {
            usersToCreate.push({
                name: `Customer ${i}`,
                email,
                phone: `9100000${String(i).padStart(3, '0')}`,
                password: hashedPassword,
                role: 'user'
            });
        }
    }

    if (usersToCreate.length > 0) {
        await User.insertMany(usersToCreate);
        console.log(`Bulk created ${usersToCreate.length} customer accounts.`);
    }

    const allCusts = await User.find({ email: /@scale200\.com$/ });
    allCusts.forEach(cust => {
        const token = jwt.sign({ id: cust._id, role: cust.role }, secretKey, { expiresIn: '1d' });
        customerTokens.push({ name: cust.name, token });
    });

    console.log(`Total active tokens prepared: ${customerTokens.length}`);

    console.log('\n================ 2. FIRING 200 SIMULTANEOUS BOOKING REQUESTS ================');
    console.log(`Target URL: http://localhost:3000/book/${vehicle._id}`);
    console.log(`Booking Dates: 2026-11-01 to 2026-11-05`);

    // Increase max sockets for HTTP agent to handle 200 concurrent connections smoothly
    const agent = new http.Agent({ keepAlive: true, maxSockets: 300 });

    function sendBookingRequest(custName, token) {
        return new Promise((resolve) => {
            const postData = new URLSearchParams({
                startDate: '2026-11-01',
                endDate: '2026-11-05'
            }).toString();

            const options = {
                hostname: 'localhost',
                port: 3000,
                path: `/book/${vehicle._id}`,
                method: 'POST',
                agent: agent,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'Cookie': `token=${token}`
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        customer: custName,
                        statusCode: res.statusCode,
                        isAccepted: res.statusCode === 302,
                        isRejected: res.statusCode === 200
                    });
                });
            });

            req.on('error', (e) => {
                resolve({ customer: custName, error: e.message, isAccepted: false, isRejected: false });
            });

            req.write(postData);
            req.end();
        });
    }

    const startTime = Date.now();
    const promises = customerTokens.map(c => sendBookingRequest(c.name, c.token));
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    const acceptedCount = results.filter(r => r.isAccepted).length;
    const rejectedCount = results.filter(r => r.isRejected).length;
    const errorCount = results.filter(r => r.error).length;

    console.log('\n================ 3. 200 REQUESTS TEST RESULTS ================');
    console.log(`Total Requests Sent: 200`);
    console.log(`Time Elapsed: ${duration} ms`);
    console.log(`Accepted Requests (Status 302 -> Saved as pending): ${acceptedCount}`);
    console.log(`Rejected Requests (Status 200 -> "Vehicle is already booked"): ${rejectedCount}`);
    console.log(`Errors / Connection Drops: ${errorCount}`);

    const dbCount = await Booking.countDocuments({ vehicleId: vehicle._id });
    console.log(`\nActual Bookings Saved in Database: ${dbCount}`);

    mongoose.connection.close();
}

run200ConcurrencyTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
