import React from 'react';
import { Link } from 'react-router-dom';

export const VehicleCard = ({ vehicle }) => {
    const owner = vehicle.ownerId;

    return (
        <div className="card">
            {/* Vehicle Image */}
            <div className="vehicle-image">
                {vehicle.image ? (
                    <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} />
                ) : (
                    <div className="no-image">No Image Available</div>
                )}
            </div>

            {/* Card Header */}
            <div className="card-header">
                <div className="card-title">
                    {vehicle.brand} {vehicle.model}
                </div>
                <span className="badge-type">
                    {vehicle.type || 'Vehicle'}
                </span>
            </div>

            {/* Card Body */}
            <div className="card-body">
                <div className="vehicle-num">
                    Reg No: <strong>{vehicle.vehicleNumber}</strong>
                </div>

                <div className="vehicle-num" style={{ marginTop: '4px' }}>
                    City: <strong>{vehicle.city || (owner && owner.city) || 'N/A'}</strong>
                </div>

                <div className="price-tag">
                    ₹{vehicle.pricePerDay} <span>/ day</span>
                </div>

                {vehicle.description && (
                    <p className="description">{vehicle.description}</p>
                )}

                {/* Owner Information */}
                <div className="owner-box">
                    <strong>Owner Details</strong>
                    {owner ? (
                        <>
                            <p>👤 {owner.name}</p>
                            <p>📧 {owner.email}</p>
                            <p>📞 {owner.phone}</p>
                        </>
                    ) : (
                        <p>Owner info unavailable</p>
                    )}
                </div>
            </div>

            {/* Card Footer */}
            <div className="card-footer">
                {vehicle.availability ? (
                    <>
                        <span className="status-available">✓ Available for Rent</span>
                        <Link to={`/book/${vehicle._id}`} className="book-btn">
                            Book Now
                        </Link>
                    </>
                ) : (
                    <span className="status-unavailable">✗ Currently Rented</span>
                )}
            </div>
        </div>
    );
};

export default VehicleCard;
