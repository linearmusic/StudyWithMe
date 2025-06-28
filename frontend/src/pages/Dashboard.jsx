import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useTheme } from '../contexts/ThemeContext'
import Avatar from '../components/Avatar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  HiPlay, 
  HiPause, 
  HiStop, 
  HiClock, 
  HiFire, 
  HiTrendingUp, 
  HiCheckCircle, 
  HiCog,
  HiSun,
  HiMoon,
  HiAdjustments
} from 'react-icons/hi'

// Achievement definitions
const achievementDefs = {
  firstSession: { title: 'First Steps', desc: 'Complete your first study session', icon: HiPlay, color: 'text-blue-500' },
  streak3: { title: '3-Day Streak', desc: 'Study for 3 consecutive days', icon: HiFire, color: 'text-orange-500' },
  streak7: { title: 'Week Warrior', desc: 'Study for 7 consecutive days', icon: HiFire, color: 'text-red-500' },
  hours10: { title: 'Study Marathon', desc: 'Complete 10 hours of study', icon: HiClock, color: 'text-green-500' },
  hours50: { title: 'Dedication Master', desc: 'Complete 50 hours of study', icon: HiTrendingUp, color: 'text-purple-500' },
  hours100: { title: 'Study Legend', desc: 'Complete 100 hours of study', icon: HiTrendingUp, color: 'text-yellow-500' },
  goalStreak: { title: 'Goal Getter', desc: 'Reach daily goal 5 days in a row', icon: HiCheckCircle, color: 'text-indigo-500' }
}

