import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Volume2, Target, Sparkles } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export default function CharacterSelectScreen() {
  const navigate = useNavigate()
  const { characters, setCharacters, selectedCharacter, selectCharacter } = useGameStore()
  const [previewChar, setPreviewChar] = useState(null)

  /* Image Mapping */
  const CHARACTER_IMAGES = {
    'char_000': '/images/otacu.webp',
    'char_001': '/images/output_satoru.webp',
    'char_002': '/images/lupy.webp',
    'char_003': '/images/livi.webp',
    'char_004': '/images/output_tan.webp',
    // Default fallback
    'default': '/images/otacu.webp'
  };

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${API_URL}/characters`)
        if (res.ok) {
          const data = await res.json()
          // Inject images
          const charsWithImages = data.characters.map(c => ({
            ...c,
            image: CHARACTER_IMAGES[c.id] || CHARACTER_IMAGES['default']
          }))
          setCharacters(charsWithImages)
          setPreviewChar(charsWithImages[0])
        }
      } catch (err) {
        console.error(err)
        // Use mock data for development - 오타쿠 캐릭터가 첫 번째 (기본)
        const mockChars = [
          { id: 'char_000', name: '찐따 오타쿠 쿠로', description: '방에서 라면만 먹으며 애니만 보는 진정한 오타쿠', stats: { cringe_level: 100, volume_req: 60, precision: 85 }, spell_text: '월화수목금토일 사랑스러운 마법소녀로 변신할거야 미라클 메이크 업!', image: '/images/otacu.webp' },
          { id: 'char_001', name: '고졸 사토루', description: '오글거림의 여왕', stats: { cringe_level: 95, volume_req: 70, precision: 80 }, spell_text: '마법소녀 카와이 러블리 루루핑!', image: '/images/output_satoru.webp' },
          { id: 'char_002', name: '몽키 D: 드라이브', description: '마음을 읽는 초능력 소녀', stats: { cringe_level: 75, volume_req: 60, precision: 90 }, spell_text: '와쿠와쿠! 피넛츠가 좋아!', image: '/images/lupy.webp' },
          { id: 'char_003', name: '딸바이', description: '삼도류의 달인', stats: { cringe_level: 50, volume_req: 95, precision: 60 }, spell_text: '산젠세카이! 오니기리!', image: '/images/livi.webp' },
          { id: 'char_004', name: '바싹 탄지로', description: '다크플레임 마스터', stats: { cringe_level: 100, volume_req: 65, precision: 75 }, spell_text: '폭렬하라! 다크 플레임 마스터!', image: '/images/output_tan.webp' },
          { id: 'char_005', name: '냥냥펀치', description: '냥냥펀치로 공격', stats: { cringe_level: 85, volume_req: 55, precision: 85 }, spell_text: '냥냥펀치! 고양이의 힘을 빌려라!', image: '/images/output_tan.webp' },
          { id: 'char_006', name: '오타쿠 전사 오글이', description: '피규어 파워', stats: { cringe_level: 90, volume_req: 80, precision: 70 }, spell_text: '오타쿠의 자존심! 피규어 슬래시!', image: '/images/output_tan.webp' },
          { id: 'char_007', name: '히키코모리 네코', description: '3년간 방에서 안 나온 은둔형 외톨이', stats: { cringe_level: 88, volume_req: 50, precision: 92 }, spell_text: '햇빛 싫어... 어둠이여 나를 감싸라!', image: '/images/output_tan.webp' },
        ]
        setCharacters(mockChars)
        setPreviewChar(mockChars[0])
      }
    }
    fetchCharacters()
  }, [setCharacters])

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
