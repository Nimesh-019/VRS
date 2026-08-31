const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
exports.showBookingForm = async (req, res) => {
    try {
        const vehicleId = req.params.vehicleId;
        // Fetch the vehicle details
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }
        if (!vehicle.availability) {
            return res.render('/book/:vehicleId')
        }
        res.render('service/booking', { user: req.user, vehicle });
    } catch (error) {
        console.error('Error showing booking form:', error);
        res.status(500).send('Server Error');
    }
};

exports.bookVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.vehicleId;
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).send('Start date and end date are required');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if(start > end) {
            return res.status(400).send('End date must be after start date');
        }
        // Create a new booking
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }
        if (!vehicle.availability) {
            return res.status(400).send('Vehicle is currently not available for booking');
        }
        
        const existingBookings = await Booking.find({
            vehicleId: vehicleId,
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });
        if (existingBookings.length > 0) {
            return res.status(400).send('Vehicle is already booked for the selected period');
        }
        console.log('REQ.USER:', req.user);
        const totalDays = Math.ceil((end - start+1) / (1000 * 60 * 60 * 24));
        const totalAmount = totalDays * vehicle.pricePerDay;
        const newBooking = new Booking({
            userId: req.user.id,
            vehicleId: vehicle._id,
            startDate: start,
            endDate: end,
            totalAmount: totalAmount,
            status: 'pending',
            paymentStatus: 'pending'
        });

        const savedBooking = await newBooking.save();
        console.log('Booking saved:', savedBooking);
        res.redirect('/bookings');
    } catch (error) {
        console.error('Error booking vehicle:', error);
        res.status(500).send('Server Error');
    }
};

exports.showBookings= async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate('vehicleId', 'vehicleNumber brand model pricePerDay')
            .sort({ createdAt: -1 });
            res.render('service/bookings', { user: req.user, bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Server Error');
    }
};
exports.showOwnerBookingHistory = async (req, res) => {
    try {
        // Logged-in owner's ID
        const ownerId = req.user.id;

        // Find all vehicles belonging to this owner
        const vehicles = await Vehicle.find({
            ownerId: ownerId
        });

        // Get only vehicle IDs
        const vehicleIds = vehicles.map(vehicle => vehicle._id);

        // Find bookings made for those vehicles
        const bookings = await Booking.find({
            vehicleId: { $in: vehicleIds }
        })
            .populate('vehicleId', 'vehicleNumber brand model type pricePerDay')
            .populate('userId', 'name email')
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