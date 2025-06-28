import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  HiClock, 
  HiCalendar, 
  HiTrash, 
  HiBookOpen,
  HiAnnotation,
  HiX
} from 'react-icons/hi'
import axios from 'axios'
import toast from 'react-hot-toast'

const Sessions = () => {
  const { user, updateUser } = useAuth()
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/study/sessions')
      setSessions(response.data.sessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error('Failed to load study sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await axios.delete(`/study/session/${sessionId}`)
      
      // Remove session from local state
      setSessions(sessions.filter(s => s._id !== sessionId))
      
      // Update user stats in context
      if (response.data.stats) {
        updateUser({
          totalStudyTime: response.data.stats.totalStudyTime,
          weeklyStudyTime: response.data.stats.weeklyStudyTime,
          monthlyStudyTime: response.data.stats.monthlyStudyTime
        })
      }

      setShowDeleteModal(false)
      setSessionToDelete(null)
      toast.success('Session deleted successfully!')
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Failed to delete session')
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

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.startTime).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(session)
    return groups
  }, {})

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Sessions</h1>
        <p className="text-gray-600 mt-2">
          View and manage all your study sessions
        </p>
        {sessions.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Total: {sessions.length} sessions • {formatDuration(sessions.reduce((total, session) => total + session.duration, 0))}
          </p>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <HiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No study sessions yet
          </h3>
          <p className="text-gray-600">
            Start studying to see your sessions here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, daySessions]) => (
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
                  <p className="text-sm text-gray-600">
                    {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} • {formatDuration(daySessions.reduce((total, session) => total + session.duration, 0))}
                  </p>
                </div>

                <div className="divide-y divide-gray-200">
                  {daySessions
                    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                    .map((session) => (
                      <div key={session._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <HiBookOpen className="w-5 h-5 text-blue-500" />
                              <h3 className="text-lg font-medium text-gray-900">
                                {session.subject || 'General Study'}
                              </h3>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <HiClock className="w-4 h-4 mr-1" />
                                <span>
                                  {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}
                                </span>
                              </div>
                              
                              <div className="flex items-center">
                                <HiCalendar className="w-4 h-4 mr-1" />
                                <span className="font-medium text-blue-600">{formatDuration(session.duration)}</span>
                              </div>
                            </div>

                            {session.notes && (
                              <div className="flex items-start space-x-2 mt-3">
                                <HiAnnotation className="w-4 h-4 text-gray-400 mt-0.5" />
                                <p className="text-sm text-gray-600">{session.notes}</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setSessionToDelete(session)
                              setShowDeleteModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete session"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Session
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSessionToDelete(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this study session? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm">
                  <HiBookOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{sessionToDelete.subject || 'General Study'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <HiClock className="w-4 h-4" />
                  <span>{formatDateTime(sessionToDelete.startTime)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <HiCalendar className="w-4 h-4" />
                  <span className="font-medium">{formatDuration(sessionToDelete.duration)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSessionToDelete(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sessions 