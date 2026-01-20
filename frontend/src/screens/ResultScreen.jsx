import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Home, TrendingUp, TrendingDown } from 'lucide-react'
import { useBattleStore } from '../stores/battleStore'
import { useUserStore } from '../stores/userStore'
import { useGameStore } from '../stores/gameStore'

export default function ResultScreen() {
  const navigate = useNavigate()
  const battle = useBattleStore()
  const { user, fetchUser } = useUserStore()
  const { selectedCharacter } = useGameStore()
  
  // Animation state
  const [showContent, setShowContent] = useState(false)

  // Use store's isWinner and eloChange (set by battle:result event)
  const isWinner = battle.isWinner ?? false
  const eloChange = battle.eloChange ?? 0

  // Refetch user data to get updated ELO from database
  useEffect(() => {
    fetchUser()
    // Animation trigger
    setTimeout(() => setShowContent(true), 100)
  }, [fetchUser])

  const handleLobby = () => {
    battle.reset()
    navigate('/lobby')
  }

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleLobby()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const gradientBg = isWinner 
    ? 'bg-gradient-to-br from-yellow-900 via-orange-900 to-black' 
    : 'bg-gradient-to-br from-gray-900 via-red-950 to-black'
    
  // Character Image Source
  const charImage = selectedCharacter?.image || selectedCharacter?.sprite_url || '/images/profile/otacu.webp'

  return (
    <div className={`min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center ${gradientBg} text-white selection:bg-white/20`}>
      
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-[150px]" />
      </div>

      {/* Massive Background Character */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ${showContent ? 'opacity-30 scale-100' : 'opacity-0 scale-90'}`}>
        <img 
          src={charImage} 
          alt="Character" 
          className={`h-[120%] object-cover object-top mix-blend-overlay opacity-50 grayscale-[30%]`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 w-full max-w-4xl px-6 flex flex-col items-center transition-all duration-700 delay-100 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Result Title */}
        <div className="text-center mb-12 relative overflow-visible px-4">
          <h1 className={`font-black italic text-[120px] leading-[0.8] tracking-tighter drop-shadow-2xl px-4 ${isWinner ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]' : 'text-zinc-500 drop-shadow-[0_0_30px_rgba(255,0,0,0.2)]'}`}>
            {isWinner ? 'VICTORY' : 'DEFEAT'}
          </h1>
          <p className="text-xl font-bold tracking-[0.5em] text-white/50 mt-4 uppercase text-center">
            {isWinner ? 'Match Completed' : 'Mission Failed'}
          </p>
        </div>

        {/* ELO Card (Ranked) or Friendly Match Card */}
        <div className="w-full max-w-md mb-16">
          {eloChange !== 0 ? (
            /* Ranked Match - Show ELO Change */
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-center gap-4 group hover:border-white/20 transition-colors shadow-2xl">
              <span className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Trophy size={16} /> MMR Update
              </span>
              
              <div className="flex flex-col items-center overflow-visible">
                <span className="text-8xl font-black italic tracking-tighter text-white drop-shadow-xl px-2">
                  {user?.elo_rating || 1200}
                </span>
                
                <div className={`flex items-center gap-2 text-3xl font-bold mt-2 ${eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {eloChange > 0 ? (
                     <TrendingUp className="w-8 h-8" />
                  ) : (
                     <TrendingDown className="w-8 h-8" />
                  )}
                  <span>{eloChange > 0 ? '+' : ''}{eloChange}</span>
                </div>
              </div>

              {isWinner && <div className="mt-4 px-4 py-1.5 bg-yellow-500/20 text-yellow-300 text-sm font-bold rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse">
                RANK UP SOON?
              </div>}
            </div>
          ) : (
            /* Friendly Match - No ELO Change */
            <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 flex flex-col justify-center items-center gap-4 group hover:border-cyan-400/30 transition-colors shadow-2xl">
              <span className="text-sm font-bold text-cyan-400/60 uppercase tracking-widest flex items-center gap-2">
                ⚔️ Friendly Match
              </span>
              
              <div className="flex flex-col items-center gap-2 overflow-visible">
                <span className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-xl px-4">
                  {isWinner ? 'GOOD GAME!' : 'GG WP'}
                </span>
                
                <p className="text-lg text-white/50 font-bold mt-2">
                  랭킹 변동 없음
                </p>
              </div>

              <div className="mt-2 px-4 py-1.5 bg-cyan-500/10 text-cyan-300 text-sm font-bold rounded-full border border-cyan-500/20">
                🎮 친선전
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="w-full max-w-md animate-pulse-slow">
          <button
            onClick={handleLobby}
            className={`w-full py-6 rounded-2xl font-black text-2xl tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3 group relative overflow-hidden ${
              isWinner 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-[0_0_50px_rgba(234,179,8,0.4)]' 
                : 'bg-gradient-to-r from-zinc-700 to-zinc-800 text-white border border-white/10 hover:bg-zinc-700'
            }`}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-3">
              <Home className="w-6 h-6" />
              RETURN TO LOBBY
              <span className="text-xs bg-black/20 px-2 py-1 rounded text-white/80 font-bold border border-white/10 ml-2">ENTER</span>
            </span>
          </button>
        </div>

      </div>
    </div>
  )
}