const Dashboard = () => {
  const { user, updateUser } = useAuth()
  const { friendsStudyStatus, startStudySession, stopStudySession } = useSocket()
  const { isDark, toggleTheme } = useTheme()
  
  // Study session state
  const [isStudying, setIsStudying] = useState(false)
  const [studySession, setStudySession] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [subject, setSubject] = useState('')
  
  // Data state
  const [quickStats, setQuickStats] = useState(null)
  const [upcomingSchedules, setUpcomingSchedules] = useState([])
  const [todayProgress, setTodayProgress] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  
  // Pomodoro state
  const [isPomodoroMode, setIsPomodoroMode] = useState(false)
  const [pomodoroState, setPomodoroState] = useState('work') // 'work' | 'break'
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60)
  const [isPomodoroPaused, setIsPomodoroPaused] = useState(false)
  
  // Customizable Pomodoro settings
  const [pomodoroSettings, setPomodoroSettings] = useState({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  })
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState(0)
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false)
  
  // Modal states
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
      console.log('Starting regular timer', { isStudying, studySession, isPomodoroMode })
      interval = setInterval(() => {
        const startTime = new Date(studySession.startTime)
        const elapsed = Date.now() - startTime.getTime()
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      console.log('Timer conditions not met', { isStudying, studySession: !!studySession, isPomodoroMode })
    }
    
    return () => {
      if (interval) {
        console.log('Clearing regular timer interval')
        clearInterval(interval)
      }
    }
  }, [isStudying, studySession, isPomodoroMode])

  const handlePomodoroComplete = useCallback(() => {
    if (pomodoroState === 'work') {
      const newSessionCount = pomodoroSessionCount + 1
      setPomodoroSessionCount(newSessionCount)
      
      // Determine if it's time for a long break
      const isLongBreak = newSessionCount % pomodoroSettings.sessionsUntilLongBreak === 0
      const breakDuration = isLongBreak ? pomodoroSettings.longBreakDuration : pomodoroSettings.breakDuration
      
      setPomodoroState('break')
      setPomodoroTimeLeft(breakDuration * 60)
      toast.success(isLongBreak ? '🍅 Great work! Time for a long break!' : '🍅 Work session complete! Time for a break!')
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete', { 
          body: isLongBreak ? 'Work session finished! Take a longer break.' : 'Work session finished! Take a 5-minute break.'
        })
      }
    } else {
      setPomodoroState('work')
      setPomodoroTimeLeft(pomodoroSettings.workDuration * 60)
      toast.success('✨ Break over! Ready for another study session?')
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Break Complete', { 
          body: 'Break finished! Time to study.' 
        })
      }
    }
  }, [pomodoroState, pomodoroSessionCount, pomodoroSettings])

  // Pomodoro timer effect
  useEffect(() => {
    if (isPomodoroMode && isStudying && !isPomodoroPaused) {
      console.log('Starting Pomodoro timer', { isPomodoroMode, isStudying, isPomodoroPaused })
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
      console.log('Pomodoro timer conditions not met', { isPomodoroMode, isStudying, isPomodoroPaused })
      clearInterval(pomodoroInterval.current)
    }

    return () => {
      if (pomodoroInterval.current) {
        console.log('Clearing Pomodoro timer interval')
        clearInterval(pomodoroInterval.current)
      }
    }
  }, [isPomodoroMode, isStudying, isPomodoroPaused, handlePomodoroComplete])

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
          const timezoneOffset = scheduleDate.getTimezoneOffset() * 60000
          const localScheduleDate = new Date(scheduleDate.getTime() + timezoneOffset)
          return localScheduleDate >= today && !schedule.completed
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
    setPomodoroTimeLeft(pomodoroSettings.workDuration * 60)
    setIsPomodoroPaused(false)
    setPomodoroSessionCount(0)
    
    if (!isPomodoroMode) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission()
      }
      toast.success('🍅 Pomodoro mode activated!')
    }
  }

  const updatePomodoroSettings = (newSettings) => {
    setPomodoroSettings(newSettings)
    if (isPomodoroMode && pomodoroState === 'work') {
      setPomodoroTimeLeft(newSettings.workDuration * 60)
    } else if (isPomodoroMode && pomodoroState === 'break') {
      const isLongBreak = pomodoroSessionCount % newSettings.sessionsUntilLongBreak === 0
      setPomodoroTimeLeft((isLongBreak ? newSettings.longBreakDuration : newSettings.breakDuration) * 60)
    }
    setShowPomodoroSettings(false)
    toast.success('Pomodoro settings updated!')
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

      console.log('Starting study session:', sessionData)
      
      setStudySession(sessionData)
      setIsStudying(true)
      setElapsedTime(0)
      
      if (isPomodoroMode) {
        setPomodoroTimeLeft(pomodoroSettings.workDuration * 60)
        setPomodoroState('work')
        setIsPomodoroPaused(false)
      }
      
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
      console.log('Stopping study session:', studySession)
      
      const response = await axios.post('/study/session/stop', {
        startTime: studySession.startTime,
        subject: subject || 'General Study'
      })

      console.log('Study session stopped successfully')

      setIsStudying(false)
      setStudySession(null)
      setElapsedTime(0)
      setSubject('')
      setIsPomodoroPaused(false)
      
      // Reset Pomodoro state
      if (isPomodoroMode) {
        setPomodoroState('work')
        setPomodoroTimeLeft(pomodoroSettings.workDuration * 60)
        setPomodoroSessionCount(0)
      }

      updateUser(response.data.stats)
      
      if (response.data.newAchievements && response.data.newAchievements.length > 0) {
        response.data.newAchievements.forEach(achievement => {
          const def = achievementDefs[achievement]
          if (def) {
            toast.success(`🏆 Achievement unlocked: ${def.title}!`, { duration: 4000 })
          }
        })
      }
      
      stopStudySession()

      const duration = response.data.session.duration
      const hours = Math.floor(duration / (1000 * 60 * 60))
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
      
      toast.success(`Study session completed! ${hours}h ${minutes}m`)
      
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

  // Apply timezone adjustment for displaying schedule times correctly
  const formatScheduleTime = (dateString) => {
    const date = new Date(dateString)
    const timezoneOffset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() + timezoneOffset)
    
    return localDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatScheduleDate = (dateString) => {
    const date = new Date(dateString)
    const timezoneOffset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() + timezoneOffset)
    
    return localDate.toLocaleDateString()
  }

  const goalProgress = todayProgress ? (todayProgress.todayStudyTime / todayProgress.dailyGoal) * 100 : 0

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {user?.username}!
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ready to continue your study journey?
            </p>
          </div>
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

        <div className="grid grid-cols-12 gap-3">
          {/* Main Content - Study Timer & Stats */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            {/* Study Timer Card */}
            <div className={`rounded-lg shadow-sm p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-3">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Study Timer
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPomodoroSettings(true)}
                    className={`p-1 rounded-md text-sm transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'
                    }`}
                  >
                    <HiAdjustments className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePomodoroMode}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${
                      isPomodoroMode
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
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
                    <div className={`text-3xl font-mono font-bold mb-1 ${
                      pomodoroState === 'work' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatPomodoroTime(pomodoroTimeLeft)}
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {pomodoroState === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
                      {pomodoroState === 'work' && ` (${pomodoroSessionCount + 1}/${pomodoroSettings.sessionsUntilLongBreak})`}
                    </p>
                  </div>
                ) : (
                  <div className={`text-3xl font-mono font-bold mb-3 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
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
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                )}

                {isStudying && studySession && (
                  <div className="mb-3">
                    <p className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Studying: <span className="font-medium">{studySession.subject}</span>
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Started at {new Date(studySession.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                )}

                <div className="flex justify-center space-x-2">
                  {!isStudying ? (
                    <button
                      onClick={handleStartStudy}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      <HiPlay className="w-4 h-4" />
                      <span>Start Studying</span>
                    </button>
                  ) : (
                    <>
                      {isPomodoroMode && (
                        <button
                          onClick={() => setIsPomodoroPaused(!isPomodoroPaused)}
                          className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          {isPomodoroPaused ? <HiPlay className="w-4 h-4" /> : <HiPause className="w-4 h-4" />}
                          <span>{isPomodoroPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                      )}
                      <button
                        onClick={handleStopStudy}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
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
              <div className={`rounded-lg shadow-sm p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Daily Goal Progress
                  </h3>
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <HiCog className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {formatDuration(todayProgress.todayStudyTime)} / {formatDuration(todayProgress.dailyGoal)}
                    </span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {Math.round(goalProgress)}%
                    </span>
                  </div>
                  
                  <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
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
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <HiCheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Goal achieved! 🎉</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            {quickStats && (
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-lg shadow-sm p-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center">
                    <HiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="ml-2">
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Today
                      </p>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDuration(todayProgress?.todayStudyTime || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg shadow-sm p-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center">
                    <HiFire className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div className="ml-2">
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Streak
                      </p>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {todayProgress?.currentStreak || 0} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg shadow-sm p-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center">
                    <HiTrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div className="ml-2">
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        This Week
                      </p>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDuration(quickStats.weeklyStudyTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div className={`rounded-lg shadow-sm p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🏆 Achievements
                </h3>
                
                <div className="space-y-2">
                  {recentAchievements.slice(-2).reverse().map((achievement, index) => {
                    const def = achievementDefs[achievement.type]
                    if (!def) return null
                    
                    const Icon = def.icon
                    return (
                      <div key={index} className={`flex items-center space-x-2 p-2 rounded-lg ${
                        isDark ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <Icon className={`w-4 h-4 ${def.color}`} />
                        <div>
                          <p className={`font-medium text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {def.title}
                          </p>
                          <p className={`text-xs leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {def.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Friends Activity */}
            <div className={`rounded-lg shadow-sm p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Friends Activity
              </h3>
              
              {user?.friends && user.friends.length > 0 ? (
                <div className="space-y-2">
                  {user.friends.slice(0, 3).map((friend) => {
                    const friendId = friend.id || friend._id
                    const status = friendsStudyStatus[friendId]
                    return (
                      <div key={friendId} className="flex items-center justify-between">
                        <Link 
                          to={`/profile/${friendId}`}
                          className="flex items-center hover:opacity-80 transition-opacity"
                        >
                          <Avatar user={friend} size="sm" />
                          <span className={`ml-2 text-xs font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {friend.username}
                          </span>
                        </Link>
                        
                        {status?.studying ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="ml-1 text-xs text-green-600 dark:text-green-400">Studying</span>
                          </div>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Offline</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Add friends to see their study activity!
                </p>
              )}
            </div>

            {/* Upcoming Schedules */}
            <div className={`rounded-lg shadow-sm p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Upcoming Sessions
              </h3>
              
              {upcomingSchedules.length > 0 ? (
                <div className="space-y-2">
                  {upcomingSchedules.slice(0, 2).map((schedule) => (
                    <div key={schedule._id} className={`border rounded-lg p-2 ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <h4 className={`font-medium text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {schedule.title}
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {schedule.subject}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatScheduleDate(schedule.startTime)} at {formatScheduleTime(schedule.startTime)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  No upcoming study sessions. Create a schedule to get started!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Goal Setting Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg max-w-sm w-full p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Set Daily Goal
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={newGoalHours}
                      onChange={(e) => setNewGoalHours(parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Minutes
                    </label>
                    <select
                      value={newGoalMinutes}
                      onChange={(e) => setNewGoalMinutes(parseInt(e.target.value))}
                      className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value={0}>0</option>
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={45}>45</option>
                    </select>
                  </div>
                </div>
                
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current goal: {formatDuration(todayProgress?.dailyGoal || 7200000)}
                </p>
              </div>

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className={`flex-1 px-3 py-2 text-sm border rounded-md transition-colors ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
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

        {/* Pomodoro Settings Modal */}
        {showPomodoroSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🍅 Pomodoro Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Work Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={pomodoroSettings.workDuration}
                    onChange={(e) => setPomodoroSettings({
                      ...pomodoroSettings,
                      workDuration: parseInt(e.target.value) || 25
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Short Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={pomodoroSettings.breakDuration}
                    onChange={(e) => setPomodoroSettings({
                      ...pomodoroSettings,
                      breakDuration: parseInt(e.target.value) || 5
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Long Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={pomodoroSettings.longBreakDuration}
                    onChange={(e) => setPomodoroSettings({
                      ...pomodoroSettings,
                      longBreakDuration: parseInt(e.target.value) || 15
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sessions until Long Break
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={pomodoroSettings.sessionsUntilLongBreak}
                    onChange={(e) => setPomodoroSettings({
                      ...pomodoroSettings,
                      sessionsUntilLongBreak: parseInt(e.target.value) || 4
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPomodoroSettings(false)}
                  className={`flex-1 px-4 py-2 border rounded-md transition-colors ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => updatePomodoroSettings(pomodoroSettings)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 