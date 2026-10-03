import React, { useState, useEffect } from 'react';
import api from '../services/api';
import VehicleCard from '../components/VehicleCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export const CustomerDashboard = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [city, setCity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('');

    const fetchVehicles = async (params = {}) => {
        setLoading(true);
        setError('');

        try {
            const query = new URLSearchParams();
            if (params.search) query.append('search', params.search);
            if (params.type) query.append('type', params.type);
            if (params.city) query.append('city', params.city);
            if (params.minPrice) query.append('minPrice', params.minPrice);
            if (params.maxPrice) query.append('maxPrice', params.maxPrice);
            if (params.sort) query.append('sort', params.sort);

            const queryString = query.toString() ? `?${query.toString()}` : '';
            const data = await api.get(`/vehicles${queryString}`);
            setVehicles(data.vehicles || []);
        } catch (err) {
            setError(err.message || 'Error fetching vehicles.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVehicles({ search, type, city, minPrice, maxPrice, sort });
    };

    const handleClear = () => {
        setSearch('');
        setType('');
        setCity('');
        setMinPrice('');
        setMaxPrice('');
        setSort('');
        fetchVehicles({});
    };

    return (
        <div className="container">
            {/* Section Header */}
            <div className="section-header">
                <div>
                    <h2>Vehicles Available for Rent</h2>
                    <p>Browse vehicles listed by owners and book the one you need.</p>
                </div>
            </div>

            {/* Filter Box */}
            <div className="filter-box">
                <form onSubmit={handleSearch} className="filter-form">
                    {/* Search */}
                    <input
                        type="text"
                        name="search"
                        placeholder="🔍 Search brand, model or registration no."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Vehicle Type */}
                    <select
                        name="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Car">Car</option>
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="SUV">SUV</option>
                        <option value="Other">Other</option>
                    </select>

                    {/* City */}
                    <input
                        type="text"
                        name="city"
                        placeholder="📍 City (e.g. Ahmedabad)"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />

                    {/* Min Price */}
                    <input
                        type="number"
                        name="minPrice"
                        placeholder="Min ₹ / day"
                        min="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                    />

                    {/* Max Price */}
                    <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max ₹ / day"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />

                    {/* Sort */}
                    <select
                        name="sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="">Sort By</option>
                        <option value="priceLow">Price: Low → High</option>
                        <option value="priceHigh">Price: High → Low</option>
                    </select>

                    {/* Search Button */}
                    <button type="submit" className="search-btn">
                        Search
                    </button>

                    {/* Clear Button */}
                    <button
                        type="button"
                        onClick={handleClear}
                        className="clear-btn"
                    >
                        Clear
                    </button>
                </form>
            </div>

            <ErrorMessage message={error} />

            {/* Loading State */}
            {loading ? (
                <Loading message="Loading vehicles..." />
            ) : (
                <>
                    {/* Results Info */}
                    {vehicles.length > 0 && (
                        <div className="results-info">
                            Showing <strong>{vehicles.length}</strong> vehicle{vehicles.length === 1 ? '' : 's'}
                        </div>
                    )}

                    {/* Vehicles Grid */}
                    {vehicles.length > 0 ? (
                        <div className="grid">
                            {vehicles.map((vehicle) => (
                                <VehicleCard key={vehicle._id} vehicle={vehicle} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>No Vehicles Found</h3>
                            {search || type || city || minPrice || maxPrice || sort ? (
                                <p>No vehicles match your current search or filter. Try changing your filters.</p>
                            ) : (
                                <p>There are currently no vehicles listed by owners. Please check back later!</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CustomerDashboard;
