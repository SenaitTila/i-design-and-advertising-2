const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../config/cloudinary');
const universalImageUpload = require('../config/universalImageUpload');

const { 
  getCourses, createCourse, updateCourse, deleteCourse,
  addVideoToCourse, updateCourseVideo, deleteCourseVideo,
  getEnrollments, revokeEnrollment, 
  getUsers, createUser, adminUpdateUserProfile, deleteUser, // 👈 Imported user creation & deletion
  getAccessCodes, createAccessCode,
  revokeAccessCode,
  getAllQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizTelemetryAnalytics
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// Lock down all admin layout nodes behind security gateways
router.use(protect);
router.use(authorize('admin'));

// --- ACCESS CODES / VOUCHER DISTRIBUTION HUB ROUTES ---  
router.route('/access-codes')
  .get(getAccessCodes)        
  .post(createAccessCode);

router.route('/access-codes/:id')
  .delete(revokeAccessCode);

// --- Top-Level Course Portfolio Routes ---
router.route('/courses')
  .get(getCourses)            
  .post(universalImageUpload.single('thumbnail'), createCourse);

router.route('/courses/:id')
  .put(universalImageUpload.single('thumbnail'), updateCourse)   
  .delete(deleteCourse);

// --- Playlist Asset Control Array Routes ---
router.route('/courses/:courseId/videos')
  .post(uploadMiddleware.single('videoFile'), addVideoToCourse);

router.route('/courses/:courseId/videos/:videoId')
  .put(updateCourseVideo)
  .delete(deleteCourseVideo);

// --- Dashboard Overlooks & Enrollment Registry Controls ---
router.route('/enrollments')
  .get(getEnrollments);

router.route('/enrollments/:id')
  .delete(revokeEnrollment);

// --- Identity & User Access Management Routes ---
router.route('/users')
  .get(getUsers)
  .post(createUser); // 👈 Added POST route for provisioning new users

router.route('/users/:id')
  .put(adminUpdateUserProfile) 
  .delete(deleteUser); // 👈 Added DELETE route for removing users

// --- 🎯 QUIZ MANAGEMENT ROUTES ---
router.route('/quizzes') 
  .get(getAllQuizzes)
  .post(createQuiz);

router.route('/quizzes/:id') 
  .put(updateQuiz)
  .delete(deleteQuiz);

router.get('/quizzes/analytics/:quizId', getQuizTelemetryAnalytics); 

// --- 🖼️ UNIVERSAL MEDIA UPLOAD ENGINE ---
router.post('/upload-image', universalImageUpload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Asset file buffer transmission empty.' });
  res.status(200).json({ success: true, imageURL: req.file.path });
});

module.exports = router;