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

        const vehicleId = req.params.vehicleId;
        const bookingId = req.query.bookingId;

        const customerId = req.user._id || req.user.id;


        // ------------------------------------------------
        // Booking ID is required
        // ------------------------------------------------

        if (!bookingId) {

            return res.status(400).send(
                'Booking ID is required.'
            );

        }


        // ------------------------------------------------
        // Check completed booking
        // ------------------------------------------------

        const booking = await Booking.findOne({

            _id: bookingId,

            userId: customerId,

            vehicleId: vehicleId,

            status: 'completed'

        });


        if (!booking) {

            return res.status(403).send(
                'Complaint can only be submitted for a completed booking.'
            );

        }


        // ------------------------------------------------
        // Prevent duplicate complaint
        // ------------------------------------------------

        const existingComplaint = await Complaint.findOne({

            bookingId: booking._id

        });


        if (existingComplaint) {

            return res.status(400).send(
                'You have already submitted a complaint for this booking.'
            );

        }


        // ------------------------------------------------
        // Find vehicle
        // ------------------------------------------------

        const vehicle = await Vehicle.findById(vehicleId)
            .populate(
                'ownerId',
                'name email phone'
            );


        if (!vehicle) {

            return res.status(404).send(
                'Vehicle not found'
            );

        }


        // ------------------------------------------------
        // Render complaint page
        // ------------------------------------------------

        res.render('service/complaint', {

            user: req.user,

            vehicle,

            booking,

            error: null

        });


    } catch (error) {

        console.error(
            'Error showing complaint form:',
            error
        );

        res.status(500).send(
            'Server Error'
        );

    }
};



// ======================================================
// SUBMIT COMPLAINT
// ======================================================

exports.submitComplaint = async (req, res) => {
    try {

        const vehicleId = req.params.vehicleId;

        const bookingId = req.query.bookingId;

        const {
            subject,
            message
        } = req.body;


        const customerId =
            req.user._id || req.user.id;


        // ------------------------------------------------
        // Validate booking ID
        // ------------------------------------------------

        if (!bookingId) {

            return res.status(400).send(
                'Booking ID is required.'
            );

        }


        // ------------------------------------------------
        // Validate complaint fields
        // ------------------------------------------------

        if (
            !subject ||
            !subject.trim() ||
            !message ||
            !message.trim()
        ) {

            return res.status(400).send(
                'Subject and message are required.'
            );

        }


        // ------------------------------------------------
        // Verify completed booking
        // ------------------------------------------------

        const booking = await Booking.findOne({

            _id: bookingId,

            userId: customerId,

            vehicleId: vehicleId,

            status: 'completed'

        });


        if (!booking) {

            return res.status(403).send(
                'Complaint can only be submitted for a completed booking.'
            );

        }


        // ------------------------------------------------
        // Prevent duplicate complaint
        // ------------------------------------------------

        const existingComplaint =
            await Complaint.findOne({

                bookingId: booking._id

            });


        if (existingComplaint) {

            return res.status(400).send(
                'You have already submitted a complaint for this booking.'
            );

        }


        // ------------------------------------------------
        // Find vehicle
        // ------------------------------------------------

        const vehicle =
            await Vehicle.findById(vehicleId);


        if (!vehicle) {

            return res.status(404).send(
                'Vehicle not found'
            );

        }


        // ------------------------------------------------
        // Owner comes from vehicle
        // ------------------------------------------------

        const ownerId = vehicle.ownerId;


        // ------------------------------------------------
        // Create complaint
        // ------------------------------------------------

        const complaint = new Complaint({

            customerId: customerId,

            bookingId: booking._id,

            vehicleId: vehicle._id,

            ownerId: ownerId,

            subject: subject.trim(),

            message: message.trim(),

            status: 'pending'

        });


        await complaint.save();


        // ------------------------------------------------
        // Redirect to customer's complaints
        // ------------------------------------------------

        res.redirect('/complaints');


    } catch (error) {

        console.error(
            'Error submitting complaint:',
            error
        );

        res.status(500).send(
            'Server Error'
        );

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

// module.exports = {
//     getAdminComplaints,
//     respondToComplaint,
//     showComplaintForm,
//     submitComplaint,
//     showMyComplaints,
//     getOwnerComplaints
// };