import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

export const AddVehicle = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        vehicleNumber: '',
        brand: '',
        model: '',
        type: 'Car',
        pricePerDay: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
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

        if (!imageFile) {
            setError('Vehicle image is required.');
            return;
        }

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('vehicleNumber', formData.vehicleNumber.trim());
            data.append('brand', formData.brand.trim());
            data.append('model', formData.model.trim());
            data.append('type', formData.type);
            data.append('pricePerDay', formData.pricePerDay);
            data.append('description', formData.description.trim());
            data.append('image', imageFile);

            await api.upload('/owner/vehicles', data, 'POST');

            // Redirect back to owner dashboard
            navigate('/owner/dashboard');
        } catch (err) {
            setError(err.message || 'Error adding vehicle.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container">
            <div className="section-header">
                <div>
                    <h2>Add Vehicle</h2>
                    <p>List a new vehicle for rent in your registered city.</p>
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
                                placeholder="e.g. DL-01-AB-1234"
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
                                    placeholder="e.g. Honda, Hyundai, Yamaha"
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
                                    placeholder="e.g. City, Creta, R15"
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
                                    placeholder="e.g. 1500"
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
                                placeholder="Provide vehicle features, specs, transmission, or condition..."
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        {/* Image Upload */}
                        <div className="form-group">
                            <label htmlFor="image">Vehicle Image</label>
                            <input
                                type="file"
                                id="image"
                                name="image"
                                accept="image/*"
                                onChange={handleImageChange}
                                required
                            />

                            {imagePreview && (
                                <div style={{ marginTop: '10px' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="actions">
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={submitting}
                            >
                                {submitting ? 'Adding Vehicle...' : 'Add Vehicle'}
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

export default AddVehicle;
