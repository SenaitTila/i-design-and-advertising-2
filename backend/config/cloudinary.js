const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vod_academy_lessons',
    resource_type: 'video', // 🚨 CRITICAL: Tells Cloudinary to process this as video, not an image
    allowed_formats: ['mp4', 'mkv', 'mov', 'avi'],
    chunk_size: 6000000, // 6MB chunks for smoother upload pipelines
  },
});

const uploadMiddleware = multer({ storage: storage });

module.exports = uploadMiddleware;