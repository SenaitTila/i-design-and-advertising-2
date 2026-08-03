const jwt = require('jsonwebtoken');

const sendTokenResponse = (user, statusCode, res) => {
  // 1. Inject BOTH the id and role into the JWT payload
  const token = jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  // 2. Safe Cookie Expiration calculation fallback
  const daysString = process.env.JWT_COOKIE_EXPIRE || '30';
  const parsedDays = parseInt(daysString, 10) || 30;

  const options = {
    expires: new Date(Date.now() + parsedDays * 24 * 60 * 60 * 1000),
    httpOnly: true, 
    // 🔥 FIXED: Always force true in deployment environments to comply with SameSite=None
    secure: true,   
    // 🔥 FIXED: Crucial for allowing cross-domain cookies from Vercel to Render
    sameSite: 'none', 
  };

  // Remove sensitive password context properties out of the response
  user.password = undefined;

  // 3. Deliver payload structured precisely for Login.jsx
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role 
      },
    });
};

module.exports = sendTokenResponse;