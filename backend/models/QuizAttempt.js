const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  quizId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  score: { 
    type: Number, 
    required: true 
  },
  totalQuestions: { 
    type: Number, 
    required: true 
  },
  percentage: { 
    type: Number, 
    required: true 
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    selectedOptionIndex: {
      type: Number,
      default: null // Allows explicit handling of skipped questions
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    }
  }]
}, { timestamps: true });

// ⚡ PERFORMANCE INDEXING LAYER
// Speeds up analytics aggregation when rendering the admin tracking dashboard
QuizAttemptSchema.index({ quizId: 1, createdAt: -1 });
// Speeds up single-student lookup checking if they've passed before
QuizAttemptSchema.index({ studentId: 1, quizId: 1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);