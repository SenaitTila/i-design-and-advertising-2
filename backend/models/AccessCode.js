const mongoose = require("mongoose");

const AccessCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },

  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

  durationDays: { type: Number, default: 30 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  usedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("AccessCode", AccessCodeSchema);