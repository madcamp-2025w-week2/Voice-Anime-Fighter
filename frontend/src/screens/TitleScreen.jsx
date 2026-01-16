import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Globe, Settings, LogIn, Sparkles, Heart } from 'lucide-react'
import { useUserStore } from '../stores/userStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const DEMO_MODE = !import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID === 'demo-client-id'

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

  // Google Login 성공 핸들러
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      
      if (response.ok) {
        const data = await response.json()
        login(data.user, data.access_token)
        navigate('/lobby')
      } else {
        throw new Error('Login failed')
      }
    } catch (err) {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]))
      login({
        id: payload.sub,
        nickname: payload.name || payload.email.split('@')[0],
        email: payload.email,
        avatar_url: payload.picture,
        elo_rating: 1200,
      }, credentialResponse.credential)
      navigate('/lobby')
    } finally {
      setIsLoading(false)
    }
  }

  // 게스트 로그인 (변신 버튼)
  const handleTransform = async () => {
    setIsLoading(true)
    login({ 
      id: `guest_${Date.now()}`, 
      nickname: `마법소녀_${Math.random().toString(36).slice(2, 6)}`, 
      elo_rating: 1200 
    }, 'demo_token')
    setTimeout(() => {
      navigate('/lobby')
    }, 500)
  }

  // 마법대결 (바로 배틀)
  const handleBattle = () => {
    login({ 
      id: `guest_${Date.now()}`, 
      nickname: `전사_${Math.random().toString(36).slice(2, 6)}`, 
      elo_rating: 1200 
    }, 'demo_token')
    navigate('/matchmaking')
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/title_bg.png')" }}
      />
      <div className="absolute inset-0 bg-black/10" />

      {/* Floating Stars */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white/80 animate-float pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            fontSize: `${Math.random() * 24 + 12}px`,
          }}
        >
          ★
        </div>
      ))}

      {/* Top Left - ReLU Games */}
      <div className="absolute top-4 left-4 z-20">
        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition">
          More From<br/>ReLU Games
        </button>
        <div className="mt-2 bg-gray-700/80 rounded-lg p-2 flex items-center gap-2">
          <div className="bg-teal-600 text-white font-bold text-xl w-10 h-10 flex items-center justify-center rounded">
            A
          </div>
          <span className="text-white/80 text-xs">전체이용가</span>
        </div>
      </div>

      {/* Top Right - Icon Buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button 
          onClick={() => {}}
          className="w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center transition"
        >
          <Globe className="w-6 h-6 text-gray-800" />
        </button>
        <button 
          onClick={testMicrophone}
          className="w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center transition"
        >
          <Settings className="w-6 h-6 text-gray-800" />
        </button>
        <button 
          onClick={handleTransform}
          className="w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center transition"
        >
          <LogIn className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      {/* Center - Title */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="font-title text-6xl md:text-8xl text-pink-500" style={{ textShadow: '3px 3px 0 #fff, -1px -1px 0 #fff' }}>
              마법소녀
            </h1>
            <span className="text-pink-400 text-2xl" style={{ textShadow: '1px 1px 0 #fff' }}>카와이<br/>러블리</span>
          </div>
          <h2 className="font-title text-4xl md:text-5xl text-cyan-400 mb-2" style={{ textShadow: '2px 2px 0 #fff' }}>
            즈큥도큥 바큥부큥
          </h2>
          <h3 className="font-title text-5xl md:text-7xl text-pink-500" style={{ textShadow: '3px 3px 0 #c084fc' }}>
            루루핑
          </h3>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="relative z-20 p-6 pb-8">
        <div className="flex items-end justify-between gap-4">
          {/* Spacer */}
          <div className="w-32"></div>

          {/* Center - 마법소녀로 변신 Button */}
          <button
            onClick={handleTransform}
            disabled={isLoading}
            className="flex-1 max-w-md py-5 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 rounded-xl font-bold text-2xl text-white shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 border-4 border-yellow-300"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
          >
            ★ 마법소녀로 변신 ★
          </button>

          {/* Right - 마법대결 Button */}
          <button
            onClick={handleBattle}
            className="px-6 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 rounded-xl font-bold text-lg text-gray-800 shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            마법대결
            <Heart className="w-5 h-5 text-purple-500 fill-purple-500" />
          </button>
        </div>
      </div>

      {/* Mic Test Modal */}
      {showMicTest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 max-w-sm text-center">
            <div className="text-4xl mb-4">
              {micStatus === null && '🎤'}
              {micStatus === 'success' && '✅'}
              {micStatus === 'error' && '❌'}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">마이크 테스트</h3>
            <p className="text-gray-200 mb-4">
              {micStatus === null && '마이크 권한을 확인하고 있습니다...'}
              {micStatus === 'success' && '마이크가 정상적으로 작동합니다!'}
              {micStatus === 'error' && '마이크 접근 권한을 허용해주세요.'}
            </p>
            <button
              onClick={() => setShowMicTest(false)}
              className="px-6 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition text-white font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
