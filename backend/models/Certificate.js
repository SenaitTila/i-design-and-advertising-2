// C:\creative-academy\backend\models\Certificate.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  // 🎓 Sophisticated, Lowercase, Udacity-Style UUID Token Matrix
  certificateId: {
    type: String,
    unique: true,
    default: () => crypto.randomUUID() // Generates strings like: "e391b4a2-12a8-4b9c-87d1-9f3b5c6e7d8f"
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// 🔑 AUTOMATIC INDEX CLEAN MATRIX
// Forces MongoDB to silently discard dead indexes (like certificateHash_1) on server initialization
Certificate.cleanIndexes().catch(err => {
  console.error("Mongoose index sync operational warning:", err.message);
});

module.exports = Certificate;