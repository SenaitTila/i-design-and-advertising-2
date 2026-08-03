// C:\creative-academy\backend\models\Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  description: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true 
  },
  thumbnailUrl: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Active'], 
    default: 'Draft' 
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  
  // 🌟 THE CRITICAL FIX: Explicit relational array mappings for population pipelines
  lessons: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson' 
  }],
  videos: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson' 
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Course', CourseSchema);