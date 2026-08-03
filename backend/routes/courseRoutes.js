const express = require('express');
const router = express.Router();

// Import Cloudinary upload middleware
const universalImageUpload = require('../config/universalImageUpload');

// Import your controller handlers
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

// Course catalog core endpoints
router.route('/courses')
  .get(getCourses)
  .post(universalImageUpload.single('thumbnail'), createCourse); // Binds middleware image field to controller logic

router.route('/courses/:id')
  .put(universalImageUpload.single('thumbnail'), updateCourse)
  .delete(deleteCourse);

module.exports = router;