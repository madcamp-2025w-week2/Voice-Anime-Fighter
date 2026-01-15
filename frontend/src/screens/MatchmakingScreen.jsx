import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Check, Smile } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useUserStore } from '../stores/userStore'
import { useGameStore } from '../stores/gameStore'

export default function MatchmakingScreen() {
  const navigate = useNavigate()
  const { on, off } = useSocket()
  const { user } = useUserStore()
  const { selectedCharacter } = useGameStore()
  
  const [status, setStatus] = useState('searching') // searching, found, ready
  const [opponent, setOpponent] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // Simulate matchmaking for demo
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      setOpponent({
        nickname: 'AI 상대',
        elo_rating: 1250,
        wins: 15,
        character: { name: '중2병 환자 리카', id: 'char_004' }
      })
      setStatus('found')
    }, 2000)

    return () => clearTimeout(searchTimer)
  }, [])

  // Listen for game start
  useEffect(() => {
    on('room:game_start', (data) => {
      setCountdown(3)
    })

    return () => off('room:game_start')
  }, [on, off])

  // Countdown to battle
  useEffect(() => {
    if (countdown === null) return
    
    if (countdown === 0) {
      navigate('/battle')
      return
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, navigate])

  const handleReady = () => {
    setIsReady(true)
    setStatus('ready')
    // In real app, this would emit to socket
    setTimeout(() => {
      setCountdown(3)
    }, 1000)
  }

  const handleCancel = () => {
    navigate('/lobby')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* VS Display */}
      <div className="flex items-center justify-center gap-8 mb-12">
        {/* Player Card */}
        <div className="glass rounded-2xl p-6 w-48 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-magical-pink-500/30 to-magical-purple-500/30 flex items-center justify-center mb-4">
            <span className="text-4xl">🌟</span>
          </div>
          <h3 className="font-bold text-lg">{user?.nickname || '나'}</h3>
          <p className="text-magical-pink-400 text-sm">ELO {user?.elo_rating || 1200}</p>
          <p className="text-gray-400 text-xs mt-1">
            {selectedCharacter?.name || '마법소녀 루루핑'}
          </p>
        </div>

        {/* VS Logo */}
        <div className="relative">
          <div className="text-6xl font-title text-transparent bg-clip-text bg-magical-gradient animate-pulse">
            VS
          </div>
          {countdown !== null && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-4xl font-bold text-star-gold animate-bounce">
              {countdown}
            </div>
          )}
        </div>

        {/* Opponent Card */}
        <div className="glass rounded-2xl p-6 w-48 text-center">
          {status === 'searching' ? (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4 animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
              </div>
              <h3 className="font-bold text-lg text-gray-400">검색 중...</h3>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center mb-4">
                <span className="text-4xl">👿</span>
              </div>
              <h3 className="font-bold text-lg">{opponent?.nickname}</h3>
              <p className="text-magical-purple-400 text-sm">ELO {opponent?.elo_rating}</p>
              <p className="text-gray-400 text-xs mt-1">
                {opponent?.character?.name}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center mb-8">
        {status === 'searching' && (
          <p className="text-xl text-gray-300 animate-pulse">
            🔍 상대를 찾고 있습니다...
          </p>
        )}
        {status === 'found' && (
          <p className="text-xl text-magical-pink-300">
            ⚔️ 상대를 찾았습니다!
          </p>
        )}
        {status === 'ready' && (
          <p className="text-xl text-green-400">
            ✅ 준비 완료! 곧 시작합니다...
          </p>
        )}
      </div>

      {/* Opponent Stats */}
      {opponent && (
        <div className="glass rounded-xl p-4 mb-8 text-center">
          <p className="text-sm text-gray-400 mb-2">상대방 전적</p>
          <div className="flex gap-6 justify-center">
            <div>
              <span className="text-star-gold font-bold">{opponent.wins}승</span>
            </div>
            <div>
              <span className="text-red-400 font-bold">8패</span>
            </div>
            <div>
              <span className="text-magical-pink-400">승률 65%</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 w-full max-w-md">
        {status === 'found' && !isReady && (
          <>
            <button
              onClick={handleCancel}
              className="flex-1 py-4 glass rounded-xl font-bold hover:bg-white/20 transition"
            >
              취소
            </button>
            <button
              onClick={handleReady}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold hover:scale-105 transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              준비 완료
            </button>
          </>
        )}
        
        {status === 'searching' && (
          <button
            onClick={handleCancel}
            className="w-full py-4 glass rounded-xl font-bold hover:bg-white/20 transition"
          >
            매칭 취소
          </button>
        )}

        {isReady && (
          <div className="w-full flex items-center justify-center gap-2 py-4 text-green-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            상대방 준비 대기 중...
          </div>
        )}
      </div>

      {/* Emote Buttons */}
      {opponent && (
        <div className="mt-8 flex gap-4">
          <button className="p-3 glass rounded-full hover:bg-white/20 transition text-2xl">
            😊
          </button>
          <button className="p-3 glass rounded-full hover:bg-white/20 transition text-2xl">
            😤
          </button>
          <button className="p-3 glass rounded-full hover:bg-white/20 transition text-2xl">
            💪
          </button>
          <button className="p-3 glass rounded-full hover:bg-white/20 transition text-2xl">
            🔥
          </button>
        </div>
      )}
    </div>
  )
}
