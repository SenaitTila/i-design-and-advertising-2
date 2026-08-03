// C:\creative-academy\backend\models\Enrollment.js
const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Keep your original configuration
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  enrolledAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ["active", "expired"], default: "active" },

  // 🎓 Added Tracking Hooks
  progress: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedVideos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson"
    }
  ],
  certificateId: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model("Enrollment", EnrollmentSchema);