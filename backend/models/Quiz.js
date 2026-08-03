// C:\creative-academy\backend\models\Quiz.js

const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  imageURL: { 
    type: String, 
    default: '' 
  }
});

const QuestionSchema = new mongoose.Schema({
  questionText: { 
    type: String, 
    required: true 
  },
  questionImage: { 
    type: String, 
    default: '' 
  },
  options: {
    type: [OptionSchema],
    validate: [arrayMinLength, 'A question node requires a baseline minimum constraint of 2 options.']
  },
  correctOptionIndex: { 
    type: Number, 
    required: true,
    default: 0
  }
});

function arrayMinLength(val) {
  return val.length >= 2;
}

const QuizSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  // 🔥 Updated field key to match frontend telemetry state maps exactly
  passingPercentage: {
    type: Number,
    required: true,
    default: 80, // Standard target passing mark threshold percentage
    min: 0,
    max: 100
  },
  // ⚡ Added structural configurations
  questionsPerPage: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  duration: {
    type: Number,
    required: true,
    default: 60, // Represented in minutes
    min: 0       // 0 could signify an untimed evaluation node
  },
  // 💡 ADDED: Limit the total allowed submission streams per student instance
  maxAttempts: {
    type: Number,
    required: true,
    default: 3,  // Standard fallback threshold restriction
    min: 1       // Must allow at least one single baseline evaluation pathway
  },
  questions: [QuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);