import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

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

    const endTime = new Date();
    const duration = endTime.getTime() - new Date(startTime).getTime();

    const sessionData = {
      startTime: new Date(startTime),
      endTime,
      duration,
      subject: subject || 'General Study',
      notes: notes || ''
    };

    // Add session to user
    const user = await User.findById(userId);
    user.addStudySession(sessionData);

    // If this was for a scheduled study, mark progress
    if (scheduleId) {
      const schedule = user.studySchedules.id(scheduleId);
      if (schedule) {
        schedule.completedSessions.push({
          date: new Date(),
          duration,
          actualStartTime: sessionData.startTime,
          actualEndTime: sessionData.endTime
        });

        // Check if schedule target is met (only for schedules with endTime)
        if (schedule.endTime) {
          const totalScheduleDuration = schedule.completedSessions.reduce(
            (total, session) => total + session.duration, 0
          );
          const plannedDuration = schedule.endTime.getTime() - schedule.startTime.getTime();
          
          if (totalScheduleDuration >= plannedDuration) {
            schedule.completed = true;
          }
        }
      }
    }

    await user.save();

    res.json({
      message: 'Study session completed',
      session: sessionData,
      stats: {
        totalStudyTime: user.totalStudyTime,
        weeklyStudyTime: user.weeklyStudyTime,
        monthlyStudyTime: user.monthlyStudyTime
      }
    });
  } catch (error) {
    console.error('Stop session error:', error);
    res.status(500).json({ message: 'Server error while stopping session' });
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
      endTime: endTime ? new Date(endTime) : null,  // Handle optional endTime
      recurring: recurring || 'none'
    };

    const user = await User.findById(userId);
    user.studySchedules.push(scheduleData);
    await user.save();

    const newSchedule = user.studySchedules[user.studySchedules.length - 1];

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