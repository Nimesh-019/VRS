import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const AdminOwnerVehicles = () => {
    const { ownerId } = useParams();
    const [owner, setOwner] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOwnerVehicles = async () => {
            try {
                const data = await api.get(`/admin/owners/${ownerId}/vehicles`);
                setOwner(data.owner);
                setVehicles(data.vehicles || []);
            } catch (err) {
                setError(err.message || 'Error fetching owner vehicles.');
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerVehicles();
    }, [ownerId]);

    if (loading) return <Loading message="Loading owner vehicles..." />;

    return (
        <div className="container">
            <div className="top-bar">
                <div>
                    <h2>Owner Vehicles</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
                        Viewing all vehicles listed by {owner ? owner.name : 'Owner'}
                    </p>
                </div>
                <Link to="/admin/dashboard" className="back-btn">
                    ← Back to Dashboard
                </Link>
            </div>

            <ErrorMessage message={error} />

            {/* Owner Details Card */}
            {owner && (
                <div className="owner-card">
                    <div className="owner-details">
                        <h3>{owner.name}</h3>
                        <p><strong>Email:</strong> {owner.email}</p>
                        <p><strong>Phone:</strong> {owner.phone}</p>
                        <p><strong>City:</strong> {owner.city || 'N/A'}</p>
                    </div>
                    <div className="owner-badge">
                        🚘 {vehicles.length} Vehicle{vehicles.length === 1 ? '' : 's'} Listed
                    </div>
                </div>
            )}

            {/* Table */}
            {vehicles.length > 0 ? (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Brand & Model</th>
                                <th>Registration No</th>
                                <th>Type</th>
                                <th>City</th>
                                <th>Price / Day</th>
                                <th>Availability</th>
                                <th>Approval Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((v) => (
                                <tr key={v._id}>
                                    <td>
                                        {v.image ? (
                                            <img src={v.image} alt={v.brand} className="vehicle-img" />
                                        ) : (
                                            <div className="no-img">No Image</div>
                                        )}
                                    </td>
                                    <td>
                                        <strong>{v.brand} {v.model}</strong>
                                    </td>
                                    <td>{v.vehicleNumber}</td>
                                    <td>{v.type}</td>
                                    <td>{v.city || 'N/A'}</td>
                                    <td>₹{v.pricePerDay}</td>
                                    <td>
                                        <span className={`status ${v.availability ? 'status-approved' : 'status-rejected'}`}>
                                            {v.availability ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td>
                                        {v.approvalStatus === 'approved' && (
                                            <span className="status status-approved">✓ Approved</span>
                                        )}
                                        {v.approvalStatus === 'rejected' && (
                                            <div>
                                                <span className="status status-rejected">✕ Rejected</span>
                                                {v.rejectionReason && (
                                                    <div className="rejection-reason">Reason: {v.rejectionReason}</div>
                                                )}
                                            </div>
                                        )}
                                        {(!v.approvalStatus || v.approvalStatus === 'pending') && (
                                            <span className="status status-pending">⏳ Pending Approval</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty">
                    <p>This owner has not added any vehicles yet.</p>
                </div>
            )}
        </div>
    );
};

export default AdminOwnerVehicles;
