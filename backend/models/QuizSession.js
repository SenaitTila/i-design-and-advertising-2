const mongoose = require('mongoose');

const QuizSessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  timeLeft: {
    type: Number,
    required: true
  },
  answers: {
    type: mongoose.Schema.Types.Mixed, // Flexibly accepts plain objects/dictionaries without Map casting errors
    default: {}
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'abandoned'],
    default: 'in-progress'
  }
}, { timestamps: true });

// Ensure a student has only one active session per quiz
QuizSessionSchema.index({ student: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model('QuizSession', QuizSessionSchema);