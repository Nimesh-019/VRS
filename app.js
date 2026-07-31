const express = require('express');
const path = require('path');
const { userRouter } = require('./routes/userrouters');
const { hostRouter } = require('./routes/hostRouter');
const rootDir = require('./utils/pathutils');
// Logger middleware



const app = express();

console.log(userRouter);
console.log(hostRouter);

// app.set('view engine', 'ejs');
// app.set('views','views');
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    // console.log("App file loaded");
    console.log(req.url, req.method);
    next();
});
app.use(express.static(path.join(rootDir, 'public')));

app.use(userRouter);

app.use("/host", hostRouter);

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(rootDir, 'views/404.html'));
});

const port = 3000;
app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`);
});