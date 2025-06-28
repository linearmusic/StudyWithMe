# StudyTogether - Collaborative Study Platform

A comprehensive study companion that makes studying social and productive. Track your study time, connect with friends, schedule study sessions, and analyze your progress with beautiful statistics.

## 🌟 Features

- **Real-time Study Timer** - Track study sessions with live timer
- **Friend System** - Add friends via unique invite codes
- **Live Activity Feed** - See when friends are studying in real-time
- **Study Schedules** - Create and track study schedules with progress
- **Statistics & Analytics** - Beautiful charts and achievement system
- **Responsive Design** - Works perfectly on mobile and desktop
- **Socket.io Integration** - Real-time notifications and updates

## 🚀 Tech Stack

### Frontend
- React 19 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Socket.io Client for real-time features
- Recharts for beautiful analytics
- React Hot Toast for notifications

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- bcryptjs for password hashing

## 🏗️ Project Structure

```
Study Together/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts for state
│   │   ├── pages/        # Main application pages
│   │   └── assets/       # Static assets
│   └── package.json
├── backend/           # Node.js backend API
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── package.json
└── README.md
```

## 🔧 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment variables:**
   ```bash
   # Copy the example file and fill in your actual values:
   cp env.example .env
   
   # Edit .env with your actual credentials:
   # MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/study-together
   # JWT_SECRET=your-super-secret-jwt-key
   # PORT=3001
   # NODE_ENV=development
   ```
   
   ⚠️ **Important**: Never commit your `.env` file. It contains sensitive credentials and is already in `.gitignore`.

4. **Start the server:**
   ```bash
   npm run dev
   ```

   Backend will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

## 🌐 Deployment

### Option 1: Render (Backend) + Vercel (Frontend) [Recommended]

#### Deploy Backend on Render:

1. **Create account at [render.com](https://render.com)**

2. **Create new Web Service:**
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-together
   FRONTEND_URL=https://your-app.vercel.app
   ```

#### Deploy Frontend on Vercel:

1. **Create account at [vercel.com](https://vercel.com)**

2. **Import your repository:**
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```

4. **Update URLs in code:**
   - Update `AuthContext.jsx` with your backend URL
   - Update `SocketContext.jsx` with your backend URL

### Option 2: Full Deployment on Render

You can also deploy both frontend and backend on Render as separate services.

## 🎯 Usage

### Getting Started

1. **Register/Login:**
   - Create an account with username, email, and password
   - Login to access the dashboard

2. **Study Timer:**
   - Start studying by clicking "Start Studying"
   - Add a subject (optional)
   - Stop when done to save the session

3. **Add Friends:**
   - Share your unique invite code with friends
   - Add friends using their invite codes
   - See live activity when friends are studying

4. **Create Schedules:**
   - Plan study sessions in advance
   - Set start/end times and subjects
   - Track progress as you complete sessions

5. **View Statistics:**
   - Analyze your study patterns
   - View weekly charts and subject breakdowns
   - Earn achievements for milestones

## 🔒 Environment Variables

⚠️ **Security Note**: Never commit `.env` files or expose credentials in your code. Use the provided `env.example` file as a template.

### Backend (.env)
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
PORT=3001
NODE_ENV=production
FRONTEND_URL=your-frontend-url
```

**Setup Instructions:**
1. Copy `backend/env.example` to `backend/.env`
2. Replace placeholder values with your actual credentials
3. The `.env` file is already in `.gitignore` and will not be committed

### Frontend (Vercel Environment Variables)
```
VITE_API_URL=your-backend-api-url
VITE_SOCKET_URL=your-backend-socket-url
```

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure FRONTEND_URL is set correctly in backend
   - Check that origin URLs match exactly

2. **Socket.io Connection Failed:**
   - Verify VITE_SOCKET_URL points to correct backend
   - Ensure backend WebSocket is enabled

3. **Database Connection Failed:**
   - Check MongoDB URI is correct
   - Ensure IP whitelist includes 0.0.0.0/0 for deployments

4. **Build Failures:**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

## 📱 Features Breakdown

### Dashboard
- Real-time study timer with subject tracking
- Quick statistics (today, week, total sessions)
- Friends activity sidebar showing who's studying
- Upcoming scheduled study sessions

### Friends System
- Unique 8-character invite codes for each user
- Add friends without friend requests
- Live online status and study activity
- Direct profile viewing for friends

### Study Schedules
- Create recurring or one-time study sessions
- Progress tracking with visual indicators
- Complete sessions manually or via timer
- Calendar view of upcoming sessions

### Statistics & Analytics
- Weekly study pattern charts
- Subject-wise time distribution
- Achievement system with milestones
- Schedule completion tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.io for real-time communication
- Recharts for beautiful data visualization
- Tailwind CSS for rapid UI development
- MongoDB Atlas for database hosting
- Render and Vercel for deployment platforms

---

**Made with ❤️ for productive studying**

For support or questions, please open an issue on GitHub. 