import React from 'react';
import { Link } from 'react-router-dom';

export const BookingCard = ({ booking, onCancel, onPay, isCancelling }) => {
    const vehicle = booking.vehicleId;
    const isFuture = new Date(booking.startDate) > new Date();
    const canCancel = (booking.status === 'pending' || booking.status === 'confirmed') && isFuture;
    const canPay = (booking.status === 'confirmed' || booking.status === 'ongoing') && booking.paymentStatus !== 'paid';

    const renderStatusBadge = (status) => {
        const s = (status || 'pending').toLowerCase();
        switch (s) {
            case 'pending':
                return <span className="status pending">🟡 Pending approval</span>;
            case 'confirmed':
                return <span className="status confirmed">🔵 Confirmed</span>;
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

    const vehicleTitle = vehicle
        ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle'
        : 'Vehicle';
    const regNo = vehicle?.vehicleNumber || 'N/A';
    const vehicleType = vehicle?.type;
    const ownerName = vehicle?.ownerId?.name || 'Vehicle Owner';

    return (
        <div className="booking-record-card">
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
                    <span className="record-label">Owner</span>
                    <span className="record-value">👤 {ownerName}</span>
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
            </div>

            {/* Valid Actions for Customer */}
            <div className="record-actions">
                {canPay && (
                    <button
                        onClick={() => onPay(booking)}
                        className="record-action-btn pay-btn"
                    >
                        💳 Pay Now
                    </button>
                )}

                {canCancel && (
                    <button
                        onClick={() => onCancel(booking._id)}
                        disabled={isCancelling}
                        className="record-action-btn reject-btn"
                        style={{
                            opacity: isCancelling ? 0.7 : 1,
                            cursor: isCancelling ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                )}

                <Link
                    to={`/complaint?bookingId=${booking._id}`}
                    className="record-action-btn reset-btn"
                >
                    Report a Complaint
                </Link>
            </div>
        </div>
    );
};

export default BookingCard;
