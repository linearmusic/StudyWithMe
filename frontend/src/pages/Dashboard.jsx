import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { HiPlay, HiPause, HiStop, HiClock, HiUsers, HiCalendar, HiTrendingUp } from 'react-icons/hi'
import axios from 'axios'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, updateUser } = useAuth()
  const { friendsStudyStatus, startStudySession, stopStudySession } = useSocket()
  const [isStudying, setIsStudying] = useState(false)
  const [studySession, setStudySession] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [subject, setSubject] = useState('')
  const [quickStats, setQuickStats] = useState(null)
  const [upcomingSchedules, setUpcomingSchedules] = useState([])

  useEffect(() => {
    fetchQuickStats()
    fetchUpcomingSchedules()
  }, [])

  useEffect(() => {
    let interval = null
    if (isStudying && studySession) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - studySession.startTime.getTime())
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStudying, studySession])

  const fetchQuickStats = async () => {
    try {
      const response = await axios.get('/study/stats')
      setQuickStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUpcomingSchedules = async () => {
    try {
      const response = await axios.get('/auth/me')
      const today = new Date()
      const upcoming = response.data.user.studySchedules
        .filter(schedule => {
          const scheduleDate = new Date(schedule.startTime)
          return scheduleDate >= today && !schedule.completed
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 3)
      
      setUpcomingSchedules(upcoming)
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  const handleStartStudy = async () => {
    try {
      const response = await axios.post('/study/session/start', {
        subject: subject || 'General Study'
      })

      const sessionData = {
        ...response.data.session,
        startTime: new Date()
      }

      setStudySession(sessionData)
      setIsStudying(true)
      setElapsedTime(0)
      
      // Notify socket
      startStudySession(subject || 'General Study')
      
      toast.success('Study session started!')
    } catch (error) {
      console.error('Error starting study session:', error)
      toast.error('Failed to start study session')
    }
  }

  const handleStopStudy = async () => {
    if (!studySession) return

    try {
      const response = await axios.post('/study/session/stop', {
        startTime: studySession.startTime,
        subject: subject || 'General Study'
      })

      setIsStudying(false)
      setStudySession(null)
      setElapsedTime(0)
      setSubject('')

      // Update user stats
      updateUser(response.data.stats)
      
      // Notify socket
      stopStudySession()

      const duration = response.data.session.duration
      const hours = Math.floor(duration / (1000 * 60 * 60))
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
      
      toast.success(`Study session completed! ${hours}h ${minutes}m`)
      
      // Refresh stats
      fetchQuickStats()
    } catch (error) {
      console.error('Error stopping study session:', error)
      toast.error('Failed to stop study session')
    }
  }

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 mt-2">
          Ready to continue your study journey?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Study Timer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Study Timer</h2>
            
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-blue-600 mb-8">
                {formatTime(elapsedTime)}
              </div>

              {!isStudying && (
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="What are you studying? (optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {isStudying && studySession && (
                <div className="mb-6">
                  <p className="text-lg text-gray-700">
                    Studying: <span className="font-medium">{studySession.subject}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Started at {new Date(studySession.startTime).toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                {!isStudying ? (
                  <button
                    onClick={handleStartStudy}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <HiPlay className="w-5 h-5" />
                    <span>Start Studying</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopStudy}
                    className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <HiStop className="w-5 h-5" />
                    <span>Stop Session</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {quickStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center">
                  <HiClock className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Today</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDuration(
                        quickStats.weekStats[quickStats.weekStats.length - 1]?.studyTime || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center">
                  <HiTrendingUp className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">This Week</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDuration(quickStats.weeklyStudyTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center">
                  <HiCalendar className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {quickStats.totalSessions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Friends Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Friends Activity
            </h3>
            
            {user?.friends && user.friends.length > 0 ? (
              <div className="space-y-3">
                {user.friends.slice(0, 5).map((friend) => {
                  const status = friendsStudyStatus[friend.id]
                  return (
                    <div key={friend.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {friend.username[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {friend.username}
                        </span>
                      </div>
                      
                      {status?.studying ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="ml-2 text-xs text-green-600">Studying</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Offline</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Add friends to see their study activity!
              </p>
            )}
          </div>

          {/* Upcoming Schedules */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Sessions
            </h3>
            
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-3">
                {upcomingSchedules.map((schedule) => (
                  <div key={schedule._id} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900">{schedule.title}</h4>
                    <p className="text-sm text-gray-600">{schedule.subject}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(schedule.startTime).toLocaleDateString()} at{' '}
                      {new Date(schedule.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No upcoming study sessions. Create a schedule to get started!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 