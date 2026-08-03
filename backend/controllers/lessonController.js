// C:\creative-academy\backend\controllers\lessonController.js
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// ==========================================
// 🛠️ ADMIN SESSIONS / SKELETON CRUD CONTROLLERS
// ==========================================

// @desc    Get all lessons (optionally filtered by a specific parent course)
// @route   GET /api/v1/admin/courses/:courseId/lessons
// @access  Private/Admin
exports.getCourseLessons = async (req, res, next) => {
  try {
    const targetCourseId = req.params.courseId || req.params.id;

    if (!targetCourseId || !mongoose.Types.ObjectId.isValid(targetCourseId)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid MongoDB course unique identifier."
      });
    }

    const lessons = await Lesson.find({ course: targetCourseId })
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: lessons.length, 
      data: lessons 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new lesson structural node under a target course
// @route   POST /api/v1/admin/courses/:courseId/lessons
// @access  Private/Admin
exports.createLesson = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        error: "A valid parent courseId parameter must be provided in the URL routing path."
      });
    }

    const parentCourse = await Course.findById(courseId);
    if (!parentCourse) {
      return res.status(404).json({
        success: false,
        error: `No course package discovered with ID: ${courseId}`
      });
    }

    // 🌟 Capture the secure URL returned from Cloudinary (req.file) or fallback to raw string input
    let finalVideoUrl = req.body.videoUrl;
    if (req.file && req.file.path) {
      finalVideoUrl = req.file.path; 
    }

    if (!finalVideoUrl) {
      return res.status(400).json({
        success: false,
        error: "Please upload a streaming media file or provide an external URL string asset."
      });
    }

    const lessonData = {
      title: req.body.title,
      duration: req.body.duration,
      order: Number(req.body.order) || 0,
      videoUrl: finalVideoUrl,
      course: courseId,   
      courseId: courseId  
    };

    const newLesson = await Lesson.create(lessonData);

    if (!parentCourse.lessons) parentCourse.lessons = [];
    if (!parentCourse.videos) parentCourse.videos = [];

    parentCourse.lessons.push(newLesson._id);
    parentCourse.videos.push(newLesson._id);
    await parentCourse.save();

    res.status(201).json({
      success: true,
      message: "Streaming asset lesson built and linked successfully!",
      data: newLesson
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a specific lesson node parameter set (Handles file modifications)
// @route   PUT /api/v1/admin/courses/:courseId/lessons/:id OR PUT /api/v1/admin/lessons/:id
// @access  Private/Admin
exports.updateLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id || req.params.lessonId;

    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid target lesson identifier format. Received: ${lessonId}` 
      });
    }

    const updatePayload = {};
    if (req.body.title !== undefined) updatePayload.title = req.body.title;
    if (req.body.duration !== undefined) updatePayload.duration = req.body.duration;
    if (req.body.order !== undefined) updatePayload.order = Number(req.body.order) || 0;

    if (req.file && req.file.path) {
      updatePayload.videoUrl = req.file.path; 
    } else if (req.body.videoUrl) {
      updatePayload.videoUrl = req.body.videoUrl; 
    }

    const lesson = await Lesson.findByIdAndUpdate(lessonId, updatePayload, {
      returnDocument: 'after', 
      runValidators: true
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Target lesson component node not found in database.' });
    }

    res.status(200).json({ 
      success: true, 
      message: "Lesson document attributes updated successfully!",
      data: lesson 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Permanently delete an individual lesson and clean reference mappings
// @route   DELETE /api/v1/admin/courses/:courseId/lessons/:id
// @access  Private/Admin
exports.deleteLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ success: false, error: 'Invalid target lesson parameter asset format.' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Target lesson track not found.' });
    }

    const parentCourseId = lesson.course || lesson.courseId;

    await Lesson.findByIdAndDelete(lessonId);

    if (parentCourseId) {
      await Course.findByIdAndUpdate(parentCourseId, {
        $pull: { 
          lessons: lessonId, 
          videos: lessonId 
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      data: {} 
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 🎓 STUDENT PROGRESS & DETAIL CONTROLLERS
// ==========================================

// @desc    Get individual course details with logged student completion progress
// @route   GET /api/v1/student/courses/:courseId
// @access  Private/Student
exports.getStudentCourseDetails = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?.id || req.user?._id;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, error: "Please provide a valid course ID." });
    }

    // 1. Fetch course details and populate the related lesson/video documents
    const course = await Course.findById(courseId).populate({
      path: 'videos',
      options: { sort: { order: 1, createdAt: 1 } }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: "Course not found." });
    }

    // 2. Fetch the student's enrollment tracking progress
    const Enrollment = mongoose.model('Enrollment');
let enrollment = await Enrollment.findOne({ user: studentId, course: courseId });
    // 3. Merge enrollment tracking metrics seamlessly into a structured payload response
    const courseData = course.toObject();
    courseData.completedVideos = enrollment ? enrollment.completedVideos : [];
    courseData.isCompleted = enrollment ? enrollment.isCompleted : false;
    courseData.progress = enrollment ? enrollment.progress : 0;
    courseData.certificateId = enrollment ? enrollment.certificateId : null;

    res.status(200).json({
      success: true,
      data: courseData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Track completed videos and dynamically update global percentage status
// @route   POST /api/v1/student/progress/video-complete
// @access  Private/Student
exports.syncVideoProgress = async (req, res, next) => {
  try {
    const { courseId, videoId } = req.body;
    const studentId = req.user?.id || req.user?._id; 

    if (!courseId || !videoId || !mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ success: false, error: "Valid courseId and videoId must be provided." });
    }

    // 1. Fetch total lessons available inside parent course document framework
    const parentCourse = await Course.findById(courseId);
    if (!parentCourse) {
      return res.status(404).json({ success: false, error: "Parent course container not found." });
    }
    const totalVideosCount = parentCourse.videos?.length || 0;

    // 2. Find student's enrollment record
    const Enrollment = mongoose.model('Enrollment'); 
let enrollment = await Enrollment.findOne({ user: studentId, course: courseId });
    if (!enrollment) {
      return res.status(404).json({ success: false, error: "Active enrollment parameter token for this student not found." });
    }

    // Initialize trackers safely if they are blank
    if (!enrollment.completedVideos) enrollment.completedVideos = [];

    // 3. Append video reference pointer uniquely if not tracking yet
    if (!enrollment.completedVideos.includes(videoId)) {
      enrollment.completedVideos.push(videoId);
    }

    // 4. Mathematical percentage evaluation
    let calculatedProgress = 0;
    if (totalVideosCount > 0) {
      calculatedProgress = Math.round((enrollment.completedVideos.length / totalVideosCount) * 100);
    }
    
    enrollment.progress = calculatedProgress;
    
    // Auto-mark course completion if progress touches 100%
    if (calculatedProgress === 100) {
      enrollment.isCompleted = true;
    }

    await enrollment.save();

    // 🌟 Structuring payload wrapper data directly matching frontend state expectations
    res.status(200).json({
      success: true,
      data: {
        progress: enrollment.progress,
        completedVideos: enrollment.completedVideos,
        isCompleted: enrollment.isCompleted
      }
    });
  } catch (err) {
    next(err);
  }
};