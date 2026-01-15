import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Mic, Settings, Play, User } from 'lucide-react'
import { useUserStore } from '../stores/userStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export default function TitleScreen() {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showMicTest, setShowMicTest] = useState(false)
  const [micStatus, setMicStatus] = useState(null)

  // Request microphone permission
  const testMicrophone = async () => {
    setShowMicTest(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setMicStatus('success')
    } catch (err) {
      setMicStatus('error')
    }
  }

  // Guest login
  const handleGuestPlay = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'guest' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        login(data.user, data.access_token)
        navigate('/lobby')
      }
    } catch (err) {
      console.error('Login error:', err)
      // For development, proceed anyway
      login({ id: 'guest', nickname: '테스트유저', elo_rating: 1200 }, 'dev_token')
      navigate('/lobby')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-magical-pink-900/20 via-transparent to-transparent" />
      
      {/* Floating Stars */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-star-gold animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            fontSize: `${Math.random() * 20 + 10}px`,
          }}
        >
          ★
        </div>
      ))}

      {/* Title */}
      <div className="text-center mb-12 animate-float">
        <h1 className="font-title text-5xl md:text-7xl text-transparent bg-clip-text bg-magical-gradient mb-2">
          마법소녀
        </h1>
        <h2 className="font-title text-3xl md:text-5xl text-magical-pink-400 text-glow-pink mb-4">
          루루핑
        </h2>
        <div className="flex items-center justify-center gap-2 text-magical-purple-300">
          <Sparkles className="w-5 h-5" />
          <span className="text-lg">즈큥도큥 바큥부큥</span>
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* Character Preview */}
      <div className="w-48 h-48 mb-8 rounded-full bg-gradient-to-br from-magical-pink-500/30 to-magical-purple-500/30 border-2 border-magical-pink-400/50 flex items-center justify-center glow-pink">
        <span className="text-6xl">🌟</span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={handleGuestPlay}
          disabled={isLoading}
          className="group relative px-8 py-4 bg-gradient-to-r from-magical-pink-500 to-magical-purple-500 rounded-2xl font-bold text-xl text-white shadow-lg hover:shadow-magical-pink-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            <Play className="w-6 h-6" />
            {isLoading ? '접속 중...' : '게임 시작'}
          </span>
        </button>

        <button
          onClick={handleGuestPlay}
          className="px-8 py-3 glass rounded-xl font-medium text-magical-pink-300 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <User className="w-5 h-5" />
          게스트 플레이
        </button>

        <button
          onClick={testMicrophone}
          className="px-8 py-3 glass rounded-xl font-medium text-magical-purple-300 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Mic className="w-5 h-5" />
          마이크 테스트
        </button>
      </div>

      {/* Mic Test Modal */}
      {showMicTest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-sm text-center">
            <div className="text-4xl mb-4">
              {micStatus === null && '🎤'}
              {micStatus === 'success' && '✅'}
              {micStatus === 'error' && '❌'}
            </div>
            <h3 className="text-xl font-bold mb-2">마이크 테스트</h3>
            <p className="text-gray-300 mb-4">
              {micStatus === null && '마이크 권한을 확인하고 있습니다...'}
              {micStatus === 'success' && '마이크가 정상적으로 작동합니다!'}
              {micStatus === 'error' && '마이크 접근 권한을 허용해주세요.'}
            </p>
            <button
              onClick={() => setShowMicTest(false)}
              className="px-6 py-2 bg-magical-pink-500 rounded-lg hover:bg-magical-pink-600 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-4 text-gray-500 text-sm">
        © 2026 마법소녀 루루핑 | ReLU Games
      </div>
    </div>
  )
}
