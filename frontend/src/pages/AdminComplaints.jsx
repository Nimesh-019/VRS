import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const AdminComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchComplaints = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await api.get('/admin/complaints');
            setComplaints(data.complaints || []);
        } catch (err) {
            setError(err.message || 'Error fetching complaints.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    return (
        <div className="container">
            <div className="top-bar">
                <div>
                    <h2>System Complaints (Admin)</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
                        Monitor and oversee complaints across the system. Resolution is managed directly by vehicle owners (Read-Only).
                    </p>
                </div>
                <Link to="/admin/dashboard" className="back-btn">
                    ← Back to Dashboard
                </Link>
            </div>

            <ErrorMessage message={error} />

            {loading ? (
                <Loading message="Loading all complaints..." />
            ) : complaints.length > 0 ? (
                <div>
                    {complaints.map((c) => {
                        const vehicle = c.vehicleId;
                        const customer = c.customerId;
                        const owner = c.ownerId;
                        const booking = c.bookingId;
                        const isResolved = c.status === 'resolved';

                        return (
                            <div key={c._id} className="complaint-card">
                                <div className="card-top">
                                    <div>
                                        <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 4px 0' }}>
                                            {c.subject}
                                        </h3>
                                        <div className="complaint-date">
                                            Submitted: {new Date(c.createdAt).toLocaleString()}
                                        </div>
                                    </div>

                                    <span className={`status ${isResolved ? 'status-approved' : 'status-pending'}`}>
                                        {isResolved ? '✓ RESOLVED' : '⏳ PENDING'}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {/* Vehicle Info */}
                                    <div>
                                        <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Vehicle:
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                                            <strong>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}</strong>
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                                            Reg: {vehicle ? vehicle.vehicleNumber : 'N/A'}
                                        </p>
                                    </div>

                                    {/* Customer Info */}
                                    {customer && (
                                        <div>
                                            <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                Customer:
                                            </strong>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                                                👤 {customer.name}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                                                📧 {customer.email}
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
                                                🚘 {owner.name}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                                                📞 {owner.phone}
                                            </p>
                                        </div>
                                    )}

                                    {/* Rental Info */}
                                    {booking && (
                                        <div>
                                            <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                Rental Period:
                                            </strong>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                                                {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#2563eb' }}>
                                                Status: {(booking.status || 'pending').toUpperCase()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Complaint Message */}
                                <div style={{ marginBottom: '15px' }}>
                                    <strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '6px' }}>
                                        Customer Complaint:
                                    </strong>
                                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px 14px', fontSize: '14px', color: '#1e293b', lineHeight: 1.5 }}>
                                        {c.message}
                                    </div>
                                </div>

                                {/* Owner's Response / Resolution Status */}
                                {c.ownerReply ? (
                                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', marginTop: '12px' }}>
                                        <strong style={{ color: '#166534', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                            💬 Vehicle Owner Response:
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#15803d', lineHeight: 1.5 }}>
                                            {c.ownerReply}
                                        </p>
                                        {c.resolvedAt && (
                                            <span style={{ fontSize: '12px', color: '#16a34a', display: 'block', marginTop: '6px' }}>
                                                Resolved at: {new Date(c.resolvedAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px 14px', marginTop: '12px', color: '#b45309', fontSize: '13px' }}>
                                        ⏳ Pending Vehicle Owner Response (Monitoring Only)
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <h3>No Complaints Found</h3>
                    <p>There are no complaints registered in the system.</p>
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;
