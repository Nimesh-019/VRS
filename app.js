const express = require('express');
const path = require('path');

const { userRouter } = require('./routes/userrouters');

const vehicleRouter = require('./modules/vehicle/vehicleRouter');

const rootDir = require('./utils/pathutils');


const app = express();


// ==========================================
// EJS CONFIGURATION
// ==========================================

app.set('view engine', 'ejs');

app.set(
    'views',
    path.join(rootDir, 'views')
);


// ==========================================
// MIDDLEWARE
// ==========================================

// Read form data
app.use(express.urlencoded({
    extended: true
}));


// Logger middleware
app.use((req, res, next) => {

    console.log(req.url, req.method);

    next();

});


// Static files
app.use(
    express.static(
        path.join(rootDir, 'public')
    )
);


// ==========================================
// ROUTES
// ==========================================

// Home
app.use(userRouter);


// Vehicle Module
app.use(
    '/vehicles',
    vehicleRouter
);


// ==========================================
// 404
// ==========================================

app.use((req, res) => {

    res.status(404).render('404');

});


// ==========================================
// SERVER
// ==========================================

const port = 3000;

app.listen(port, () => {

    console.log(
        `Server is running on http://localhost:${port}`
    );

});