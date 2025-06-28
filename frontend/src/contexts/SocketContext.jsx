import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineFriends, setOnlineFriends] = useState([])
  const [friendsStudyStatus, setFriendsStudyStatus] = useState({})
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      
      // Socket URL configuration for different environments
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
      
      const newSocket = io(SOCKET_URL, {
        auth: { token }
      })

      newSocket.on('connect', () => {
        console.log('Connected to server')
        setSocket(newSocket)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
      })

      newSocket.on('online_friends', (friends) => {
        setOnlineFriends(friends)
      })

      newSocket.on('friend_started_studying', (data) => {
        setFriendsStudyStatus(prev => ({
          ...prev,
          [data.userId]: {
            studying: true,
            startTime: data.startTime,
            subject: data.subject
          }
        }))

        // Show notification
        const friend = user.friends?.find(f => f.id === data.userId)
        if (friend) {
          toast.success(`${friend.username} started studying ${data.subject}!`)
        }
      })

      newSocket.on('friend_stopped_studying', (data) => {
        setFriendsStudyStatus(prev => ({
          ...prev,
          [data.userId]: { studying: false }
        }))

        // Show notification
        const friend = user.friends?.find(f => f.id === data.userId)
        if (friend) {
          const hours = Math.floor(data.duration / (1000 * 60 * 60))
          const minutes = Math.floor((data.duration % (1000 * 60 * 60)) / (1000 * 60))
          toast.success(`${friend.username} completed ${hours}h ${minutes}m of study!`)
        }
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      return () => {
        newSocket.close()
        setSocket(null)
      }
    }
  }, [user])

  const startStudySession = (subject, scheduleId = null) => {
    if (socket) {
      socket.emit('start_study', { subject, scheduleId })
    }
  }

  const stopStudySession = () => {
    if (socket) {
      socket.emit('stop_study')
    }
  }

  const getOnlineFriends = (friendIds) => {
    if (socket) {
      socket.emit('get_online_friends', friendIds)
    }
  }

  const value = {
    socket,
    onlineFriends,
    friendsStudyStatus,
    startStudySession,
    stopStudySession,
    getOnlineFriends
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
} 