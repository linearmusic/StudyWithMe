import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { 
  HiPlay, 
  HiPause, 
  HiStop, 
  HiClock, 
  HiUsers, 
  HiCalendar,
  HiTrendingUp,
  HiCog,
  HiCheckCircle,
  HiFire,
  HiStar,
  HiBadgeCheck
} from 'react-icons/hi'
import axios from 'axios'
import toast from 'react-hot-toast'

// Achievement definitions
const achievementDefs = {
  'first_session': { icon: HiStar, title: 'First Steps', desc: 'Completed your first study session', color: 'text-yellow-500' },
  'five_sessions': { icon: HiCheckCircle, title: 'Getting Started', desc: 'Completed 5 study sessions', color: 'text-green-500' },
  'twenty_five_sessions': { icon: HiBadgeCheck, title: 'Dedicated', desc: 'Completed 25 study sessions', color: 'text-blue-500' },
  'streak_3': { icon: HiFire, title: '3-Day Streak', desc: 'Studied for 3 consecutive days', color: 'text-orange-500' },
  'streak_7': { icon: HiFire, title: 'Week Warrior', desc: 'Studied for 7 consecutive days', color: 'text-red-500' },
  'streak_30': { icon: HiFire, title: 'Study Master', desc: 'Studied for 30 consecutive days', color: 'text-purple-500' },
  'goal_achiever': { icon: HiBadgeCheck, title: 'Goal Crusher', desc: 'Met daily goal for 7 days', color: 'text-indigo-500' }
}

