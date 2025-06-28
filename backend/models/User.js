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
  }
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
};

export default mongoose.model('User', userSchema); 