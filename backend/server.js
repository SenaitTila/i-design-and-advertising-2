const express = require('express');
const http = require('http'); // 🔌 Native HTTP module for WebSockets
const path = require('path'); 
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const { Server } = require('socket.io'); // 🔌 Socket.io import
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Database Message, Conversation, and User models
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

// 1. Load environment variables
dotenv.config({ path: './.env' });

// 2. Connect to the database
connectDB();

// 3. Initialize Express app
const app = express();

// 🔌 3.5. Create HTTP Server to wrap Express app for Socket.io support
const server = http.createServer(app);

// 4. Standard Middlewares
app.use(express.json());
app.use(cookieParser());

// Customize Helmet to allow frontend to view uploaded images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Expose static physical uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Express 5 compatibility fix for express-mongo-sanitize
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
const allowedOrigins = [
  'https://creative-academyy.vercel.app', 
  'https://i-design-and-advertising.vercel.app', 
  'http://localhost:5173',                  
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy restriction'), false);
  },
  credentials: true 
};

app.use(cors(corsOptions));

// 🔌 4.5. Initialize Socket.io Server instance with CORS mapping
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// 🚀 Attach io instance to Express app so controllers can access it via req.app.get('socketio')
app.set('socketio', io);

// Track active socket connections per user to handle multi-tab/device presence
const userSocketCounts = new Map();

// 🔌 Real-Time Network Socket Handler Core Matrix
io.on('connection', (socket) => {
  console.log(`User connected to Socket Engine: ${socket.id}`);

  // Helper handler for user online status and personal channel assignment
  const handleUserOnline = async (userId) => {
    if (!userId) return;
    
    const strUserId = userId.toString();
    socket.userId = strUserId;
    socket.join(strUserId); // Join personal room for targeted real-time updates

    // Increment active connections count for this user
    const currentCount = userSocketCounts.get(strUserId) || 0;
    userSocketCounts.set(strUserId, currentCount + 1);

    try {
      // Mark user online in MongoDB
      await User.findByIdAndUpdate(strUserId, { isOnline: true });

      // Broadcast presence update to all connected clients
      io.emit('user_status_changed', {
        userId: strUserId,
        isOnline: true,
        lastSeen: new Date().toISOString()
      });
      console.log(`🟢 User ${strUserId} is ONLINE (Active sockets: ${currentCount + 1})`);
    } catch (err) {
      console.error(`Error updating online status for ${strUserId}:`, err.message);
    }
  };

  // 🟢 1. USER PRESENCE: Handle user login / connection (Supports both frontend socket events)
  socket.on('user_online', handleUserOnline);
  socket.on('user_connected', handleUserOnline);

  // Room joining handler
  socket.on('join_room', (roomId) => {
    if (!roomId) return;
    socket.join(roomId.toString());
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Leave room handler
  socket.on('leave_room', (roomId) => {
    if (!roomId) return;
    socket.leave(roomId.toString());
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });

  // 🚀 Real-time message processor
  socket.on('send_message', async (data) => {
    const { conversationId, sender, text, isGroupPost, tempId } = data;

    // Safely parse sender ID whether passed as an object or raw ID string
    const senderId = typeof sender === 'object' ? sender?._id || sender?.id : sender;

    if (!senderId || !text) {
      console.error('Invalid send_message payload received:', data);
      return;
    }

    try {
      // 1. Save fresh message instance to MongoDB
      const newMessage = new Message({
        conversationId: isGroupPost ? undefined : conversationId,
        sender: senderId,
        text,
        isGroupPost: !!isGroupPost
      });

      await newMessage.save();
      const populatedMessage = await newMessage.populate('sender', 'name role');

      // Convert Mongoose doc to plain object and attach tempId for optimistic UI match
      const responsePayload = {
        ...populatedMessage.toObject(),
        tempId: tempId || null
      };

      // 2. Manage unread metadata updates for private conversations
      if (!isGroupPost && conversationId) {
        let conversationCheck = await Conversation.findById(conversationId);

        if (conversationCheck) {
          if (!conversationCheck.unreadCounts || conversationCheck.unreadCounts.length === 0) {
            const defaultUnreads = conversationCheck.participants.map((pId) => ({
              user: pId,
              count: 0
            }));
            
            await Conversation.updateOne(
              { _id: conversationId },
              { $set: { unreadCounts: defaultUnreads } }
            );
          }
        }

        // Increment unread counts for recipients and update last message reference
        const updatedConversation = await Conversation.findOneAndUpdate(
          { _id: conversationId },
          {
            $set: { lastMessage: newMessage._id },
            $inc: { "unreadCounts.$[elem].count": 1 }
          },
          {
            arrayFilters: [{ "elem.user": { $ne: senderId } }],
            returnDocument: 'after'
          }
        ).populate('participants', 'name email role isOnline lastSeen');

        // Broadcast updated conversation context globally
        io.emit('conversation_updated', updatedConversation);
      }

      // 3. Emit message stream to target room
      const targetRoom = isGroupPost ? 'global_qa' : conversationId?.toString();
      io.to(targetRoom).emit('receive_message', responsePayload);
      
    } catch (err) {
      console.error("Socket Engine Processing Error: ", err.message);
    }
  });

  // 🔴 2. USER PRESENCE: Handle disconnect with multi-tab protection
  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);

    if (socket.userId) {
      const activeSockets = (userSocketCounts.get(socket.userId) || 1) - 1;

      if (activeSockets > 0) {
        // User still has active tabs open
        userSocketCounts.set(socket.userId, activeSockets);
        console.log(`Socket closed for ${socket.userId}, but ${activeSockets} connection(s) remain active.`);
      } else {
        // User completely disconnected from all tabs/devices
        userSocketCounts.delete(socket.userId);
        const lastSeenDate = new Date();

        try {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: lastSeenDate
          });

          io.emit('user_status_changed', {
            userId: socket.userId,
            isOnline: false,
            lastSeen: lastSeenDate.toISOString()
          });
          console.log(`🔴 User ${socket.userId} marked as OFFLINE at ${lastSeenDate.toISOString()}`);
        } catch (err) {
          console.error(`Error updating offline status for ${socket.userId}:`, err.message);
        }
      }
    }
  });
});

// Root GET Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Creative Academy API Backend Server!"
  });
});

// ==========================================
// 🔌 ROUTE IMPORTS & MOUNTING MATRIX
// ==========================================
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const studentRoutes = require('./routes/studentRoutes');

const categoryRoutes = require('./routes/categoryRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const chatRoutes = require('./routes/chatRoutes'); 

// Primary Base Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/admin', adminRoutes); 

// Standalone Administrative Operations
app.use('/api/v1/admin/categories', categoryRoutes);
app.use('/api/v1/admin/courses', courseRoutes);
app.use('/api/v1/chat', chatRoutes); 

// Nested proxy route
app.use('/api/v1/admin/courses/:courseId/lessons', lessonRoutes);

// ==========================================

// 7. Error Handling Middleware
app.use(errorHandler);

// 8. Start Server
const PORT = process.env.PORT || 5000;
const serverInstance = server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  serverInstance.close(() => process.exit(1));
});
