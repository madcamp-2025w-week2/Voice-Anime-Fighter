import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useUserStore } from '../stores/userStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'

export function useSocket() {
  const socketRef = useRef(null)
  const { token, user } = useUserStore()
  
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token,
        user_id: user?.id,
      },
      transports: ['websocket', 'polling'],
    })
    
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected:', socketRef.current.id)
    })
    
    socketRef.current.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })
    
    socketRef.current.on('connected', (data) => {
      console.log('✨', data.message)
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
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    sendReady,
    sendMessage,
    sendAttack,
    startGame,
  }
}
