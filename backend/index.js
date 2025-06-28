import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import studyRoutes from './routes/study.js';
import { authenticateSocket } from './middleware/auth.js';

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();
const server = createServer(app);

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        'https://study-with-me-tau.vercel.app',
        /\.vercel\.app$/  // Allow any vercel.app subdomain
      ].filter(Boolean)
    : ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studytogether';

console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  connectTimeoutMS: 10000, // Give up initial connection after 10s
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Continuing without MongoDB (some features may not work)');
    console.log('💡 To fix this:');
    console.log('   1. Install MongoDB locally, OR');
    console.log('   2. Use MongoDB Atlas cloud service, OR');
    console.log('   3. Update MONGODB_URI in .env file');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/study', studyRoutes);

// Socket.io for real-time features
const activeUsers = new Map();

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Store active user
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    studySession: null,
    lastSeen: new Date()
  });

  // Join user to their room for friend updates
  socket.join(`user_${socket.userId}`);

  // Handle study session start
  socket.on('start_study', (data) => {
    const user = activeUsers.get(socket.userId);
    if (user) {
      user.studySession = {
        startTime: new Date(),
        subject: data.subject || 'General Study',
        target: data.target || null
      };
      
      // Notify friends about study session
      socket.broadcast.to(`friends_${socket.userId}`).emit('friend_started_studying', {
        userId: socket.userId,
        startTime: user.studySession.startTime,
        subject: user.studySession.subject
      });
    }
  });

  // Handle study session stop
  socket.on('stop_study', () => {
    const user = activeUsers.get(socket.userId);
    if (user && user.studySession) {
      const duration = Date.now() - user.studySession.startTime.getTime();
      
      // Save study session to database here
      
      user.studySession = null;
      
      // Notify friends
      socket.broadcast.to(`friends_${socket.userId}`).emit('friend_stopped_studying', {
        userId: socket.userId,
        duration
      });
    }
  });

  // Handle getting online friends
  socket.on('get_online_friends', async (friendIds) => {
    const onlineFriends = friendIds.filter(id => activeUsers.has(id));
    socket.emit('online_friends', onlineFriends);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    activeUsers.delete(socket.userId);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 