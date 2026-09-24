const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
    {
        // Customer who submitted the complaint
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // Specific booking related to this complaint
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true
        },

        // Vehicle involved in the complaint
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true
        },

        // Owner of the vehicle
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // Complaint subject
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        // Complaint details
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        // Message sent by admin
        adminReply: {
            type: String,
            default: '',
            trim: true
        },

        // Message sent by vehicle owner directly to customer
        ownerReply: {
            type: String,
            default: '',
            trim: true
        },

        // Complaint status
        status: {
            type: String,
            enum: ['pending', 'resolved'],
            default: 'pending'
        },

        // When admin resolved the complaint
        resolvedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;