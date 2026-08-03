// Simple wrapper to check roles easily
const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have the required permissions',
    });
  }
  next();
};

module.exports = checkRole;