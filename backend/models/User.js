import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    default: null
  },
  otpExpiresAt: {
    type: Date,
    default: null
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendInviteCode: {
    type: String,
    unique: true,
    required: true
  },
  studySessions: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // in milliseconds
    subject: String,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  studySchedules: [{
    title: String,
    subject: String,
    startTime: Date,
    endTime: Date,
    recurring: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedSessions: [{
      date: Date,
      duration: Number,
      actualStartTime: Date,
      actualEndTime: Date
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalStudyTime: {
    type: Number,
    default: 0 // in milliseconds
  },
  weeklyStudyTime: {
    type: Number,
    default: 0
  },
  monthlyStudyTime: {
    type: Number,
    default: 0
  },
  lastStudyReset: {
    type: Date,
    default: Date.now
  },
  dailyGoal: {
    type: Number,
    default: 7200000 // 2 hours in milliseconds
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastStudyDate: Date,
  achievements: [{
    type: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addStudySession = function(session) {
  try {
    // Validate session data
    if (!session || typeof session !== 'object') {
      throw new Error('Invalid session data provided');
    }

    if (!session.startTime || !session.endTime || !session.duration) {
      throw new Error('Missing required session fields (startTime, endTime, duration)');
    }

    if (typeof session.duration !== 'number' || session.duration <= 0) {
      throw new Error('Invalid session duration');
    }

    // Add session to array
    this.studySessions.push(session);
    
    // Safely update total study time
    this.totalStudyTime = (this.totalStudyTime || 0) + session.duration;
    
    // Update weekly and monthly stats with error handling
    try {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      if (session.startTime >= weekStart) {
        this.weeklyStudyTime = (this.weeklyStudyTime || 0) + session.duration;
      }
      
      if (session.startTime >= monthStart) {
        this.monthlyStudyTime = (this.monthlyStudyTime || 0) + session.duration;
      }
    } catch (statsError) {
      console.error('Error updating weekly/monthly stats:', statsError);
      // Continue without failing
    }

    // Update streak with error handling
    try {
      this.updateStreak(session.startTime);
    } catch (streakError) {
      console.error('Error updating streak:', streakError);
      // Continue without failing
    }
    
    // Check for achievements with error handling
    try {
      return this.checkAchievements();
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
      return []; // Return empty array if achievement check fails
    }
  } catch (error) {
    console.error('Error in addStudySession:', error);
    throw error; // Re-throw to be handled by caller
  }
};

userSchema.methods.updateStreak = function(sessionDate) {
  try {
    // Validate session date
    if (!sessionDate) {
      console.error('No session date provided for streak update');
      return;
    }

    const sessionDateObj = new Date(sessionDate);
    if (isNaN(sessionDateObj.getTime())) {
      console.error('Invalid session date for streak update');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sessionDay = new Date(sessionDateObj);
    sessionDay.setHours(0, 0, 0, 0);
    
    // Initialize streak if not set
    if (typeof this.currentStreak !== 'number') {
      this.currentStreak = 0;
    }
    
    if (!this.lastStudyDate) {
      // First ever study session
      this.currentStreak = 1;
      this.lastStudyDate = sessionDay;
    } else {
      const lastStudyDay = new Date(this.lastStudyDate);
      lastStudyDay.setHours(0, 0, 0, 0);
      
      if (sessionDay.getTime() === today.getTime()) {
        // Studying today
        if (lastStudyDay.getTime() === yesterday.getTime()) {
          // Studied yesterday, continue streak
          this.currentStreak += 1;
        } else if (lastStudyDay.getTime() === today.getTime()) {
          // Already studied today, no change
          return;
        } else {
          // Broke streak, start new
          this.currentStreak = 1;
        }
        this.lastStudyDate = sessionDay;
      }
    }
  } catch (error) {
    console.error('Error updating streak:', error);
    // Don't throw, just log and continue
  }
};

userSchema.methods.checkAchievements = function() {
  try {
    const newAchievements = [];
    
    // Initialize achievements array if not set
    if (!Array.isArray(this.achievements)) {
      this.achievements = [];
    }
    
    // Initialize studySessions array if not set
    if (!Array.isArray(this.studySessions)) {
      this.studySessions = [];
    }
    
    // Check if achievement already exists
    const hasAchievement = (type) => {
      try {
        return this.achievements.some(a => a && a.type === type);
      } catch (error) {
        console.error('Error checking existing achievement:', error);
        return false;
      }
    };
    
    // First Study Session
    if (this.studySessions.length === 1 && !hasAchievement('first_session')) {
      newAchievements.push('first_session');
    }
    
    // 5 Study Sessions
    if (this.studySessions.length >= 5 && !hasAchievement('five_sessions')) {
      newAchievements.push('five_sessions');
    }
    
    // 25 Study Sessions
    if (this.studySessions.length >= 25 && !hasAchievement('twenty_five_sessions')) {
      newAchievements.push('twenty_five_sessions');
    }
    
    // Streak achievements
    const currentStreak = this.currentStreak || 0;
    
    // 3-day streak
    if (currentStreak >= 3 && !hasAchievement('streak_3')) {
      newAchievements.push('streak_3');
    }
    
    // 7-day streak
    if (currentStreak >= 7 && !hasAchievement('streak_7')) {
      newAchievements.push('streak_7');
    }
    
    // 30-day streak
    if (currentStreak >= 30 && !hasAchievement('streak_30')) {
      newAchievements.push('streak_30');
    }
    
    // Study goal achiever (studied at least goal amount for 7 days)
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentSessions = this.studySessions.filter(s => {
        try {
          return s && s.startTime && s.startTime >= weekAgo;
        } catch (filterError) {
          console.error('Error filtering recent sessions:', filterError);
          return false;
        }
      });
      
      const dayGroups = {};
      recentSessions.forEach(session => {
        try {
          if (session && session.startTime && session.duration) {
            const day = session.startTime.toDateString();
            dayGroups[day] = (dayGroups[day] || 0) + session.duration;
          }
        } catch (groupError) {
          console.error('Error grouping session by day:', groupError);
        }
      });
      
      const dailyGoal = this.dailyGoal || 7200000; // Default 2 hours
      const goalDays = Object.values(dayGroups).filter(time => time >= dailyGoal).length;
      
      if (goalDays >= 7 && !hasAchievement('goal_achiever')) {
        newAchievements.push('goal_achiever');
      }
    } catch (goalError) {
      console.error('Error checking goal achiever:', goalError);
    }
    
    // Add new achievements
    newAchievements.forEach(type => {
      try {
        this.achievements.push({ type, date: new Date() });
      } catch (pushError) {
        console.error('Error adding achievement:', pushError);
      }
    });
    
    return newAchievements;
  } catch (error) {
    console.error('Error in checkAchievements:', error);
    return []; // Return empty array on error
  }
};

export default mongoose.model('User', userSchema); 