import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const OwnerBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [actionId, setActionId] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');

    const fetchHistory = async (params = {}) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            if (params.search) query.append('search', params.search);
            if (params.status) query.append('status', params.status);
            if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);

            const queryString = query.toString() ? `?${query.toString()}` : '';
            const data = await api.get(`/owner/bookings${queryString}`);
            setBookings(data.bookings || []);
        } catch (err) {
            setError(err.message || 'Error fetching rental history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleFilter = (e) => {
        e.preventDefault();
        fetchHistory({ search, status, paymentStatus });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setPaymentStatus('');
        fetchHistory({});
    };

    const renderStatusBadge = (status) => {
        const s = (status || 'pending').toLowerCase();
        switch (s) {
            case 'pending':
                return <span className="status pending">🟡 Pending approval</span>;
            case 'confirmed':
                return <span className="status confirmed">🔵 Confirmed / Upcoming</span>;
            case 'ongoing':
                return <span className="status ongoing">🟢 Ongoing</span>;
            case 'completed':
                return <span className="status completed">⚪ Completed</span>;
            case 'rejected':
                return <span className="status rejected">🔴 Rejected</span>;
            case 'cancelled':
                return <span className="status cancelled">⚫ Cancelled</span>;
            case 'expired':
                return <span className="status expired">🟠 Expired</span>;
            default:
                return <span className="status pending">🟡 {status}</span>;
        }
    };

    const renderPaymentBadge = (status) => {
        const p = (status || 'pending').toLowerCase();
        if (p === 'paid') {
            return <span className="status status-approved">PAID</span>;
        }
        if (p === 'failed') {
            return <span className="status status-rejected">FAILED</span>;
        }
        return <span className="status status-pending">PENDING</span>;
    };

    const handleConfirm = async (bookingId) => {
        setActionId(bookingId);
        setError('');
        setSuccessMessage('');

        try {
            const data = await api.post(`/owner/bookings/${bookingId}/confirm`);
            setSuccessMessage(data.message || 'Booking approved successfully.');
            await fetchHistory({ search, status, paymentStatus });
        } catch (err) {
            setError(err.message || 'Failed to approve booking.');
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (bookingId) => {
        if (!window.confirm('Are you sure you want to reject this booking?')) {
            return;
        }

        setActionId(bookingId);
        setError('');
        setSuccessMessage('');

        try {
            const data = await api.post(`/owner/bookings/${bookingId}/reject`);
            setSuccessMessage(data.message || 'Booking rejected successfully.');
            await fetchHistory({ search, status, paymentStatus });
        } catch (err) {
            setError(err.message || 'Failed to reject booking.');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="container">
            <div className="top-bar">
                <h2>Booking History</h2>
                <Link to="/owner/dashboard" className="back-btn">
                    ← Back to Dashboard
                </Link>
            </div>

            {successMessage && (
                <div className="alert-success">
                    ✓ {successMessage}
                </div>
            )}

            <ErrorMessage message={error} />

            {/* Filter */}
            <div className="filter-container">
                <form onSubmit={handleFilter} className="filter-form">
                    <div className="filter-group search-group">
                        <label htmlFor="search">Search</label>
                        <input
                            type="text"
                            id="search"
                            placeholder="Customer, email, vehicle or registration..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="status">Booking Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="paymentStatus">Payment Status</label>
                        <select
                            id="paymentStatus"
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                            <option value="">All Payment Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="filter-buttons">
                        <button type="submit" className="filter-btn">
                            Apply Filter
                        </button>
                        <button type="button" onClick={handleReset} className="reset-btn">
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {loading ? (
                <Loading message="Loading rental history..." />
            ) : bookings.length > 0 ? (
                <>
                    <div className="results-info">
                        Showing <strong>{bookings.length}</strong> booking{bookings.length === 1 ? '' : 's'}
                    </div>

                    <div className="grid">
                        {bookings.map((booking) => {
                            const vehicle = booking.vehicleId;
                            const customer = booking.userId;
                            const isPending = booking.status === 'pending';
                            const vehicleTitle = vehicle
                                ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle'
                                : 'Vehicle';
                            const regNo = vehicle?.vehicleNumber || 'N/A';
                            const vehicleType = vehicle?.type;

                            return (
                                <div key={booking._id} className="booking-record-card">
                                    {/* Header: Vehicle Name, Reg No, Type & Badges */}
                                    <div className="record-header">
                                        <div className="record-title-box">
                                            <div className="record-title">
                                                {vehicleTitle}
                                                {vehicleType && <span className="record-type-badge">{vehicleType}</span>}
                                            </div>
                                            <div className="record-subtitle">
                                                Reg No: <strong>{regNo}</strong>
                                            </div>
                                        </div>

                                        <div className="record-badges">
                                            {renderStatusBadge(booking.status)}
                                            {renderPaymentBadge(booking.paymentStatus)}
                                        </div>
                                    </div>

                                    {/* Record Details Grid */}
                                    <div className="record-details-grid">
                                        <div className="record-detail-item">
                                            <span className="record-label">Customer</span>
                                            <span className="record-value">👤 {customer ? customer.name : 'Unknown'}</span>
                                        </div>

                                        <div className="record-detail-item">
                                            <span className="record-label">Amount</span>
                                            <span className="record-value record-amount">
                                                ₹{booking.totalAmount !== undefined ? booking.totalAmount : 0}
                                            </span>
                                        </div>

                                        <div className="record-detail-item">
                                            <span className="record-label">Start Date</span>
                                            <span className="record-value">
                                                📅 {new Date(booking.startDate).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="record-detail-item">
                                            <span className="record-label">End Date</span>
                                            <span className="record-value">
                                                📅 {new Date(booking.endDate).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {(customer?.email || customer?.phone) && (
                                            <div className="record-detail-item full-width">
                                                <span className="record-label">Customer Contact</span>
                                                <span className="record-value" style={{ fontSize: '13px', color: '#475569' }}>
                                                    {customer.email && <span>✉️ {customer.email}</span>}
                                                    {customer.email && customer.phone && <span> &nbsp;•&nbsp; </span>}
                                                    {customer.phone && <span>📞 {customer.phone}</span>}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions for Pending Bookings Only */}
                                    {isPending && (
                                        <div className="record-actions">
                                            <button
                                                onClick={() => handleConfirm(booking._id)}
                                                disabled={actionId === booking._id}
                                                className="action-btn confirm-btn record-action-btn"
                                            >
                                                {actionId === booking._id ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(booking._id)}
                                                disabled={actionId === booking._id}
                                                className="action-btn reject-btn record-action-btn"
                                            >
                                                {actionId === booking._id ? 'Processing...' : 'Reject'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <h3>No Bookings Found</h3>
                    <p>There are no bookings matching your search criteria.</p>
                </div>
            )}
        </div>
    );
};

export default OwnerBookings;
