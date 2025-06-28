import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Friends from './pages/Friends'
import Schedule from './pages/Schedule'
import Sessions from './pages/Sessions'
import Statistics from './pages/Statistics'
import Profile from './pages/Profile'
import Rankings from './pages/Rankings'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is logged in, wrap with SocketProvider
  if (user) {
    return (
      <SocketProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <Routes>
            <Route 
              path="/login" 
              element={<Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={<Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={<Dashboard />} 
            />
            <Route 
              path="/friends" 
              element={<Friends />} 
            />
            <Route 
              path="/schedule" 
              element={<Schedule />} 
            />
            <Route 
              path="/sessions" 
              element={<Sessions />} 
            />
            <Route 
              path="/statistics" 
              element={<Statistics />} 
            />
            <Route 
              path="/rankings" 
              element={<Rankings />} 
            />
            <Route 
              path="/profile/:userId?" 
              element={<Profile />} 
            />
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" />} 
            />
          </Routes>
        </div>
      </SocketProvider>
    )
  }

  // If no user, show login/register pages without socket
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/login" 
          element={<Login />} 
        />
        <Route 
          path="/register" 
          element={<Register />} 
        />
        <Route 
          path="/" 
          element={<Navigate to="/login" />} 
        />
        <Route 
          path="*" 
          element={<Navigate to="/login" />} 
        />
      </Routes>
    </div>
  )
}

export default App
