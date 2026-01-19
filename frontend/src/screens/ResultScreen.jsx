import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Home, TrendingUp, TrendingDown, Volume2, Target } from 'lucide-react'
import { useBattleStore } from '../stores/battleStore'
import { useUserStore } from '../stores/userStore'
import { useGameStore } from '../stores/gameStore'

export default function ResultScreen() {
  const navigate = useNavigate()
  const battle = useBattleStore()
  const { user, fetchUser } = useUserStore()
  const { selectedCharacter } = useGameStore()

  // Use store's isWinner and eloChange (set by battle:result event)
  const isWinner = battle.isWinner ?? false
  const eloChange = battle.eloChange ?? 0

  // Refetch user data to get updated ELO from database
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Mock stats for demo
  const stats = {
    peakDb: 85.3,
    avgAccuracy: 0.82,
    totalDamage: isWinner ? 100 : 45,
    spellsUsed: 5,
  }


  const handleLobby = () => {
    battle.reset()
    navigate('/lobby')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Result Title */}
      <div className={`text-center mb-8 ${isWinner ? 'animate-bounce' : ''}`}>
        <div className="text-6xl mb-4">
          {isWinner ? '🎉' : '💔'}
        </div>
        <h1 className={`font-title text-5xl ${isWinner ? 'text-star-gold text-glow-gold' : 'text-gray-400'
          }`}>
          {isWinner ? 'VICTORY!' : 'DEFEAT'}
        </h1>
      </div>

      {/* Winner Character Animation */}
      <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-8 ${isWinner
        ? 'bg-gradient-to-br from-star-gold/30 to-orange-500/30 glow-gold'
        : 'bg-gradient-to-br from-gray-500/30 to-gray-700/30'
        }`}>
        <span className="text-7xl">
          {isWinner ? '🌟' : '😢'}
        </span>
      </div>

      {/* ELO Change */}
      <div className={`glass rounded-xl px-8 py-4 mb-8 flex items-center gap-4 ${isWinner ? 'border-star-gold/50' : 'border-red-500/30'
        }`}>
        <Trophy className={`w-8 h-8 ${isWinner ? 'text-star-gold' : 'text-gray-400'}`} />
        <div>
          <p className="text-sm text-gray-400">ELO 변동</p>
          <p className={`text-2xl font-bold flex items-center gap-1 ${isWinner ? 'text-green-400' : 'text-red-400'
            }`}>
            {isWinner ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {eloChange > 0 ? '+' : ''}{eloChange}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">현재 ELO</p>
          <p className="text-xl font-bold">{user?.elo_rating || 1200}</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="glass rounded-2xl p-6 w-full max-w-md mb-8">
        <h3 className="font-bold text-lg mb-4 text-center">📊 대결 통계</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={<Volume2 className="w-5 h-5 text-magical-pink-400" />}
            label="최대 성량"
            value={`${stats.peakDb.toFixed(1)} dB`}
          />
          <StatItem
            icon={<Target className="w-5 h-5 text-magical-purple-400" />}
            label="평균 정확도"
            value={`${(stats.avgAccuracy * 100).toFixed(0)}%`}
          />
          <StatItem
            icon={<span className="text-cringe-red">💥</span>}
            label="총 데미지"
            value={stats.totalDamage}
          />
          <StatItem
            icon={<span className="text-star-gold">⭐</span>}
            label="주문 횟수"
            value={`${stats.spellsUsed}회`}
          />
        </div>
      </div>

      {/* Final HP Display */}
      <div className="flex gap-8 mb-8 w-full max-w-md">
        <div className="flex-1 glass rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">나</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className={`text-2xl font-bold ${battle.player.hp > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {battle.player.hp}
            </span>
          </div>
        </div>
        <div className="flex-1 glass rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">상대</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">💔</span>
            <span className={`text-2xl font-bold ${battle.opponent.hp > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {battle.opponent.hp}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center w-full max-w-md">
        <button
          onClick={handleLobby}
          className="px-12 py-4 bg-gradient-to-r from-magical-pink-500 to-magical-purple-500 rounded-xl font-bold hover:scale-105 transition flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          로비로
        </button>
      </div>
    </div>
  )
}

function StatItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  )
}
