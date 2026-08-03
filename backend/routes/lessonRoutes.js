// C:\creative-academy\backend\routes\lessonRoutes.js
const express = require('express');
// mergeParams handles incoming values from nested path pipelines perfectly
const router = express.Router({ mergeParams: true }); 

// Import the middleware directly as a function
const uploadLessonVideo = require('../config/cloudinary'); 
const { protect } = require('../middleware/auth'); // Added authentication layer

const {
  getCourseLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  syncVideoProgress // Imported the progress tracking controller function
} = require('../controllers/lessonController');

// 🎓 STUDENT TARGET ENDPOINTS
// Placed above parametrized routes to ensure the router doesn't mistake /video-complete for an :id parameter
router.post('/progress/video-complete', protect, syncVideoProgress);

// Handle root operations for standalone collections vs parent course pipeline collections
router.route('/')
  .get(getCourseLessons)
  // 🌟 FIX: Intercept using 'videoFile' to match frontend append('videoFile', videoFile) key name exactly
  .post(uploadLessonVideo.single('videoFile'), createLesson); 

router.route('/:id')
  // 🌟 FIX: Synced up update field parameters to 'videoFile' as well
  .put(uploadLessonVideo.single('videoFile'), updateLesson)   
  .delete(deleteLesson);

module.exports = router;