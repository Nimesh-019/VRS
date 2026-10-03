import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Create React context for Authentication
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in on initial page load
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await api.get('/auth/me');
                if (data && data.user) {
                    setUser(data.user);
                }
            } catch (err) {
                // Not logged in or session expired
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Login function
    const login = async (email, password, role) => {
        const data = await api.post('/auth/login', { email, password, role });
        setUser(data.user);
        return data.user;
    };

    // Signup function
    const signup = async (userData) => {
        return await api.post('/auth/signup', userData);
    };

    // Logout function
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Simple hook to use auth in any component
export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthContext;
