import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const CustomerComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const data = await api.get('/complaints/my');
                setComplaints(data.complaints || []);
            } catch (err) {
                setError(err.message || 'Error fetching complaints.');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    return (
        <div className="container">
            {/* Header */}
            <div className="section-header">
                <div>
                    <h2>My Complaints</h2>
                    <p>View complaints submitted for your vehicle rentals and responses from vehicle owners.</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to="/complaint" className="btn">
                        File New Complaint
                    </Link>
                    <Link to="/bookings" className="reset-btn">
                        My Bookings
                    </Link>
                    <Link to="/user/dashboard" className="home-btn">
                        Home
                    </Link>
                </div>
            </div>

            <ErrorMessage message={error} />

            {loading ? (
                <Loading message="Loading complaints..." />
            ) : complaints.length > 0 ? (
                <div>
                    {complaints.map((c) => {
                        const vehicle = c.vehicleId;
                        const owner = c.ownerId;
                        const booking = c.bookingId;

                        return (
                            <div key={c._id} className="complaint-card">
                                {/* Top Header */}
                                <div className="card-top">
                                    <div>
                                        <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 4px 0' }}>
                                            {c.subject}
                                        </h3>
                                        <div className="complaint-date">
                                            Submitted: {new Date(c.createdAt).toLocaleString()}
                                        </div>
                                    </div>

                                    <span className={`status ${c.status === 'resolved' ? 'status-approved' : 'status-pending'}`}>
                                        {c.status === 'resolved' ? '✓ RESOLVED' : '⏳ PENDING'}
                                    </span>
                                </div>

                                {/* Body Information */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {/* Vehicle Info */}
                                    <div>
                                        <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Vehicle Details:
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                                            <strong>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}</strong>
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                                            Reg: {vehicle ? vehicle.vehicleNumber : 'N/A'} ({vehicle ? vehicle.type : 'Vehicle'})
                                        </p>
                                    </div>

                                    {/* Rental Info */}
                                    {booking && (
                                        <div>
                                            <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                Rental Period:
                                            </strong>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                                                {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
                                                Amount: ₹{booking.totalAmount}
                                            </p>
                                        </div>
                                    )}

                                    {/* Owner Info */}
                                    {owner && (
                                        <div>
                                            <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                Vehicle Owner:
                                            </strong>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                                                👤 {owner.name}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                                                📞 {owner.phone}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Customer Message */}
                                <div style={{ marginBottom: '15px' }}>
                                    <strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                                        Your Complaint:
                                    </strong>
                                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px 14px', fontSize: '14px', color: '#1e293b', lineHeight: 1.5 }}>
                                        {c.message}
                                    </div>
                                </div>

                                {/* Vehicle Owner Response / Status */}
                                {c.status === 'resolved' && c.ownerReply ? (
                                    <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '14px' }}>
                                        <strong style={{ color: '#065f46', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                            💬 Response from Vehicle Owner:
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#047857', lineHeight: 1.5 }}>
                                            {c.ownerReply}
                                        </p>
                                        {c.resolvedAt && (
                                            <span style={{ fontSize: '12px', color: '#059669', display: 'block', marginTop: '6px' }}>
                                                Resolved at: {new Date(c.resolvedAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px 14px', color: '#b45309', fontSize: '13px' }}>
                                        ⏳ Waiting for vehicle owner response.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty">
                    <h2>No Complaints Found</h2>
                    <p>You haven't filed any complaints yet.</p>
                    <Link to="/bookings" className="btn">
                        Go to My Bookings
                    </Link>
                </div>
            )}
        </div>
    );
};

export default CustomerComplaints;
