// Simple and clean API client for Express backend communication
const API_BASE = '/api';

export const api = {
    // GET request
    async get(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include' // include cookies for authentication
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        return data;
    },

    // POST request with JSON body
    async post(endpoint, body = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        return data;
    },

    // POST/PUT request with FormData (for image file uploads)
    async upload(endpoint, formData, method = 'POST') {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: method,
            headers: {
                'Accept': 'application/json'
                // Content-Type is set automatically by the browser with correct multipart boundary
            },
            credentials: 'include',
            body: formData
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Upload failed with status ${response.status}`);
        }
        return data;
    },

    // DELETE request
    async delete(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Delete failed with status ${response.status}`);
        }
        return data;
    }
};

export default api;
