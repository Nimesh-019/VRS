const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        vehicleNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            match: /^[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{4}$/i
        },

        brand: {
            type: String,
            required: true,
            trim: true
        },

        model: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            required: true,
            enum: ['Car', 'Bike', 'Scooter', 'SUV', 'Other']
        },

        pricePerDay: {
            type: Number,
            required: true,
            min: 0
        },

        description: {
            type: String,
            trim: true
        },

        image: {
            type: String,
            required: true
        },

        availability: {
            type: Boolean,
            default: true
        },

        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },

        rejectionReason: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;