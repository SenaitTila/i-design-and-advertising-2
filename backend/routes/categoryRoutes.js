const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// 💾 Configure Local Storage or Memory Storage Engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure an 'uploads' directory exists in your root backend folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 5MB Limit
});

// ==========================================
// 🛣️ CATEGORY ROUTING MATRIX (WITH FILE INTERCEPTORS)
// ==========================================

// Handles paths matching: /api/v1/admin/categories
router.route('/')
  .get(getCategories)
  .post(upload.single('thumbnail'), createCategory); // ✨ Intercepts multipart text fields and files safely

// Handles paths matching: /api/v1/admin/categories/:id
router.route('/:id')
  .put(upload.single('thumbnail'), updateCategory) // ✨ Intercepts update streams smoothly
  .delete(deleteCategory);

module.exports = router;