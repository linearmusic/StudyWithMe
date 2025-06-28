import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Generate unique friend invite code
    let friendInviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      friendInviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const codeExists = await User.findOne({ friendInviteCode });
      if (!codeExists) isUnique = true;
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      friendInviteCode
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        friendInviteCode: user.friendInviteCode,
        totalStudyTime: user.totalStudyTime,
        weeklyStudyTime: user.weeklyStudyTime,
        monthlyStudyTime: user.monthlyStudyTime,
        dailyGoal: user.dailyGoal,
        currentStreak: user.currentStreak,
        achievements: user.achievements
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).populate('friends', 'username email friendInviteCode totalStudyTime');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        friendInviteCode: user.friendInviteCode,
        friends: user.friends,
        totalStudyTime: user.totalStudyTime,
        weeklyStudyTime: user.weeklyStudyTime,
        monthlyStudyTime: user.monthlyStudyTime,
        dailyGoal: user.dailyGoal,
        currentStreak: user.currentStreak,
        achievements: user.achievements,
        studySchedules: user.studySchedules
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email friendInviteCode totalStudyTime')
      .select('-password');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        friendInviteCode: user.friendInviteCode,
        friends: user.friends,
        totalStudyTime: user.totalStudyTime,
        weeklyStudyTime: user.weeklyStudyTime,
        monthlyStudyTime: user.monthlyStudyTime,
        dailyGoal: user.dailyGoal,
        currentStreak: user.currentStreak,
        achievements: user.achievements,
        studySchedules: user.studySchedules,
        studySessions: user.studySessions.slice(-20) // Last 20 sessions
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 