import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Register - Send OTP
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          message: 'User with this email already exists'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          message: 'Username is already taken. Please choose a different username.'
        });
      }
    }

    // Generate OTP and set expiration (10 minutes)
    const otp = emailService.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique friend invite code
    let friendInviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      friendInviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const codeExists = await User.findOne({ friendInviteCode });
      if (!codeExists) isUnique = true;
    }

    // Create new user with unverified email
    const user = new User({
      username,
      email,
      password,
      friendInviteCode,
      emailVerificationOTP: otp,
      otpExpiresAt,
      isEmailVerified: false
    });

    await user.save();

    // Send OTP email
    console.log('📧 Attempting to send OTP email to:', email, 'OTP:', otp);
    const emailSent = await emailService.sendOTPEmail(email, otp, username);
    console.log('📧 Email sent result:', emailSent);
    
    if (!emailSent) {
      console.log('❌ Failed to send email, cleaning up user');
      await User.findByIdAndDelete(user._id); // Clean up if email fails
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.status(201).json({
      message: 'Registration initiated. Please check your email for the verification code.',
      userId: user._id,
      email: email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    console.log('📧 OTP Verification attempt:', { userId, otp });

    if (!userId || !otp) {
      console.log('❌ Missing userId or OTP');
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      console.log('⚠️ Email already verified for user:', userId);
      // If already verified, just log them in
      console.log('⚠️ User already verified, logging them in...');
      
      try {
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          message: 'Email already verified. Login successful.',
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            friendInviteCode: user.friendInviteCode,
            totalStudyTime: user.totalStudyTime || 0,
            weeklyStudyTime: user.weeklyStudyTime || 0,
            monthlyStudyTime: user.monthlyStudyTime || 0,
            dailyGoal: user.dailyGoal || 7200000,
            currentStreak: user.currentStreak || 0,
            achievements: user.achievements || []
          }
        });
      } catch (alreadyVerifiedError) {
        console.error('❌ Error handling already verified user:', alreadyVerifiedError);
        return res.status(500).json({ message: 'User already verified but login error occurred' });
      }
    }

    console.log('🔍 Stored OTP:', user.emailVerificationOTP, 'Provided OTP:', otp);
    console.log('🕒 OTP expires at:', user.otpExpiresAt, 'Current time:', new Date());

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
      console.log('❌ Invalid OTP provided');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiresAt < new Date()) {
      console.log('❌ OTP has expired');
      return res.status(400).json({ message: 'OTP has expired' });
    }

    console.log('✅ OTP verified successfully, updating user...');

    // Verify email and clear OTP fields
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.otpExpiresAt = null;
    
    try {
      await user.save();
      console.log('✅ User saved successfully');
    } catch (saveError) {
      console.error('❌ Error saving user:', saveError);
      return res.status(500).json({ message: 'Error updating user verification status' });
    }

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('✅ JWT token generated successfully');
    } catch (jwtError) {
      console.error('❌ Error generating JWT:', jwtError);
      return res.status(500).json({ message: 'Error generating authentication token' });
    }

    console.log('✅ Sending success response...');
    
    try {
      res.json({
        message: 'Email verified successfully! Registration complete.',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          friendInviteCode: user.friendInviteCode,
          totalStudyTime: user.totalStudyTime || 0,
          weeklyStudyTime: user.weeklyStudyTime || 0,
          monthlyStudyTime: user.monthlyStudyTime || 0,
          dailyGoal: user.dailyGoal || 7200000,
          currentStreak: user.currentStreak || 0,
          achievements: user.achievements || []
        }
      });
      console.log('✅ Success response sent');
    } catch (responseError) {
      console.error('❌ Error sending response:', responseError);
      return res.status(500).json({ message: 'Verification successful but response error' });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP and set expiration
    const otp = emailService.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP email
    console.log('📧 Resending OTP email to:', user.email, 'New OTP:', otp);
    const emailSent = await emailService.sendOTPEmail(user.email, otp, user.username);
    console.log('📧 Resend email result:', emailSent);
    
    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.json({
      message: 'Verification code sent successfully. Please check your email.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error during resend' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).populate('friends', 'username email avatar friendInviteCode totalStudyTime');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('⚠️ Login attempt by unverified user:', user.email);
      return res.status(403).json({ 
        message: 'Please verify your email address before logging in. Use the verification link from your registration email or contact support.',
        userId: user._id,
        email: user.email,
        needsVerification: true
      });
    }

    console.log('✅ Login authentication successful, generating token...');

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('✅ JWT token generated successfully for login');
    } catch (jwtError) {
      console.error('❌ Error generating JWT for login:', jwtError);
      return res.status(500).json({ message: 'Error generating authentication token' });
    }

    console.log('✅ Sending login success response...');

    try {
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          friendInviteCode: user.friendInviteCode,
          friends: user.friends || [],
          totalStudyTime: user.totalStudyTime || 0,
          weeklyStudyTime: user.weeklyStudyTime || 0,
          monthlyStudyTime: user.monthlyStudyTime || 0,
          dailyGoal: user.dailyGoal || 7200000,
          currentStreak: user.currentStreak || 0,
          achievements: user.achievements || [],
          studySchedules: user.studySchedules || []
        }
      });
      console.log('✅ Login success response sent');
    } catch (responseError) {
      console.error('❌ Error sending login response:', responseError);
      return res.status(500).json({ message: 'Login successful but response error' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email avatar friendInviteCode totalStudyTime')
      .select('-password');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
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