const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Native Node module, no npm install needed

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Exclude password by default on queries
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // 🟢 Real-time Presence Tracking Fields
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },

  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt before saving
// Removed 'next' argument to let Mongoose handle async promise resolution natively
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return; // Safely exit without a callback function crash
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
  // 1. Generate a raw random token string
  const resetToken = crypto.randomBytes(20).toString('hex');

  // 2. Hash token and save it to the user's document schema
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3. Set token expiration window to exactly 10 minutes from now
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  // 4. Return the raw, unhashed token (this gets emailed to the user)
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);