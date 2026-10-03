import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const OwnerDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [availability, setAvailability] = useState('');
    const [sort, setSort] = useState('');

    const fetchOwnerData = async (params = {}) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            if (params.search) query.append('search', params.search);
            if (params.type) query.append('type', params.type);
            if (params.availability) query.append('availability', params.availability);
            if (params.sort) query.append('sort', params.sort);

            const queryString = query.toString() ? `?${query.toString()}` : '';
            const data = await api.get(`/owner/dashboard${queryString}`);
            setProfile(data.profile);
            setVehicles(data.vehicles || []);
        } catch (err) {
            setError(err.message || 'Error fetching owner dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwnerData();
    }, []);

    const handleFilter = (e) => {
        e.preventDefault();
        fetchOwnerData({ search, type, availability, sort });
    };

    const handleReset = () => {
        setSearch('');
        setType('');
        setAvailability('');
        setSort('');
        fetchOwnerData({});
    };

    const handleDelete = async (vehicleId) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) {
            return;
        }

        setDeletingId(vehicleId);
        setError('');
        setSuccessMessage('');

        try {
            await api.delete(`/owner/vehicles/${vehicleId}`);
            setSuccessMessage('Vehicle deleted successfully.');
            await fetchOwnerData({ search, type, availability, sort });
        } catch (err) {
            setError(err.message || 'Error deleting vehicle.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="container">
            {/* Owner Profile Card */}
            {profile && (
                <div className="profile-card">
                    <h3>Owner Profile</h3>
                    <p><strong>Name:</strong> {profile.name}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>City:</strong> {profile.city || 'N/A'}</p>
                </div>
            )}

            {/* Top Bar */}
            <div className="top-bar">
                <h2>Vehicles Listed for Rent</h2>
                <div className="top-actions">
                    <Link to="/owner/history" className="btn-history">
                        Rental History
                    </Link>
                    <Link to="/owner/complaints" className="btn-history">
                        Customer Complaints
                    </Link>
                    <Link to="/owner/vehicles/add" className="btn-add">
                        + Add New Vehicle
                    </Link>
                </div>
            </div>

            {/* Success and Error messages */}
            {successMessage && (
                <div className="alert-success">
                    ✓ {successMessage}
                </div>
            )}

            <ErrorMessage message={error} />

            {/* Filter Container */}
            <div className="filter-container">
                <form onSubmit={handleFilter} className="filter-form">
                    <div className="filter-group search-group">
                        <label htmlFor="search">Search</label>
                        <input
                            type="text"
                            id="search"
                            placeholder="Brand, model or vehicle number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="type">Vehicle Type</label>
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Car">Car</option>
                            <option value="Bike">Bike</option>
                            <option value="Scooter">Scooter</option>
                            <option value="SUV">SUV</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="availability">Availability</label>
                        <select
                            id="availability"
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="available">Available</option>
                            <option value="unavailable">Not Available</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="sort">Sort By</label>
                        <select
                            id="sort"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <option value="">Latest</option>
                            <option value="priceAsc">Price: Low to High</option>
                            <option value="priceDesc">Price: High to Low</option>
                            <option value="nameAsc">Name: A-Z</option>
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

                {(search || type || availability || sort) && (
                    <div className="filter-result">
                        Showing <strong>{vehicles.length}</strong> matching vehicle(s).
                    </div>
                )}
            </div>

            {/* Vehicles Display */}
            {loading ? (
                <Loading message="Loading your vehicles..." />
            ) : vehicles.length > 0 ? (
                <div className="grid">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle._id} className="card">
                            {/* Vehicle Image */}
                            <div className="vehicle-image">
                                {vehicle.image ? (
                                    <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} />
                                ) : (
                                    <div className="no-image">No Image Available</div>
                                )}
                            </div>

                            {/* Header */}
                            <div className="card-header">
                                <div className="card-title">
                                    {vehicle.brand} {vehicle.model}
                                </div>
                                <span className="badge-type">{vehicle.type || 'Vehicle'}</span>
                            </div>

                            {/* Body */}
                            <div className="card-body">
                                <div className="vehicle-num">
                                    Vehicle Reg No: <strong>{vehicle.vehicleNumber}</strong>
                                </div>

                                <div className="vehicle-num">
                                    City: <strong>{vehicle.city || 'N/A'}</strong>
                                </div>

                                <div className="price-tag">
                                    ₹{vehicle.pricePerDay} <span>/ day</span>
                                </div>

                                {vehicle.description && (
                                    <p className="description">{vehicle.description}</p>
                                )}

                                {/* Vehicle Availability */}
                                <p className={`status-tag ${vehicle.availability ? 'status-available' : 'status-unavailable'}`}>
                                    Status: {vehicle.availability ? 'Available for Rent' : 'Not Available'}
                                </p>

                                {/* Approval Status */}
                                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                                        Admin Approval:
                                    </div>

                                    {vehicle.approvalStatus === 'approved' && (
                                        <span className="approval-badge approval-approved">
                                            ✓ Approved
                                        </span>
                                    )}

                                    {vehicle.approvalStatus === 'rejected' && (
                                        <>
                                            <span className="approval-badge approval-rejected">
                                                ✕ Rejected
                                            </span>
                                            {vehicle.rejectionReason && (
                                                <div className="rejection-reason">
                                                    Admin Reason: {vehicle.rejectionReason}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {(!vehicle.approvalStatus || vehicle.approvalStatus === 'pending') && (
                                        <>
                                            <span className="approval-badge approval-pending">
                                                ⏳ Pending Approval
                                            </span>
                                            <p style={{ fontSize: '12px', color: '#856404', marginTop: '4px' }}>
                                                Your vehicle is waiting for admin approval.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="card-actions">
                                <Link to={`/owner/vehicles/edit/${vehicle._id}`} className="btn-edit">
                                    Edit
                                </Link>

                                <button
                                    onClick={() => handleDelete(vehicle._id)}
                                    disabled={deletingId === vehicle._id}
                                    className="btn-delete"
                                >
                                    {deletingId === vehicle._id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <h3>No Vehicles Found</h3>
                    {search || type || availability ? (
                        <>
                            <p>No vehicles match your current filter.</p>
                            <button onClick={handleReset} className="reset-btn">
                                Clear Filters
                            </button>
                        </>
                    ) : (
                        <>
                            <p>You haven't listed any vehicles for rent yet.</p>
                            <Link to="/owner/vehicles/add" className="btn-add">
                                + Add Your First Vehicle
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
