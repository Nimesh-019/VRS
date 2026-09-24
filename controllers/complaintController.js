const Complaint = require('../models/Complaint');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');



// ======================================================
// SHOW ALL COMPLAINTS FOR ADMIN
// ======================================================

exports.getAdminComplaints = async (req, res) => {
    try {

        const complaints = await Complaint.find()
            .populate(
                'customerId',
                'name email phone'
            )
            .populate(
                'ownerId',
                'name email phone'
            )
            .populate(
                'vehicleId',
                'vehicleNumber brand model type image'
            )
            .populate(
                'bookingId',
                'startDate endDate totalAmount status'
            )
            .sort({
                createdAt: -1
            });

        res.render('admin/complaints', {
            user: req.user,
            complaints
        });

    } catch (error) {

        console.error(
            'Error fetching admin complaints:',
            error
        );

        res.status(500).send(
            'Server Error'
        );
    }
};



// ======================================================
// ADMIN RESPONDS TO COMPLAINT
// ======================================================

exports.respondToComplaint = async (req, res) => {
    try {

        const complaintId = req.params.id;

        const { adminReply } = req.body;


        // ------------------------------------------------
        // Validate response
        // ------------------------------------------------

        if (
            !adminReply ||
            !adminReply.trim()
        ) {

            return res.status(400).send(
                'Admin response is required.'
            );
        }


        // ------------------------------------------------
        // Find complaint
        // ------------------------------------------------

        const complaint =
            await Complaint.findById(complaintId);


        if (!complaint) {

            return res.status(404).send(
                'Complaint not found'
            );
        }


        // ------------------------------------------------
        // Save admin response
        // ------------------------------------------------

        complaint.adminReply =
            adminReply.trim();

        complaint.status = 'resolved';

        complaint.resolvedAt = new Date();


        await complaint.save();


        // ------------------------------------------------
        // Return to admin complaints
        // ------------------------------------------------

        res.redirect('/admin/complaints');


    } catch (error) {

        console.error(
            'Error responding to complaint:',
            error
        );

        res.status(500).send(
            'Server Error'
        );
    }
};

// ======================================================
// SHOW COMPLAINT FORM
// ======================================================

exports.showComplaintForm = async (req, res) => {
    try {
        const customerId = req.user._id || req.user.id;
        const bookingId = req.query.bookingId;
        const vehicleId = req.params.vehicleId;

        // Fetch all bookings for this customer
        const bookings = await Booking.find({ userId: customerId })
            .populate('vehicleId')
            .sort({ createdAt: -1 });

        let selectedBooking = null;
        let vehicle = null;

        if (bookingId) {
            selectedBooking = await Booking.findOne({
                _id: bookingId,
                userId: customerId
            }).populate('vehicleId');
        } else if (vehicleId) {
            selectedBooking = await Booking.findOne({
                vehicleId: vehicleId,
                userId: customerId
            }).populate('vehicleId');
        } else if (bookings.length > 0) {
            selectedBooking = bookings[0];
        }

        if (selectedBooking && selectedBooking.vehicleId) {
            vehicle = selectedBooking.vehicleId;
        }

        res.render('service/complaint', {
            user: req.user,
            bookings,
            booking: selectedBooking,
            vehicle: vehicle,
            error: null
        });

    } catch (error) {
        console.error('Error showing complaint form:', error);
        res.status(500).send('Server Error');
    }
};



// ======================================================
// SUBMIT COMPLAINT
// ======================================================

exports.submitComplaint = async (req, res) => {
    try {
        const { subject, message, bookingId: bodyBookingId } = req.body;
        const queryBookingId = req.query.bookingId;
        const bookingId = bodyBookingId || queryBookingId;
        const customerId = req.user._id || req.user.id;

        if (!bookingId) {
            return res.status(400).send('Booking ID is required.');
        }

        if (!subject || !subject.trim() || !message || !message.trim()) {
            return res.status(400).send('Subject and message are required.');
        }

        // Find customer's booking regardless of status
        const booking = await Booking.findOne({
            _id: bookingId,
            userId: customerId
        }).populate('vehicleId');

        if (!booking) {
            return res.status(404).send('Booking not found.');
        }

        const vehicle = booking.vehicleId;

        if (!vehicle) {
            return res.status(404).send('Associated vehicle not found.');
        }

        const existingComplaint = await Complaint.findOne({
            bookingId: booking._id
        });

        if (existingComplaint) {
            return res.status(400).send('You have already submitted a complaint for this booking.');
        }

        const complaint = new Complaint({
            customerId: customerId,
            bookingId: booking._id,
            vehicleId: vehicle._id,
            ownerId: vehicle.ownerId,
            subject: subject.trim(),
            message: message.trim(),
            status: 'pending'
        });

        await complaint.save();
        res.redirect('/complaints');

    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).send('Server Error');
    }
};



// ======================================================
// SHOW CUSTOMER'S COMPLAINTS
// ======================================================

exports.showMyComplaints = async (req, res) => {
    try {

        const customerId =
            req.user._id || req.user.id;


        const complaints =
            await Complaint.find({

                customerId: customerId

            })
            .populate(
                'vehicleId',
                'vehicleNumber brand model type image'
            )
            .populate(
                'ownerId',
                'name email phone'
            )
            .populate(
                'bookingId',
                'startDate endDate totalAmount status'
            )
            .sort({
                createdAt: -1
            });


        res.render(
            'service/complaints',
            {
                user: req.user,
                complaints
            }
        );


    } catch (error) {

        console.error(
            'Error fetching complaints:',
            error
        );

        res.status(500).send(
            'Server Error'
        );

    }
};

// ======================================================
// SHOW OWNER COMPLAINTS
// ======================================================

exports.getOwnerComplaints = async (req, res) => {
    try {

        const ownerId = req.user._id || req.user.id;

        const complaints = await Complaint.find({
            ownerId: ownerId
        })
            .populate(
                'customerId',
                'name email phone'
            )
            .populate(
                'vehicleId',
                'vehicleNumber brand model type image'
            )
            .populate(
                'bookingId',
                'startDate endDate totalAmount status'
            )
            .sort({
                createdAt: -1
            });


        res.render('owner/complaints', {
            user: req.user,
            complaints
        });


    } catch (error) {

        console.error(
            'Error fetching owner complaints:',
            error
        );

        res.status(500).send(
            'Server Error'
        );

    }
};

// ======================================================
// OWNER RESPONDS TO COMPLAINT DIRECTLY
// ======================================================

exports.ownerRespondToComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const ownerId = req.user._id || req.user.id;
        const { ownerReply } = req.body;

        if (!ownerReply || !ownerReply.trim()) {
            return res.status(400).send('Response message is required.');
        }

        const complaint = await Complaint.findOne({
            _id: complaintId,
            ownerId: ownerId
        });

        if (!complaint) {
            return res.status(404).send('Complaint not found.');
        }

        complaint.ownerReply = ownerReply.trim();
        complaint.adminReply = ownerReply.trim(); // Sync with adminReply for compatibility
        complaint.status = 'resolved';
        complaint.resolvedAt = new Date();

        await complaint.save();

        res.redirect('/owner/complaints');

    } catch (error) {
        console.error('Error responding to complaint:', error);
        res.status(500).send('Server Error');
    }
};