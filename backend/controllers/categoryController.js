const Category = require('../models/Category');
const Course = require('../models/Course');

// @desc    Get all parent categories
// @route   GET /api/v1/admin/categories
// @access  Private/Admin
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: categories.length, 
      data: categories 
    });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Create a new parent category node with dynamic local image uploads
// @route   POST /api/v1/admin/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      // If a file was uploaded by Multer, normalize backslashes for URL consistency
      thumbnailUrl: req.file ? `/uploads/${req.file.filename}` : ''
    };

    const category = await Category.create(categoryData);
    
    res.status(201).json({ 
      success: true, 
      data: category 
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Category name already exists' });
    }
    next(err);
  }
};

// @desc    Update parameters of a category node (Handles optional new image streams cleanly)
// @route   PUT /api/v1/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status
    };

    // ✨ If a new physical file uploader stream was intercepted, update the schema field
    if (req.file) {
      updateData.thumbnailUrl = `/uploads/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after', // Fixed deprecation logs elegantly
      runValidators: true
    });
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category node not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: category 
    });
  } catch (err) { 
    next(err); 
  }
};

// @desc    Permanently delete a category branch
// @route   DELETE /api/v1/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    // Check if any courses are still attached to this category before dropping it
    const coursesAttached = await Course.countDocuments({ category: req.params.id });
    if (coursesAttached > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete category. There are ${coursesAttached} courses currently assigned to it.` 
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: {} 
    });
  } catch (err) { 
    next(err); 
  }
};