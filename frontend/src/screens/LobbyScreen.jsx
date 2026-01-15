import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swords, Users, BookOpen, Trophy, Shuffle, UserPlus } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { useGameStore } from '../stores/gameStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export default function LobbyScreen() {
  const navigate = useNavigate()
  const { user, token } = useUserStore()
  const { characters, setCharacters, selectedCharacter } = useGameStore()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch characters
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${API_URL}/characters`)
        if (res.ok) {
          const data = await res.json()
          setCharacters(data.characters)
        }
      } catch (err) {
        console.error('Failed to fetch characters:', err)
      }
    }
    fetchCharacters()
  }, [setCharacters])

  const mainCharacter = selectedCharacter || characters[0]

  const menuItems = [
    { icon: Shuffle, label: '빠른 대전', desc: '무작위 매칭', path: '/matchmaking', color: 'from-pink-500 to-rose-500' },
    { icon: Users, label: '친구와 대결', desc: '방 만들기/입장', path: '/social', color: 'from-purple-500 to-violet-500' },
    { icon: BookOpen, label: '캐릭터 도감', desc: '해금된 캐릭터', path: '/select', color: 'from-cyan-500 to-blue-500' },
    { icon: Trophy, label: '랭킹', desc: '전체 순위', path: '/social?tab=ranking', color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header - Profile */}
      <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-magical-pink-500 to-magical-purple-500 flex items-center justify-center text-2xl">
            🌟
          </div>
          <div>
            <h2 className="font-bold text-lg">{user?.nickname || '게스트 플레이어'}</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-magical-pink-400">ELO {user?.elo_rating || 1200}</span>
              <span className="text-gray-400">|</span>
              <span className="text-star-gold">🏆 {user?.wins || 0}승</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl">💎 1,000</div>
          <div className="text-sm text-gray-400">보유 재화</div>
        </div>
      </div>

      {/* Main Character Display */}
      <div className="relative glass rounded-3xl p-6 mb-6 min-h-[300px] flex flex-col items-center justify-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-radial from-magical-pink-500/20 via-transparent to-transparent" />
        
        {/* Character */}
        <div className="relative z-10">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-magical-pink-400/30 to-magical-purple-400/30 border-2 border-magical-pink-400/50 flex items-center justify-center glow-pink mb-4">
            <span className="text-7xl">✨</span>
          </div>
          <div className="text-center">
            <h3 className="font-title text-2xl text-magical-pink-300">
              {mainCharacter?.name || '마법소녀 루루핑'}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {mainCharacter?.description || '오글거림의 여왕'}
            </p>
          </div>
        </div>

        {/* Change character button */}
        <button
          onClick={() => navigate('/select')}
          className="absolute bottom-4 right-4 px-4 py-2 glass rounded-lg text-sm hover:bg-white/20 transition flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          캐릭터 변경
        </button>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="group relative glass rounded-2xl p-6 text-left hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 transition-opacity`} />
            
            <item.icon className="w-8 h-8 mb-3 text-white" />
            <h3 className="font-bold text-lg">{item.label}</h3>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
