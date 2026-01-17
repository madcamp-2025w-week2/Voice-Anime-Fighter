import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import { useUserStore } from '../stores/userStore'
import { useErrorStore } from '../stores/errorStore'

// 빈 문자열이면 현재 origin 사용 (nginx를 통해 프록시됨)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined

export function useSocket() {
  const socketRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const { token, user } = useUserStore()
  const { showUnauthorized, showSocketDisconnect, clearError } = useErrorStore()
  
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token,
        user_id: user?.id,
        nickname: user?.nickname,
        elo_rating: user?.elo_rating,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
    
    // 디버깅용: 전역으로 소켓 노출
    window.__socket = socketRef.current
    
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected:', socketRef.current.id)
      setIsConnected(true)
      reconnectAttempts.current = 0
      clearError() // 연결 성공 시 에러 클리어
    })
    
    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      setIsConnected(false)
      
      // 서버에서 강제 종료한 경우 (인증 실패 등)
      if (reason === 'io server disconnect') {
        showUnauthorized()
      }
    })
    
    // 연결 에러 핸들링
    socketRef.current.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message)
      reconnectAttempts.current += 1
      
      // 인증 에러인 경우
      if (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
        showUnauthorized()
        socketRef.current.disconnect()
      }
      // 재연결 시도 횟수 초과
      else if (reconnectAttempts.current >= 5) {
        showSocketDisconnect()
      }
    })
    
    // 재연결 실패 핸들링
    socketRef.current.on('reconnect_failed', () => {
      console.error('🔌 Socket reconnection failed')
      showSocketDisconnect()
    })
    
    socketRef.current.on('connected', (data) => {
      console.log('✨', data.message)
    })
    
    // Online user count listener
    socketRef.current.on('user:count', (data) => {
      console.log('👥 Online users:', data.count)
      setOnlineUsers(data.count)
    })
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [token, user?.id])
  
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data)
    }
  }, [])
  
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])
  
  const off = useCallback((event) => {
    if (socketRef.current) {
      socketRef.current.off(event)
    }
  }, [])
  
  // Room actions
  const joinRoom = useCallback((roomId) => {
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
    emit('battle_attack', { battle_id: battleId, damage_data: damageData })
  }, [emit])
  
  const startGame = useCallback((roomId, battleId) => {
    emit('game_start', { room_id: roomId, battle_id: battleId })
  }, [emit])
  
  return {
    socket: socketRef.current,
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
