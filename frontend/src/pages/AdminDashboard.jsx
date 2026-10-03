import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalOwners: 0, totalVehicles: 0, pendingVehiclesCount: 0 });
    const [pendingVehicles, setPendingVehicles] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [rejectionReasons, setRejectionReasons] = useState({});
    const [actionId, setActionId] = useState(null);

    const fetchAdminData = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await api.get('/admin/dashboard');
            setStats(data.stats || { totalOwners: 0, totalVehicles: 0, pendingVehiclesCount: 0 });
            setPendingVehicles(data.pendingVehicles || []);
            setOwners(data.owners || []);
        } catch (err) {
            setError(err.message || 'Error fetching admin dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleApprove = async (vehicleId) => {
        setActionId(vehicleId);
        setError('');
        setSuccessMessage('');

        try {
            await api.post(`/admin/vehicles/${vehicleId}/approve`);
            setSuccessMessage('Vehicle approved successfully.');
            await fetchAdminData();
        } catch (err) {
            setError(err.message || 'Failed to approve vehicle.');
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (vehicleId) => {
        const reason = rejectionReasons[vehicleId];
        if (!reason || !reason.trim()) {
            alert('Please specify a rejection reason.');
            return;
        }

        setActionId(vehicleId);
        setError('');
        setSuccessMessage('');

        try {
            await api.post(`/admin/vehicles/${vehicleId}/reject`, {
                rejectionReason: reason.trim()
            });
            setSuccessMessage('Vehicle rejected.');
            await fetchAdminData();
        } catch (err) {
            setError(err.message || 'Failed to reject vehicle.');
        } finally {
            setActionId(null);
        }
    };

    const handleReasonChange = (vehicleId, val) => {
        setRejectionReasons((prev) => ({
            ...prev,
            [vehicleId]: val
        }));
    };

    return (
        <div className="container">
            <div className="page-title">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Manage vehicle owners, vehicle approvals, and complaints.</p>
                </div>
                <Link to="/admin/complaints" className="btn-history">
                    View All Complaints
                </Link>
            </div>

            {successMessage && (
                <div className="alert-success">
                    ✓ {successMessage}
                </div>
            )}

            <ErrorMessage message={error} />

            {/* Statistics Cards */}
            <div className="stats">
                <div className="stat-card">
                    <h2>{stats.totalOwners}</h2>
                    <p>Total Vehicle Owners</p>
                </div>

                <div className="stat-card">
                    <h2>{stats.totalVehicles}</h2>
                    <p>Total Vehicles</p>
                </div>

                <div className="stat-card">
                    <h2>{stats.pendingVehiclesCount}</h2>
                    <p>Pending Approvals</p>
                </div>
            </div>

            {loading ? (
                <Loading message="Loading dashboard data..." />
            ) : (
                <>
                    {/* Pending Approvals Section */}
                    <div style={{ marginBottom: '40px' }}>
                        <div className="section-header">
                            <div>
                                <h2>Pending Vehicle Approvals</h2>
                                <p>Review vehicles submitted by owners.</p>
                            </div>
                        </div>

                        {pendingVehicles.length === 0 ? (
                            <div className="empty">
                                <p>No vehicles are waiting for approval.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Registration No</th>
                                            <th>Type</th>
                                            <th>Owner</th>
                                            <th>Price / Day</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingVehicles.map((v) => {
                                            const owner = v.ownerId;
                                            return (
                                                <tr key={v._id}>
                                                    <td>
                                                        <strong>{v.brand} {v.model}</strong>
                                                    </td>
                                                    <td>{v.vehicleNumber}</td>
                                                    <td>{v.type}</td>
                                                    <td>
                                                        {owner ? (
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{owner.name}</div>
                                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{owner.email}</div>
                                                            </div>
                                                        ) : (
                                                            'Unknown'
                                                        )}
                                                    </td>
                                                    <td>₹{v.pricePerDay}</td>
                                                    <td>
                                                        <span className="status status-pending">
                                                            Pending
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-container">
                                                            <button
                                                                onClick={() => handleApprove(v._id)}
                                                                disabled={actionId === v._id}
                                                                className="approve-btn"
                                                            >
                                                                {actionId === v._id ? 'Processing...' : 'Approve'}
                                                            </button>

                                                            <div className="reject-form">
                                                                <input
                                                                    type="text"
                                                                    className="reason-input"
                                                                    placeholder="Rejection reason"
                                                                    value={rejectionReasons[v._id] || ''}
                                                                    onChange={(e) => handleReasonChange(v._id, e.target.value)}
                                                                />
                                                                <button
                                                                    onClick={() => handleReject(v._id)}
                                                                    disabled={actionId === v._id}
                                                                    className="reject-btn"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Vehicle Owners Section */}
                    <div>
                        <div className="section-header">
                            <div>
                                <h2>Registered Vehicle Owners</h2>
                                <p>All registered vehicle owners and their vehicle counts.</p>
                            </div>
                        </div>

                        {owners.length === 0 ? (
                            <div className="empty">
                                <p>No vehicle owners registered yet.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>City</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {owners.map((owner) => (
                                            <tr key={owner._id}>
                                                <td>
                                                    <strong>{owner.name}</strong>
                                                </td>
                                                <td>{owner.email}</td>
                                                <td>{owner.phone}</td>
                                                <td>{owner.city || 'N/A'}</td>
                                                <td>
                                                    <Link to={`/admin/owners/${owner._id}/vehicles`} className="view-btn">
                                                        View Vehicles ➔
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
