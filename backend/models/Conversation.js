const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCounts: [
      {
        _id: false,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        count: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
ConversationSchema.index({ participants: 1 }, { unique: true });
ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ 'unreadCounts.user': 1 });

// Helper function to safely extract string IDs
const toIdString = (id) => (id ? (id._id || id).toString() : null);

// 🚀 PRE-SAVE HOOK (NO 'next' PARAMETER NEEDED)
ConversationSchema.pre('save', function () {
  // 1. Sort participant IDs alphabetically so [UserA, UserB] === [UserB, UserA]
  if (Array.isArray(this.participants) && this.participants.length > 1) {
    this.participants.sort((a, b) => {
      const strA = toIdString(a) || '';
      const strB = toIdString(b) || '';
      return strA.localeCompare(strB);
    });
  }

  // 2. Ensure unreadCounts array exists
  if (!this.unreadCounts) {
    this.unreadCounts = [];
  }

  const existingUserSet = new Set(
    this.unreadCounts.map((u) => toIdString(u?.user)).filter(Boolean)
  );

  // 3. Populate missing unreadCounts for each participant
  if (Array.isArray(this.participants)) {
    this.participants.forEach((participant) => {
      const pIdStr = toIdString(participant);

      if (pIdStr && !existingUserSet.has(pIdStr)) {
        this.unreadCounts.push({
          user: participant._id || participant,
          count: 0,
        });
        existingUserSet.add(pIdStr);
      }
    });
  }
});

module.exports = mongoose.model('Conversation', ConversationSchema);