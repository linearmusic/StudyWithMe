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
  this.studySessions.push(session);
  this.totalStudyTime += session.duration;
  
  // Update weekly and monthly stats
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  if (session.startTime >= weekStart) {
    this.weeklyStudyTime += session.duration;
  }
  
  if (session.startTime >= monthStart) {
    this.monthlyStudyTime += session.duration;
  }

  // Update streak
  this.updateStreak(session.startTime);
  
  // Check for achievements
  return this.checkAchievements();
};

userSchema.methods.updateStreak = function(sessionDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sessionDay = new Date(sessionDate);
  sessionDay.setHours(0, 0, 0, 0);
  
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
};

userSchema.methods.checkAchievements = function() {
  const newAchievements = [];
  
  // Check if achievement already exists
  const hasAchievement = (type) => this.achievements.some(a => a.type === type);
  
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
  
  // 3-day streak
  if (this.currentStreak >= 3 && !hasAchievement('streak_3')) {
    newAchievements.push('streak_3');
  }
  
  // 7-day streak
  if (this.currentStreak >= 7 && !hasAchievement('streak_7')) {
    newAchievements.push('streak_7');
  }
  
  // 30-day streak
  if (this.currentStreak >= 30 && !hasAchievement('streak_30')) {
    newAchievements.push('streak_30');
  }
  
  // Study goal achiever (studied at least goal amount for 7 days)
  const recentSessions = this.studySessions.filter(s => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return s.startTime >= weekAgo;
  });
  
  const dayGroups = {};
  recentSessions.forEach(session => {
    const day = session.startTime.toDateString();
    dayGroups[day] = (dayGroups[day] || 0) + session.duration;
  });
  
  const goalDays = Object.values(dayGroups).filter(time => time >= this.dailyGoal).length;
  if (goalDays >= 7 && !hasAchievement('goal_achiever')) {
    newAchievements.push('goal_achiever');
  }
  
  // Add new achievements
  newAchievements.forEach(type => {
    this.achievements.push({ type, date: new Date() });
  });
  
  return newAchievements;
};

export default mongoose.model('User', userSchema); 