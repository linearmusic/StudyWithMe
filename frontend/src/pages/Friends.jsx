import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useTheme } from '../contexts/ThemeContext'
import Avatar from '../components/Avatar'
import { 
  HiUserAdd, 
  HiClipboardCopy, 
  HiUsers, 
  HiClock, 
  HiTrendingUp, 
  HiTrash,
  HiExternalLink
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const Friends = () => {
  const { user, updateUser } = useAuth()
  const { onlineFriends, friendsStudyStatus } = useSocket()
  const { isDark } = useTheme()
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [friends, setFriends] = useState([])

  useEffect(() => {
    if (user?.friends) {
      setFriends(user.friends)
    }
  }, [user])

  const handleAddFriend = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setIsLoading(true)
    try {
      const response = await axios.post('/users/add-friend', {
        inviteCode: inviteCode.trim().toUpperCase()
      })

      const newFriend = response.data.friend
      setFriends([...friends, newFriend])
      updateUser({
        friends: [...(user.friends || []), newFriend]
      })

      setInviteCode('')
      toast.success(`${newFriend.username} added as friend!`)
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add friend'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Remove ${friendName} from your friends?`)) return

    try {
      await axios.delete(`/users/remove-friend/${friendId}`)
      
      const updatedFriends = friends.filter(f => (f.id || f._id) !== friendId)
      setFriends(updatedFriends)
      updateUser({
        friends: updatedFriends
      })

      toast.success(`${friendName} removed from friends`)
    } catch (error) {
      toast.error('Failed to remove friend')
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(user?.friendInviteCode)
    toast.success('Invite code copied to clipboard!')
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/add-friend/${user?.friendInviteCode}`
    navigator.clipboard.writeText(link)
    toast.success('Invite link copied to clipboard!')
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
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Friends</h1>
        <p className={`mt-2 transition-colors ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Connect with your study buddies and track progress together
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Friend Section */}
        <div className="lg:col-span-1">
          <div className={`rounded-lg shadow-md p-6 mb-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Add Friend
            </h2>
            
            <form onSubmit={handleAddFriend} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Friend's Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  maxLength={8}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !inviteCode.trim()}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <HiUserAdd className="w-4 h-4" />
                <span>{isLoading ? 'Adding...' : 'Add Friend'}</span>
              </button>
            </form>
          </div>

          {/* Your Invite Code */}
          <div className={`rounded-lg shadow-md p-6 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Your Invite Code
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className={`text-sm mb-2 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Share this code with friends to connect:
                </p>
                <div className="flex items-center space-x-2">
                  <code className={`px-3 py-2 rounded text-lg font-mono font-bold text-blue-600 flex-1 text-center transition-colors ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {user?.friendInviteCode}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    className={`p-2 transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-blue-400' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                    title="Copy code"
                  >
                    <HiClipboardCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={`border-t pt-4 transition-colors ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <p className={`text-sm mb-2 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Or share this direct link:
                </p>
                <button
                  onClick={copyInviteLink}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <HiExternalLink className="w-4 h-4" />
                  <span>Copy Invite Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="lg:col-span-2">
          <div className={`rounded-lg shadow-md transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b transition-colors ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-lg font-semibold flex items-center transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <HiUsers className="w-5 h-5 mr-2" />
                Your Friends ({friends.length})
              </h2>
            </div>

            {friends.length > 0 ? (
              <div className={`divide-y transition-colors ${
                isDark ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                {friends.map((friend) => {
                  const friendId = friend.id || friend._id
                  const isOnline = onlineFriends.includes(friendId)
                  const studyStatus = friendsStudyStatus[friendId]
                  
                                      return (
                      <div key={friendId} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar user={friend} size="md" />
                            {isOnline && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 ${
                                isDark ? 'border-gray-800' : 'border-white'
                              }`}></div>
                            )}
                          </div>

                          <div>
                            <Link
                              to={`/profile/${friendId}`}
                              className={`text-lg font-medium transition-colors hover:text-blue-600 cursor-pointer ${
                                isDark ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                              }`}
                            >
                              <h3>{friend.username}</h3>
                            </Link>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className={`flex items-center text-sm transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <HiClock className="w-4 h-4 mr-1" />
                                <span>{formatDuration(friend.totalStudyTime || 0)}</span>
                              </div>
                              <div className={`flex items-center text-sm transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <HiTrendingUp className="w-4 h-4 mr-1" />
                                <span>{formatDuration(friend.weeklyStudyTime || 0)} this week</span>
                              </div>
                            </div>
                            
                            {studyStatus?.studying && (
                              <div className="flex items-center mt-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                <span className="text-sm text-green-600 font-medium">
                                  Currently studying {studyStatus.subject}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/profile/${friendId}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Profile
                          </Link>
                          
                          <button
                            onClick={() => handleRemoveFriend(friendId, friend.username)}
                            className={`p-1 transition-colors ${
                              isDark 
                                ? 'text-gray-400 hover:text-red-400' 
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title="Remove friend"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <HiUsers className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                  isDark ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <h3 className={`text-lg font-medium mb-2 transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  No friends yet
                </h3>
                <p className={`mb-6 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Share your invite code or add friends using their codes to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Friends 