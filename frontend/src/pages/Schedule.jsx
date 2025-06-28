import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  HiCalendar, 
  HiClock, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiCheckCircle, 
  HiPlay,
  HiX
} from 'react-icons/hi'
import axios from 'axios'
import toast from 'react-hot-toast'

const Schedule = () => {
  const { user, updateUser } = useAuth()
  const { isDark } = useTheme()
  const [schedules, setSchedules] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    recurring: 'none'
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user?.studySchedules) {
      setSchedules(user.studySchedules)
    }
  }, [user])

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      recurring: 'none'
    })
    setEditingSchedule(null)
  }

  const handleAddSchedule = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create date objects and adjust for timezone to preserve the exact time entered
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)
      
      // Adjust for timezone offset to preserve the local time when stored as UTC
      const timezoneOffset = startDateTime.getTimezoneOffset() * 60000
      const adjustedStartTime = new Date(startDateTime.getTime() - timezoneOffset)
      const adjustedEndTime = new Date(endDateTime.getTime() - timezoneOffset)
      
      const scheduleData = {
        title: formData.title,
        subject: formData.subject,
        startTime: adjustedStartTime.toISOString(),
        endTime: adjustedEndTime.toISOString(),
        recurring: formData.recurring
      }

      const response = await axios.post('/study/schedule', scheduleData)
      const newSchedule = response.data.schedule

      setSchedules([...schedules, newSchedule])
      updateUser({
        studySchedules: [...(user.studySchedules || []), newSchedule]
      })

      setShowAddModal(false)
      resetForm()
      toast.success('Schedule created successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create schedule'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSchedule = async (e) => {
    e.preventDefault()
    if (!editingSchedule) return

    setIsLoading(true)

    try {
      // Create date objects and adjust for timezone to preserve the exact time entered
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)
      
      // Adjust for timezone offset to preserve the local time when stored as UTC
      const timezoneOffset = startDateTime.getTimezoneOffset() * 60000
      const adjustedStartTime = new Date(startDateTime.getTime() - timezoneOffset)
      const adjustedEndTime = new Date(endDateTime.getTime() - timezoneOffset)
      
      const scheduleData = {
        title: formData.title,
        subject: formData.subject,
        startTime: adjustedStartTime.toISOString(),
        endTime: adjustedEndTime.toISOString(),
        recurring: formData.recurring
      }

      const response = await axios.put(`/study/schedule/${editingSchedule._id}`, scheduleData)
      const updatedSchedule = response.data.schedule

      const updatedSchedules = schedules.map(s => 
        s._id === editingSchedule._id ? updatedSchedule : s
      )
      setSchedules(updatedSchedules)
      updateUser({
        studySchedules: updatedSchedules
      })

      setEditingSchedule(null)
      resetForm()
      toast.success('Schedule updated successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update schedule'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId, title) => {
    if (!window.confirm(`Delete "${title}" schedule?`)) return

    try {
      await axios.delete(`/study/schedule/${scheduleId}`)
      
      const updatedSchedules = schedules.filter(s => s._id !== scheduleId)
      setSchedules(updatedSchedules)
      updateUser({
        studySchedules: updatedSchedules
      })

      toast.success('Schedule deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete schedule')
    }
  }

  const startEditingSchedule = (schedule) => {
    setEditingSchedule(schedule)
    
    const startDateTime = new Date(schedule.startTime)
    const endDateTime = new Date(schedule.endTime)
    
    // Adjust the dates to show the original local time (reverse the timezone adjustment)
    const timezoneOffset = startDateTime.getTimezoneOffset() * 60000
    const localStartTime = new Date(startDateTime.getTime() + timezoneOffset)
    const localEndTime = new Date(endDateTime.getTime() + timezoneOffset)
    
    setFormData({
      title: schedule.title,
      subject: schedule.subject,
      startDate: localStartTime.toISOString().slice(0, 10),
      startTime: localStartTime.toISOString().slice(11, 16),
      endDate: localEndTime.toISOString().slice(0, 10),
      endTime: localEndTime.toISOString().slice(11, 16),
      recurring: schedule.recurring
    })
  }

  const getScheduleProgress = (schedule) => {
    if (!schedule.completedSessions || schedule.completedSessions.length === 0) {
      return 0
    }

    const totalPlannedDuration = new Date(schedule.endTime).getTime() - new Date(schedule.startTime).getTime()
    const completedDuration = schedule.completedSessions.reduce(
      (total, session) => total + session.duration, 0
    )

    return Math.min(Math.round((completedDuration / totalPlannedDuration) * 100), 100)
  }

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getScheduleDuration = (schedule) => {
    return new Date(schedule.endTime).getTime() - new Date(schedule.startTime).getTime()
  }

  // Group schedules by date (adjusting for timezone to show original local date)
  const groupedSchedules = schedules.reduce((groups, schedule) => {
    const scheduleDate = new Date(schedule.startTime)
    const timezoneOffset = scheduleDate.getTimezoneOffset() * 60000
    const localDate = new Date(scheduleDate.getTime() + timezoneOffset)
    const dateKey = localDate.toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(schedule)
    return groups
  }, {})

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    } min-h-screen`}>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Study Schedule</h1>
          <p className={`mt-2 transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Plan your study sessions and track your progress
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="w-4 h-4" />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Schedules List */}
      <div className="space-y-6">
        {Object.keys(groupedSchedules).length > 0 ? (
          Object.entries(groupedSchedules)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, daySchedules]) => (
              <div key={date} className={`rounded-lg shadow-md overflow-hidden transition-colors ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`px-6 py-3 border-b transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <h2 className={`text-lg font-semibold transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                </div>

                <div className={`divide-y transition-colors ${
                  isDark ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {daySchedules
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                    .map((schedule) => {
                      const progress = getScheduleProgress(schedule)
                      const duration = getScheduleDuration(schedule)
                      
                      return (
                        <div key={schedule._id} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className={`text-lg font-medium transition-colors ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {schedule.title}
                                </h3>
                                {schedule.completed && (
                                  <HiCheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>

                              <p className={`mb-3 transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>{schedule.subject}</p>

                              <div className={`flex items-center space-x-6 text-sm mb-4 transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                <div className="flex items-center">
                                  <HiClock className="w-4 h-4 mr-1" />
                                  <span>
                                    {(() => {
                                      // Adjust times to show original local time
                                      const startTime = new Date(schedule.startTime)
                                      const endTime = new Date(schedule.endTime)
                                      const offset = startTime.getTimezoneOffset() * 60000
                                      const localStart = new Date(startTime.getTime() + offset)
                                      const localEnd = new Date(endTime.getTime() + offset)
                                      
                                      return `${localStart.toLocaleTimeString([], {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })} - ${localEnd.toLocaleTimeString([], {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}`
                                    })()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center">
                                  <HiCalendar className="w-4 h-4 mr-1" />
                                  <span>{formatDuration(duration)}</span>
                                </div>

                                {schedule.recurring !== 'none' && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {schedule.recurring}
                                  </span>
                                )}
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className={`transition-colors ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}>Progress</span>
                                  <span className={`font-medium transition-colors ${
                                    isDark ? 'text-white' : 'text-gray-900'
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

                              {schedule.completedSessions && schedule.completedSessions.length > 0 && (
                                <div className="mt-3">
                                  <p className={`text-sm transition-colors ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    Completed {schedule.completedSessions.length} session(s) • 
                                    Total: {formatDuration(
                                      schedule.completedSessions.reduce((total, session) => total + session.duration, 0)
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              {/* Show Start Session button if schedule is today and not completed */}
                              {(() => {
                                const scheduleDate = new Date(schedule.startTime)
                                const timezoneOffset = scheduleDate.getTimezoneOffset() * 60000
                                const localScheduleDate = new Date(scheduleDate.getTime() + timezoneOffset)
                                return localScheduleDate.toDateString() === new Date().toDateString()
                              })() && !schedule.completed && (
                                <button
                                  onClick={() => window.open('/dashboard', '_blank')}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                  title="Start study session for this schedule"
                                >
                                  <HiPlay className="w-4 h-4 inline mr-1" />
                                  Start
                                </button>
                              )}
                              
                              <button
                                onClick={() => startEditingSchedule(schedule)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit schedule"
                              >
                                <HiPencil className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteSchedule(schedule._id, schedule.title)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete schedule"
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))
        ) : (
          <div className={`rounded-lg shadow-md p-12 text-center transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <HiCalendar className={`w-16 h-16 mx-auto mb-4 transition-colors ${
              isDark ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <h3 className={`text-lg font-medium mb-2 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              No schedules yet
            </h3>
            <p className={`mb-6 transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Create your first study schedule to start tracking your progress!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <HiPlus className="w-4 h-4" />
              <span>Create Schedule</span>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Schedule Modal */}
      {(showAddModal || editingSchedule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg max-w-md w-full p-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingSchedule(null)
                  resetForm()
                }}
                className={`transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingSchedule ? handleEditSchedule : handleAddSchedule} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="e.g., Math Study Session"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="e.g., Calculus"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Start Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  End Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Recurring
                </label>
                <select
                  value={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingSchedule(null)
                    resetForm()
                  }}
                  className={`flex-1 px-4 py-2 border rounded-md transition-colors ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : editingSchedule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedule 