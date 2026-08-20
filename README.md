# Vehicle Rental System (VRS)

A web-based **Vehicle Rental System** built using **Node.js, Express.js, EJS, and MongoDB**.

The system allows users to browse and book vehicles, while vehicle owners can manage their vehicles and bookings.

## Technologies Used

* Node.js
* Express.js
* EJS
* MongoDB
* Mongoose
* JavaScript
* HTML
* CSS
* JWT / Session Authentication

## Prerequisites

Before running this project, make sure you have installed:

* **Node.js**
* **npm**
* **MongoDB**

You can verify Node.js and npm installation using:

```bash
node -v
npm -v
```

## Project Setup

### 1. Clone or Download the Project

Download or clone this project to your computer.

Then open the project folder in VS Code or another code editor.

### 2. Install Dependencies

Open a terminal inside the project directory and run:

```bash
npm install
```

If Express and EJS have not been installed, install them using:

```bash
npm install express ejs
```

If MongoDB/Mongoose and other dependencies are required by the project:

```bash
npm install mongoose dotenv jsonwebtoken bcrypt cookie-parser express-session
```

## Environment Variables

Create a `.env` file in the **root directory of the project**, at the same level as folders such as `controllers`, `models`, `routes`, `views`, etc.

Example:

```text
project-folder/
│
├── controllers/
├── models/
├── routes/
├── views/
├── public/
├── middleware/
├── app.js
├── package.json
├── package-lock.json
└── .env
```

### `.env` File

Add the following content to `.env`:

```env
MONGO_URI=YOU_MONGO_URI
SECRET_KEY="YOR_SECRET_KEY"
```

Replace `YOU_MONGO_URI` with your actual MongoDB connection string.

For example:

```env
MONGO_URI=mongodb://127.0.0.1:27017/vrs
SECRET_KEY="MY_SECRET_KEY_123"
```

If you are using MongoDB Atlas, use your Atlas connection string instead.

**Do not upload or push the `.env` file to GitHub.**

Add this to `.gitignore`:

```text
.env
node_modules/
```

## MongoDB

The project uses MongoDB as its database.

Make sure MongoDB is running before starting the application.

The application reads the MongoDB connection string from:

```env
MONGO_URI=YOU_MONGO_URI
```

The database name used by the project can be specified in the MongoDB URI.

Example:

```env
MONGO_URI=mongodb://127.0.0.1:27017/vrs
```

Here:

```text
vrs
```

is the database name.

## Running the Project

Start the application using:

```bash
node app.js
```

If the project uses Nodemon, you can run:

```bash
npx nodemon app.js
```

After the server starts, open:

```text
http://localhost:3000
```

## Environment Variable Usage

The project loads environment variables using `dotenv`.

Example:

```javascript
require('dotenv').config();
```

MongoDB can then be connected using:

```javascript
mongoose.connect(process.env.MONGO_URI);
```

The secret key can be accessed using:

```javascript
process.env.SECRET_KEY
```

## Main Project Structure

```text
VRS/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── views/
│   ├── owner/
│   ├── user/
│   └── services/
│
├── public/
│   ├── css/
│   ├── js/
│   └── images/
│
├── .env
├── .gitignore
├── app.js
├── package.json
└── package-lock.json
```

## Important

Make sure the `.env` file is located in the **same root directory as `app.js` and `package.json`**.

Correct:

```text
VRS/
├── .env
├── app.js
├── package.json
├── controllers/
├── models/
├── routes/
└── views/
```

Incorrect:

```text
VRS/
├── controllers/
├── models/
├── routes/
└── views/
    └── .env
```

## Security

Never share your real:

```env
MONGO_URI
SECRET_KEY
```

publicly.

Do not commit `.env` to Git:

```bash
git add .
git commit -m "Initial project"
```

The `.gitignore` file should contain:

```text
.env
node_modules/
```

## Author

**Vehicle Rental System (VRS)**

Built using Node.js, Express.js, EJS, and MongoDB.
