const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');

exports.showBookingForm = async (req, res) => {
    try {
        const vehicleId = req.params.vehicleId;
        const vehicle = await Vehicle.findById(vehicleId);

        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }

        if (!vehicle.availability) {
            return res.render('service/booking', {
                user: req.user,
                vehicle,
                error: 'Vehicle is currently not available for booking'
            });
        }

        res.render('service/booking', {
            user: req.user,
            vehicle,
            error: null
        });

    } catch (error) {
        console.error('Error showing booking form:', error);
        res.status(500).send('Server Error');
    }
};

exports.bookVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.vehicleId;
        const { startDate, endDate } = req.body;

        const vehicle = await Vehicle.findById(vehicleId);

        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }

        if (!startDate || !endDate) {
            return res.render('service/booking', {
                user: req.user,
                vehicle,
                error: 'Start date and end date are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.render('service/booking', {
                user: req.user,
                vehicle,
                error: 'End date must be on or after start date'
            });
        }

        if (!vehicle.availability) {
            return res.render('service/booking', {
                user: req.user,
                vehicle,
                error: 'Vehicle is currently not available for booking'
            });
        }

        const existingBookings = await Booking.find({
            vehicleId: vehicleId,
            status: { $in: ['pending', 'confirmed'] },
            startDate: { $lte: end },
            endDate: { $gte: start }
        });

        if (existingBookings.length > 0) {
            return res.render('service/booking', {
                user: req.user,
                vehicle,
                error: 'Vehicle is already booked for the selected period'
            });
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const totalDays = Math.max(1, diffDays);

        const totalAmount = totalDays * vehicle.pricePerDay;

        const userId = req.user._id || req.user.id;

        const newBooking = new Booking({
            userId: userId,
            vehicleId: vehicle._id,
            startDate: start,
            endDate: end,
            totalAmount: totalAmount,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await newBooking.save();

        res.redirect('/bookings');

    } catch (error) {
        console.error('Error booking vehicle:', error);
        res.status(500).send('Server Error');
    }
};

exports.showBookings = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const bookings = await Booking.find({ userId: userId })
            .populate('vehicleId', 'vehicleNumber brand model type pricePerDay image')
            .sort({ createdAt: -1 });

        res.render('service/bookings', { user: req.user, bookings });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Server Error');
    }
};

exports.showOwnerBookingHistory = async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;

        const vehicles = await Vehicle.find({ ownerId: ownerId });

        const vehicleIds = vehicles.map(vehicle => vehicle._id);

        const bookings = await Booking.find({
            vehicleId: { $in: vehicleIds }
        })
            .populate('vehicleId', 'vehicleNumber brand model type pricePerDay image')
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.render('owner/bookingHistory', {
            user: req.user,
            bookings
        });

    } catch (error) {
        console.error('Error fetching owner booking history:', error);
        res.status(500).send('Server Error');
    }
};