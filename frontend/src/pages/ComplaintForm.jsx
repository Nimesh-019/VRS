import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const ComplaintForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await api.get('/bookings/my');
                const list = data.bookings || [];
                setBookings(list);

                const preselectedId = searchParams.get('bookingId');
                if (preselectedId && list.some(b => b._id === preselectedId)) {
                    setSelectedBookingId(preselectedId);
                } else if (list.length > 0) {
                    setSelectedBookingId(list[0]._id);
                }
            } catch (err) {
                setError(err.message || 'Error loading your bookings.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedBookingId) {
            setError('Please select a booking to file a complaint for.');
            return;
        }

        if (!subject.trim() || !message.trim()) {
            setError('Subject and message are required.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/complaints', {
                bookingId: selectedBookingId,
                subject: subject.trim(),
                message: message.trim()
            });

            // Redirect to customer complaints list
            navigate('/complaints');
        } catch (err) {
            setError(err.message || 'Failed to submit complaint.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading message="Loading booking details..." />;

    return (
        <div className="container">
            <div className="section-header">
                <div>
                    <h2>Report Complaint</h2>
                    <p>Submit a complaint for any of your rental bookings.</p>
                </div>
                <Link to="/bookings" className="reset-btn">
                    ← Back to Bookings
                </Link>
            </div>

            <div className="auth-wrapper" style={{ padding: '10px 0' }}>
                <div className="auth-card" style={{ maxWidth: '600px' }}>
                    <h3 style={{ fontSize: '18px', margin: '0 0 15px 0', color: '#0f172a', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        File a Complaint
                    </h3>

                    <ErrorMessage message={error} />

                    {bookings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <p style={{ color: '#ef4444', marginBottom: '15px' }}>
                                You don't have any bookings to report a complaint for.
                            </p>
                            <Link to="/user/dashboard" className="btn-primary">
                                Browse Vehicles
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Select Booking */}
                            <div className="form-group">
                                <label htmlFor="bookingId">Select Rental Booking</label>
                                <select
                                    id="bookingId"
                                    value={selectedBookingId}
                                    onChange={(e) => setSelectedBookingId(e.target.value)}
                                    required
                                >
                                    {bookings.map((b) => (
                                        <option key={b._id} value={b._id}>
                                            {b.vehicleId ? `${b.vehicleId.brand} ${b.vehicleId.model}` : 'Vehicle'} ({b.vehicleId ? b.vehicleId.vehicleNumber : 'N/A'}) - {new Date(b.startDate).toLocaleDateString()} [{(b.status || 'pending').toUpperCase()}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div className="form-group">
                                <label htmlFor="subject">Complaint Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    placeholder="e.g. Vehicle condition issue, delay, etc."
                                    maxLength={100}
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Message */}
                            <div className="form-group">
                                <label htmlFor="message">Detailed Explanation</label>
                                <textarea
                                    id="message"
                                    placeholder="Provide detailed description of what happened..."
                                    maxLength={1000}
                                    rows={5}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <div className="actions">
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                                </button>
                                <Link to="/bookings" className="btn-cancel">
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComplaintForm;
