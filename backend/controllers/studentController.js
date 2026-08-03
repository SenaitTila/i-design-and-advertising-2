const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Category = require('../models/Category');
const AccessCode = require('../models/AccessCode');
const Lesson = require('../models/Lesson'); 
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const QuizSession = require('../models/QuizSession');
const Certificate = require('../models/Certificate');
const mongoose = require('mongoose');

// @desc    Get all active enrollments for the logged-in student
// @route   GET /api/v1/student/enrollments
// @access  Private (Student)
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const studentId = req.user._id || req.user.id;
    
    const enrollments = await Enrollment.find({
      $or: [{ student: studentId }, { user: studentId }]
    }).populate({
      path: 'course',
      select: 'title category thumbnailUrl description videos',
      match: { status: 'Active' }
    });

    const activeEnrollments = enrollments.filter(e => e.course !== null);

    res.status(200).json({
      success: true,
      count: activeEnrollments.length,
      data: activeEnrollments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get specific course content + video playlist for player theater
// @route   GET /api/v1/student/courses/:courseId
// @access  Private (Student/Admin)
exports.getStudentCourseDetails = async (req, res, next) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { courseId } = req.params;

    if (req.user.role !== 'admin') {
      const isEnrolled = await Enrollment.findOne({
        $or: [
          { student: studentId, course: courseId },
          { user: studentId, course: courseId }
        ]
      });

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You must be enrolled in this course to stream lessons.'
        });
      }
    }

    const course = await Course.findById(courseId).select('-__v');
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'The requested course content could not be found.'
      });
    }

    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 }).select('-__v');
    
    const enrollment = await Enrollment.findOne({
      $or: [{ student: studentId, course: courseId }, { user: studentId, course: courseId }]
    });

    const certificate = await Certificate.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId)
    });

    const courseData = course.toObject();
    courseData.videos = lessons; 
    
    courseData.completedVideos = enrollment ? enrollment.completedVideos || [] : [];
    courseData.isCompleted = enrollment ? !!enrollment.isCompleted : !!certificate;
    courseData.certificateId = certificate ? certificate.certificateId : null;

    res.status(200).json({
      success: true,
      data: courseData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all published/active courses for the catalog layout
// @route   GET /api/v1/student/catalog
// @access  Private (Student/Admin)
exports.getCatalogCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ status: 'Active' })
      .populate({
        path: 'category',
        select: 'name description thumbnailUrl status'
      })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Self-enroll into a specific catalog course using a unique access code
