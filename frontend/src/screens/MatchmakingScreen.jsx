import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Check, Trophy, TrendingUp, Swords, Target } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useUserStore } from '../stores/userStore'
import { useGameStore } from '../stores/gameStore'

export default function MatchmakingScreen() {
  const navigate = useNavigate()
  const { on, off } = useSocket()
  const { user } = useUserStore()
  const { selectedCharacter, characters } = useGameStore()
  
  const [status, setStatus] = useState('searching') // searching, found, ready
  const [opponent, setOpponent] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // Find character image by ID
  const getCharacterImage = (characterId) => {
    const char = characters?.find(c => c.id === characterId)
    return char?.image || char?.sprite_url || '/images/otacu.webp'
  }

  // Calculate win rate
  const calcWinRate = (wins, losses) => {
    const total = (wins || 0) + (losses || 0)
    return total > 0 ? ((wins || 0) / total * 100).toFixed(0) : '0'
  }

  // My stats
  const myWins = user?.wins || 0
  const myLosses = user?.losses || 0
  const myWinRate = calcWinRate(myWins, myLosses)
  const myCharImage = selectedCharacter?.image || selectedCharacter?.sprite_url || getCharacterImage(user?.main_character_id)

  // Simulate matchmaking for demo
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      setOpponent({
        nickname: 'AI 상대',
        elo_rating: 1250,
        wins: 15,
        losses: 8,
        main_character_id: 'char_004',
        avatar_url: null,
        rank: 42
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
    setTimeout(() => {
      setCountdown(3)
    }, 1000)
  }

  const handleCancel = () => {
    navigate('/lobby')
  }

  // Opponent stats
  const oppWins = opponent?.wins || 0
  const oppLosses = opponent?.losses || 0
  const oppWinRate = calcWinRate(oppWins, oppLosses)
  const oppCharImage = getCharacterImage(opponent?.main_character_id)

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-purple-950/30 to-black text-white p-6">
      
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-[120px]" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8 drop-shadow-lg px-12 py-4 leading-relaxed">
        {status === 'searching' ? 'SEARCHING...' : status === 'found' ? 'MATCH FOUND!' : 'GET READY!'}
      </h1>

      {/* VS Display */}
      <div className="flex items-stretch justify-center gap-6 md:gap-12 mb-8 w-full max-w-4xl relative z-10">
        
        {/* Player Card */}
        <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 group hover:border-pink-500/30 transition-colors shadow-xl">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg shadow-pink-900/30 border-2 border-white/20 overflow-hidden">
              {(user?.avatar_url && (user.avatar_url.startsWith('/') || user.avatar_url.startsWith('http'))) ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.avatar_url || '🌟'
              )}
            </div>
            {/* Character Badge */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-pink-500 overflow-hidden bg-black shadow-lg">
              <img src={myCharImage} alt="Character" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Nickname & Rank */}
          <div className="text-center">
            <h3 className="font-black italic text-xl text-white">{user?.nickname || 'Player'}</h3>
            {user?.rank && (
              <p className="text-xs text-pink-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mt-1">
                <Trophy size={12} /> RANK #{user.rank}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-2 mt-2">
            <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">MMR</p>
              <p className="text-xl font-black text-yellow-400">{user?.elo_rating || 1200}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Win Rate</p>
              <p className={`text-xl font-black ${Number(myWinRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>{myWinRate}%</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Wins</p>
              <p className="text-lg font-bold text-cyan-400">{myWins}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Losses</p>
              <p className="text-lg font-bold text-zinc-400">{myLosses}</p>
            </div>
          </div>
        </div>

        {/* VS Logo */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse">
            VS
          </div>
          {countdown !== null && (
            <div className="mt-4 text-5xl font-black text-white animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              {countdown}
            </div>
          )}
        </div>

        {/* Opponent Card */}
        <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 group hover:border-purple-500/30 transition-colors shadow-xl">
          {status === 'searching' ? (
            <>
              <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse border-2 border-zinc-700">
                <Loader2 className="w-10 h-10 animate-spin text-zinc-500" />
              </div>
              <h3 className="font-black italic text-xl text-zinc-500">Finding...</h3>
              <div className="w-full grid grid-cols-2 gap-2 mt-2 opacity-30">
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5 h-16"></div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5 h-16"></div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5 h-12"></div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5 h-12"></div>
              </div>
            </>
          ) : (
            <>
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-4xl shadow-lg shadow-purple-900/30 border-2 border-white/20 overflow-hidden">
                  {(opponent?.avatar_url && (opponent.avatar_url.startsWith('/') || opponent.avatar_url.startsWith('http'))) ? (
                    <img src={opponent.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    opponent?.avatar_url || '👿'
                  )}
                </div>
                {/* Character Badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden bg-black shadow-lg">
                  <img src={oppCharImage} alt="Character" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Nickname & Rank */}
              <div className="text-center">
                <h3 className="font-black italic text-xl text-white">{opponent?.nickname}</h3>
                {opponent?.rank && (
                  <p className="text-xs text-purple-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mt-1">
                    <Trophy size={12} /> RANK #{opponent.rank}
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-2 mt-2">
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">MMR</p>
                  <p className="text-xl font-black text-yellow-400">{opponent?.elo_rating}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Win Rate</p>
                  <p className={`text-xl font-black ${Number(oppWinRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>{oppWinRate}%</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Wins</p>
                  <p className="text-lg font-bold text-cyan-400">{oppWins}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Losses</p>
                  <p className="text-lg font-bold text-zinc-400">{oppLosses}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 w-full max-w-md relative z-10">
        {status === 'found' && !isReady && (
          <>
            <button
              onClick={handleCancel}
              className="flex-1 py-4 bg-zinc-800/80 border border-zinc-700 rounded-2xl font-bold hover:bg-zinc-700 transition text-zinc-300"
            >
              취소
            </button>
            <button
              onClick={handleReady}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
            >
              <Check className="w-6 h-6" />
              READY
            </button>
          </>
        )}
        
        {status === 'searching' && (
          <button
            onClick={handleCancel}
            className="w-full py-4 bg-zinc-800/80 border border-zinc-700 rounded-2xl font-bold hover:bg-zinc-700 transition text-zinc-300"
          >
            매칭 취소
          </button>
        )}

        {isReady && (
          <div className="w-full flex items-center justify-center gap-3 py-4 text-green-400 font-bold">
            <Loader2 className="w-6 h-6 animate-spin" />
            상대방 준비 대기 중...
          </div>
        )}
      </div>

      {/* Emote Buttons */}
      {opponent && (
        <div className="mt-8 flex gap-3 relative z-10">
          {['😊', '😤', '💪', '🔥'].map((emoji, i) => (
            <button key={i} className="p-3 bg-black/30 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 transition text-2xl shadow-lg">
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
