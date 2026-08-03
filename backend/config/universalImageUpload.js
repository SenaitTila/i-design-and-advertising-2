const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary Credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => { // 💡 Removed 'async' to ensure synchronous header resolution
    
    // Safely extract target folder from headers, defaulting if not found
    const targetFolder = req.headers['upload-folder'] || 'creative_academy_general_media';
    
    // Clean up the target folder name (remove special characters/spaces)
    const sanitizedFolder = targetFolder.replace(/[^a-zA-Z0-8_]/g, '_');

    // Extract file name without extension to use as a base for the public_id
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');

    return {
      folder: `creative-academy/${sanitizedFolder}`, // Beautifully structured subfolders
      format: 'jpeg', // 💡 Force convert to modern, web-optimized jpeg/webp format
      public_id: `${originalName}-${uniqueSuffix}`, // 💡 Guarantees a unique, clean URL on Cloudinary
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
      ]
    };
  },
});

// Configure Multer engine constraints
const universalImageUpload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Strict 5MB limit
  fileFilter: (req, file, cb) => {
    // 🛡️ Frontend files safety check at the server boundary
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

module.exports = universalImageUpload;