// @route   POST /api/v1/student/enrollments
// @access  Private (Student)
exports.enrollInCourse = async (req, res, next) => {
  try {
    const { courseId, enrollmentCode } = req.body;
    const studentId = req.user._id || req.user.id;

    if (!enrollmentCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'An access registration code is required to unlock this blueprint track.' 
      });
    }

    const codeRecord = await AccessCode.findOne({ code: enrollmentCode.trim() });

    if (!codeRecord) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid access code. Please request a valid key from an administrator.' 
      });
    }

    if (codeRecord.usedBy || codeRecord.usedAt) {
      return res.status(400).json({ 
        success: false, 
        error: 'This code has already been redeemed and cannot be used again.' 
      });
    }

    if (!codeRecord.course.equals(courseId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'This registration code is not valid for this specific course blueprint.' 
      });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      $or: [
        { student: studentId, course: courseId },
        { user: studentId, course: courseId }
      ]
    });

    if (alreadyEnrolled) {
      return res.status(400).json({ 
        success: false, 
        error: 'You are already actively enrolled in this training module.' 
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (codeRecord.durationDays || 30));

    const enrollment = await Enrollment.create({
      student: studentId,
      user: studentId,
      course: courseId,
      completedVideos: [],
      progress: 0,
      expiresAt 
    });

    codeRecord.usedBy = studentId;
    codeRecord.usedAt = new Date();
    await codeRecord.save();

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get categories with calculated active tracking analytics
// @route   GET /api/v1/student/categories
// @access  Private (Student)
exports.getCategories = async (req, res, next) => {
  try {
    const categoriesWithSums = await Category.aggregate([
      {
        $lookup: {
          from: 'courses', 
          localField: '_id',
          foreignField: 'category',
          as: 'coursesData'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          thumbnailUrl: 1,
          status: 1,
          createdAt: 1,
          totalTrackPrice: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$coursesData',
                    as: 'c',
                    cond: { $eq: ['$$c.status', 'Active'] }
                  }
                },
                as: 'activeCourse',
                in: { $ifNull: ['$$activeCourse.price', 0] }
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: categoriesWithSums.length,
      data: categoriesWithSums
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Synchronize active quiz answers using the dedicated QuizSession model
// @route   POST /api/v1/student/quizzes/sync-session
// @access  Private (Student)
exports.syncQuizSession = async (req, res, next) => {
  try {
    const { courseId, quizId, answers, timeLeft } = req.body;
    const studentId = req.user._id || req.user.id;

    if (!courseId || !quizId) {
      return res.status(400).json({ success: false, error: 'Missing session synchronization identifiers.' });
    }

    await QuizSession.findOneAndUpdate(
      { student: studentId, quiz: quizId, course: courseId },
      { $set: { answers: answers || {}, timeLeft: timeLeft ?? 0 } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Progress telemetry matrix updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get quiz configuration + handle cross-device session tracking via QuizSession model
// @route   GET /api/v1/student/quizzes/course/:courseId
// @access  Private (Student)
exports.getQuizByCourseId = async (req, res, next) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { courseId } = req.params;

    const alreadyCertified = await Certificate.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId)
    });

    if (alreadyCertified) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You have successfully completed this course quiz and earned a certificate.'
      });
    }

    const quiz = await Quiz.findOne({ course: courseId }).select('-__v');
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'No assessment modules found for this course.' });
    }

    const attemptsCount = await QuizAttempt.countDocuments({ studentId, quizId: quiz._id });
    const maxAllowedAttempts = quiz.maxAttempts || 3;

    if (attemptsCount >= maxAllowedAttempts) {
      return res.status(403).json({ success: false, error: 'Access denied. You have exhausted all allowed attempts.' });
    }

    let session = await QuizSession.findOne({ 
      student: studentId, 
      quiz: quiz._id, 
      course: courseId 
    });

    let restoredAnswers = {};
    const durationSeconds = quiz.duration ? quiz.duration * 60 : 3600;
    let calculatedSecondsLeft = durationSeconds;

    if (session) {
      restoredAnswers = session.answers || {};
      if (session.timeLeft !== undefined && session.timeLeft !== null) {
        calculatedSecondsLeft = session.timeLeft;
      }
    } else {
      session = await QuizSession.create({
        student: studentId,
        quiz: quiz._id,
        course: courseId,
        answers: {},
        timeLeft: durationSeconds,
        status: 'in-progress'
      });
      calculatedSecondsLeft = durationSeconds;
    }

    const safeQuiz = quiz.toObject();

    if (safeQuiz.questions && Array.isArray(safeQuiz.questions)) {
      safeQuiz.questions = safeQuiz.questions.map(question => {
        const { correctOptionIndex, ...safeQuestion } = question;
        return safeQuestion;
      });
    }

    res.status(200).json({
      success: true,
      attemptsMade: attemptsCount,
      attemptsRemaining: Math.max(0, maxAllowedAttempts - attemptsCount),
      restoredSession: {
        hasSavedSession: Object.keys(restoredAnswers).length > 0 || calculatedSecondsLeft < durationSeconds,
        answers: restoredAnswers,
        timeLeft: calculatedSecondsLeft
      },
      data: safeQuiz
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit answers for evaluation, calculate scores, and clean up backup state
// @route   POST /api/v1/student/quizzes/:id/submit
// @access  Private (Student)
exports.submitQuizAnswers = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const studentId = req.user._id || req.user.id; 
    const { answers, courseId } = req.body; 

    let subAnswers = [];
    if (Array.isArray(answers)) {
      subAnswers = answers;
    } else if (answers && typeof answers === 'object') {
      subAnswers = Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex
      }));
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz module missing.' });
    }

    const structuralAttemptsCount = await QuizAttempt.countDocuments({ studentId, quizId });
    if (structuralAttemptsCount >= (quiz.maxAttempts || 3)) {
      return res.status(403).json({ success: false, error: 'Submission blocked. Attempts limit reached.' });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions ? quiz.questions.length : 0;
    const evaluatedAnswersPipeline = [];

    if (totalQuestions > 0) {
      quiz.questions.forEach((question) => {
        if (!question || !question._id) return;

        const studentSubmission = subAnswers.find(a => {
          if (!a || !a.questionId) return false;
          const targetId = question._id.toString();
          const submittedId = typeof a.questionId === 'object' && a.questionId._id 
            ? a.questionId._id.toString() 
            : a.questionId.toString();
          return submittedId === targetId;
        });

        const selectedIndex = studentSubmission ? studentSubmission.selectedOptionIndex : null;
        const isCorrect = selectedIndex !== null && selectedIndex !== undefined &&
                          Number(selectedIndex) === Number(question.correctOptionIndex);
                          
        if (isCorrect) correctCount++;

        evaluatedAnswersPipeline.push({
          questionId: question._id,
          selectedOptionIndex: selectedIndex,
          isCorrect
        });
      });
    }

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const hasPassed = percentage >= (quiz.passingPercentageRequired || quiz.passingPercentage || 0);

    const attempt = await QuizAttempt.create({
      studentId,
      quizId,
      score: correctCount,
      totalQuestions,
      percentage,
      answers: evaluatedAnswersPipeline
    });

    if (courseId) {
      await QuizSession.deleteOne({ student: studentId, quiz: quizId, course: courseId });
    } else {
      await QuizSession.deleteMany({ student: studentId, quiz: quizId });
    }

    let certificateData = null;
    if (hasPassed && quiz.course) {
      certificateData = await Certificate.findOneAndUpdate(
        { studentId, courseId: quiz.course },
        { studentId, courseId: quiz.course },
        { upsert: true, new: true }
      );
      
      await Enrollment.updateOne(
        { $or: [{ student: studentId, course: quiz.course }, { user: studentId, course: quiz.course }] },
        { $set: { isCompleted: true } }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        hasPassed,
        certificate: certificateData
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public verification details for a completed course certificate
// @route   GET /api/v1/student/verify-credentials/:certId
// @access  Public
exports.getPublicCertificate = async (req, res, next) => {
  try {
    const { certId } = req.params; 
    if (!certId) {
      return res.status(400).json({ success: false, error: "Missing tracking serial token identifier." });
    }

    const formattedCertId = certId.trim().toLowerCase();

    const certificate = await Certificate.findOne({ certificateId: formattedCertId })
      .populate('courseId', 'title description')
      .populate('studentId', 'name')
      .select('-__v');

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        error: "This certificate tracking credential could not be found or validated." 
      });
    }

    return res.status(200).json({ success: true, data: certificate });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all certificates belonging to the logged-in student
// @route   GET /api/v1/student/certificates
// @access  Private (Student)
exports.getMyCertificates = async (req, res, next) => {
  try {
    const studentId = req.user._id || req.user.id;
    const certificates = await Certificate.find({ studentId })
      .populate('courseId', 'title summary thumbnail')
      .sort({ issuedAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Synchronize lesson progress metrics
// @route   POST /api/v1/student/progress/video-complete
// @access  Private (Student)
exports.syncVideoProgress = async (req, res, next) => {
  try {
    const { courseId, videoId } = req.body;
    const studentId = req.user?.id || req.user?._id; 

    if (!courseId || !videoId || !mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ success: false, error: "Valid courseId and videoId must be provided." });
    }

    const totalVideosCount = await Lesson.countDocuments({ course: courseId });
    if (totalVideosCount === 0) {
      return res.status(404).json({ success: false, error: "No lessons exist for this course container." });
    }

    let enrollment = await Enrollment.findOne({
      $or: [{ student: studentId, course: courseId }, { user: studentId, course: courseId }]
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: "Active enrollment parameter token for this student not found." });
    }

    if (!enrollment.completedVideos) enrollment.completedVideos = [];

    const stringifiedVideoId = videoId.toString();
    if (!enrollment.completedVideos.includes(stringifiedVideoId)) {
      enrollment.completedVideos.push(stringifiedVideoId);
    }

    let calculatedProgress = Math.round((enrollment.completedVideos.length / totalVideosCount) * 100);
    if (calculatedProgress > 100) calculatedProgress = 100;
    
    enrollment.progress = calculatedProgress;
    await enrollment.save();

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