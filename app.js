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

const userRouter=require('./routes/userRouter');
const vehicleRouter=require('./routes/vehicleRoutes');
const connectDB=require('./config/db');

connectDB();
const app = express();
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

// Routes
app.use('/', userRouter);
app.use('/', vehicleRouter);
app.use('/', bookingRouter);
app.use('/owner', ownerRoutes);
app.use('/admin', adminRouter);
app.use('/', complaintRouter);

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});