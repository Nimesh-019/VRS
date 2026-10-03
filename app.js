require('dotenv').config();
const express=require('express');
const rootDir=require('./utils/pathutils');
const path=require('path');
const cookieParser = require('cookie-parser');
const bookingRouter = require('./routes/bookingRouter');
const ownerRoutes = require('./routes/ownerRouter');
const session = require('express-session');
const adminRouter = require('./routes/adminRouter');
const complaintRouter = require('./routes/complaintRouter');

const paymentRouter = require('./routes/paymentRouter');
const apiRouter = require('./routes/apiRouter');

const userRouter=require('./routes/userRouter');
const vehicleRouter=require('./routes/vehicleRoutes');
const connectDB=require('./config/db');
const { syncAllActiveBookings } = require('./utils/bookingLifecycle');

connectDB();

// Initial sync of active bookings on startup
syncAllActiveBookings().then(count => {
    if (count > 0) console.log(`[Lifecycle] Initial startup sync updated ${count} bookings.`);
}).catch(err => console.error('[Lifecycle] Startup sync error:', err));

// Periodic lightweight sync every 2 minutes
setInterval(() => {
    syncAllActiveBookings().catch(err => console.error('[Lifecycle] Interval sync error:', err));
}, 2 * 60 * 1000);

const app = express();

// CORS middleware to allow React frontend requests with credentials
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    }
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.static(path.join(rootDir, 'public')));
app.set('view engine','ejs');
app.set('views',path.join(rootDir,'views'));


// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Session middleware - MUST be before route handlers
app.use(session({
    secret: process.env.SESSION_SECRET || 'MYKEY123KEY',
    resave: false,
    saveUninitialized: false
}));

// API Routes for React Frontend
app.use('/api', apiRouter);

// Routes
app.use('/', userRouter);
app.use('/', vehicleRouter);
app.use('/', bookingRouter);
app.use('/owner', ownerRoutes);
app.use('/admin', adminRouter);
app.use('/', complaintRouter);
app.use('/payment', paymentRouter);
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
const port2 = 5000;
app.listen(port2, () => {
    console.log(`Server is running on http://localhost:${port2}`);
});