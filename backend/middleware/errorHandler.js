const colors = require('colors'); // Optional: Only keep this line if you have 'colors' installed in package.json

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 🚀 FIXED: Fallback safely if err or err.stack is undefined, and handle string styling cleanly
  const errorStack = err && err.stack ? err.stack : 'No error stack trace available';
  
  // If you use the 'colors' package, you apply it as a function wrapper or template tag: colors.red(text)
  // Or simply remove '.red' entirely to avoid relying on external styling dependencies
  console.log(typeof errorStack.red === 'string' ? errorStack.red : errorStack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Duplicate field value entered`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;