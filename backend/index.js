import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import studyRoutes from './routes/study.js';
import { authenticateSocket } from './middleware/auth.js';

dotenv.config();

// Set JWT secret if not in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'study-together-secret-key-change-in-production';
}

const app = express();
const server = createServer(app);

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend-url.vercel.app']
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aman123:aman123@cluster0.wv3uj.mongodb.net/study-together';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

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