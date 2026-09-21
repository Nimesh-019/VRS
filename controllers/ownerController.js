const Booking = require('../models/Booking');

const confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = (req.user._id || req.user.id).toString();

        const booking = await Booking.findById(id).populate('vehicleId');

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        if (!booking.vehicleId || booking.vehicleId.ownerId.toString() !== ownerId) {
            return res.status(403).send('Access denied. You do not own this vehicle.');
        }

        if (booking.status !== 'pending') {
            return res.status(400).send('Booking is already processed');
        }

        booking.status = 'confirmed';

        await booking.save();

        res.redirect('/owner/history');

    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).send('Server error');
    }
};

const rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = (req.user._id || req.user.id).toString();

        const booking = await Booking.findById(id).populate('vehicleId');

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        if (!booking.vehicleId || booking.vehicleId.ownerId.toString() !== ownerId) {
            return res.status(403).send('Access denied. You do not own this vehicle.');
        }

        if (booking.status !== 'pending') {
            return res.status(400).send('Booking is already processed');
        }

        booking.status = 'cancelled';

        await booking.save();

        res.redirect('/owner/history');

    } catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).send('Server error');
    }
};

module.exports = {
    confirmBooking,
    rejectBooking
};