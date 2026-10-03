import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import BookingCard from '../components/BookingCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const Bookings = () => {
    const [searchParams] = useSearchParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [cancellingId, setCancellingId] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Check payment query param from PayU return
    useEffect(() => {
        const paymentParam = searchParams.get('payment');
        if (paymentParam === 'success') {
            setSuccessMessage('Payment completed successfully! Your booking is now paid.');
        } else if (paymentParam === 'failed') {
            setError('Payment was cancelled or failed. Please try again.');
        }
    }, [searchParams]);

    const fetchBookings = async (status = statusFilter, type = typeFilter) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            if (status) query.append('status', status);
            if (type) query.append('type', type);

            const queryString = query.toString() ? `?${query.toString()}` : '';
            const data = await api.get(`/bookings/my${queryString}`);
            setBookings(data.bookings || []);
        } catch (err) {
            setError(err.message || 'Error fetching bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleFilter = (e) => {
        e.preventDefault();
        fetchBookings(statusFilter, typeFilter);
    };

    const handleClear = () => {
        setStatusFilter('');
        setTypeFilter('');
        fetchBookings('', '');
    };

    // Cancellation Handler
    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        setCancellingId(bookingId);
        setError('');
        setSuccessMessage('');

        try {
            const data = await api.post(`/bookings/${bookingId}/cancel`);
            setSuccessMessage(data.message || 'Booking cancelled successfully.');
            await fetchBookings();
        } catch (err) {
            setError(err.message || 'Failed to cancel booking.');
        } finally {
            setCancellingId(null);
        }
    };

    // Pay Now Handler (PayU Integration)
    const handlePayNow = async (booking) => {
        try {
            // Get PayU form parameters from backend
            const payData = await api.get(`/payment/pay/${booking._id}`);

            // Dynamically create and submit a form to PayU gateway (just like views/payment/payu.ejs)
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payData.payuUrl;

            const fields = {
                key: payData.key,
                txnid: payData.txnid,
                amount: payData.amount,
                productinfo: payData.productinfo,
                firstname: payData.firstname,
                email: payData.email,
                phone: payData.phone,
                surl: payData.surl,
                furl: payData.furl,
                hash: payData.hash,
                udf1: payData.udf1 || ''
            };

            for (const [key, value] of Object.entries(fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value || '';
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();
        } catch (err) {
            setError(err.message || 'Could not initiate payment. Please try again.');
        }
    };

    return (
        <div className="container">
            {/* Page Header */}
            <div className="section-header">
                <div>
                    <h2>My Bookings</h2>
                    <p>View and manage your vehicle rental bookings.</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to="/complaint" className="btn" style={{ fontSize: '13px', height: '38px' }}>
                        Report a Complaint
                    </Link>
                    <Link to="/complaints" className="reset-btn" style={{ fontSize: '13px', height: '38px' }}>
                        My Complaints
                    </Link>
                    <Link to="/user/dashboard" className="home-btn" style={{ fontSize: '13px', height: '38px' }}>
                        Browse Vehicles
                    </Link>
                </div>
            </div>

            {/* Messages */}
            {successMessage && (
                <div className="alert-success">
                    ✓ {successMessage}
                </div>
            )}

            <ErrorMessage message={error} />

            {/* Filter Box */}
            <div className="filter-box">
                <form onSubmit={handleFilter} className="filter-form">
                    {/* Booking Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Booking Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                    </select>

                    {/* Vehicle Type */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All Vehicle Types</option>
                        <option value="Car">Car</option>
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="SUV">SUV</option>
                        <option value="Other">Other</option>
                    </select>

                    <button type="submit" className="filter-btn">
                        Filter
                    </button>
                    <button type="button" onClick={handleClear} className="clear-filter-btn">
                        Clear
                    </button>
                </form>
            </div>

            {/* Bookings Display */}
            {loading ? (
                <Loading message="Loading your bookings..." />
            ) : (
                <>
                    {bookings.length > 0 && (
                        <div className="results-info">
                            Showing <strong>{bookings.length}</strong> booking{bookings.length === 1 ? '' : 's'}
                        </div>
                    )}

                    {bookings.length > 0 ? (
                        <div className="booking-grid">
                            {bookings.map((booking) => (
                                <BookingCard
                                    key={booking._id}
                                    booking={booking}
                                    onCancel={handleCancel}
                                    onPay={handlePayNow}
                                    isCancelling={cancellingId === booking._id}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="empty">
                            <h2>No Bookings Found</h2>
                            {statusFilter || typeFilter ? (
                                <p>No bookings match your selected filters. Try changing your filters.</p>
                            ) : (
                                <p>You haven't booked any vehicles yet.</p>
                            )}
                            <Link to="/user/dashboard" className="btn">
                                Rent a Vehicle Now
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Bookings;
