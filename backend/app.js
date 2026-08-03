const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const { xss } = require('xss');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// 1. Load environment variables
dotenv.config({ path: './.env' });

// 2. Connect to the database
connectDB();

// 3. Initialize Express app
const app = express();

// 4. Standard Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// 5. Express 5 compatibility fix for express-mongo-sanitize
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: { ...req.query },
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});

// Prevent NoSQL Injection attacks
app.use(mongoSanitize());

// Prevent XSS attacks
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// 6. Mount routers
const authRoutes = require('./routes/authRoutes');
app.use('/api/v1/auth', authRoutes);

// 7. Error Handling Middleware
app.use(errorHandler);

// 8. Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// 9. Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});