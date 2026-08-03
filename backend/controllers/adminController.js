// C:\creative-academy\backend\controllers\adminController.js

const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Lesson = require('../models/Lesson'); 
const AccessCode = require('../models/AccessCode');

const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// ==========================================
// 🏫 COURSE CONTROLLERS
// ==========================================

// @desc    Get all courses with category relations and lessons appended
// @route   GET /api/v1/admin/courses
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('category', 'name status')
      .sort({ createdAt: -1 });

    const coursesWithLessons = await Promise.all(
      courses.map(async (course) => {
        const courseObj = course.toObject();
        courseObj.lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });
        return courseObj;
      })
    );

    res.status(200).json({ success: true, data: coursesWithLessons });
  } catch (err) { next(err); }
};

// @desc    Create a brand new video course container
// @route   POST /api/v1/admin/courses
// ==========================================
// 🏫 COURSE CONTROLLERS
// ==========================================

// @desc    Create a brand new video course container
// @route   POST /api/v1/admin/courses
exports.createCourse = async (req, res, next) => {
  try {
    // 1. Destructure fields from body
    const { title, category, description, price, status } = req.body;

    // 2. Extract the file path if a file was uploaded, otherwise fallback to text URL or empty string
    const thumbnailUrl = req.file ? req.file.path : (req.body.thumbnailUrl || '');

    const courseData = {
      title,
      category,
      description,
      price,
      status: status || 'Active',
      thumbnailUrl
    };

    const course = await Course.create(courseData);
    res.status(201).json({ success: true, data: course });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Update top-level parameters of a course
// @route   PUT /api/v1/admin/courses/:id
exports.updateCourse = async (req, res, next) => {
  try {
    // 1. Build update payload dynamically so we don't overwrite with undefined
    const fieldsToUpdate = ['title', 'category', 'description', 'price', 'status'];
    const updateData = {};

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // 2. Handle image file update
    if (req.file) {
      updateData.thumbnailUrl = req.file.path; // New image file uploaded
    } else if (req.body.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = req.body.thumbnailUrl; // Retained or modified text URL
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      runValidators: true
    });

    if (!course) return res.status(404).json({ success: false, error: 'Target course not found' });
    
    res.status(200).json({ success: true, data: course });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Permanently delete an entire course portfolio and associated lessons
// @route   DELETE /api/v1/admin/courses/:id
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course target not found' });
    
    await Lesson.deleteMany({ course: req.params.id });
    res.status(200).json({ success: true, data: {} });
  } catch (err) { next(err); }
};

// ==========================================
// 🎞️ LESSON PORTFOLIO MANAGEMENT
// ==========================================

// @desc    Upload file or save link and create a standalone Lesson document
// @route   POST /api/v1/admin/lessons
exports.addVideoToCourse = async (req, res, next) => {
  try {
    const targetCourseId = req.body.course || req.params.courseId;
    
    const courseExists = await Course.findById(targetCourseId);
    if (!courseExists) return res.status(404).json({ success: false, error: 'Course entry not found' });

    let finalVideoUrl = req.body.videoUrl;
    if (req.file && req.file.path) {
      finalVideoUrl = req.file.path; 
    }

    if (!finalVideoUrl) {
      return res.status(400).json({ success: false, error: 'Please upload a physical asset or supply a valid source link string' });
    }

    const lesson = await Lesson.create({
      course: targetCourseId,
      title: req.body.title,
      videoUrl: finalVideoUrl,
      duration: req.body.duration || "00:00",
      order: parseInt(req.body.order, 10) || 1
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

// @desc    Modify fields of a standalone lesson document
// @route   PUT /api/v1/admin/lessons/:lessonId
exports.updateCourseVideo = async (req, res, next) => {
  try {
    let updateData = { ...req.body };
    
    if (req.file && req.file.path) {
      updateData.videoUrl = req.file.path;
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.lessonId, updateData, {
      returnDocument: 'after',
      runValidators: true
    });

    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson document missing' });
    res.status(200).json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

// @desc    Remove an individual lesson document safely
// @route   DELETE /api/v1/admin/lessons/:lessonId
exports.deleteCourseVideo = async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson document reference missing' });
    
    res.status(200).json({ success: true, data: {} });
  } catch (err) { next(err); }
};

// ==========================================
// 👥 ENROLLMENTS & USER OVERRIDES
// ==========================================

exports.getEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('user', 'name email')       
      .populate('course', 'title')          
      .sort({ enrolledAt: -1 });            

    res.status(200).json({ success: true, data: enrollments });
  } catch (err) { 
    console.error("Backend Error inside getEnrollments:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.revokeEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) return res.status(404).json({ success: false, error: 'Target enrollment record not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.adminUpdateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User account not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) user.role = req.body.role;
    if (req.body.password) user.password = req.body.password; 

    await user.save();
    user.password = undefined; 

    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ==========================================
// 🛡️ ACCESS CODE / VOUCHER CONTROLLERS
// ==========================================

exports.createAccessCode = async (req, res, next) => {
  try {
    const { courseId, durationDays, prefix } = req.body;

    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({ success: false, error: 'Target course context metadata not found.' });
    }

    const codePrefix = prefix ? prefix.trim().toUpperCase() : 'CAD';
    const uniqueToken = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const uniqueCodeString = `${codePrefix}-${uniqueToken}`;

    const newAccessCode = await AccessCode.create({
      code: uniqueCodeString,
      course: courseId,
      durationDays: durationDays || 30,
      createdBy: req.user.id 
    });

    res.status(201).json({ success: true, data: newAccessCode });
  } catch (err) { next(err); }
};

exports.getAccessCodes = async (req, res, next) => {
  try {
    const codes = await AccessCode.find()
      .populate('course', 'title price')
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: codes.length,
      data: codes
    });
  } catch (err) { next(err); }
};





// @desc    Deactivate/Revoke an access voucher code
// @route   DELETE /api/v1/admin/access-codes/:id
// @access  Private/Admin
exports.revokeAccessCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Changes status flag to inactive or toggles an isActive boolean field
    const accessCode = await AccessCode.findByIdAndUpdate(
      id,
      { isActive: false, revokedAt: new Date() },
      { new: true }
    );

    if (!accessCode) {
      return res.status(404).json({
        success: false,
        message: 'Access code not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Access code successfully deactivated.',
      data: accessCode
    });
  } catch (error) {
    console.error('Error deactivating access code:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error encountered while changing voucher status.'
    });
  }
};









// ==========================================
// 📝 ASSESSMENT & QUIZ ENGINE INTERFACES
// ==========================================

// @desc    Get all quizzes with parental configuration records
// @route   GET /api/v1/admin/quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('course', 'title');
    res.status(200).json({ success: true, data: quizzes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database dropped evaluation index syncing.' });
  }
};

// @desc    Create a brand new exam logic map container
// @route   POST /api/v1/admin/quizzes
exports.createQuiz = async (req, res) => {
  try {
    // 💡 Added maxAttempts to destructured body properties
    const { title, course, description, passingPercentage, questionsPerPage, duration, maxAttempts, questions } = req.body;

    if (!title || !course || !questions || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing mandatory quiz definition metrics.' });
    }

    const newQuiz = await Quiz.create({ 
      title, 
      course, 
      description, 
      passingPercentage: passingPercentage || 70, 
      questionsPerPage: questionsPerPage || 1, 
      duration: duration || 30, 
      maxAttempts: maxAttempts || 3, // 💡 Persisted to DB with fallback defaults
      questions 
    });
    
    res.status(201).json({ success: true, data: newQuiz });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Modify structurally nested fields inside an active assessment schema
// @route   PUT /api/v1/admin/quizzes/:id
exports.updateQuiz = async (req, res) => {
  try {
    // 💡 Added maxAttempts to destructured body properties
    const { title, course, description, passingPercentage, questionsPerPage, duration, maxAttempts, questions } = req.body;

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        course, 
        description, 
        passingPercentage: passingPercentage || 70, 
        questionsPerPage: questionsPerPage || 1, 
        duration: duration || 30, 
        maxAttempts: maxAttempts || 3, // 💡 Enabled updates for the dynamic configuration field
        questions 
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedQuiz) {
      return res.status(404).json({ success: false, error: 'Target assessment node not found.' });
    }

    res.status(200).json({ success: true, data: updatedQuiz });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Wipe an active assessment node and cascading metrics entries clean
// @route   DELETE /api/v1/admin/quizzes/:id
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Target node context missing.' });
    }
    await QuizAttempt.deleteMany({ quizId: req.params.id });
    res.status(200).json({ success: true, message: 'Quiz structural components dropped completely.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to purge data nodes.' });
  }
};

// @desc    Process active student telemetry streams against targeted evaluation keys
// @route   GET /api/v1/admin/quizzes/analytics/:quizId
exports.getQuizTelemetryAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;
    const targetQuiz = await Quiz.findById(quizId);
    if (!targetQuiz) return res.status(404).json({ success: false, error: 'Assessment missing.' });

    const attempts = await QuizAttempt.find({ quizId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          quizTitle: targetQuiz.title,
          passingPercentage: targetQuiz.passingPercentage || 70,
          maxAttempts: targetQuiz.maxAttempts || 3, // 💡 Passed through context metadata payload
          summary: { totalAttempts: 0, averageScore: 0, highestScore: 0, lowestScore: 0 },
          students: []
        }
      });
    }

    const totalAttempts = attempts.length;
    const scoresArray = attempts.map(a => a.percentage);
    const averageScore = scoresArray.reduce((acc, curr) => acc + curr, 0) / totalAttempts;
    const highestScore = Math.max(...scoresArray);
    const lowestScore = Math.min(...scoresArray);

    res.status(200).json({
      success: true,
      data: {
        quizTitle: targetQuiz.title,
        passingPercentage: targetQuiz.passingPercentage || 70,
        maxAttempts: targetQuiz.maxAttempts || 3, // 💡 Passed through context metadata payload
        summary: { totalAttempts, averageScore, highestScore, lowestScore },
        students: attempts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Telemetry parsing compilation dropped.' });
  }
};

// @desc    Register / Provision a new user account
// @route   POST /api/v1/admin/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.'
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // 3. Create new user record
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role: role || 'student',
      password // Assumes pre('save') hook in User model handles hashing
    });

    // 4. Exclude password from response payload
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};



// @desc    Delete user account
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};








