import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
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
  const [schedules, setSchedules] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    startTime: '',
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
      startTime: '',
      endTime: '',
      recurring: 'none'
    })
    setEditingSchedule(null)
  }

  const handleAddSchedule = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post('/study/schedule', formData)
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
      const response = await axios.put(`/study/schedule/${editingSchedule._id}`, formData)
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
    setFormData({
      title: schedule.title,
      subject: schedule.subject,
      startTime: new Date(schedule.startTime).toISOString().slice(0, 16),
      endTime: new Date(schedule.endTime).toISOString().slice(0, 16),
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

  // Group schedules by date
  const groupedSchedules = schedules.reduce((groups, schedule) => {
    const date = new Date(schedule.startTime).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(schedule)
    return groups
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Schedule</h1>
          <p className="text-gray-600 mt-2">
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
              <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
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
                                <h3 className="text-lg font-medium text-gray-900">
                                  {schedule.title}
                                </h3>
                                {schedule.completed && (
                                  <HiCheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>

                              <p className="text-gray-600 mb-3">{schedule.subject}</p>

                              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                                <div className="flex items-center">
                                  <HiClock className="w-4 h-4 mr-1" />
                                  <span>
                                    {new Date(schedule.startTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })} - {new Date(schedule.endTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
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
                                  <span className="text-gray-600">Progress</span>
                                  <span className="text-gray-900 font-medium">{progress}%</span>
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

                              {schedule.completedSessions && schedule.completedSessions.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600">
                                    Completed {schedule.completedSessions.length} session(s) • 
                                    Total: {formatDuration(
                                      schedule.completedSessions.reduce((total, session) => total + session.duration, 0)
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
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
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <HiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No schedules yet
            </h3>
            <p className="text-gray-600 mb-6">
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingSchedule(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingSchedule ? handleEditSchedule : handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Math Study Session"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Calculus"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurring
                </label>
                <select
                  value={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
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