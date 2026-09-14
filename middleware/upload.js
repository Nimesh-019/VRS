const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key';

let storage;

if (isCloudinaryConfigured) {
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'vrs_vehicles',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        }
    });
} else {
    // Memory storage fallback when Cloudinary credentials are not set yet
    storage = multer.memoryStorage();
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