const Dashboard = () => {
  const { user, updateUser } = useAuth()
  const { friendsStudyStatus, startStudySession, stopStudySession } = useSocket()
  const [isStudying, setIsStudying] = useState(false)
  const [studySession, setStudySession] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [subject, setSubject] = useState('')
  const [quickStats, setQuickStats] = useState(null)
  const [upcomingSchedules, setUpcomingSchedules] = useState([])
  const [todayProgress, setTodayProgress] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  
  // Pomodoro state
  const [isPomodoroMode, setIsPomodoroMode] = useState(false)
  const [pomodoroState, setPomodoroState] = useState('work') // 'work' | 'break'
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60) // 25 minutes
  const [isPomodoroPaused, setIsPomodoroPaused] = useState(false)
  
  // Goal settings modal
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [newGoalHours, setNewGoalHours] = useState(2)
  const [newGoalMinutes, setNewGoalMinutes] = useState(0)
  
  const pomodoroInterval = useRef(null)

  useEffect(() => {
    fetchQuickStats()
    fetchUpcomingSchedules()
    fetchTodayProgress()
  }, [])

  useEffect(() => {
    let interval = null
    if (isStudying && studySession && !isPomodoroMode) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - studySession.startTime.getTime())
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStudying, studySession, isPomodoroMode])

  // Pomodoro timer effect
  useEffect(() => {
    if (isPomodoroMode && isStudying && !isPomodoroPaused) {
      pomodoroInterval.current = setInterval(() => {
        setPomodoroTimeLeft(prev => {
          if (prev <= 1) {
            handlePomodoroComplete()
            return 0
          }
          return prev - 1
        })
        setElapsedTime(prev => prev + 1000)
      }, 1000)
    } else {
      clearInterval(pomodoroInterval.current)
    }

    return () => clearInterval(pomodoroInterval.current)
  }, [isPomodoroMode, isStudying, isPomodoroPaused])

  const handlePomodoroComplete = useCallback(() => {
    if (pomodoroState === 'work') {
      // Work session complete, start break
      setPomodoroState('break')
      setPomodoroTimeLeft(5 * 60) // 5 minute break
      toast.success('🍅 Work session complete! Time for a break!')
      
      // Browser notification
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete', { 
          body: 'Work session finished! Take a 5-minute break.' 
        })
      }
    } else {
      // Break complete, start new work session
      setPomodoroState('work')
      setPomodoroTimeLeft(25 * 60) // 25 minute work
      toast.success('✨ Break over! Ready for another study session?')
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Break Complete', { 
          body: 'Break finished! Time to study.' 
        })
      }
    }
  }, [pomodoroState])

  const fetchQuickStats = async () => {
    try {
      const response = await axios.get('/study/stats')
      setQuickStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTodayProgress = async () => {
    try {
      const response = await axios.get('/study/today')
      setTodayProgress(response.data)
      setRecentAchievements(response.data.achievements || [])
    } catch (error) {
      console.error('Error fetching today progress:', error)
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

  const togglePomodoroMode = () => {
    setIsPomodoroMode(!isPomodoroMode)
    setPomodoroState('work')
    setPomodoroTimeLeft(25 * 60)
    setIsPomodoroPaused(false)
    
    if (!isPomodoroMode) {
      // Request notification permission
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission()
      }
      toast.success('🍅 Pomodoro mode activated!')
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
      
      if (isPomodoroMode) {
        setPomodoroTimeLeft(25 * 60)
        setPomodoroState('work')
      }
      
      // Notify socket
      startStudySession(subject || 'General Study')
      
      toast.success(`Study session started${isPomodoroMode ? ' in Pomodoro mode' : ''}!`)
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
      setIsPomodoroPaused(false)

      // Update user stats
      updateUser(response.data.stats)
      
      // Show new achievements
      if (response.data.newAchievements && response.data.newAchievements.length > 0) {
        response.data.newAchievements.forEach(achievement => {
          const def = achievementDefs[achievement]
          if (def) {
            toast.success(`🏆 Achievement unlocked: ${def.title}!`, { duration: 4000 })
          }
        })
      }
      
      // Notify socket
      stopStudySession()

      const duration = response.data.session.duration
      const hours = Math.floor(duration / (1000 * 60 * 60))
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
      
      toast.success(`Study session completed! ${hours}h ${minutes}m`)
      
      // Refresh stats
      fetchQuickStats()
      fetchTodayProgress()
    } catch (error) {
      console.error('Error stopping study session:', error)
      toast.error('Failed to stop study session')
    }
  }

  const handleUpdateGoal = async () => {
    try {
      const goalInMs = (newGoalHours * 60 + newGoalMinutes) * 60 * 1000
      await axios.put('/study/goal', { dailyGoal: goalInMs })
      
      updateUser({ dailyGoal: goalInMs })
      setShowGoalModal(false)
      fetchTodayProgress()
      toast.success('Daily goal updated!')
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal')
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

  const formatPomodoroTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const goalProgress = todayProgress ? (todayProgress.todayStudyTime / todayProgress.dailyGoal) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 text-sm">
          Ready to continue your study journey?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Study Timer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Study Timer</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePomodoroMode}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                    isPomodoroMode
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>🍅</span>
                  <span>Pomodoro</span>
                </button>
              </div>
            </div>
            
            <div className="text-center">
              {isPomodoroMode ? (
                <div className="mb-3">
                  <div className={`text-4xl font-mono font-bold mb-1 ${
                    pomodoroState === 'work' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatPomodoroTime(pomodoroTimeLeft)}
                  </div>
                  <p className="text-sm font-medium">
                    {pomodoroState === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
                  </p>
                </div>
              ) : (
                <div className="text-4xl font-mono font-bold text-blue-600 mb-4">
                  {formatTime(elapsedTime)}
                </div>
              )}

              {!isStudying && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="What are you studying? (optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {isStudying && studySession && (
                <div className="mb-3">
                  <p className="text-base text-gray-700">
                    Studying: <span className="font-medium">{studySession.subject}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Started at {new Date(studySession.startTime).toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div className="flex justify-center space-x-3">
                {!isStudying ? (
                  <button
                    onClick={handleStartStudy}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <HiPlay className="w-4 h-4" />
                    <span>Start Studying</span>
                  </button>
                ) : (
                  <>
                    {isPomodoroMode && (
                      <button
                        onClick={() => setIsPomodoroPaused(!isPomodoroPaused)}
                        className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        {isPomodoroPaused ? <HiPlay className="w-4 h-4" /> : <HiPause className="w-4 h-4" />}
                        <span>{isPomodoroPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                    )}
                    <button
                      onClick={handleStopStudy}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <HiStop className="w-4 h-4" />
                      <span>Stop Session</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Daily Goal Progress */}
          {todayProgress && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-900">Daily Goal Progress</h3>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiCog className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {formatDuration(todayProgress.todayStudyTime)} / {formatDuration(todayProgress.dailyGoal)}
                  </span>
                  <span className="font-medium text-gray-900">{Math.round(goalProgress)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      goalProgress >= 100
                        ? 'bg-green-500'
                        : goalProgress >= 70
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(goalProgress, 100)}%` }}
                  ></div>
                </div>
                
                {goalProgress >= 100 && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <HiCheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Goal achieved! 🎉</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {quickStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="bg-white rounded-lg shadow-md p-3">
                <div className="flex items-center">
                  <HiClock className="w-6 h-6 text-blue-600" />
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">Today</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDuration(todayProgress?.todayStudyTime || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-3">
                <div className="flex items-center">
                  <HiFire className="w-6 h-6 text-orange-600" />
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">Streak</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {todayProgress?.currentStreak || 0} days
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-3">
                <div className="flex items-center">
                  <HiTrendingUp className="w-6 h-6 text-green-600" />
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-500">This Week</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDuration(quickStats.weeklyStudyTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                🏆 Achievements
              </h3>
              
              <div className="space-y-2">
                {recentAchievements.slice(-2).reverse().map((achievement, index) => {
                  const def = achievementDefs[achievement.type]
                  if (!def) return null
                  
                  const Icon = def.icon
                  return (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <Icon className={`w-5 h-5 ${def.color}`} />
                      <div>
                        <p className="font-medium text-gray-900 text-xs">{def.title}</p>
                        <p className="text-xs text-gray-600 leading-tight">{def.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Friends Activity */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Friends Activity
            </h3>
            
            {user?.friends && user.friends.length > 0 ? (
              <div className="space-y-2">
                {user.friends.slice(0, 3).map((friend) => {
                  const friendId = friend.id || friend._id
                  const status = friendsStudyStatus[friendId]
                  return (
                    <div key={friendId} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {friend.username[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="ml-2 text-xs font-medium text-gray-900">
                          {friend.username}
                        </span>
                      </div>
                      
                      {status?.studying ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="ml-1 text-xs text-green-600">Studying</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Offline</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">
                Add friends to see their study activity!
              </p>
            )}
          </div>

          {/* Upcoming Schedules */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Upcoming Sessions
            </h3>
            
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-2">
                {upcomingSchedules.slice(0, 2).map((schedule) => (
                  <div key={schedule._id} className="border border-gray-200 rounded-lg p-2">
                    <h4 className="font-medium text-gray-900 text-xs">{schedule.title}</h4>
                    <p className="text-xs text-gray-600">{schedule.subject}</p>
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
              <p className="text-gray-500 text-xs">
                No upcoming study sessions. Create a schedule to get started!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Set Daily Goal
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={newGoalHours}
                    onChange={(e) => setNewGoalHours(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Minutes</label>
                  <select
                    value={newGoalMinutes}
                    onChange={(e) => setNewGoalMinutes(parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>0</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={45}>45</option>
                  </select>
                </div>
              </div>
              
              <p className="text-xs text-gray-600">
                Current goal: {formatDuration(todayProgress?.dailyGoal || 7200000)}
              </p>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGoal}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 