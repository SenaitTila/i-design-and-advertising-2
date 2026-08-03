const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Presence fields string to reuse across all projections
const USER_PRESENCE_FIELDS = 'name email role isOnline lastSeen';

// @desc    Search users by name/email & filter by role
// @route   GET /api/v1/chat/search
exports.searchUsers = async (req, res) => {
  try {
    const { q, role } = req.query;
    const currentUserId = req.user?.id || req.user?._id;

    const queryConditions = {};

    if (currentUserId) {
      queryConditions._id = { $ne: currentUserId };
    }

    if (role && role.toLowerCase() !== 'all') {
      queryConditions.role = role.toLowerCase();
    }

    if (q && q.trim() !== '') {
      const searchRegex = new RegExp(q.trim(), 'i');
      queryConditions.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Includes isOnline and lastSeen in search projection
    const users = await User.find(queryConditions)
      .select(USER_PRESENCE_FIELDS)
      .limit(20)
      .lean();

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error("Error in searchUsers:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get or create a direct conversation between two users
// @route   POST /api/v1/chat/conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const senderId = req.user?.id || req.user?._id || req.body.studentId;
    const targetUserId = req.body.targetUserId;

    if (!senderId) {
      return res.status(400).json({ success: false, error: "Missing sender identity context." });
    }

    const firstParticipantId = new mongoose.Types.ObjectId(senderId);
    let secondParticipantId;

    if (targetUserId) {
      secondParticipantId = new mongoose.Types.ObjectId(targetUserId);
    } else {
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return res.status(404).json({
          success: false,
          error: "No administrator found in system to assign to this chat."
        });
      }
      secondParticipantId = admin._id;
    }

    if (firstParticipantId.equals(secondParticipantId)) {
      return res.status(400).json({ success: false, error: "Cannot create direct conversation with yourself." });
    }

    // STEP A: Guarantee string-based sorting for accurate ObjectIds
    const sortedParticipants = [firstParticipantId, secondParticipantId].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

    // STEP B: Find room matching exact participants
    let conversation = await Conversation.findOne({
      participants: { $size: 2, $all: sortedParticipants }
    }).populate('participants', USER_PRESENCE_FIELDS);

    // STEP C: Safe atomic creation fallback
    if (!conversation) {
      try {
        const newConv = new Conversation({
          participants: sortedParticipants,
          unreadCounts: [
            { user: firstParticipantId, count: 0 },
            { user: secondParticipantId, count: 0 }
          ]
        });

        await newConv.save();

        conversation = await Conversation.findById(newConv._id).populate(
          'participants',
          USER_PRESENCE_FIELDS
        );
      } catch (saveError) {
        // Handle E11000 duplicate key error when parallel requests attempt creation simultaneously
        if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
          conversation = await Conversation.findOne({
            participants: { $size: 2, $all: sortedParticipants }
          }).populate('participants', USER_PRESENCE_FIELDS);
        } else {
          throw saveError;
        }
      }
    }

    // Emit live socket event
    const io = req.app.get('socketio');
    if (io && conversation) {
      conversation.participants.forEach((p) => {
        const pId = typeof p === 'object' ? (p._id || p.id)?.toString() : p?.toString();
        if (pId) {
          io.to(pId).emit('conversation_updated', conversation);
        }
      });
    }

    return res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    console.error("Error in getOrCreateConversation:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Fetch all Private Conversations for the Admin Support Inbox
// @route   GET /api/v1/chat/admin/conversations
exports.getAdminConversations = async (req, res) => {
  try {
    // Includes presence fields in inbox list
    const conversations = await Conversation.find()
      .populate('participants', USER_PRESENCE_FIELDS)
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get Private Chat History for a specific room
// @route   GET /api/v1/chat/messages/:conversationId
exports.getPrivateMessageHistory = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get Global Group Q&A Posts
// @route   GET /api/v1/chat/group-qa
exports.getGlobalGroupQA = async (req, res) => {
  try {
    const posts = await Message.find({ isGroupPost: true })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Clear Unread Message Counter for a specific user in a conversation
// @route   PUT /api/v1/chat/conversation/:conversationId/clear-unread
exports.clearUnreadCount = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized access context." });
    }

    let conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, "unreadCounts.user": userId },
      { $set: { "unreadCounts.$.count": 0 } },
      { returnDocument: 'after' }
    );

    if (!conversation) {
      conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { $push: { unreadCounts: { user: userId, count: 0 } } },
        { returnDocument: 'after' }
      );
    }

    res.status(200).json({ success: true, message: "Unread counter cleared successfully.", data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};