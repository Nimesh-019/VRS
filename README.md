# 🚗 Vehicle Rental System (VRS)

A full-stack **Vehicle Rental System** built with **Node.js, Express.js, MongoDB, EJS, and Cloudinary**.

The system provides separate functionality for **Customers, Vehicle Owners, and Administrators**. Customers can browse and book vehicles, owners can manage their vehicles and rental requests, and administrators can manage vehicle approvals and customer complaints.

---

## 📌 Features

### 👤 Customer

- User registration and login
- JWT-based authentication
- Browse available vehicles
- Filter vehicles by relevant details such as city and vehicle type
- View vehicle details
- Book vehicles for a selected date range
- Prevent overlapping bookings for the same vehicle
- View personal bookings
- View booking status
- Cancel eligible bookings
- Make online payments
- Submit complaints regarding vehicles/owners
- View submitted complaints and their responses

### 🚘 Vehicle Owner

- Owner registration and login
- Add vehicles for rental
- Upload vehicle images
- Store images using Cloudinary
- Edit vehicle information
- Delete vehicles
- View rental history
- View customer booking requests
- Confirm or reject booking requests
- Manage vehicles listed by the owner

### 🛡️ Administrator

- Dedicated administrator account
- View registered vehicle owners
- View vehicles listed by owners
- Approve vehicles before they become available for customers
- View customer complaints
- Respond to complaints
- Communicate complaint-related information to vehicle owners

> The administrator account is created separately and is not available through normal user registration.

---

# 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **Node.js** | Backend runtime |
| **Express.js** | Web application framework |
| **MongoDB** | Database |
| **Mongoose** | MongoDB ODM |
| **EJS** | Server-side frontend rendering |
| **JavaScript** | Application logic |
| **HTML5** | Page structure |
| **CSS3** | Styling |
| **JWT** | Authentication |
| **Cookie Parser** | Cookie handling |
| **Cloudinary** | Vehicle image storage |
| **Multer** | File/image upload handling |
| **dotenv** | Environment variable management |
| **Razorpay / Payment Gateway** | Online payment processing |

---

# 🏗️ System Architecture

The project follows an **MVC-based architecture**.

```text
                    ┌─────────────────────┐
                    │       Client        │
                    │      Browser        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Express.js     │
                    │       Routes        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Controllers      │
                    │   Business Logic    │
                    └───────┬─────┬───────┘
                            │     │
                 ┌──────────┘     └──────────┐
                 ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │     MongoDB     │         │    Cloudinary   │
        │    Database     │         │ Vehicle Images  │
        └─────────────────┘         └─────────────────┘
```

---

# 📂 Project Structure

```text
VRS/
│
├── config/
│   ├── db.js
│   └── cloudinary.js
│
├── controllers/
│   ├── userController.js
│   ├── vehicleController.js
│   ├── bookingController.js
│   ├── complaintController.js
│   └── adminController.js
│
├── middleware/
│   ├── auth.js
│   └── ...
│
├── models/
│   ├── user.js
│   ├── vehicle.js
│   ├── Booking.js
│   └── Complaint.js
│
├── routes/
│   ├── userRoutes.js
│   ├── vehicleRoutes.js
│   ├── bookingRoutes.js
│   ├── complaintRoutes.js
│   └── adminRoutes.js
│
├── views/
│   ├── admin/
│   ├── owner/
│   ├── user/
│   ├── services/
│   └── ...
│
├── public/
│   ├── css/
│   ├── js/
│   └── images/
│
├── scripts/
│   ├── createAdmin.js
│   └── ...
│
├── .env
├── .gitignore
├── app.js
├── package.json
└── package-lock.json
```

---

# 🗄️ Database Models

## User

Stores customers, vehicle owners, and administrator information.

```text
User
├── name
├── email
├── phone
├── password
├── city
└── role
```

Roles include:

```text
admin
owner
user
```

---

## Vehicle

Stores vehicles listed by vehicle owners.

```text
Vehicle
├── ownerId
├── vehicleNumber
├── brand
├── model
├── type
├── city
├── pricePerDay
├── description
├── image
├── availability
└── approval/status information
```

Vehicle images are stored using Cloudinary.

