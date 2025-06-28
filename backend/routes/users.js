import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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
      .populate('friends', 'username email friendInviteCode totalStudyTime weeklyStudyTime monthlyStudyTime studySessions')
      .select('friends');

    const friendsWithStats = user.friends.map(friend => ({
      id: friend._id,
      username: friend.username,
      email: friend.email,
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