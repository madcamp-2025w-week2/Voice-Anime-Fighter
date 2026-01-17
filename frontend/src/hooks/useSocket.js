import { useEffect, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { useUserStore } from '../stores/userStore'
import { useErrorStore } from '../stores/errorStore'

// 빈 문자열이면 현재 origin 사용 (nginx를 통해 프록시됨)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined

// ============================================
// SINGLETON SOCKET INSTANCE (module level)
// ============================================
let socketInstance = null

function getSocket(auth) {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // 디버깅용: 전역으로 소켓 노출
    window.__socket = socketInstance

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('🔌 Socket connect error:', error.message)
    })

    socketInstance.on('connected', (data) => {
      console.log('✨', data.message)
    })
  }
  return socketInstance
}

// Update auth when user changes
function updateSocketAuth(auth) {
  if (socketInstance && socketInstance.connected) {
    // Socket.io doesn't support changing auth on existing connection,
    // but we can store it for reconnection
    socketInstance.auth = auth
  }
}

export function useSocket() {
  const { token, user } = useUserStore()
  
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)

  useEffect(() => {
    const auth = {
      token,
      user_id: user?.id,
      nickname: user?.nickname,
      elo_rating: user?.elo_rating,
    }

    // Get or create singleton socket
    const socket = getSocket(auth)

    // Update connection state
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    const handleUserCount = (data) => {
      console.log('👥 Online users:', data.count)
      setOnlineUsers(data.count)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('user:count', handleUserCount)

    // Set initial state
    setIsConnected(socket.connected)

    // If socket exists but not connected, connect it
    if (!socket.connected) {
      updateSocketAuth(auth)
      socket.connect()
    }

    // DON'T disconnect on unmount - socket persists across screens
    
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('user:count', handleUserCount)
    }
  }, [token, user?.id, user?.nickname, user?.elo_rating])

  const emit = useCallback((event, data) => {
    if (socketInstance) {
      socketInstance.emit(event, data)
    }
  }, [])

  const on = useCallback((event, callback) => {
    if (socketInstance) {
      socketInstance.on(event, callback)
    }
  }, [])

  const off = useCallback((event, callback) => {
    if (socketInstance) {
      if (callback) {
        socketInstance.off(event, callback)
      } else {
        socketInstance.off(event)
      }
    }
  }, [])

  // Room actions
  const joinRoom = useCallback((roomId) => {
    console.log('📨 joinRoom:', roomId)
    emit('room_join', { room_id: roomId })
  }, [emit])

  const leaveRoom = useCallback((roomId) => {
    emit('room_leave', { room_id: roomId })
  }, [emit])

  const sendReady = useCallback((roomId, isReady) => {
    emit('room_ready', { room_id: roomId, is_ready: isReady })
  }, [emit])

  // Chat actions
  const sendMessage = useCallback((roomId, message) => {
    console.log('📤 sendMessage called:', { roomId, message })
    emit('chat_message', { room_id: roomId, message })
  }, [emit])

  // Battle actions
  const sendAttack = useCallback((battleId, damageData) => {
    console.log('⚔️ sendAttack:', { battleId, damageData })
    emit('battle_attack', { battle_id: battleId, damage_data: damageData })
  }, [emit])

  const startGame = useCallback((roomId, battleId) => {
    emit('game_start', { room_id: roomId, battle_id: battleId })
  }, [emit])

  return {
    socket: socketInstance,
    isConnected,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    sendReady,
    sendMessage,
    sendAttack,
    startGame,
    onlineUsers,
  }
}
