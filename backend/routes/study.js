import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// Start study session
router.post('/session/start', authenticateToken, async (req, res) => {
  try {
    const { subject, scheduleId } = req.body;
    const userId = req.user._id;

    // Create session record (will be completed when stopped)
    const sessionData = {
      userId,
      subject: subject || 'General Study',
      scheduleId: scheduleId || null,
      startTime: new Date()
    };

    res.json({
      message: 'Study session started',
      session: sessionData
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ message: 'Server error while starting session' });
  }
});

// Stop study session
router.post('/session/stop', authenticateToken, async (req, res) => {
  try {
    const { startTime, subject, scheduleId, notes } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!startTime) {
      return res.status(400).json({ message: 'Start time is required' });
    }

    // Validate and parse dates
    const endTime = new Date();
    const startTimeDate = new Date(startTime);
    
    // Check if startTime is valid
    if (isNaN(startTimeDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start time format' });
    }

    // Check if session makes sense (not in future, not more than 24 hours)
    if (startTimeDate > endTime) {
      return res.status(400).json({ message: 'Start time cannot be in the future' });
    }

    const duration = endTime.getTime() - startTimeDate.getTime();
    
    // Validate session duration (at least 1 second, max 24 hours)
    if (duration < 1000) {
      return res.status(400).json({ message: 'Session too short (minimum 1 second)' });
    }

    if (duration > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Session too long (maximum 24 hours)' });
    }

    const sessionData = {
      startTime: startTimeDate,
      endTime,
      duration,
      subject: subject || 'General Study',
      notes: notes || ''
    };

    // Find user and validate
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add session to user with error handling
    let newAchievements = [];
    try {
      newAchievements = user.addStudySession(sessionData);
    } catch (sessionError) {
      console.error('Error adding study session:', sessionError);
      return res.status(500).json({ message: 'Failed to record study session' });
    }

    // If this was for a scheduled study, mark progress
    if (scheduleId) {
      try {
        const schedule = user.studySchedules.id(scheduleId);
        if (schedule) {
          schedule.completedSessions.push({
            date: new Date(),
            duration,
            actualStartTime: sessionData.startTime,
            actualEndTime: sessionData.endTime
          });

          // Check if schedule target is met
          const totalScheduleDuration = schedule.completedSessions.reduce(
            (total, session) => total + (session.duration || 0), 0
          );
          const plannedDuration = schedule.endTime.getTime() - schedule.startTime.getTime();
          
          if (totalScheduleDuration >= plannedDuration) {
            schedule.completed = true;
          }
        }
      } catch (scheduleError) {
        console.error('Error updating schedule progress:', scheduleError);
        // Continue without failing - schedule update is not critical
      }
    }

    // Save user data
    try {
      await user.save();
    } catch (saveError) {
      console.error('Error saving user data:', saveError);
      return res.status(500).json({ message: 'Failed to save session data' });
    }

    // Send achievement email notifications (non-blocking)
    if (newAchievements && newAchievements.length > 0) {
      // Run email notifications asynchronously without blocking response
      setImmediate(async () => {
        try {
          for (const achievement of newAchievements) {
            try {
              await emailService.sendAchievementNotification(
                user.email,
                achievement,
                user.username
              );
            } catch (emailError) {
              console.error(`Failed to send email for achievement ${achievement}:`, emailError);
            }
          }
        } catch (emailBatchError) {
          console.error('Failed to send achievement notifications:', emailBatchError);
        }
      });
    }

    // Calculate today's progress for daily goal
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStudyTime = user.studySessions
      .filter(session => {
        try {
          return session.startTime && session.startTime >= today && session.startTime < tomorrow;
        } catch (filterError) {
          console.error('Error filtering today sessions:', filterError);
          return false;
        }
      })
      .reduce((total, session) => total + (session.duration || 0), 0);

    res.json({
      message: 'Study session completed',
      session: sessionData,
      newAchievements: newAchievements || [],
      stats: {
        totalStudyTime: user.totalStudyTime || 0,
        weeklyStudyTime: user.weeklyStudyTime || 0,
        monthlyStudyTime: user.monthlyStudyTime || 0,
        currentStreak: user.currentStreak || 0,
        todayStudyTime,
        dailyGoal: user.dailyGoal || 7200000
      }
    });
  } catch (error) {
    console.error('Stop session error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while stopping session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create study schedule
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const { title, subject, startTime, endTime, recurring } = req.body;
    const userId = req.user._id;

    const scheduleData = {
      title,
      subject,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      recurring: recurring || 'none'
    };

    const user = await User.findById(userId);
    user.studySchedules.push(scheduleData);
    await user.save();

    const newSchedule = user.studySchedules[user.studySchedules.length - 1];

    // Send email notification for the scheduled session
    try {
      await emailService.sendSessionNotification(
        user.email,
        {
          title,
          subject,
          startTime,
          endTime
        },
        user.username
      );
    } catch (emailError) {
      console.error('Failed to send session notification:', emailError);
      // Continue without failing the request
    }

    res.json({
      message: 'Schedule created successfully',
      schedule: newSchedule
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Server error while creating schedule' });
  }
});

// Update study schedule
router.put('/schedule/:scheduleId', authenticateToken, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { title, subject, startTime, endTime, recurring } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const schedule = user.studySchedules.id(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.title = title || schedule.title;
    schedule.subject = subject || schedule.subject;
    schedule.startTime = startTime ? new Date(startTime) : schedule.startTime;
    schedule.endTime = endTime ? new Date(endTime) : schedule.endTime;
    schedule.recurring = recurring || schedule.recurring;

    await user.save();

    res.json({
      message: 'Schedule updated successfully',
      schedule
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Server error while updating schedule' });
  }
});

// Delete study schedule
router.delete('/schedule/:scheduleId', authenticateToken, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $pull: { studySchedules: { _id: scheduleId } }
    });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Server error while deleting schedule' });
  }
});

