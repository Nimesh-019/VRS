const multer = require('multer');

// Use memory storage for clean, reliable image uploads (converted to base64 Data URIs)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadSingleImage = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('API File Upload Error:', err);
            const errorMessage = typeof err === 'string'
                ? err
                : (err.message || 'Error uploading vehicle image.');
            return res.status(400).json({ message: errorMessage });
        }
        next();
    });
};

module.exports = uploadSingleImage;
