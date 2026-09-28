const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const connectDB = require('../config/db');

async function inspectErrorMsg() {
    await connectDB();

    let vehicle = await Vehicle.findOne({ vehicleNumber: 'MH12AB1234' });
    await Booking.deleteMany({ vehicleId: vehicle._id });

    const secretKey = process.env.SECRET_KEY || 'MYKEY123KEY';
    
    const customerTokens = [];
    for (let i = 1; i <= 100; i++) {
        const cust = await User.findOne({ email: `cust_${i}@scale.com` });
        const token = jwt.sign({ id: cust._id, role: cust.role }, secretKey, { expiresIn: '1d' });
        customerTokens.push({ name: `Customer ${i}`, token });
    }

    function sendBookingRequest(custName, token) {
        return new Promise((resolve) => {
            const postData = new URLSearchParams({
                startDate: '2026-10-10',
                endDate: '2026-10-15'
            }).toString();

            const options = {
                hostname: 'localhost',
                port: 3000,
                path: `/book/${vehicle._id}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'Cookie': `token=${token}`
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ customer: custName, statusCode: res.statusCode, body: data }));
            });

            req.on('error', (e) => resolve({ customer: custName, error: e.message }));
            req.write(postData);
            req.end();
        });
    }

    const results = await Promise.all(customerTokens.map(c => sendBookingRequest(c.name, c.token)));

    const status200s = results.filter(r => r.statusCode === 200);
    console.log(`Status 200 count: ${status200s.length}`);
    if (status200s.length > 0) {
        // Find where the alert error message is located in EJS
        const html = status200s[0].body;
        // Search for strings like "Vehicle is already booked" or any error text in HTML
        console.log('--- HTML CONTENT SEARCH FOR ERROR MESSAGES ---');
        const lines = html.split('\n');
        lines.forEach(line => {
            if (line.includes('error') || line.includes('alert') || line.includes('booked') || line.includes('Vehicle')) {
                console.log(line.trim());
            }
        });
    }

    mongoose.connection.close();
}

inspectErrorMsg().catch(console.error);
