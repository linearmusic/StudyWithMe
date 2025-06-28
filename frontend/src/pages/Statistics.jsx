import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import {
  HiClock,
  HiTrendingUp,
  HiCalendar,
  HiChartPie,
  HiBadgeCheck,
  HiBookOpen,
  HiStar,
  HiCheckCircle,
  HiFire
} from 'react-icons/hi'
import axios from 'axios'

// Achievement definitions matching Dashboard - enhanced for dark mode
const achievementDefs = {
  'first_session': { icon: HiStar, title: 'First Steps', desc: 'Completed your first study session', color: 'text-yellow-500', bg: 'bg-yellow-50', darkBg: 'dark:bg-yellow-900/20' },
  'five_sessions': { icon: HiCheckCircle, title: 'Getting Started', desc: 'Completed 5 study sessions', color: 'text-green-500', bg: 'bg-green-50', darkBg: 'dark:bg-green-900/20' },
  'twenty_five_sessions': { icon: HiBadgeCheck, title: 'Dedicated', desc: 'Completed 25 study sessions', color: 'text-blue-500', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20' },
  'streak_3': { icon: HiFire, title: '3-Day Streak', desc: 'Studied for 3 consecutive days', color: 'text-orange-500', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/20' },
  'streak_7': { icon: HiFire, title: 'Week Warrior', desc: 'Studied for 7 consecutive days', color: 'text-red-500', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/20' },
  'streak_30': { icon: HiFire, title: 'Study Master', desc: 'Studied for 30 consecutive days', color: 'text-purple-500', bg: 'bg-purple-50', darkBg: 'dark:bg-purple-900/20' },
  'goal_achiever': { icon: HiBadgeCheck, title: 'Goal Crusher', desc: 'Met daily goal for 7 days', color: 'text-indigo-500', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/20' }
}

const Statistics = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('week') // week, month, year

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/study/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDurationHours = (milliseconds) => {
    return (milliseconds / (1000 * 60 * 60)).toFixed(1)
  }

  // Colors for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  if (loading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center py-12">
          <p className={`transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>Unable to load statistics</p>
        </div>
      </div>
    )
  }

  // Prepare data for charts
  const weeklyData = stats.weekStats.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: parseFloat(formatDurationHours(day.studyTime))
  }))

  const subjectData = Object.entries(stats.subjectStats).map(([subject, time]) => ({
    name: subject,
    value: parseFloat(formatDurationHours(time)),
    hours: formatDuration(time)
  }))

  const completedSchedules = stats.schedules.filter(s => s.completed).length
  const totalSchedules = stats.schedules.length

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Study Statistics</h1>
        <p className={`mt-2 transition-colors ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Track your progress and analyze your study patterns
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <HiClock className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>Total Study Time</p>
              <p className={`text-2xl font-semibold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {formatDuration(stats.totalStudyTime)}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <HiTrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>This Week</p>
              <p className={`text-2xl font-semibold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {formatDuration(stats.weeklyStudyTime)}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <HiCalendar className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>Study Sessions</p>
              <p className={`text-2xl font-semibold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.totalSessions}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <HiFire className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>Current Streak</p>
              <p className={`text-2xl font-semibold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.currentStreak || 0} days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Study Hours Chart */}
        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Weekly Study Pattern</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                labelFormatter={(label) => `${label}`}
                formatter={(value) => [`${value}h`, 'Study Hours']}
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  color: isDark ? '#f9fafb' : '#111827'
                }}
              />
              <Bar dataKey="hours" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Distribution */}
        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Study Time by Subject</h2>
          {subjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subjectData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{ fill: isDark ? '#f9fafb' : '#111827', fontSize: '12px' }}
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}h`, 'Hours']}
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    color: isDark ? '#f9fafb' : '#111827'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={`flex items-center justify-center h-[300px] transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="text-center">
                <HiBookOpen className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                  isDark ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p>No study data available yet</p>
              </div>
            </div>
          )}
        </div>

        {/* User Achievements */}
        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>🏆 Your Achievements</h2>
          
          {user?.achievements && user.achievements.length > 0 ? (
            <div className="space-y-3">
              {user.achievements
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((achievement, index) => {
                  const def = achievementDefs[achievement.type]
                  if (!def) return null
                  
                  const Icon = def.icon
                  return (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-700' 
                        : def.bg
                    }`}>
                      <div className="flex items-center">
                        <Icon className={`w-6 h-6 ${def.color} mr-3`} />
                        <div>
                          <h3 className={`font-medium transition-colors ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>{def.title}</h3>
                          <p className={`text-sm transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>{def.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-semibold text-xl">✓</div>
                        <p className={`text-xs transition-colors ${
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
                     ) : (
             <div className={`text-center py-8 transition-colors ${
               isDark ? 'text-gray-400' : 'text-gray-500'
             }`}>
               <HiBadgeCheck className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                 isDark ? 'text-gray-600' : 'text-gray-300'
               }`} />
               <p className="mb-2">No achievements yet</p>
               <p className="text-sm">Start studying to unlock your first achievement!</p>
             </div>
           )}

          {/* Progress towards next achievements */}
          <div className={`mt-6 pt-6 border-t transition-colors ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-md font-medium mb-3 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Progress Towards Next Goals</h3>
            <div className="space-y-3">
              {/* Sessions milestone */}
              {stats.totalSessions < 25 && (
                <div className="flex items-center justify-between text-sm">
                  <span className={`transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stats.totalSessions < 5 ? 'First 5 Sessions' : stats.totalSessions < 25 ? '25 Sessions' : ''}
                  </span>
                  <span className={`font-medium transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stats.totalSessions}/{stats.totalSessions < 5 ? 5 : 25}
                  </span>
                </div>
              )}
              
              {/* Streak milestone */}
              {(user?.currentStreak || 0) < 30 && (
                <div className="flex items-center justify-between text-sm">
                  <span className={`transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {(user?.currentStreak || 0) < 3 ? '3-Day Streak' : 
                     (user?.currentStreak || 0) < 7 ? '7-Day Streak' : '30-Day Streak'}
                  </span>
                  <span className={`font-medium transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user?.currentStreak || 0}/{(user?.currentStreak || 0) < 3 ? 3 : (user?.currentStreak || 0) < 7 ? 7 : 30}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Study Schedule Progress */}
        <div className={`rounded-lg shadow-md p-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Schedule Progress</h2>
          
          {stats.schedules.length > 0 ? (
            <div className="space-y-4">
              {stats.schedules.slice(0, 5).map((schedule) => {
                const totalPlannedDuration = new Date(schedule.endTime).getTime() - new Date(schedule.startTime).getTime()
                const completedDuration = schedule.completedSessions?.reduce(
                  (total, session) => total + session.duration, 0
                ) || 0
                const progress = Math.min(Math.round((completedDuration / totalPlannedDuration) * 100), 100)

                return (
                  <div key={schedule._id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium transition-colors ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>{schedule.title}</span>
                      <span className={`transition-colors ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>{progress}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 transition-colors ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-2 rounded-full transition-all ${
                          schedule.completed 
                            ? 'bg-green-500' 
                            : progress > 50 
                            ? 'bg-blue-500' 
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
              
              {stats.schedules.length > 5 && (
                <p className={`text-sm text-center transition-colors ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  And {stats.schedules.length - 5} more schedules...
                </p>
              )}
            </div>
          ) : (
            <div className={`text-center py-8 transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <HiCalendar className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                isDark ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p>No study schedules created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Statistics 