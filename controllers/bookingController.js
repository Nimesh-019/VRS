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

        // Get filter values from URL
        const {
            status = '',
            type = ''
        } = req.query;


        // ==================== BUILD QUERY ====================

        const query = {
            userId: userId
        };


        // ==================== STATUS FILTER ====================

        if (status) {
            query.status = status;
        }


        // ==================== GET BOOKINGS ====================

        let bookings = await Booking.find(query)
            .populate(
                'vehicleId',
                'vehicleNumber brand model type pricePerDay image'
            )
            .sort({
                createdAt: -1
            });


        // ==================== VEHICLE TYPE FILTER ====================

        /*
            Vehicle type belongs to Vehicle document,
            not Booking document.

            Therefore, after populate(), we filter
            bookings according to vehicleId.type.
        */

        if (type) {

            bookings = bookings.filter(
                booking =>
                    booking.vehicleId &&
                    booking.vehicleId.type === type
            );

        }


        // ==================== RENDER ====================

        res.render('service/bookings', {

            user: req.user,

            bookings,

            // Send filters back to EJS
            // so selected options remain selected

            status,

            type

        });


    } catch (error) {

        console.error('Error fetching bookings:', error);

        res.status(500).send('Server Error');

    }
};

exports.showOwnerBookingHistory = async (req, res) => {

    try {

        const ownerId = req.user._id || req.user.id;


        // ================= FILTER VALUES =================

        const {
            status = '',
            paymentStatus = '',
            search = ''
        } = req.query;


        // ================= OWNER VEHICLES =================

        /*
         * First get vehicles belonging to this owner.
         *
         * This is important because an owner should
         * only see bookings for their own vehicles.
         */

        const vehicles = await Vehicle.find({
            ownerId: ownerId
        }).select('_id');


        const vehicleIds = vehicles.map(
            vehicle => vehicle._id
        );


        // ================= BOOKING QUERY =================

        const query = {
            vehicleId: {
                $in: vehicleIds
            }
        };


        // ================= STATUS FILTER =================

        if (status) {

            query.status = status;

        }


        // ================= PAYMENT FILTER =================

        if (paymentStatus) {

            query.paymentStatus = paymentStatus;

        }


        // ================= GET BOOKINGS =================

        let bookings = await Booking.find(query)

            .populate(
                'vehicleId',
                'vehicleNumber brand model type pricePerDay image'
            )

            .populate(
                'userId',
                'name email phone'
            )

            .sort({
                createdAt: -1
            });


        // ================= SEARCH FILTER =================

        if (search.trim() !== '') {

            const searchText =
                search.trim().toLowerCase();


            bookings = bookings.filter(booking => {

                const vehicle = booking.vehicleId;
                const customer = booking.userId;


                const customerName =
                    customer?.name?.toLowerCase() || '';

                const customerEmail =
                    customer?.email?.toLowerCase() || '';

                const vehicleBrand =
                    vehicle?.brand?.toLowerCase() || '';

                const vehicleModel =
                    vehicle?.model?.toLowerCase() || '';

                const vehicleNumber =
                    vehicle?.vehicleNumber?.toLowerCase() || '';


                return (

                    customerName.includes(searchText) ||

                    customerEmail.includes(searchText) ||

                    vehicleBrand.includes(searchText) ||

                    vehicleModel.includes(searchText) ||

                    vehicleNumber.includes(searchText)

                );

            });

        }


        // ================= RENDER =================

        res.render('owner/bookingHistory', {

            user: req.user,

            bookings,

            // Keep filters selected in EJS
            status,

            paymentStatus,

            search

        });


    } catch (error) {

        console.error(
            'Error fetching owner booking history:',
            error
        );

        res.status(500).send('Server Error');

    }

};