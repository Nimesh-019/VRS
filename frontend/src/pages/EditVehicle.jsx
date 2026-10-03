import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const EditVehicle = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        vehicleNumber: '',
        brand: '',
        model: '',
        type: 'Car',
        pricePerDay: '',
        description: '',
        availability: true
    });
    const [existingImage, setExistingImage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const data = await api.get(`/owner/vehicles/${id}`);
                const v = data.vehicle;
                setFormData({
                    vehicleNumber: v.vehicleNumber || '',
                    brand: v.brand || '',
                    model: v.model || '',
                    type: v.type || 'Car',
                    pricePerDay: v.pricePerDay || '',
                    description: v.description || '',
                    availability: v.availability !== undefined ? v.availability : true
                });
                setExistingImage(v.image || '');
            } catch (err) {
                setError(err.message || 'Error fetching vehicle details.');
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [id]);

    const handleChange = (e) => {
        const value = e.target.name === 'availability' ? e.target.value === 'true' : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('vehicleNumber', formData.vehicleNumber.trim());
            data.append('brand', formData.brand.trim());
            data.append('model', formData.model.trim());
            data.append('type', formData.type);
            data.append('pricePerDay', formData.pricePerDay);
            data.append('description', formData.description.trim());
            data.append('availability', formData.availability);
            if (imageFile) {
                data.append('image', imageFile);
            }

            await api.upload(`/owner/vehicles/${id}`, data, 'PUT');

            // Redirect back to owner dashboard
            navigate('/owner/dashboard');
        } catch (err) {
            setError(err.message || 'Error updating vehicle.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading message="Loading vehicle data..." />;

    return (
        <div className="container">
            <div className="section-header">
                <div>
                    <h2>Edit Vehicle Details</h2>
                    <p>Update vehicle details, availability status, or image.</p>
                </div>
                <Link to="/owner/dashboard" className="reset-btn">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="auth-wrapper" style={{ padding: '10px 0' }}>
                <div className="auth-card" style={{ maxWidth: '650px' }}>
                    <ErrorMessage message={error} />

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="vehicleNumber">Vehicle Number / Registration</label>
                            <input
                                type="text"
                                id="vehicleNumber"
                                name="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="brand">Brand / Make</label>
                                <input
                                    type="text"
                                    id="brand"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="model">Model</label>
                                <input
                                    type="text"
                                    id="model"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="type">Vehicle Type</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Car">Car</option>
                                    <option value="Bike">Bike</option>
                                    <option value="Scooter">Scooter</option>
                                    <option value="SUV">SUV</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="pricePerDay">Price Per Day (₹)</label>
                                <input
                                    type="number"
                                    id="pricePerDay"
                                    name="pricePerDay"
                                    min="0"
                                    value={formData.pricePerDay}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="availability">Availability</label>
                            <select
                                id="availability"
                                name="availability"
                                value={formData.availability ? 'true' : 'false'}
                                onChange={handleChange}
                            >
                                <option value="true">Available for Rent</option>
                                <option value="false">Not Available</option>
                            </select>
                        </div>

                        {/* Image Change */}
                        <div className="form-group">
                            <label htmlFor="image">Change Vehicle Image</label>

                            {existingImage && !imagePreview && (
                                <div style={{ marginBottom: '10px' }}>
                                    <img
                                        src={existingImage}
                                        alt="Current Vehicle"
                                        style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0' }}>Current Image</p>
                                </div>
                            )}

                            {imagePreview && (
                                <div style={{ marginBottom: '10px' }}>
                                    <img
                                        src={imagePreview}
                                        alt="New Preview"
                                        style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#16a34a', margin: '4px 0' }}>New Image Selected</p>
                                </div>
                            )}

                            <input
                                type="file"
                                id="image"
                                name="image"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="actions">
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={submitting}
                            >
                                {submitting ? 'Updating...' : 'Update Vehicle'}
                            </button>
                            <Link to="/owner/dashboard" className="btn-cancel">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditVehicle;
