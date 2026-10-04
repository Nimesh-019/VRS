const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const Complaint = require('../models/Complaint');
const Payment = require('../models/Payment');

const {
    isApiLoggedIn,
    isApiOwner,
    isApiUser,
    isApiAdmin
} = require('../middleware/apiAuth');
const apiUpload = require('../middleware/apiUpload');
const { generatePaymentData } = require('../controllers/paymentController');
const {
    syncBookingStatus,
    syncBookings,
    syncAllActiveBookings,
    getBookingLifecycleStatus,
    hasEnded
} = require('../utils/bookingLifecycle');

const router = express.Router();

// Helper to resolve vehicle images from file upload or base64 or URL
const resolveImageUrl = (req, fallbackUrl = '') => {
    if (req.file) {
        if (req.file.path) return req.file.path; // Cloudinary URL if available
        if (req.file.buffer) {
            return `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
    }
    if (req.body && req.body.image && typeof req.body.image === 'string' && req.body.image.trim()) {
        return req.body.image.trim();
    }
    return fallbackUrl;
};

// =========================================================================
// 1. AUTHENTICATION ENDPOINTS
// =========================================================================

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Wrong password.' });
        }

        if (user.role !== role) {
            return res.status(401).json({
                message: `Account exists as '${user.role}', but tried logging in as '${role}'`
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.SECRET_KEY || 'MYKEY123KEY',
            { expiresIn: '1d' }
        );

        // Set httpOnly cookie (matching existing EJS behavior)
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

        if (req.session) {
            req.session.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                role: user.role
            };
        }

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                role: user.role
            }
        });
    } catch (error) {
        console.error('API Login Error:', error);
        return res.status(500).json({ message: 'Server error during login.' });
    }
});

// POST /api/auth/signup
router.post('/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password, city, role } = req.body;

        if (!name || !email || !phone || !password || !role) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (!city || !city.trim()) {
            return res.status(400).json({ message: 'City is required.' });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'Email' : 'Phone number';
            return res.status(400).json({ message: `${field} is already registered.` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            city: city.trim(),
            role
        });

        await user.save();

        return res.status(201).json({
            message: 'Account created successfully. Please login.',
            email,
            role
        });
    } catch (error) {
        console.error('API Signup Error:', error);
        return res.status(500).json({ message: error.message || 'Error creating account.' });
    }
});

// POST & GET /api/auth/logout
const handleLogout = (req, res) => {
    res.clearCookie('token');
    if (req.session) {
        req.session.destroy(() => {
            return res.json({ message: 'Logged out successfully.' });
        });
    } else {
        return res.json({ message: 'Logged out successfully.' });
    }
};
router.post('/auth/logout', handleLogout);
router.get('/auth/logout', handleLogout);

// GET /api/auth/me
router.get('/auth/me', isApiLoggedIn, (req, res) => {
    return res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            city: req.user.city,
            role: req.user.role
        }
    });
});

// =========================================================================
// 2. CUSTOMER / VEHICLE BROWSING ENDPOINTS
// =========================================================================

// GET /api/vehicles - Browse available and approved vehicles
router.get('/vehicles', async (req, res) => {
    try {
        const {
            search = '',
            type = '',
            minPrice = '',
            maxPrice = '',
            city = '',
            sort = ''
        } = req.query;

        const query = {
            approvalStatus: 'approved',
            availability: true
        };

        if (search.trim()) {
            query.$or = [
                { brand: { $regex: search.trim(), $options: 'i' } },
                { model: { $regex: search.trim(), $options: 'i' } },
                { vehicleNumber: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        if (type) {
            query.type = type;
        }

        if (city && city.trim()) {
            query.city = { $regex: city.trim(), $options: 'i' };
        }

        if (minPrice || maxPrice) {
            query.pricePerDay = {};
            if (minPrice) query.pricePerDay.$gte = Number(minPrice);
            if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'priceLow') {
            sortOption = { pricePerDay: 1 };
        } else if (sort === 'priceHigh') {
            sortOption = { pricePerDay: -1 };
        }

        const vehicles = await Vehicle.find(query)
            .populate('ownerId', 'name email phone city')
            .sort(sortOption);

        return res.json({ vehicles });
    } catch (error) {
        console.error('API get vehicles error:', error);
        return res.status(500).json({ message: 'Error fetching vehicles.' });
    }
});

// GET /api/vehicles/:id - Vehicle details for booking
router.get('/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id).populate('ownerId', 'name email phone city');
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }
        return res.json({ vehicle });
    } catch (error) {
        console.error('API get vehicle details error:', error);
        return res.status(500).json({ message: 'Error fetching vehicle details.' });
    }
});

// =========================================================================
// 3. BOOKING ENDPOINTS
// =========================================================================

// POST /api/bookings - Create booking
router.post('/bookings', isApiLoggedIn, isApiUser, async (req, res) => {
    try {
        const { vehicleId, startDate, endDate } = req.body;

        if (!vehicleId || !startDate || !endDate) {
            return res.status(400).json({ message: 'Vehicle, start date, and end date are required.' });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        if (vehicle.approvalStatus !== 'approved') {
            return res.status(403).json({ message: 'This vehicle is not approved for rental.' });
        }

        if (!vehicle.availability) {
            return res.status(400).json({ message: 'Vehicle is currently not available for booking.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.status(400).json({ message: 'End date must be on or after start date.' });
        }

        // Sync active bookings first to ensure current states
        await syncAllActiveBookings();

        // Check overlapping bookings
        const existingBookings = await Booking.find({
            vehicleId: vehicleId,
            status: { $in: ['pending', 'confirmed', 'ongoing'] },
            startDate: { $lte: end },
            endDate: { $gte: start }
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({
                message: 'Vehicle is already booked for this period. Please choose a different date.'
            });
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const totalDays = Math.max(1, diffDays);
        const totalAmount = totalDays * vehicle.pricePerDay;

        const userId = req.user._id || req.user.id;
        const newBooking = new Booking({
            userId,
            vehicleId: vehicle._id,
            startDate: start,
            endDate: end,
            totalAmount,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await newBooking.save();

        return res.status(201).json({
            message: 'Booking created successfully.',
            booking: newBooking
        });
    } catch (error) {
        console.error('API create booking error:', error);
        return res.status(500).json({ message: 'Server error creating booking.' });
    }
});

// GET /api/bookings/my - Get customer bookings
router.get('/bookings/my', isApiLoggedIn, isApiUser, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { status = '', type = '' } = req.query;

        // Sync active bookings so lifecycle updates are saved
        await syncAllActiveBookings();

        const query = { userId };
        if (status) {
            query.status = status;
        }

        let bookings = await Booking.find(query)
            .populate({
                path: 'vehicleId',
                select: 'vehicleNumber brand model type pricePerDay image city ownerId',
                populate: { path: 'ownerId', select: 'name email phone' }
            })
            .sort({ createdAt: -1 });

        if (type) {
            bookings = bookings.filter(b => b.vehicleId && b.vehicleId.type === type);
        }

        await syncBookings(bookings);

        return res.json({ bookings });
    } catch (error) {
        console.error('API get bookings error:', error);
        return res.status(500).json({ message: 'Error fetching bookings.' });
    }
});

// POST /api/bookings/:id/cancel - Customer cancel booking
router.post('/bookings/:id/cancel', isApiLoggedIn, isApiUser, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req.user._id || req.user.id).toString();

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (booking.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to cancel this booking.' });
        }

        // Sync status first in case it transitioned to ongoing/completed
        await syncBookingStatus(booking);

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled.' });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel a completed booking.' });
        }
        if (booking.status === 'ongoing') {
            return res.status(400).json({ message: 'Cannot cancel an ongoing rental.' });
        }
        if (booking.status === 'rejected') {
            return res.status(400).json({ message: 'Cannot cancel a rejected booking.' });
        }
        if (booking.status === 'expired') {
            return res.status(400).json({ message: 'Cannot cancel an expired booking.' });
        }

        const now = new Date();
        const startDate = new Date(booking.startDate);

        if (now >= startDate) {
            return res.status(400).json({
                message: 'Cannot cancel booking: The booking start date has already passed or started.'
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Restore vehicle availability
        if (booking.vehicleId) {
            await Vehicle.updateOne({ _id: booking.vehicleId }, { $set: { availability: true } });
        }

        return res.json({ message: 'Booking cancelled successfully.' });
    } catch (error) {
        console.error('API cancel booking error:', error);
        return res.status(500).json({ message: 'Server error cancelling booking.' });
    }
});

// =========================================================================
// 4. COMPLAINT ENDPOINTS
// =========================================================================

// GET /api/complaints/my - Customer's complaints
router.get('/complaints/my', isApiLoggedIn, isApiUser, async (req, res) => {
    try {
        const customerId = req.user._id || req.user.id;

        const complaints = await Complaint.find({ customerId })
            .populate('vehicleId', 'vehicleNumber brand model type image')
            .populate('ownerId', 'name email phone')
            .populate('bookingId', 'startDate endDate totalAmount status')
            .sort({ createdAt: -1 });

        return res.json({ complaints });
    } catch (error) {
        console.error('API get complaints error:', error);
        return res.status(500).json({ message: 'Error fetching complaints.' });
    }
});

// POST /api/complaints - Customer submit complaint
router.post('/complaints', isApiLoggedIn, isApiUser, async (req, res) => {
    try {
        const { bookingId, subject, message } = req.body;
        const customerId = req.user._id || req.user.id;

        if (!bookingId || !subject || !subject.trim() || !message || !message.trim()) {
            return res.status(400).json({ message: 'Booking, subject, and message are required.' });
        }

        const booking = await Booking.findOne({ _id: bookingId, userId: customerId }).populate('vehicleId');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const vehicle = booking.vehicleId;
        if (!vehicle) {
            return res.status(404).json({ message: 'Associated vehicle not found.' });
        }

        const existingComplaint = await Complaint.findOne({ bookingId: booking._id });
        if (existingComplaint) {
            return res.status(400).json({ message: 'You have already submitted a complaint for this booking.' });
        }

        const complaint = new Complaint({
            customerId,
            bookingId: booking._id,
            vehicleId: vehicle._id,
            ownerId: vehicle.ownerId,
            subject: subject.trim(),
            message: message.trim(),
            status: 'pending'
        });

        await complaint.save();
        return res.status(201).json({ message: 'Complaint submitted successfully.', complaint });
    } catch (error) {
        console.error('API submit complaint error:', error);
        return res.status(500).json({ message: 'Server error submitting complaint.' });
    }
});

// =========================================================================
// 5. PAYMENT ENDPOINTS
// =========================================================================

// GET /api/payment/pay/:bookingId - Initiate PayU payment data
router.get('/payment/pay/:bookingId', isApiLoggedIn, isApiUser, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id || req.user.id;

        const paymentData = await generatePaymentData({ bookingId, userId, source: 'react', req });

        return res.json({
            payuUrl: paymentData.payuUrl,
            key: paymentData.key,
            txnid: paymentData.txnid,
            amount: paymentData.amount,
            productinfo: paymentData.productinfo,
            firstname: paymentData.firstname,
            email: paymentData.email,
            phone: paymentData.phone,
            udf1: paymentData.udf1,
            hash: paymentData.hash,
            surl: paymentData.surl,
            furl: paymentData.furl
        });
    } catch (error) {
        console.error('API initiate payment error:', error);
        return res.status(error.statusCode || 500).json({ message: error.message || 'Failed to initiate payment.' });
    }
});

// =========================================================================
// 6. OWNER ENDPOINTS
// =========================================================================

// GET /api/owner/dashboard
router.get('/owner/dashboard', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;
        const { search = '', type = '', availability = '', city = '', sort = '' } = req.query;

        const filter = { ownerId };

        if (search.trim()) {
            filter.$or = [
                { brand: { $regex: search.trim(), $options: 'i' } },
                { model: { $regex: search.trim(), $options: 'i' } },
                { vehicleNumber: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        if (type) filter.type = type;
        if (availability === 'available') filter.availability = true;
        else if (availability === 'unavailable') filter.availability = false;
        if (city && city.trim()) filter.city = { $regex: city.trim(), $options: 'i' };

        let sortOption = { _id: -1 };
        if (sort === 'priceAsc') sortOption = { pricePerDay: 1 };
        else if (sort === 'priceDesc') sortOption = { pricePerDay: -1 };
        else if (sort === 'nameAsc') sortOption = { brand: 1, model: 1 };

        const vehicles = await Vehicle.find(filter).sort(sortOption);

        return res.json({
            profile: {
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                city: req.user.city
            },
            vehicles
        });
    } catch (error) {
        console.error('API owner dashboard error:', error);
        return res.status(500).json({ message: 'Error fetching owner dashboard.' });
    }
});

// GET /api/owner/vehicles - All owner vehicles
router.get('/owner/vehicles', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;
        const vehicles = await Vehicle.find({ ownerId }).sort({ createdAt: -1 });
        return res.json({ vehicles });
    } catch (error) {
        console.error('API owner vehicles error:', error);
        return res.status(500).json({ message: 'Error fetching vehicles.' });
    }
});

// POST /api/owner/vehicles - Add vehicle
router.post('/owner/vehicles', isApiLoggedIn, isApiOwner, apiUpload, async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;
        const owner = await User.findById(ownerId);

        if (!owner || !owner.city || !owner.city.trim()) {
            return res.status(400).json({
                message: 'Your profile does not have a registered city. Please update your profile before adding a vehicle.'
            });
        }

        const { vehicleNumber, brand, model, type, pricePerDay, description } = req.body;
        const imageUrl = resolveImageUrl(req);

        if (!imageUrl) {
            return res.status(400).json({ message: 'Vehicle image is required.' });
        }

        if (!vehicleNumber || !brand || !model || !type || !pricePerDay) {
            return res.status(400).json({ message: 'All vehicle fields are required.' });
        }

        const newVehicle = new Vehicle({
            ownerId: owner._id,
            vehicleNumber,
            brand,
            model,
            type,
            pricePerDay: Number(pricePerDay),
            description: description || '',
            image: imageUrl,
            city: owner.city,
            availability: true,
            approvalStatus: 'pending'
        });

        await newVehicle.save();
        return res.status(201).json({ message: 'Vehicle added successfully.', vehicle: newVehicle });
    } catch (error) {
        console.error('API add vehicle error:', error);
        return res.status(500).json({ message: error.message || 'Error adding vehicle.' });
    }
});

// GET /api/owner/vehicles/:id - Get vehicle details for editing
router.get('/owner/vehicles/:id', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            ownerId: req.user._id || req.user.id
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        return res.json({ vehicle });
    } catch (error) {
        console.error('API get owner vehicle error:', error);
        return res.status(500).json({ message: 'Error fetching vehicle.' });
    }
});

// PUT & POST /api/owner/vehicles/:id/edit - Update vehicle
const handleEditVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.user._id || req.user.id;

        const vehicle = await Vehicle.findOne({ _id: id, ownerId });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        const { vehicleNumber, brand, model, type, pricePerDay, description, availability } = req.body;
        const imageUrl = resolveImageUrl(req, vehicle.image);

        if (vehicleNumber) vehicle.vehicleNumber = vehicleNumber;
        if (brand) vehicle.brand = brand;
        if (model) vehicle.model = model;
        if (type) vehicle.type = type;
        if (pricePerDay !== undefined) vehicle.pricePerDay = Number(pricePerDay);
        if (description !== undefined) vehicle.description = description;
        if (availability !== undefined) {
            vehicle.availability = availability === 'true' || availability === true;
        }
        vehicle.image = imageUrl;

        await vehicle.save();
        return res.json({ message: 'Vehicle updated successfully.', vehicle });
    } catch (error) {
        console.error('API edit vehicle error:', error);
        return res.status(500).json({ message: error.message || 'Error editing vehicle.' });
    }
};
router.put('/owner/vehicles/:id', isApiLoggedIn, isApiOwner, apiUpload, handleEditVehicle);
router.post('/owner/vehicles/:id/edit', isApiLoggedIn, isApiOwner, apiUpload, handleEditVehicle);

// DELETE & POST /api/owner/vehicles/:id/delete - Delete vehicle
const handleDeleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.user._id || req.user.id;

        const deletedVehicle = await Vehicle.findOneAndDelete({ _id: id, ownerId });
        if (!deletedVehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        return res.json({ message: 'Vehicle deleted successfully.' });
    } catch (error) {
        console.error('API delete vehicle error:', error);
        return res.status(500).json({ message: 'Error deleting vehicle.' });
    }
};
router.delete('/owner/vehicles/:id', isApiLoggedIn, isApiOwner, handleDeleteVehicle);
router.post('/owner/vehicles/:id/delete', isApiLoggedIn, isApiOwner, handleDeleteVehicle);

// GET /api/owner/bookings - Owner booking history
router.get('/owner/bookings', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;
        const { status = '', paymentStatus = '', search = '' } = req.query;

        // Sync active bookings first
        await syncAllActiveBookings();

        const ownerVehicles = await Vehicle.find({ ownerId }).select('_id');
        const vehicleIds = ownerVehicles.map(v => v._id);

        const query = { vehicleId: { $in: vehicleIds } };
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        let bookings = await Booking.find(query)
            .populate('vehicleId', 'vehicleNumber brand model type pricePerDay image')
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        await syncBookings(bookings);

        if (search.trim()) {
            const term = search.trim().toLowerCase();
            bookings = bookings.filter(b => {
                const customer = b.userId;
                const vehicle = b.vehicleId;
                return (
                    (customer?.name?.toLowerCase() || '').includes(term) ||
                    (customer?.email?.toLowerCase() || '').includes(term) ||
                    (vehicle?.brand?.toLowerCase() || '').includes(term) ||
                    (vehicle?.model?.toLowerCase() || '').includes(term) ||
                    (vehicle?.vehicleNumber?.toLowerCase() || '').includes(term)
                );
            });
        }

        return res.json({ bookings });
    } catch (error) {
        console.error('API owner bookings error:', error);
        return res.status(500).json({ message: 'Error fetching owner bookings.' });
    }
});

// POST /api/owner/bookings/:id/confirm
router.post('/owner/bookings/:id/confirm', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = (req.user._id || req.user.id).toString();

        const booking = await Booking.findById(id).populate('vehicleId');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (!booking.vehicleId || booking.vehicleId.ownerId.toString() !== ownerId) {
            return res.status(403).json({ message: 'Access denied. You do not own this vehicle.' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'Booking is already processed.' });
        }

        // Late approval check: If rental period has already completely passed without approval
        if (hasEnded(booking.endDate)) {
            booking.status = 'expired';
            await booking.save();
            return res.status(400).json({
                message: 'This booking has expired and can no longer be approved.',
                booking
            });
        }

        booking.approvedAt = new Date();
        // Transitions to ongoing if rental starts today or past, or confirmed if in future
        booking.status = getBookingLifecycleStatus({ ...booking.toObject(), status: 'confirmed' });
        await booking.save();

        return res.json({
            message: booking.status === 'ongoing'
                ? 'Booking approved and rental is now ongoing.'
                : 'Booking confirmed successfully.',
            booking
        });
    } catch (error) {
        console.error('API confirm booking error:', error);
        return res.status(500).json({ message: 'Error confirming booking.' });
    }
});

// POST /api/owner/bookings/:id/reject
router.post('/owner/bookings/:id/reject', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = (req.user._id || req.user.id).toString();

        const booking = await Booking.findById(id).populate('vehicleId');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (!booking.vehicleId || booking.vehicleId.ownerId.toString() !== ownerId) {
            return res.status(403).json({ message: 'Access denied. You do not own this vehicle.' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'Booking is already processed.' });
        }

        if (hasEnded(booking.endDate)) {
            booking.status = 'expired';
            await booking.save();
            return res.status(400).json({
                message: 'This booking has expired and can no longer be rejected.',
                booking
            });
        }

        booking.status = 'rejected';
        await booking.save();

        return res.json({ message: 'Booking rejected successfully.', booking });
    } catch (error) {
        console.error('API reject booking error:', error);
        return res.status(500).json({ message: 'Error rejecting booking.' });
    }
});

// GET /api/owner/complaints
router.get('/owner/complaints', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const ownerId = req.user._id || req.user.id;

        const complaints = await Complaint.find({ ownerId })
            .populate('customerId', 'name email phone')
            .populate('vehicleId', 'vehicleNumber brand model type image')
            .populate('bookingId', 'startDate endDate totalAmount status')
            .sort({ createdAt: -1 });

        return res.json({ complaints });
    } catch (error) {
        console.error('API owner complaints error:', error);
        return res.status(500).json({ message: 'Error fetching complaints.' });
    }
});

// POST /api/owner/complaints/:id/reply
router.post('/owner/complaints/:id/reply', isApiLoggedIn, isApiOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = (req.user._id || req.user.id).toString();
        const { ownerReply } = req.body;

        if (!ownerReply || !ownerReply.trim()) {
            return res.status(400).json({ message: 'Reply message is required.' });
        }

        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found.' });
        }

        // Verify that the logged-in owner is the actual owner of this complaint's vehicle
        if (complaint.ownerId.toString() !== ownerId) {
            return res.status(403).json({ message: 'Access denied. You can only resolve complaints for your own vehicles.' });
        }

        complaint.ownerReply = ownerReply.trim();
        complaint.status = 'resolved';
        complaint.resolvedAt = new Date();

        await complaint.save();
        return res.json({ message: 'Reply submitted and complaint marked resolved.', complaint });
    } catch (error) {
        console.error('API owner reply error:', error);
        return res.status(500).json({ message: 'Error replying to complaint.' });
    }
});

// =========================================================================
// 7. ADMIN ENDPOINTS
// =========================================================================

// GET /api/admin/dashboard
router.get('/admin/dashboard', isApiLoggedIn, isApiAdmin, async (req, res) => {
    try {
        const owners = await User.find({ role: 'owner' }).select('-password');
        const vehicles = await Vehicle.find().populate('ownerId', 'name email phone').sort({ createdAt: -1 });
        const pendingVehicles = await Vehicle.find({ approvalStatus: 'pending' })
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });

        return res.json({
            stats: {
                totalOwners: owners.length,
                totalVehicles: vehicles.length,
                pendingVehiclesCount: pendingVehicles.length
            },
            pendingVehicles,
            owners
        });
    } catch (error) {
        console.error('API admin dashboard error:', error);
        return res.status(500).json({ message: 'Error fetching admin dashboard.' });
    }
});

// POST /api/admin/vehicles/:id/approve
router.post('/admin/vehicles/:id/approve', isApiLoggedIn, isApiAdmin, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        vehicle.approvalStatus = 'approved';
        vehicle.rejectionReason = '';
        await vehicle.save();

        return res.json({ message: 'Vehicle approved successfully.', vehicle });
    } catch (error) {
        console.error('API approve vehicle error:', error);
        return res.status(500).json({ message: 'Error approving vehicle.' });
    }
});

// POST /api/admin/vehicles/:id/reject
router.post('/admin/vehicles/:id/reject', isApiLoggedIn, isApiAdmin, async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found.' });
        }

        vehicle.approvalStatus = 'rejected';
        vehicle.rejectionReason = rejectionReason?.trim() || 'Vehicle rejected by admin.';
        await vehicle.save();

        return res.json({ message: 'Vehicle rejected.', vehicle });
    } catch (error) {
        console.error('API reject vehicle error:', error);
        return res.status(500).json({ message: 'Error rejecting vehicle.' });
    }
});

// GET /api/admin/owners/:ownerId/vehicles
router.get('/admin/owners/:ownerId/vehicles', isApiLoggedIn, isApiAdmin, async (req, res) => {
    try {
        const { ownerId } = req.params;
        const owner = await User.findOne({ _id: ownerId, role: 'owner' }).select('-password');
        if (!owner) {
            return res.status(404).json({ message: 'Owner not found.' });
        }

        const vehicles = await Vehicle.find({ ownerId }).sort({ createdAt: -1 });
        return res.json({ owner, vehicles });
    } catch (error) {
        console.error('API admin owner vehicles error:', error);
        return res.status(500).json({ message: 'Error fetching owner vehicles.' });
    }
});

// GET /api/admin/complaints
router.get('/admin/complaints', isApiLoggedIn, isApiAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('customerId', 'name email phone')
            .populate('ownerId', 'name email phone')
            .populate('vehicleId', 'vehicleNumber brand model type image')
            .populate('bookingId', 'startDate endDate totalAmount status')
            .sort({ createdAt: -1 });

        return res.json({ complaints });
    } catch (error) {
        console.error('API admin complaints error:', error);
        return res.status(500).json({ message: 'Error fetching complaints.' });
    }
});

// POST /api/admin/complaints/:id/respond
router.post('/admin/complaints/:id/respond', isApiLoggedIn, isApiAdmin, async (req, res) => {
    // Admin has a monitoring/oversight role only; resolving complaints is restricted to the vehicle owner.
    return res.status(403).json({
        message: 'Access denied. Admin cannot resolve complaints. Only the vehicle owner can resolve complaints.'
    });
});

module.exports = router;
