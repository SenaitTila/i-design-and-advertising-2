const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: function() { return !this.isGroupPost; } // Only required for private chat
  },
  isGroupPost: { type: Boolean, default: false }, // Set to true for the Global Q&A Forum
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);