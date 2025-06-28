import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Avatar from './Avatar'
import { 
  HiHome, 
  HiUsers, 
  HiCalendar, 
  HiChartBar, 
  HiUser, 
  HiLogout, 
  HiMenu, 
  HiX,
  HiClock,
  HiAcademicCap,
  HiStar
} from 'react-icons/hi'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/dashboard', icon: HiHome, label: 'Dashboard' },
    { path: '/friends', icon: HiUsers, label: 'Friends' },
    { path: '/schedule', icon: HiCalendar, label: 'Schedule' },
    { path: '/sessions', icon: HiClock, label: 'Sessions' },
    { path: '/statistics', icon: HiChartBar, label: 'Statistics' },
    { path: '/rankings', icon: HiStar, label: 'Rankings' },
  ]

  return (
    <nav className={`shadow-lg border-b sticky top-0 z-50 transition-colors ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <HiAcademicCap className="w-8 h-8 text-blue-600" />
            <span className={`text-lg font-bold transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>StudyTogether</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-300'
                    : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to={`/profile/${user?.id}`}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Avatar user={user} size="sm" />
              <span className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
              }`}>
                {user?.username}
              </span>
            </Link>

            <Link
              to={`/profile/${user?.id}`}
              className={`p-2 rounded-md transition-colors ${
                isActive(`/profile/${user?.id}`)
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-300'
                  : `${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
              }`}
            >
              <HiUser className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className={`p-2 rounded-md transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <HiLogout className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className={`md:hidden border-t transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(path)
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-300'
                    : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}

            {/* Mobile User Menu */}
            <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Link 
                to={`/profile/${user?.id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 hover:opacity-80 transition-opacity"
              >
                <Avatar user={user} size="lg" />
                <div className="ml-3">
                  <div className={`text-base font-medium transition-colors ${
                    isDark ? 'text-white hover:text-blue-400' : 'text-gray-800 hover:text-blue-600'
                  }`}>
                    {user?.username}
                  </div>
                  <div className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {user?.email}
                  </div>
                </div>
              </Link>

              <Link
                to={`/profile/${user?.id}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(`/profile/${user?.id}`)
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-300'
                    : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`
                }`}
              >
                <HiUser className="w-5 h-5" />
                <span>Profile</span>
              </Link>

              <button
                onClick={() => {
                  handleLogout()
                  setIsOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-red-400 hover:bg-red-900/20' 
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <HiLogout className="w-5 h-5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar 