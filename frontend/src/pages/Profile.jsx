import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Avatar from '../components/Avatar'
import { 
  HiUser, 
  HiClock, 
  HiCalendar, 
  HiTrendingUp, 
  HiBookOpen,
  HiBadgeCheck,
  HiUsers,
  HiCheckCircle
} from 'react-icons/hi'
import axios from 'axios'

const Profile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const { isDark } = useTheme()
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const isOwnProfile = !userId || userId === currentUser?.id

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser)
      setLoading(false)
    } else {
      fetchUserProfile(userId)
    }
  }, [userId, currentUser, isOwnProfile])

  const fetchUserProfile = async (targetUserId) => {
    try {
      const response = await axios.get(`/users/profile/${targetUserId}`)
      setProfileUser(response.data.user)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate schedule consistency
  const calculateScheduleConsistency = (schedules, sessions) => {
    if (!schedules || schedules.length === 0) return 0;
    
    const completedSchedules = schedules.filter(schedule => 
      schedule.completed || 
      (schedule.completedSessions && schedule.completedSessions.length > 0)
    );
    
    return Math.round((completedSchedules.length / schedules.length) * 100);
  };

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className={`min-h-screen transition-colors ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <HiUser className={`w-16 h-16 mx-auto mb-4 transition-colors ${
              isDark ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <h3 className={`text-lg font-medium mb-2 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>User not found</h3>
            <p className={`transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>The user profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className={`rounded-lg shadow-md overflow-hidden mb-8 transition-colors ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex items-center -mt-16 mb-4">
            <div className={`border-4 shadow-lg rounded-full transition-colors ${
              isDark ? 'border-gray-800' : 'border-white'
            }`}>
              <Avatar 
                user={profileUser} 
                size="xl" 
                editable={isOwnProfile}
                className="w-24 h-24"
              />
            </div>
            <div className="ml-6 mt-16">
              <h1 className={`text-2xl font-bold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{profileUser.username}</h1>
              <p className={`transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {isOwnProfile ? 'Your Profile' : 'Friend Profile'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Study Statistics */}
          <div className={`rounded-lg shadow-md p-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-lg font-semibold mb-6 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Study Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <HiClock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className={`text-2xl font-bold transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDuration(profileUser.totalStudyTime || 0)}
                </div>
                <div className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Time</div>
              </div>

              <div className="text-center">
                <HiTrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className={`text-2xl font-bold transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDuration(profileUser.weeklyStudyTime || 0)}
                </div>
                <div className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>This Week</div>
              </div>

              <div className="text-center">
                <HiCalendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className={`text-2xl font-bold transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {profileUser.recentSessions?.length || 0}
                </div>
                <div className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Sessions</div>
              </div>

              <div className="text-center">
                <HiCheckCircle className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <div className={`text-2xl font-bold transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {calculateScheduleConsistency(profileUser.studySchedules || [], profileUser.recentSessions || [])}%
                </div>
                <div className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Consistency</div>
              </div>
            </div>
          </div>

          {/* Recent Study Sessions */}
          <div className={`rounded-lg shadow-md p-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Recent Study Sessions</h2>
            
            {profileUser.recentSessions && profileUser.recentSessions.length > 0 ? (
              <div className="space-y-3">
                {profileUser.recentSessions.slice(0, 5).map((session, index) => (
                  <div key={index} className={`flex items-center justify-between py-3 border-b last:border-b-0 transition-colors ${
                    isDark ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <div className="flex items-center">
                      <HiBookOpen className={`w-5 h-5 mr-3 transition-colors ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className={`font-medium transition-colors ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {session.subject || 'General Study'}
                        </div>
                        <div className={`text-sm transition-colors ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {new Date(session.startTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-medium transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatDuration(session.duration)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <HiBookOpen className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                  isDark ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p>No study sessions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Info */}
          <div className={`rounded-lg shadow-md p-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {isOwnProfile ? 'Your Info' : 'Friend Info'}
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <HiUser className={`w-5 h-5 mr-3 transition-colors ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <span className={`transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>{profileUser.username}</span>
              </div>
              
              <div className="flex items-center">
                <HiUsers className={`w-5 h-5 mr-3 transition-colors ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <span className={`transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {isOwnProfile ? 'Your profile' : 'Friend'}
                </span>
              </div>
              
              {!isOwnProfile && (
                <div className={`pt-4 border-t transition-colors ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <p className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    You can see {profileUser.username}'s study progress and recent sessions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`rounded-lg shadow-md p-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Quick Stats</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className={`transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Time</span>
                <span className={`font-medium transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDuration(profileUser.totalStudyTime || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className={`transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Weekly Time</span>
                <span className={`font-medium transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDuration(profileUser.weeklyStudyTime || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className={`transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Monthly Time</span>
                <span className={`font-medium transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDuration(profileUser.monthlyStudyTime || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Profile 