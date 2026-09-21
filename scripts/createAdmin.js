require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

const connectDB = require('../config/db');


const createAdmin = async () => {

    try {

        await connectDB();

        const adminEmail = 'admin@gmail.com';

        // Check whether admin already exists
        const existingAdmin = await User.findOne({
            email: adminEmail
        });

        if (existingAdmin) {

            console.log('Admin account already exists.');

            process.exit(0);
        }


        // Choose your admin password here
        const adminPassword = 'Admin@123';


        // Hash password
        const hashedPassword = await bcrypt.hash(
            adminPassword,
            10
        );


        // Create admin
        const admin = new User({

            name: 'Admin',

            email: adminEmail,

            phone: '9999999999',

            password: hashedPassword,

            role: 'admin'

        });


        await admin.save();


        console.log('=================================');
        console.log('Admin account created successfully');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('Role: admin');
        console.log('=================================');


        process.exit(0);

    } catch (error) {

        console.error('Error creating admin:', error);

        process.exit(1);

    }

};


createAdmin();