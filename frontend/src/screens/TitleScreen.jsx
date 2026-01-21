import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import { Mic, Sparkles } from 'lucide-react'
import { useUserStore } from '../stores/userStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const DEMO_MODE = !import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID === 'demo-client-id'

export default function TitleScreen() {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showMicTest, setShowMicTest] = useState(false)
  const [micStatus, setMicStatus] = useState(null)
  const bgmRef = useRef(null)

  // 배경음악 재생 (페이지 진입 시)
  useEffect(() => {
    const audio = new Audio('/audio/title_bgm.mp3')
    audio.loop = false
    audio.volume = 0.5
    bgmRef.current = audio

    // 사용자 상호작용 후 재생 시도 (브라우저 자동재생 정책 대응)
    const playBgm = () => {
      audio.play().catch(err => console.log('BGM autoplay blocked:', err))
    }

    // 첫 클릭/터치 시 재생 시작
    document.addEventListener('click', playBgm, { once: true })
    document.addEventListener('touchstart', playBgm, { once: true })

    // 즉시 재생 시도 (일부 브라우저에서 허용)
    playBgm()

    return () => {
      audio.pause()
      audio.src = ''
      document.removeEventListener('click', playBgm)
      document.removeEventListener('touchstart', playBgm)
    }
  }, [])

  // BGM 페이드 아웃 후 중지
  const stopBgm = () => {
    if (bgmRef.current) {
      const audio = bgmRef.current
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.1) {
          audio.volume -= 0.1
        } else {
          audio.pause()
          clearInterval(fadeOut)
        }
      }, 50)
    }
  }

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

  // Google Login Hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      try {
        // 백엔드로 액세스 토큰 전송
        const response = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        })

        if (response.ok) {
          const data = await response.json()
          login(data.user, data.access_token)
          stopBgm()
          navigate('/lobby')
        } else {
          throw new Error('Backend login failed')
        }
      } catch (err) {
        console.error('Login error:', err)
        // 실패 시 데모 로그인 (임시)
        handleTransformDemo()
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      console.log('Login failed')
      setIsLoading(false)
    },
  })

  // 게스트 로그인 공통 함수
  const performGuestLogin = async (targetPath) => {
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
        stopBgm()
        navigate(targetPath)
      } else {
        throw new Error('Guest login failed')
      }
    } catch (err) {
      console.error('Guest login error:', err)
      alert('게스트 로그인에 실패했습니다. 서버 상태를 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // 게스트 로그인 (데모) - Real API call now
  const handleTransformDemo = () => performGuestLogin('/lobby')

  // 로그인 버튼 핸들러
  const handleTransform = () => {
    setIsLoading(true)

    if (DEMO_MODE) {
      handleTransformDemo()
    } else {
      googleLogin()
    }
  }



  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/background/title_bg.png')" }}
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



      {/* Top Right - Icon Buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">

        <button
          onClick={testMicrophone}
          className="w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center transition"
        >
          <Mic className="w-6 h-6 text-gray-800" />
        </button>

      </div>

      {/* Center - Title */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="font-title text-6xl md:text-8xl text-red-900"
              style={{
                textShadow: '0 0 10px #000, 2px 2px 0 #4a0404, 0 0 30px #8b0000',
                animation: 'breathe 3s ease-in-out infinite'
              }}>
              흑염룡이
            </h1>
            <span className="text-purple-400 text-2xl font-bold"
              style={{
                textShadow: '2px 2px 4px #000',
                animation: 'wobble 2s ease-in-out infinite'
              }}>
              날뛰어서<br />크아아앙
            </span>
          </div>
          <h2 className="font-title text-4xl md:text-5xl text-gray-400 mb-2"
            style={{
              textShadow: '0 0 5px #000, 2px 2px 0 #333',
            }}>
            {Array.from("야레야레 다이스키다요").map((char, i) => (
              <span key={i} style={{
                display: 'inline-block',
                animation: 'wave 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
                marginRight: char === ' ' ? '10px' : '0'
              }}>
                {char}
              </span>
            ))}
          </h2>
          <h3 className="font-title text-5xl md:text-8xl text-white"
            style={{
              textShadow: '4px 4px 0 #2e1065, 0 0 20px #a855f7', // Deep purple hard shadow + Bright purple glow
              WebkitTextStroke: '2px #000' // Black stroke for definition
            }}>
            중이병핑
          </h3>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="relative z-20 p-6 pb-8 -mt-20">
        <div className="flex items-center justify-center">
          {/* Center - 마법소녀로 변신 Button */}
          <button
            onClick={handleTransform}
            disabled={isLoading}
            className="max-w-md py-5 px-12 bg-gradient-to-r from-purple-900 to-black hover:from-black hover:to-red-900 rounded-xl font-bold text-2xl text-red-500 shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 border-4 border-red-900 overflow-hidden relative group"
            style={{
              textShadow: '0 0 10px #ff0000',
              boxShadow: '0 0 20px #8b0000'
            }}
          >
            <span className="relative z-10">☠️ 흑염룡에 잠식당하기 ☠️</span>
            {/* Hover Effect overlay */}
            <div className="absolute inset-0 bg-red-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </div>
      </div>

      {/* VAF Logo (Bottom Right) */}
      <img
        src="/images/logo_vaf.png"
        alt="VAF Logo"
        className="absolute bottom-4 right-4 w-24 md:w-32 z-20 opacity-80 animate-pulse hover:opacity-100 transition-opacity"
      />

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
