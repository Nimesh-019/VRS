const Booking = require('../models/Booking');
const confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).send('Booking not found');
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

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).send('Booking not found');
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
module.exports={
    confirmBooking,
    rejectBooking
}