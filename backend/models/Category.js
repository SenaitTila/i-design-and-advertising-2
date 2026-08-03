const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  description: String,
  thumbnailUrl: String,
  status: { type: String, enum: ["Active", "Draft"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);