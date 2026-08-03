const jwt = require('jsonwebtoken');

// 🔒 Strong Protect: Lightweight, database-safe, and supports strict cookie matching
exports.protect = async (req, res, next) => {
  let token;

  // 1. Prioritize secure HttpOnly cookies over easily stolen LocalStorage headers
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. Missing authentication token.' });
  }

  try {
    // 2. Fast cryptographic token verification (No slow DB query!)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach essential context directly from the token payload
    req.user = {
      id: decoded.id,
      role: decoded.role // Encode the role in your JWT payload during login!
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    return res.status(401).json({ success: false, error: 'Invalid or malformed authentication token.' });
  }
};

// 🎛️ Dynamic Role Authorization Gatekeeper
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access Denied: Account role '${req.user?.role || 'Guest'}' lacks permissions.` 
      });
    }
    next();
  };
};