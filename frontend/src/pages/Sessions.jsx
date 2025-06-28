import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
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
  const { isDark } = useTheme()
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
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-pulse">
          <div className={`h-8 rounded w-64 mb-6 transition-colors ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`rounded-lg shadow-md p-6 transition-colors ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`h-6 rounded w-32 mb-4 transition-colors ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 rounded w-48 mb-2 transition-colors ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 rounded w-24 transition-colors ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Study Sessions</h1>
        <p className={`mt-2 transition-colors ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          View and manage all your study sessions
        </p>
        {sessions.length > 0 && (
          <p className={`text-sm mt-1 transition-colors ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Total: {sessions.length} sessions • {formatDuration(sessions.reduce((total, session) => total + session.duration, 0))}
          </p>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className={`rounded-lg shadow-md p-12 text-center transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <HiClock className={`w-16 h-16 mx-auto mb-4 transition-colors ${
            isDark ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h3 className={`text-lg font-medium mb-2 transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            No study sessions yet
          </h3>
          <p className={`transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Start studying to see your sessions here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, daySessions]) => (
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
                  <p className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} • {formatDuration(daySessions.reduce((total, session) => total + session.duration, 0))}
                  </p>
                </div>

                <div className={`divide-y transition-colors ${
                  isDark ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {daySessions
                    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                    .map((session) => (
                      <div key={session._id} className={`p-6 transition-colors ${
                        isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <HiBookOpen className="w-5 h-5 text-blue-500" />
                              <h3 className={`text-lg font-medium transition-colors ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {session.subject || 'General Study'}
                              </h3>
                            </div>

                            <div className={`flex items-center space-x-6 text-sm mb-3 transition-colors ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
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
                                <HiAnnotation className={`w-4 h-4 mt-0.5 transition-colors ${
                                  isDark ? 'text-gray-500' : 'text-gray-400'
                                }`} />
                                <p className={`text-sm transition-colors ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>{session.notes}</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setSessionToDelete(session)
                              setShowDeleteModal(true)
                            }}
                            className={`p-2 transition-colors ${
                              isDark 
                                ? 'text-gray-400 hover:text-red-400' 
                                : 'text-gray-400 hover:text-red-600'
                            }`}
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
          <div className={`rounded-lg max-w-md w-full p-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Delete Session
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSessionToDelete(null)
                }}
                className={`transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className={`mb-4 transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Are you sure you want to delete this study session? This action cannot be undone.
              </p>
              
              <div className={`rounded-lg p-4 transition-colors ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2 text-sm">
                  <HiBookOpen className="w-4 h-4 text-blue-500" />
                  <span className={`font-medium transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{sessionToDelete.subject || 'General Study'}</span>
                </div>
                <div className={`flex items-center space-x-2 text-sm mt-1 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <HiClock className="w-4 h-4" />
                  <span>{formatDateTime(sessionToDelete.startTime)}</span>
                </div>
                <div className={`flex items-center space-x-2 text-sm mt-1 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
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
                className={`flex-1 px-4 py-2 border rounded-md transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
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