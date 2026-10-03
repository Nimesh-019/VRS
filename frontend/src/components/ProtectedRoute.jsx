import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading message="Checking authorization..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard if they don't have permission
        if (user.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/user/dashboard" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
