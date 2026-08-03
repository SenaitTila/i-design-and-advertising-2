const express = require('express');
const router = express.Router();

const {
  searchUsers,
  getOrCreateConversation,
  getAdminConversations,
  getPrivateMessageHistory,
  getGlobalGroupQA,
  clearUnreadCount,
} = require('../controllers/chatController');

// 🚀 Authentication Middleware
const { protect } = require('../middleware/auth');

// Apply protection middleware to all chat routes below
router.use(protect);

// 🔎 Search users directory
router.get('/search', searchUsers);

// 💬 1-to-1 Private Conversation Routes
router.post('/conversation', getOrCreateConversation);
router.get('/messages/:conversationId', getPrivateMessageHistory);
router.put('/conversation/:conversationId/clear-unread', clearUnreadCount);

// 🛡️ Admin Conversations View
router.get('/admin/conversations', getAdminConversations);

// 🌐 Community / Public Group Route
router.get('/group-qa', getGlobalGroupQA);

module.exports = router;