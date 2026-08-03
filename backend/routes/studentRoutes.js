// C:\creative-academy\backend\routes\studentRoutes.js
const express = require('express');
const router = express.Router();

const { 
  getMyEnrollments, 
  getStudentCourseDetails,
  getCatalogCourses, 
  enrollInCourse,
  getCategories,
  getQuizByCourseId, 
  submitQuizAnswers,
  syncVideoProgress,
  getPublicCertificate,
  getMyCertificates,
  syncQuizSession 
} = require('../controllers/studentController');
const { downloadPublicCertificatePDF } = require('../controllers/certificateController');

const { protect, authorize } = require('../middleware/auth');

// 🔓 1. COMPLETELY PUBLIC ENDPOINTS (No token required)
router.get('/verify-credentials/:certId', getPublicCertificate);
router.get('/verify-credentials/:certId/download', downloadPublicCertificatePDF);
// ----------------------------------------------------------------------
// 🔒 SECURITY GATE MATRIX (Everything below this line requires login)
router.use(protect);
router.use(authorize('student', 'admin'));
// ----------------------------------------------------------------------

// 2. Authenticated Static Sub-paths
router.route('/categories').get(getCategories);
router.route('/catalog').get(getCatalogCourses);

router.route('/enrollments')
  .get(getMyEnrollments)
  .post(enrollInCourse); 

// 🎯 3. Quizzes 
router.route('/quizzes/course/:courseId').get(getQuizByCourseId);
router.route('/quizzes/:id/submit').post(submitQuizAnswers);
router.route('/quizzes/sync-session').post(syncQuizSession);

// 🎥 4. Dynamic Parameters (Always keep at the absolute bottom)
router.route('/courses/:courseId').get(getStudentCourseDetails);

router.route('/progress/video-complete').post(syncVideoProgress);

router.route('/certificates').get(getMyCertificates);

module.exports = router;