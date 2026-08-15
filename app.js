require('dotenv').config();
const express=require('express');
const rootDir=require('./utils/pathutils');
const path=require('path');

const session = require('express-session');



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

// Session middleware - MUST be before route handlers
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Routes
app.use('/', userRouter);
app.use('/', vehicleRouter);

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});