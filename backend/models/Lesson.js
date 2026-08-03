const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  title: String,
  videoUrl: String,
  duration: String,
  order: Number
}, { timestamps: true });

module.exports = mongoose.model("Lesson", LessonSchema);