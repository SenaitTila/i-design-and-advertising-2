const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const mongoose = require('mongoose');
// Consider importing a Cloudinary/storage cleanup utility here

// ==========================================
// @desc    Get all courses with category relations and lesson tracks populated
// @route   GET /api/v1/admin/courses
// ==========================================
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('category', 'name status')
      .populate('lessons') 
      .sort({ createdAt: -1 })
      .lean(); // ⚡ Use .lean() for faster, read-only JSON operations

    const dataPayload = courses.map(course => {
      course.videos = course.lessons || []; // Sync fallback for frontend keys
      return course;
    });

    res.status(200).json({ 
      success: true, 
      count: dataPayload.length, 
      data: dataPayload 
    });
  } catch (err) { 
    next(err); 
  }
};

// ==========================================
// @desc    Create a brand new course container
// @route   POST /api/v1/admin/courses
// ==========================================
exports.createCourse = async (req, res, next) => {
  try {


    console.log("--- DEBUGGING FILE UPLOAD ---");
    console.log("req.file details:", req.file); 
    console.log("req.body details:", req.body);
    console.log("-----------------------------");
    const { title, category, description, price, status } = req.body;

    const courseData = {
      title,
      category,
      description,
      price,
      status: status || 'Draft',
      thumbnailUrl: req.file ? req.file.path : (req.body.thumbnailUrl || '')
    };

    const course = await Course.create(courseData);
    
    res.status(201).json({ 
      success: true, 
      data: course 
    });
  } catch (err) { 
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Course title already exists.' });
    }
    next(err); 
  }
};

// ==========================================
// @desc    Update course parameters and handle optional thumbnail replacements
// @route   PUT /api/v1/admin/courses/:id
// ==========================================
exports.updateCourse = async (req, res, next) => {
  try {
    const fieldsToUpdate = ['title', 'category', 'description', 'price', 'status'];
    const updateData = {};

    // ⚡ Dynamically populate properties to avoid overwriting database fields with undefined
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (req.file) {
      updateData.thumbnailUrl = req.file.path; 
      // TODO: (Optional but recommended) Trigger async deletion of the old image asset in Cloudinary
    } else if (req.body.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = req.body.thumbnailUrl; 
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true, // cleaner alternative to returnDocument: 'after'
      runValidators: true
    });
    
    if (!course) {
      return res.status(404).json({ success: false, error: 'Target course not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: course 
    });
  } catch (err) { 
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Course title collision detected' });
    }
    next(err); 
  }
};

// ==========================================
// @desc    Delete course and cascading drop of lessons
// @route   DELETE /api/v1/admin/courses/:id
// ==========================================
exports.deleteCourse = async (req, res, next) => {
  // ⚡ Using a transaction ensures both delete operations succeed, or both fail together
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const course = await Course.findByIdAndDelete(req.params.id).session(session);
    
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: 'Target course not found' });
    }
    
    // Cascading delete
    await Lesson.deleteMany({ course: req.params.id }).session(session);

    // Commit changes safely
    await session.commitTransaction();
    session.endSession();

    // TODO: Trigger async deletion of course.thumbnailUrl from cloud storage here

    res.status(200).json({ 
      success: true, 
      data: {} 
    });
  } catch (err) { 
    await session.abortTransaction();
    session.endSession();
    next(err); 
  }
};