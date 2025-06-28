import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { HiClock, HiEye, HiEyeOff, HiSun, HiMoon } from 'react-icons/hi'
import OTPVerification from '../components/OTPVerification'

// API URL configuration for different environments
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [unverifiedUser, setUnverifiedUser] = useState(null)
  const { login, loginWithToken } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        loginWithToken(data.user, data.token)
      } else if (response.status === 403 && data.needsVerification) {
        // Email not verified
        setUnverifiedUser({
          userId: data.userId,
          email: data.email
        })
        setShowOTPVerification(true)
      } else {
        setError(data.message || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSuccess = async (verificationData) => {
    try {
      loginWithToken(verificationData.user, verificationData.token)
    } catch (error) {
      console.error('Login after verification error:', error)
      setError('Verification successful! Please login manually.')
      setShowOTPVerification(false)
    }
  }

  const handleResendOTP = () => {
    console.log('OTP resent successfully')
  }

  // Show OTP verification if user email is not verified
  if (showOTPVerification && unverifiedUser) {
    return (
      <OTPVerification
        email={unverifiedUser.email}
        userId={unverifiedUser.userId}
        onVerificationSuccess={handleVerificationSuccess}
        onResendOTP={handleResendOTP}
      />
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-md w-full space-y-4">
        {/* Theme Toggle */}
        <div className="flex justify-end">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            } shadow-sm`}
          >
            {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-center">
          <div className="flex justify-center">
            <HiClock className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className={`mt-3 text-2xl font-extrabold transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome back
          </h2>
          <p className={`mt-1 text-sm transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Sign in to continue your study journey
          </p>
        </div>

        <div className={`py-6 px-4 shadow-xl rounded-lg sm:px-8 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className={`block text-sm font-medium transition-colors ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className={`block text-sm font-medium transition-colors ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <HiEyeOff className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  ) : (
                    <HiEye className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <span className={`text-sm transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up here
                </Link>
              </span>
            </div>
          </form>
        </div>

        <div className={`text-center text-xs mt-2 transition-colors ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          <p>StudyTogether - Make studying social and productive</p>
        </div>
      </div>
    </div>
  )
}

export default Login 