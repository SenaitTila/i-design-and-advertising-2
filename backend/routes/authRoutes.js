const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  forgotPassword, 
  resetPassword ,updateDetails
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// --- Public Authentication Routes ---
router.post('/register', register);
router.post('/login', login);

// --- Password Reset Routes ---
// These must remain public because an unauthenticated user needs access to them
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// --- Protected Routes ---
// These require the user to be logged in (validated by the protect middleware)
router.get('/me', protect, getMe);
router.post('/logout', logout);


router.put('/updatedetails', protect, updateDetails);

module.exports = router;