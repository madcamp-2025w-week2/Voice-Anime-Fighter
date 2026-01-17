import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Volume2, Target, Sparkles, Loader2 } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'

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

  const handleConfirm = async () => {
    if (previewChar) {
      try {
        const { token, updateUser } = useUserStore.getState(); // userStore 접근
        
        // 1. 백엔드 저장 API 호출
        const res = await fetch(`${API_URL}/users/me/character`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ character_id: previewChar.id })
        });

        if (!res.ok) {
          throw new Error('Failed to update character');
        }

        const updatedUser = await res.json();
        
        // 2. 스토어 업데이트
        updateUser({ main_character_id: previewChar.id }); // userStore 업데이트
        selectCharacter(previewChar); // gameStore 업데이트
        
        navigate('/lobby');
      } catch (err) {
        console.error('Character update failed:', err);
        // 에러 발생시에도 일단 로컬 상태 업데이트하고 이동할지, 아니면 막을지 결정
        // 여기서는 일단 로컬만이라도 업데이트하고 이동 (사용자 경험 우선)
        selectCharacter(previewChar);
        navigate('/lobby');
      }
    }
  }

  const getStatColor = (value) => {
    if (value >= 90) return 'bg-cringe-red'
    if (value >= 70) return 'bg-magical-pink-500'
    if (value >= 50) return 'bg-magical-purple-500'
    return 'bg-blue-500'
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col p-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-4 shrink-0 relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-lg hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-title text-2xl md:text-3xl text-magical-pink-400 font-black italic tracking-wider uppercase drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
          SELECT CHARACTER
        </h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 relative z-10">
        {/* Character Preview - Left Side (Fixed/Scrollable content) */}
        <div className="lg:w-1/3 h-full flex flex-col min-h-0">
          <div className="glass rounded-2xl p-6 h-full flex flex-col items-center justify-center overflow-y-auto custom-scrollbar border border-white/10 bg-black/40 backdrop-blur-md">
            {previewChar ? (
              <>
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-magical-pink-400/30 to-magical-purple-400/30 border-2 border-magical-pink-400/50 flex items-center justify-center glow-pink mb-6 overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.3)] relative group shrink-0">
                  <div className="absolute inset-0 bg-[url('/effects/sparkle.png')] opacity-30 animate-pulse"></div>
                  <img
                    src={previewChar.image || "/images/char_otaku.png"}
                    alt={previewChar.name}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  />
                </div>
                <h2 className="font-title text-3xl font-black italic text-magical-pink-300 mb-2">{previewChar.name}</h2>
                <p className="text-gray-400 text-sm mb-4 text-center px-4">{previewChar.description}</p>

                {/* Stats */}
                <div className="w-full space-y-3 shrink-0">
                  <StatBar label="오글거림" value={previewChar.stats.cringe_level} icon={<Sparkles className="w-4 h-4" />} color={getStatColor(previewChar.stats.cringe_level)} />
                  <StatBar label="성량" value={previewChar.stats.volume_req} icon={<Volume2 className="w-4 h-4" />} color={getStatColor(previewChar.stats.volume_req)} />
                  <StatBar label="정확도" value={previewChar.stats.precision} icon={<Target className="w-4 h-4" />} color={getStatColor(previewChar.stats.precision)} />
                </div>

                {/* Spell Text */}
                <div className="mt-4 p-4 bg-black/50 border border-white/10 rounded-xl w-full shrink-0">
                  <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">필살 주문</p>
                  <p className="text-magical-pink-300 font-bold italic text-lg text-center">"{previewChar.spell_text}"</p>
                </div>
              </>
            ) : (
              <p className="text-gray-400 font-bold animate-pulse">캐릭터를 선택하세요</p>
            )}
          </div>
        </div>

        {/* Character Grid - Right Side (Scrollable) */}
        <div className="lg:w-2/3 h-full overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-2 pb-8">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleSelect(char)}
                className={`group glass rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10 relative hover:z-50 ${previewChar?.id === char.id ? 'ring-2 ring-magical-pink-400 glow-pink bg-magical-pink-900/20' : 'border border-white/5'
                  } ${selectedCharacter?.id === char.id ? 'ring-2 ring-star-gold shadow-[0_0_15px_rgba(250,204,21,0.3)]' : ''}`}
              >
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-magical-pink-500/10 to-magical-purple-500/10 flex items-center justify-center mb-2 overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                  <img
                    src={char.image || "/images/char_otaku.png"}
                    alt={char.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-sm font-bold truncate text-gray-200 group-hover:text-white transition-colors">{char.name}</p>
                {selectedCharacter?.id === char.id && (
                  <div className="absolute top-2 right-2 bg-star-gold text-black rounded-full p-1 shadow-lg scale-90">
                    <Check className="w-3 h-3 stroke-[4]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-4 shrink-0 relative z-10">
        <button
          onClick={handleConfirm}
          disabled={!previewChar}
          className="w-full py-4 bg-gradient-to-r from-magical-pink-600 to-purple-600 rounded-xl font-black italic text-2xl uppercase tracking-widest hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(219,39,119,0.5)] transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
        >
          {previewChar ? `SELECT ${previewChar.name}` : 'SELECT CHARACTER'}
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #db2777; }
      `}</style>
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
