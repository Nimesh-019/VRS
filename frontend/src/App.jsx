import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerDashboard from './pages/CustomerDashboard';
import VehicleDetails from './pages/VehicleDetails';
import Bookings from './pages/Bookings';
import ComplaintForm from './pages/ComplaintForm';
import CustomerComplaints from './pages/CustomerComplaints';
import OwnerDashboard from './pages/OwnerDashboard';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import OwnerBookings from './pages/OwnerBookings';
import OwnerComplaints from './pages/OwnerComplaints';
import AdminDashboard from './pages/AdminDashboard';
import AdminOwnerVehicles from './pages/AdminOwnerVehicles';
import AdminComplaints from './pages/AdminComplaints';

// Default Index redirector based on user session role
const HomeRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) return <Loading message="Loading VRS..." />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <main style={{ flex: 1 }}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<HomeRedirect />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />

                            {/* Customer (User) Protected Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                                <Route path="/user/dashboard" element={<CustomerDashboard />} />
                                <Route path="/dashboard" element={<CustomerDashboard />} />
                                <Route path="/book/:vehicleId" element={<VehicleDetails />} />
                                <Route path="/vehicles/:vehicleId" element={<VehicleDetails />} />
                                <Route path="/bookings" element={<Bookings />} />
                                <Route path="/complaint" element={<ComplaintForm />} />
                                <Route path="/complaints" element={<CustomerComplaints />} />
                            </Route>

                            {/* Owner Protected Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                                <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                                <Route path="/owner/vehicles" element={<OwnerDashboard />} />
                                <Route path="/owner/vehicles/add" element={<AddVehicle />} />
                                <Route path="/owner/vehicles/edit/:id" element={<EditVehicle />} />
                                <Route path="/owner/history" element={<OwnerBookings />} />
                                <Route path="/owner/complaints" element={<OwnerComplaints />} />
                            </Route>

                            {/* Admin Protected Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/owners/:ownerId/vehicles" element={<AdminOwnerVehicles />} />
                                <Route path="/admin/complaints" element={<AdminComplaints />} />
                            </Route>

                            {/* Fallback route */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
