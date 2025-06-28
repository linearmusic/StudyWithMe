import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
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
  HiBookOpen
} from 'react-icons/hi'
import axios from 'axios'

const Statistics = () => {
  const { user } = useAuth()
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load statistics</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Statistics</h1>
        <p className="text-gray-600 mt-2">
          Track your progress and analyze your study patterns
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiClock className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Study Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(stats.totalStudyTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiTrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(stats.weeklyStudyTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiCalendar className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Study Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalSessions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <HiChartPie className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Schedule Completion</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalSchedules > 0 ? Math.round((completedSchedules / totalSchedules) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Study Hours Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Study Pattern</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `${label}`}
                formatter={(value) => [`${value}h`, 'Study Hours']}
              />
              <Bar dataKey="hours" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Study Time by Subject</h2>
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
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <HiBookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No study data available yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Study Streaks and Achievements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <HiBadgeCheck className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Study Champion</h3>
                  <p className="text-sm text-gray-600">Complete 10 study sessions</p>
                </div>
              </div>
              <div className="text-blue-600 font-semibold">
                {stats.totalSessions >= 10 ? '✓' : `${stats.totalSessions}/10`}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <HiBadgeCheck className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Time Master</h3>
                  <p className="text-sm text-gray-600">Study for 50 hours total</p>
                </div>
              </div>
              <div className="text-green-600 font-semibold">
                {stats.totalStudyTime >= 50 * 60 * 60 * 1000 ? '✓' : 
                 `${Math.floor(stats.totalStudyTime / (1000 * 60 * 60))}/50`}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <HiBadgeCheck className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Schedule Keeper</h3>
                  <p className="text-sm text-gray-600">Complete 5 scheduled sessions</p>
                </div>
              </div>
              <div className="text-purple-600 font-semibold">
                {completedSchedules >= 5 ? '✓' : `${completedSchedules}/5`}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <HiBadgeCheck className="w-6 h-6 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Weekly Warrior</h3>
                  <p className="text-sm text-gray-600">Study 10 hours in a week</p>
                </div>
              </div>
              <div className="text-orange-600 font-semibold">
                {stats.weeklyStudyTime >= 10 * 60 * 60 * 1000 ? '✓' : 
                 `${Math.floor(stats.weeklyStudyTime / (1000 * 60 * 60))}/10`}
              </div>
            </div>
          </div>
        </div>

        {/* Study Schedule Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Progress</h2>
          
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
                      <span className="font-medium text-gray-900">{schedule.title}</span>
                      <span className="text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
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
                <p className="text-sm text-gray-500 text-center">
                  And {stats.schedules.length - 5} more schedules...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <HiCalendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No study schedules created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Statistics 