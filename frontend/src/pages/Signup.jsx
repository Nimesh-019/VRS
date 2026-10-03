import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

export const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        city: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!formData.city.trim()) {
            setError('City is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            await signup({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                city: formData.city,
                role: formData.role
            });

            setSuccessMessage('Account created successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Error creating account. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-body">
            <div className="auth-wrapper">
                <div className="auth-card signup-card">
                    <h2>Create Account</h2>
                    <p className="auth-subtitle">Join VRS and get started today</p>

                    <ErrorMessage message={error} />

                    {successMessage && (
                        <div className="alert-success">
                            ✓ {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    pattern="[0-9]{10}"
                                    title="Please enter a 10-digit phone number"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="city">City</label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                placeholder="e.g. Ahmedabad"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Create password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Account Type</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="user">User - Rent Vehicles</option>
                                <option value="owner">Owner - List My Vehicles</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary btn-block"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Login</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
