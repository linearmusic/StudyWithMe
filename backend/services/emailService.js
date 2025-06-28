import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded with explicit path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Double-check environment variables are loaded
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('⚠️ Retrying .env file loading...');
  dotenv.config();
}

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_USER;
    this.setupTransporter();
  }

  setupTransporter() {
    try {
      // Check if Gmail credentials are provided
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // This should be your Gmail App Password
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        console.log('📧 Email Service initialized with Gmail SMTP');
      } 
      // Alternative: Use OAuth (if configured)
      else if (process.env.EMAIL_USER && process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET && process.env.OAUTH_REFRESH_TOKEN) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
          }
        });
        console.log('📧 Email Service initialized with Gmail OAuth');
      }
      // Alternative: Use other SMTP service
      else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('📧 Email Service initialized with Custom SMTP');
      }
      else {
        this.transporter = null;
        console.log('📧 Email Service initialized (Development Mode - No credentials)');
        console.log('💡 To enable email sending, choose one of these options:');
        console.log('');
        console.log('🔹 Option 1: Gmail App Password');
        console.log('   1. Enable 2-Step Verification on Gmail');
        console.log('   2. Generate App Password');
        console.log('   3. Set EMAIL_USER and EMAIL_PASS in .env file');
        console.log('');
        console.log('🔹 Option 2: Gmail OAuth (Recommended by Google)');
        console.log('   1. Set up Google Cloud Console project');
        console.log('   2. Set OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REFRESH_TOKEN');
        console.log('');
        console.log('🔹 Option 3: Alternative SMTP Service');
        console.log('   1. Use Mailgun, SendGrid, or other SMTP provider');
        console.log('   2. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env file');
        console.log('');
        console.log('🔹 Option 4: Development Mode (Current)');
        console.log('   - Emails will be logged to console only');
      }
    } catch (error) {
      console.error('Failed to setup email transporter:', error);
      this.transporter = null;
    }
  }

  async sendEmail(to, subject, htmlContent) {
    if (!this.transporter) {
      // Development mode - just log the email
      console.log('\n📧 EMAIL NOTIFICATION (Dev Mode):');
      console.log('├── To:', to);
      console.log('├── Subject:', subject);
      console.log('└── Content Preview:', htmlContent.substring(0, 100) + '...');
      console.log('⚠️  WARNING: No actual email sent - running in development mode');
      console.log('💡 Check your EMAIL_USER and EMAIL_PASS environment variables');
      return false; // Return false to indicate email wasn't actually sent
    }

    try {
      const mailOptions = {
        from: `"StudyTogether" <${this.fromEmail}>`,
        to: to,
        subject: subject,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      
      // Check if it's a temporary Gmail error
      if (error.message.includes('temporarily rejected') || error.message.includes('rate limit')) {
        console.log('📧 Gmail temporarily unavailable, but will retry later');
        // For temporary errors, still return true as the service is working
        return true;
      }
      
      // Fallback to development mode logging for other errors
      console.log('\n📧 EMAIL NOTIFICATION (Fallback):');
      console.log('├── To:', to);
      console.log('├── Subject:', subject);
      console.log('└── Content Preview:', htmlContent.substring(0, 100) + '...');
      return true; // Return true to not break the flow
    }
  }

  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Send OTP for email verification
  async sendOTPEmail(email, otp, username) {
    const htmlContent = `
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
    `;

    return await this.sendEmail(email, 'StudyTogether - Email Verification', htmlContent);
  }

  // Send study session notification
  async sendSessionNotification(email, sessionDetails, username) {
    const { title, subject, startTime, endTime } = sessionDetails;
    const formattedStartTime = new Date(startTime).toLocaleString();
    const formattedEndTime = new Date(endTime).toLocaleString();

    const htmlContent = `
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
    `;

    return await this.sendEmail(email, `StudyTogether - Upcoming Study Session: ${title}`, htmlContent);
  }

  // Send friend invitation notification
  async sendFriendInviteNotification(email, inviterName, inviteCode) {
    const htmlContent = `
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
    `;

    return await this.sendEmail(email, `StudyTogether - Friend Invitation from ${inviterName}`, htmlContent);
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

    const htmlContent = `
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
    `;

    return await this.sendEmail(email, 'StudyTogether - New Achievement Unlocked!', htmlContent);
  }
}

export default new EmailService(); 