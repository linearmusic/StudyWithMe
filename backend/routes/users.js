import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Get rankings/leaderboard
router.get('/rankings', authenticateToken, async (req, res) => {
  try {
    const { filter = 'total' } = req.query;
    const currentUserId = req.user._id;
    
    // Determine sort field based on filter
    let sortField = 'totalStudyTime';
    if (filter === 'weekly') sortField = 'weeklyStudyTime';
    if (filter === 'monthly') sortField = 'monthlyStudyTime';
    
    // Get all users sorted by study time
    const users = await User.find({})
      .select('username avatar totalStudyTime weeklyStudyTime monthlyStudyTime currentStreak')
      .sort({ [sortField]: -1 })
      .limit(50); // Top 50 users
    
    // Format rankings
    const rankings = users.map((user, index) => ({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      totalStudyTime: user.totalStudyTime || 0,
      weeklyStudyTime: user.weeklyStudyTime || 0,
      monthlyStudyTime: user.monthlyStudyTime || 0,
      currentStreak: user.currentStreak || 0,
      rank: index + 1
    }));
    
    // Find current user's rank
    const myRank = rankings.find(user => user.id.toString() === currentUserId.toString());
    
    res.json({
      rankings,
      myRank: myRank || null
    });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ message: 'Server error while fetching rankings' });
  }
});

// Upload profile picture
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Update user's avatar in database
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });

    res.json({
      message: 'Profile picture uploaded successfully',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error while uploading avatar' });
  }
});

// Delete profile picture
router.delete('/delete-avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.avatar) {
      // Delete the file from filesystem
      const filePath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remove avatar from database
      await User.findByIdAndUpdate(req.user._id, { avatar: '' });
    }

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ message: 'Server error while deleting avatar' });
  }
});

// Add friend by invite code
router.post('/add-friend', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const currentUserId = req.user._id;

    // Find user by invite code
    const friendUser = await User.findOne({ friendInviteCode: inviteCode });

    if (!friendUser) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if trying to add themselves
    if (friendUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as a friend' });
    }

    // Check if already friends
    const currentUser = await User.findById(currentUserId);
    if (currentUser.friends.includes(friendUser._id)) {
      return res.status(400).json({ message: 'User is already your friend' });
    }

    // Add friend to both users
    await User.findByIdAndUpdate(currentUserId, {
      $push: { friends: friendUser._id }
    });

    await User.findByIdAndUpdate(friendUser._id, {
      $push: { friends: currentUserId }
    });

    res.json({
      message: 'Friend added successfully',
      friend: {
        id: friendUser._id,
        username: friendUser.username,
        email: friendUser.email,
        avatar: friendUser.avatar,
        friendInviteCode: friendUser.friendInviteCode,
        totalStudyTime: friendUser.totalStudyTime
      }
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ message: 'Server error while adding friend' });
  }
});

// Remove friend
router.delete('/remove-friend/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id;

    // Remove friend from both users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error while removing friend' });
  }
});

// Get friends list with their study stats
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email avatar friendInviteCode totalStudyTime weeklyStudyTime monthlyStudyTime studySessions')
      .select('friends');

    const friendsWithStats = user.friends.map(friend => ({
      id: friend._id,
      username: friend.username,
      email: friend.email,
      avatar: friend.avatar,
      friendInviteCode: friend.friendInviteCode,
      totalStudyTime: friend.totalStudyTime,
      weeklyStudyTime: friend.weeklyStudyTime,
      monthlyStudyTime: friend.monthlyStudyTime,
      recentSessions: friend.studySessions.slice(-5) // Last 5 sessions
    }));

    res.json({ friends: friendsWithStats });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error while fetching friends' });
  }
});

// Get user profile by ID (for friends to view)
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if they are friends
    const currentUser = await User.findById(currentUserId);
    const isFriend = currentUser.friends.includes(userId);

    if (!isFriend && userId !== currentUserId.toString()) {
      return res.status(403).json({ message: 'You can only view friends\' profiles' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        totalStudyTime: user.totalStudyTime,
        weeklyStudyTime: user.weeklyStudyTime,
        monthlyStudyTime: user.monthlyStudyTime,
        studySchedules: user.studySchedules,
        recentSessions: user.studySessions.slice(-10)
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

export default router; 