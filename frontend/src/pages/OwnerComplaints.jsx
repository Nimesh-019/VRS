import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const OwnerComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [replyText, setReplyText] = useState({});
    const [submittingId, setSubmittingId] = useState(null);

    const fetchComplaints = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await api.get('/owner/complaints');
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

    const handleReplyChange = (id, text) => {
        setReplyText((prev) => ({
            ...prev,
            [id]: text
        }));
    };

    const handleSendReply = async (complaintId) => {
        const text = replyText[complaintId];
        if (!text || !text.trim()) {
            alert('Please enter a response before sending.');
            return;
        }

        setSubmittingId(complaintId);
        setError('');
        setSuccessMessage('');

        try {
            await api.post(`/owner/complaints/${complaintId}/reply`, {
                ownerReply: text.trim()
            });

            setSuccessMessage('Response submitted successfully and complaint marked as resolved.');
            await fetchComplaints();
        } catch (err) {
            setError(err.message || 'Failed to submit response.');
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="container">
            <div className="top-bar">
                <div>
                    <h2>Customer Complaints</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
                        View complaints related to your vehicles and respond directly to customers.
                    </p>
                </div>
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

            {loading ? (
                <Loading message="Loading complaints..." />
            ) : complaints.length > 0 ? (
                <div>
                    {complaints.map((c) => {
                        const vehicle = c.vehicleId;
                        const customer = c.customerId;
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

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {/* Vehicle Info */}
                                    <div>
                                        <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Vehicle:
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                                            <strong>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}</strong>
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                                            Reg: {vehicle ? vehicle.vehicleNumber : 'N/A'} ({vehicle ? vehicle.type : 'Vehicle'})
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
                                                📧 {customer.email} | 📞 {customer.phone}
                                            </p>
                                        </div>
                                    )}

                                    {/* Rental Info */}
                                    {booking && (
                                        <div>
                                            <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                Booking Dates:
                                            </strong>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                                                {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#2563eb' }}>
                                                Amount: ₹{booking.totalAmount}
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

                                {/* Reply Section */}
                                {isResolved ? (
                                    <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '14px' }}>
                                        <strong style={{ color: '#065f46', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                                            ✓ Response Sent:
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                                            {c.ownerReply}
                                        </p>
                                        {c.resolvedAt && (
                                            <span style={{ fontSize: '12px', color: '#059669', display: 'block', marginTop: '6px' }}>
                                                Resolved at: {new Date(c.resolvedAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '15px' }}>
                                        <label htmlFor={`reply-${c._id}`} style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                                            Your Response to Customer:
                                        </label>
                                        <textarea
                                            id={`reply-${c._id}`}
                                            placeholder="Write your explanation or resolution to the customer..."
                                            rows={3}
                                            value={replyText[c._id] || ''}
                                            onChange={(e) => handleReplyChange(c._id, e.target.value)}
                                            style={{ width: '100%', marginBottom: '10px' }}
                                        ></textarea>
                                        <button
                                            onClick={() => handleSendReply(c._id)}
                                            disabled={submittingId === c._id}
                                            className="btn-primary"
                                            style={{ height: '36px', fontSize: '13px' }}
                                        >
                                            {submittingId === c._id ? 'Sending...' : 'Send Response & Resolve'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <h3>No Complaints Found</h3>
                    <p>No complaints have been filed for your vehicles.</p>
                </div>
            )}
        </div>
    );
};

export default OwnerComplaints;