// Get all study sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Sort sessions by most recent first
    const sessions = user.studySessions.sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );

    res.json({
      sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error while fetching sessions' });
  }
});

// Delete study session
router.delete('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const session = user.studySessions.id(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Subtract session duration from totals
    user.totalStudyTime = Math.max(0, user.totalStudyTime - session.duration);
    
    // Update weekly and monthly stats if session was recent
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (session.startTime >= weekStart) {
      user.weeklyStudyTime = Math.max(0, user.weeklyStudyTime - session.duration);
    }
    
    if (session.startTime >= monthStart) {
      user.monthlyStudyTime = Math.max(0, user.monthlyStudyTime - session.duration);
    }

    // Remove session
    user.studySessions.pull(sessionId);
    await user.save();

    res.json({ 
      message: 'Session deleted successfully',
      stats: {
        totalStudyTime: user.totalStudyTime,
        weeklyStudyTime: user.weeklyStudyTime,
        monthlyStudyTime: user.monthlyStudyTime
      }
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error while deleting session' });
  }
});

// Set daily goal
router.put('/goal', authenticateToken, async (req, res) => {
  try {
    const { dailyGoal } = req.body;
    const userId = req.user._id;

    // Validate goal (between 15 minutes and 12 hours)
    if (!dailyGoal || dailyGoal < 900000 || dailyGoal > 43200000) {
      return res.status(400).json({ 
        message: 'Daily goal must be between 15 minutes and 12 hours' 
      });
    }

    const user = await User.findById(userId);
    user.dailyGoal = dailyGoal;
    await user.save();

    res.json({
      message: 'Daily goal updated successfully',
      dailyGoal: user.dailyGoal
    });
  } catch (error) {
    console.error('Set goal error:', error);
    res.status(500).json({ message: 'Server error while setting goal' });
  }
});

// Get today's progress
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStudyTime = user.studySessions
      .filter(session => session.startTime >= today && session.startTime < tomorrow)
      .reduce((total, session) => total + session.duration, 0);

    const todaySessions = user.studySessions
      .filter(session => session.startTime >= today && session.startTime < tomorrow)
      .length;

    res.json({
      todayStudyTime,
      todaySessions,
      dailyGoal: user.dailyGoal,
      currentStreak: user.currentStreak,
      achievements: user.achievements.slice(-5) // Last 5 achievements
    });
  } catch (error) {
    console.error('Get today error:', error);
    res.status(500).json({ message: 'Server error while fetching today\'s progress' });
  }
});

// Get study statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Calculate daily stats for the past week
    const weekStats = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayStudyTime = user.studySessions
        .filter(session => 
          session.startTime >= date && session.startTime < nextDate
        )
        .reduce((total, session) => total + session.duration, 0);
      
      weekStats.push({
        date: date.toISOString().split('T')[0],
        studyTime: dayStudyTime
      });
    }

    // Subject breakdown
    const subjectStats = {};
    user.studySessions.forEach(session => {
      const subject = session.subject || 'General Study';
      subjectStats[subject] = (subjectStats[subject] || 0) + session.duration;
    });

    res.json({
      totalStudyTime: user.totalStudyTime,
      weeklyStudyTime: user.weeklyStudyTime,
      monthlyStudyTime: user.monthlyStudyTime,
      weekStats,
      subjectStats,
      totalSessions: user.studySessions.length,
      schedules: user.studySchedules
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

export default router; 