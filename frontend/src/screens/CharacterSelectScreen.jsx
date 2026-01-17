import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Volume2, Target, Sparkles, Loader2 } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export default function CharacterSelectScreen() {
  const navigate = useNavigate()
  const { characters, setCharacters, selectedCharacter, selectCharacter } = useGameStore()
  const [previewChar, setPreviewChar] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 이미 캐릭터가 로드되어 있으면 스킵
    if (characters.length > 0) {
      setPreviewChar(characters[0])
      return
    }

    const fetchCharacters = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`${API_URL}/characters`)
        if (res.ok) {
          const data = await res.json()
          // 백엔드에서 sprite_url 사용
          const charsWithImages = data.characters.map(c => ({
            ...c,
            image: c.sprite_url || c.thumbnail_url
          }))
          setCharacters(charsWithImages)
          setPreviewChar(charsWithImages[0])
        }
      } catch (err) {
        console.error('Failed to fetch characters:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCharacters()
  }, [setCharacters, characters.length])

  const handleSelect = (char) => {
    setPreviewChar(char)
  }

  const handleConfirm = () => {
    if (previewChar) {
      selectCharacter(previewChar)
      navigate('/lobby')
    }
  }

  const getStatColor = (value) => {
    if (value >= 90) return 'bg-cringe-red'
    if (value >= 70) return 'bg-magical-pink-500'
    if (value >= 50) return 'bg-magical-purple-500'
    return 'bg-blue-500'
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-lg hover:bg-white/20">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-title text-2xl text-magical-pink-400">캐릭터 선택</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Character Preview - Left Side */}
        <div className="lg:w-1/3">
          <div className="glass rounded-2xl p-6 h-full flex flex-col items-center justify-center">
            {previewChar ? (
              <>
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-magical-pink-400/30 to-magical-purple-400/30 border-2 border-magical-pink-400/50 flex items-center justify-center glow-pink mb-4 overflow-hidden">
                  <img
                    src={previewChar.image || "/images/char_otaku.png"}
                    alt={previewChar.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="font-title text-2xl text-magical-pink-300 mb-2">{previewChar.name}</h2>
                <p className="text-gray-400 text-sm mb-4">{previewChar.description}</p>

                {/* Stats */}
                <div className="w-full space-y-3">
                  <StatBar label="오글거림" value={previewChar.stats.cringe_level} icon={<Sparkles className="w-4 h-4" />} color={getStatColor(previewChar.stats.cringe_level)} />
                  <StatBar label="성량" value={previewChar.stats.volume_req} icon={<Volume2 className="w-4 h-4" />} color={getStatColor(previewChar.stats.volume_req)} />
                  <StatBar label="정확도" value={previewChar.stats.precision} icon={<Target className="w-4 h-4" />} color={getStatColor(previewChar.stats.precision)} />
                </div>

                {/* Spell Text */}
                <div className="mt-4 p-3 bg-black/30 rounded-lg w-full">
                  <p className="text-sm text-gray-400 mb-1">필살 주문</p>
                  <p className="text-magical-pink-300 font-bold">"{previewChar.spell_text}"</p>
                </div>
              </>
            ) : (
              <p className="text-gray-400">캐릭터를 선택하세요</p>
            )}
          </div>
        </div>

        {/* Character Grid - Right Side */}
        <div className="lg:w-2/3">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleSelect(char)}
                className={`group glass rounded-xl p-3 transition-all duration-200 hover:scale-105 ${previewChar?.id === char.id ? 'ring-2 ring-magical-pink-400 glow-pink' : ''
                  } ${selectedCharacter?.id === char.id ? 'ring-2 ring-star-gold' : ''}`}
              >
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-magical-pink-500/20 to-magical-purple-500/20 flex items-center justify-center mb-2 overflow-hidden">
                  <img
                    src={char.image || "/images/char_otaku.png"}
                    alt={char.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium truncate">{char.name}</p>
                {selectedCharacter?.id === char.id && (
                  <div className="absolute top-1 right-1 bg-star-gold rounded-full p-1">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-6">
        <button
          onClick={handleConfirm}
          disabled={!previewChar}
          className="w-full py-4 bg-gradient-to-r from-magical-pink-500 to-magical-purple-500 rounded-2xl font-bold text-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
        >
          선택 확정
        </button>
      </div>
    </div>
  )
}

function StatBar({ label, value, icon, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1 text-gray-300">
          {icon}
          {label}
        </span>
        <span className="text-white font-bold">{value}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
