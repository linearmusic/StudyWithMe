import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
  constructor() {
    // Create email transporter - you'll need to configure this with your email credentials
    this.transporter = nodemailer.createTransporter({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Send OTP for email verification
  async sendOTPEmail(email, otp, username) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'StudyTogether - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Welcome to StudyTogether!</h2>
          <p>Hi ${username},</p>
          <p>Thank you for signing up! Please verify your email address with the OTP below:</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1F2937; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <br>
          <p>Best regards,<br>StudyTogether Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  // Send study session notification
  async sendSessionNotification(email, sessionDetails, username) {
    const { title, subject, startTime, endTime } = sessionDetails;
    const formattedStartTime = new Date(startTime).toLocaleString();
    const formattedEndTime = new Date(endTime).toLocaleString();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: `StudyTogether - Upcoming Study Session: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">📚 Study Session Reminder</h2>
          <p>Hi ${username},</p>
          <p>You have an upcoming study session scheduled:</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin-top: 0;">${title}</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Start Time:</strong> ${formattedStartTime}</p>
            <p><strong>End Time:</strong> ${formattedEndTime}</p>
          </div>
          
          <p>Don't forget to prepare your study materials and find a quiet place to focus!</p>
          <p>Good luck with your studies!</p>
          
          <br>
          <p>Best regards,<br>StudyTogether Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Session notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending session notification:', error);
      return false;
    }
  }

  // Send friend invitation notification
  async sendFriendInviteNotification(email, inviterName, inviteCode) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: `StudyTogether - Friend Invitation from ${inviterName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">🤝 You've been invited to StudyTogether!</h2>
          <p>Hi there,</p>
          <p>${inviterName} has invited you to join them on StudyTogether - a platform for collaborative studying!</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <p>Use this invite code to connect:</p>
            <h2 style="color: #1F2937; margin: 10px 0; letter-spacing: 2px;">${inviteCode}</h2>
          </div>
          
          <p>StudyTogether helps you:</p>
          <ul>
            <li>Track your study sessions and progress</li>
            <li>Connect with friends and study together</li>
            <li>Set study schedules and receive reminders</li>
            <li>Compete on leaderboards and earn achievements</li>
          </ul>
          
          <p><a href="http://localhost:5173/register" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Join StudyTogether</a></p>
          
          <br>
          <p>Best regards,<br>StudyTogether Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Friend invite notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending friend invite notification:', error);
      return false;
    }
  }

  // Send achievement notification
  async sendAchievementNotification(email, achievement, username) {
    const achievementNames = {
      'first_session': 'First Study Session! 🎉',
      'five_sessions': '5 Study Sessions Complete! 📚',
      'twenty_five_sessions': '25 Study Sessions Master! 🏆',
      'streak_3': '3-Day Study Streak! 🔥',
      'streak_7': '7-Day Study Streak! 🌟',
      'streak_30': '30-Day Study Streak! 👑',
      'goal_achiever': 'Weekly Goal Achiever! 🎯'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: `StudyTogether - New Achievement Unlocked!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">🏆 Achievement Unlocked!</h2>
          <p>Hi ${username},</p>
          <p>Congratulations! You've earned a new achievement:</p>
          
          <div style="background-color: #F59E0B; color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 24px;">${achievementNames[achievement] || achievement}</h2>
          </div>
          
          <p>Keep up the great work and continue your study journey!</p>
          
          <br>
          <p>Best regards,<br>StudyTogether Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Achievement notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending achievement notification:', error);
      return false;
    }
  }
}

export default new EmailService(); 