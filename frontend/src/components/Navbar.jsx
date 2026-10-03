import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getHomePath = () => {
        if (!user) return '/login';
        if (user.role === 'owner') return '/owner/dashboard';
        if (user.role === 'admin') return '/admin/dashboard';
        return '/user/dashboard';
    };

    return (
        <header>
            <h1>
                <Link to={getHomePath()} style={{ color: '#ffffff', textDecoration: 'none' }}>
                    <span>V</span>RS - Vehicle Rentals
                </Link>
            </h1>

            <div className="user-nav">
                {user ? (
                    <>
                        <span>
                            Welcome, <strong>{user.name}</strong> ({user.role === 'user' ? 'Customer' : user.role === 'owner' ? 'Owner' : 'Admin'})
                        </span>

                        {/* Customer Links */}
                        {user.role === 'user' && (
                            <>
                                <NavLink to="/user/dashboard" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    Vehicles
                                </NavLink>
                                <NavLink to="/bookings" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    My Bookings
                                </NavLink>
                                <NavLink to="/complaints" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    My Complaints
                                </NavLink>
                            </>
                        )}

                        {/* Owner Links */}
                        {user.role === 'owner' && (
                            <>
                                <NavLink to="/owner/dashboard" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    Dashboard
                                </NavLink>
                                <NavLink to="/owner/history" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    Rental History
                                </NavLink>
                                <NavLink to="/owner/complaints" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    Complaints
                                </NavLink>
                                <Link to="/owner/vehicles/add" className="btn-add" style={{ height: '36px', padding: '0 14px', fontSize: '13px' }}>
                                    + Add Vehicle
                                </Link>
                            </>
                        )}

                        {/* Admin Links */}
                        {user.role === 'admin' && (
                            <>
                                <NavLink to="/admin/dashboard" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    Dashboard
                                </NavLink>
                                <NavLink to="/admin/complaints" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                                    Complaints
                                </NavLink>
                            </>
                        )}

                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login" className={({ isActive }) => `bookings-btn ${isActive ? 'active' : ''}`}>
                            Login
                        </NavLink>
                        <NavLink to="/signup" className="btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
                            Sign Up
                        </NavLink>
                    </>
                )}
            </div>
        </header>
    );
};

export default Navbar;