---

## Booking

Stores vehicle rental requests.

```text
Booking
├── userId
├── vehicleId
├── startDate
├── endDate
├── totalAmount
├── status
└── paymentStatus
```

Current booking states are based around:

```text
Pending
Confirmed
Rejected / Cancelled
```

The system does **not** automatically use a `completed` booking state as part of the current booking flow.

---

## Complaint

Stores complaints submitted by customers.

```text
Complaint
├── userId
├── vehicleId
├── ownerId
├── complaint
├── response
└── status
```

The administrator can review complaints and respond to them.

---

# 📅 Booking System

The booking system supports rental periods using:

```text
Start Date
     ↓
End Date
```

The system checks whether another booking already occupies the requested rental period.

For example:

```text
Existing Booking
3 Oct ───────── 5 Oct

New Request
4 Oct ───────── 6 Oct
```

The new booking overlaps with the existing booking and therefore cannot be processed for the same vehicle.

The system is designed to prevent conflicting bookings for the same vehicle.

---

# ⏰ Expired Bookings

Bookings are also handled according to their rental dates.

For example:

```text
Booking:
3 Oct → 3 Oct
```

When the rental date has passed, the booking should be displayed as expired when viewed later.

For example, when the owner or customer checks the booking on:

```text
4 Oct
```

the 3 Oct rental should appear as expired rather than as an active upcoming rental.

---

# 💳 Payment System

The project includes online payment functionality for vehicle bookings.

The payment flow is approximately:

```text
Customer
   │
   ▼
Select Vehicle
   │
   ▼
Select Rental Dates
   │
   ▼
Create Booking
   │
   ▼
Payment
   │
   ▼
Payment Gateway
   │
   ▼
Payment Result
   │
   ▼
Booking Payment Status Updated
```

Payment-related configuration is stored in environment variables and should never be exposed publicly.

---

# ☁️ Cloudinary

Vehicle images are uploaded to **Cloudinary** instead of being permanently stored inside the project.

### Image Flow

```text
Vehicle Owner
      │
      ▼
Upload Vehicle Image
      │
      ▼
Multer / Express
      │
      ▼
Cloudinary
      │
      ▼
Cloudinary Image URL
      │
      ▼
MongoDB
      │
      ▼
Vehicle Image Displayed
```

Required Cloudinary environment variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# 🔐 Authentication

Authentication is implemented using JWT and cookies.

General flow:

```text
Login
  ↓
Credentials Verified
  ↓
JWT Generated
  ↓
JWT Stored in Cookie
  ↓
Authentication Middleware
  ↓
Protected Route
```

Protected functionality includes customer, owner, and administrator operations.

---

# ⚙️ Prerequisites

Before running the project, install:

- Node.js
- npm
- MongoDB

Check Node.js and npm:

```bash
node -v
npm -v
```

Check MongoDB installation according to your operating system.

---

# 🚀 Installation

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
```

Move into the project directory:

```bash
cd VRS
```

---

### 2. Install dependencies

```bash
npm install
```

If required dependencies have not been installed:

```bash
npm install express mongoose ejs dotenv jsonwebtoken bcryptjs cookie-parser multer cloudinary
```

---

# 🔑 Environment Variables

Create a `.env` file in the **root directory**, alongside `app.js` and `package.json`.

Example:

```env
MONGO_URI=mongodb://127.0.0.1:27017/vrs

SECRET_KEY=YOUR_SECRET_KEY

CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# Payment Gateway Configuration
PAYMENT_KEY=YOUR_PAYMENT_KEY
PAYMENT_SECRET=YOUR_PAYMENT_SECRET
```

Use the exact environment variable names required by the current payment implementation in your project.

### Correct location

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

Do **not** put `.env` inside `views`, `controllers`, `models`, or any other subdirectory.

---

# 🗄️ MongoDB Configuration

For a local MongoDB installation:

```env
MONGO_URI=mongodb://127.0.0.1:27017/vrs
```

Here:

```text
127.0.0.1 → Local MongoDB server
27017     → MongoDB default port
vrs       → Database name
```

Make sure MongoDB is running before starting the application.

---

# 👑 Creating the Admin Account

The administrator is not created through the normal registration page.

The project contains an administrator creation script.

Run:

```bash
node scripts/createAdmin.js
```

The script creates the default administrator account in MongoDB.

Make sure:

1. MongoDB is running.
2. `.env` is correctly configured.
3. Required dependencies are installed.
4. The User model contains the required fields.

---

# ▶️ Running the Application

Start the server:

```bash
node app.js
```

If Nodemon is configured:

```bash
npx nodemon app.js
```

Then open:

```text
http://localhost:3000
```

---

# 🔄 Main User Flow

## Customer

```text
Register / Login
       ↓
