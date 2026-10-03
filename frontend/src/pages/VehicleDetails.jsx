import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const VehicleDetails = () => {
    const { vehicleId } = useParams();
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);

    // Calculate total days and total price
    const calculateTotal = () => {
        if (!vehicle || !startDate || !endDate) return { days: 0, total: 0 };
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) return { days: 0, total: 0 };
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const days = Math.max(1, diffDays);
        const total = days * vehicle.pricePerDay;
        return { days, total };
    };

    const { days, total } = calculateTotal();

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const data = await api.get(`/vehicles/${vehicleId}`);
                setVehicle(data.vehicle);
            } catch (err) {
                setError(err.message || 'Error loading vehicle details.');
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [vehicleId]);

    const handleBooking = async (e) => {
        e.preventDefault();
        setError('');

        if (new Date(startDate) > new Date(endDate)) {
            setError('End date must be on or after start date.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/bookings', {
                vehicleId,
                startDate,
                endDate
            });

            // On success, redirect to customer bookings page
            navigate('/bookings');
        } catch (err) {
            setError(err.message || 'Error booking vehicle.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading message="Loading vehicle details..." />;

    if (!vehicle) {
        return (
            <div className="container">
                <ErrorMessage message={error || 'Vehicle not found.'} />
                <Link to="/user/dashboard" className="btn-secondary">
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                {/* Vehicle Image */}
                <div className="vehicle-image" style={{ height: '280px' }}>
                    {vehicle.image ? (
                        <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} />
                    ) : (
                        <div className="no-image">No Image Available</div>
                    )}
                </div>

                <div className="content">
                    <h1>Book Vehicle</h1>

                    <ErrorMessage message={error} />

                    {/* Vehicle Information */}
                    <div className="vehicle-info" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                        <div className="vehicle-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h2 style={{ fontSize: '22px', margin: 0, color: '#0f172a' }}>
                                {vehicle.brand} {vehicle.model}
                            </h2>
                            <span className="vehicle-type">{vehicle.type || 'Vehicle'}</span>
                        </div>

                        {vehicle.vehicleNumber && (
                            <p style={{ margin: '6px 0', fontSize: '14px', color: '#475569' }}>
                                <strong>Registration:</strong> {vehicle.vehicleNumber}
                            </p>
                        )}

                        <p style={{ margin: '6px 0', fontSize: '14px', color: '#475569' }}>
                            <strong>City:</strong> {vehicle.city || 'N/A'}
                        </p>

                        <p className="price" style={{ margin: '10px 0' }}>
                            ₹{vehicle.pricePerDay} <span>/ day</span>
                        </p>

                        <p style={{ margin: '6px 0', fontSize: '14px' }}>
                            <strong>Status: </strong>
                            {vehicle.availability ? (
                                <span className="available">Available</span>
                            ) : (
                                <span className="unavailable">Currently Rented</span>
                            )}
                        </p>

                        {vehicle.description && (
                            <p style={{ margin: '10px 0', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                                {vehicle.description}
                            </p>
                        )}
                    </div>

                    {/* Booking Form */}
                    {vehicle.availability ? (
                        <form onSubmit={handleBooking}>
                            <div className="form-row">
                                <div className="date-group">
                                    <label htmlFor="startDate">Start Date</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        min={todayStr}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="date-group">
                                    <label htmlFor="endDate">End Date</label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        name="endDate"
                                        min={startDate || todayStr}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Estimated Price Summary */}
                            {days > 0 && (
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#475569' }}>
                                        <span>Duration:</span>
                                        <strong>{days} Day{days === 1 ? '' : 's'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#475569' }}>
                                        <span>Rate:</span>
                                        <span>₹{vehicle.pricePerDay} / day</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #cbd5e1', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>
                                        <span>Total Amount:</span>
                                        <span style={{ color: '#2563eb' }}>₹{total}</span>
                                    </div>
                                </div>
                            )}

                            <div className="actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Confirming Booking...' : 'Confirm Booking'}
                                </button>
                                <Link to="/user/dashboard" className="btn btn-secondary">
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="alert-error">
                            This vehicle is currently rented or unavailable for booking.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleDetails;