Browse Vehicles
       ↓
Filter / Select Vehicle
       ↓
View Vehicle Details
       ↓
Select Rental Dates
       ↓
Check Availability
       ↓
Book Vehicle
       ↓
Payment
       ↓
View Booking
```

---

## Vehicle Owner

```text
Register / Login
       ↓
Add Vehicle
       ↓
Upload Image
       ↓
Admin Approval
       ↓
Vehicle Listed
       ↓
Receive Booking Request
       ↓
Confirm / Reject
       ↓
View Rental History
```

---

## Administrator

```text
Admin Login
     ↓
Admin Dashboard
     ├── Manage Vehicle Owners
     ├── View Vehicles
     ├── Approve Vehicles
     └── Manage Complaints
              ↓
        Respond to Customer
              ↓
        Owner Communication
```

---

# 🛡️ Vehicle Approval Flow

When an owner adds a vehicle, it does not immediately become available to customers.

```text
Owner Adds Vehicle
        ↓
Vehicle Pending Approval
        ↓
Admin Reviews Vehicle
        ↓
       ┌───────────────┐
       │               │
    Approve         Reject
       │               │
       ▼               ▼
Listed for         Not Listed
Rental
```

This allows the administrator to control which vehicles are displayed to customers.

---

# 📋 Booking Information

### Customer's My Bookings

The booking list focuses on relevant booking information rather than displaying unnecessary vehicle images.

Information can include:

```text
Vehicle Name / Model
Owner Name
Payment Information
Booking Dates
Booking Status
Available User Actions
```

### Owner's Rental History

The owner's rental history similarly focuses on rental/booking information rather than displaying vehicle images repeatedly.

---

# 🔒 Security

Never commit sensitive credentials to GitHub.

Your `.gitignore` should contain:

```gitignore
.env
node_modules/
```

Never expose:

```text
MongoDB credentials
JWT secret
Cloudinary API secret
Payment gateway secret
```

Do not upload `.env`:

```bash
git add .
```

is safe only when `.env` is properly listed in `.gitignore`.

---

# 🧪 Testing

The project includes testing for important booking scenarios such as concurrent booking attempts.

Example scenario:

```text
User A ──► Requests Vehicle ──► Booking
                                │
User B ──► Requests Same Vehicle
                                │
                                ▼
                     Availability Check
                                │
                         Conflict Detected
                                │
                                ▼
                     Booking Rejected
```

This helps prevent two users from successfully booking the same vehicle for overlapping rental periods.

---

# 📌 Important Notes

- MongoDB must be running before starting the application.
- `.env` must be located in the project root.
- Cloudinary credentials are required for vehicle image uploads.
- Payment credentials must be configured for online payments.
- Vehicles may require administrator approval before being visible to customers.
- Rental dates are checked to prevent overlapping bookings.
- Sensitive credentials must never be committed to GitHub.

---

# 🔮 Future Improvements

Possible future enhancements include:

- Improved admin dashboard
- Advanced booking calendar
- Better payment transaction tracking
- Email/SMS notifications
- Vehicle ratings and reviews
- Location/map integration
- Advanced analytics for owners and administrators
- Improved responsive UI
- Automated booking notifications
- Enhanced payment reconciliation

---

# 👨‍💻 Project

**Vehicle Rental System (VRS)**

A web-based vehicle rental platform developed using:

```text
Node.js
Express.js
MongoDB
Mongoose
EJS
JavaScript
Cloudinary
JWT
```

The project demonstrates authentication, role-based access, vehicle management, booking management, date-conflict handling, complaints, administrator approval, image management, and online payment integration.
