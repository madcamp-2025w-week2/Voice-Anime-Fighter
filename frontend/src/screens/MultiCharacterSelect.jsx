import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Volume2, Target, Sparkles } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useSocket } from '../hooks/useSocket'

// 캐릭터 데이터
const CHARACTERS = [
  { id: 'char_000', name: '찐따 오타쿠 쿠로', image: '/images/char_otaku.png', stats: { cringe_level: 100, volume_req: 60, precision: 85 }, spell_text: '월화수목금토일 사랑스러운 마법소녀로 변신할거야 미라클 메이크 업!' },
  { id: 'char_008', name: '고졸 사토루', image: '/images/char_satoru.png', stats: { cringe_level: 75, volume_req: 90, precision: 95 }, spell_text: '무량공처! 죽여버린다 이 새끼!' },
  { id: 'char_001', name: '마법소녀 루루핑', image: null, stats: { cringe_level: 95, volume_req: 70, precision: 80 }, spell_text: '마법소녀 카와이 러블리 루루핑!' },
  { id: 'char_002', name: '와쿠와쿠 아냐', image: null, stats: { cringe_level: 75, volume_req: 60, precision: 90 }, spell_text: '와쿠와쿠! 피넛츠가 좋아!' },
  { id: 'char_003', name: '열혈 남아 조로', image: null, stats: { cringe_level: 50, volume_req: 95, precision: 60 }, spell_text: '산젠세카이! 오니기리!' },
  { id: 'char_004', name: '중2병 환자 리카', image: null, stats: { cringe_level: 100, volume_req: 65, precision: 75 }, spell_text: '폭렬하라! 다크 플레임 마스터!' },
  { id: 'char_005', name: '고양이 집사 냥댕이', image: null, stats: { cringe_level: 85, volume_req: 55, precision: 85 }, spell_text: '냥냥펀치! 고양이의 힘을 빌려라!' },
  { id: 'char_006', name: '오타쿠 전사 오글이', image: null, stats: { cringe_level: 90, volume_req: 80, precision: 70 }, spell_text: '오타쿠의 자존심! 피규어 슬래시!' },
  { id: 'char_007', name: '히키코모리 네코', image: null, stats: { cringe_level: 88, volume_req: 50, precision: 92 }, spell_text: '햇빛 싫어... 어둠이여 나를 감싸라!' },
]

export default function MultiCharacterSelect() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { selectCharacter } = useGameStore()
  const { on, off, emit } = useSocket()
  
  // Player 1 (나) / Player 2 (상대)
  const [mySelected, setMySelected] = useState(null)
  const [opponentSelected, setOpponentSelected] = useState(null)
  const [myConfirmed, setMyConfirmed] = useState(false)
  const [opponentConfirmed, setOpponentConfirmed] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [isPlayer1, setIsPlayer1] = useState(true) // 나는 왼쪽(Player 1)인지 오른쪽인지

  // Socket events
  useEffect(() => {
    on('character:selected', (data) => {
      if (data.user_id !== user?.id) {
        setOpponentSelected(CHARACTERS.find(c => c.id === data.character_id))
      }
    })

    on('character:confirmed', (data) => {
      if (data.user_id !== user?.id) {
        setOpponentConfirmed(true)
      }
    })

    on('battle:countdown', (data) => {
      setCountdown(data.count)
    })

    on('battle:start', () => {
      navigate('/battle')
    })

    return () => {
      off('character:selected')
      off('character:confirmed')
      off('battle:countdown')
      off('battle:start')
    }
  }, [on, off, user?.id, navigate])

  // 둘 다 확정하면 카운트다운 시작 (데모)
  useEffect(() => {
    if (myConfirmed && opponentConfirmed) {
      let count = 3
      setCountdown(count)
      const interval = setInterval(() => {
        count--
        if (count >= 0) {
          setCountdown(count)
        } else {
          clearInterval(interval)
          selectCharacter(mySelected)
          navigate('/battle')
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [myConfirmed, opponentConfirmed, mySelected, navigate, selectCharacter])

  // 캐릭터 선택
  const handleSelect = (char) => {
    if (!myConfirmed) {
      setMySelected(char)
      emit('character:select', { character_id: char.id })
    }
  }

  // 선택 확정
  const handleConfirm = () => {
    if (mySelected && !myConfirmed) {
      setMyConfirmed(true)
      emit('character:confirm', { character_id: mySelected.id })
      
      // 데모: 상대도 자동 선택/확정
      if (!opponentSelected) {
        const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
        setOpponentSelected(randomChar)
      }
      setTimeout(() => {
        setOpponentConfirmed(true)
      }, 1500)
    }
  }

  const getStatColor = (value) => {
    if (value >= 90) return 'bg-red-500'
    if (value >= 70) return 'bg-pink-500'
    if (value >= 50) return 'bg-purple-500'
    return 'bg-blue-500'
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      {/* 카운트다운 오버레이 */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-9xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}
      {countdown === 0 && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-6xl font-bold text-yellow-400 animate-bounce">
            FIGHT!
          </div>
        </div>
      )}

      {/* 상단 */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="font-title text-2xl text-white">캐릭터 선택</h1>
        <div className="w-10" />
      </div>

      {/* 메인 - 양쪽 캐릭터 */}
      <div className="flex-1 relative z-10 flex">
        {/* 왼쪽 - Player 1 (나) */}
        <div className="w-1/2 flex flex-col items-center justify-center p-4">
          <div className="text-cyan-400 font-bold text-xl mb-2">{user?.nickname || 'Player 1'}</div>
          
          {/* 캐릭터 이미지 */}
          <div className="relative h-64 w-48 mb-4">
            {mySelected ? (
              mySelected.image ? (
                <img src={mySelected.image} alt={mySelected.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-t from-cyan-500/30 to-transparent rounded-lg flex items-end justify-center pb-4">
                  <span className="text-8xl">🌟</span>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                <span className="text-gray-500">캐릭터 선택</span>
              </div>
            )}
            {myConfirmed && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          {/* 이름 & 스탯 */}
          {mySelected && (
            <div className="text-center">
              <h2 className="text-white font-bold text-lg">{mySelected.name}</h2>
              <div className="mt-2 space-y-1 text-xs">
                <StatMini label="오글거림" value={mySelected.stats.cringe_level} color={getStatColor(mySelected.stats.cringe_level)} />
                <StatMini label="성량" value={mySelected.stats.volume_req} color={getStatColor(mySelected.stats.volume_req)} />
                <StatMini label="정확도" value={mySelected.stats.precision} color={getStatColor(mySelected.stats.precision)} />
              </div>
            </div>
          )}
        </div>

        {/* VS */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="text-4xl font-bold text-white/50">VS</div>
        </div>

        {/* 오른쪽 - Player 2 (상대) */}
        <div className="w-1/2 flex flex-col items-center justify-center p-4">
          <div className="text-red-400 font-bold text-xl mb-2">Opponent</div>
          
          {/* 캐릭터 이미지 */}
          <div className="relative h-64 w-48 mb-4">
            {opponentSelected ? (
              opponentSelected.image ? (
                <img src={opponentSelected.image} alt={opponentSelected.name} className="w-full h-full object-contain transform scale-x-[-1]" />
              ) : (
                <div className="w-full h-full bg-gradient-to-t from-red-500/30 to-transparent rounded-lg flex items-end justify-center pb-4">
                  <span className="text-8xl">👿</span>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 animate-pulse">
                <span className="text-gray-500">선택 중...</span>
              </div>
            )}
            {opponentConfirmed && (
              <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          {/* 이름 & 스탯 */}
          {opponentSelected && (
            <div className="text-center">
              <h2 className="text-white font-bold text-lg">{opponentSelected.name}</h2>
              <div className="mt-2 space-y-1 text-xs">
                <StatMini label="오글거림" value={opponentSelected.stats.cringe_level} color={getStatColor(opponentSelected.stats.cringe_level)} />
                <StatMini label="성량" value={opponentSelected.stats.volume_req} color={getStatColor(opponentSelected.stats.volume_req)} />
                <StatMini label="정확도" value={opponentSelected.stats.precision} color={getStatColor(opponentSelected.stats.precision)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 - 캐릭터 그리드 */}
      <div className="relative z-10 p-4 bg-black/50">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => handleSelect(char)}
              disabled={myConfirmed}
              className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                mySelected?.id === char.id 
                  ? 'border-cyan-400 ring-2 ring-cyan-400/50' 
                  : 'border-gray-600 hover:border-gray-400'
              } ${myConfirmed ? 'opacity-50' : ''}`}
            >
              {char.image ? (
                <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 확정 버튼 */}
        <button
          onClick={handleConfirm}
          disabled={!mySelected || myConfirmed}
          className={`w-full mt-4 py-4 rounded-xl font-bold text-xl transition-all ${
            myConfirmed 
              ? 'bg-green-600 text-white' 
              : mySelected 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105' 
                : 'bg-gray-700 text-gray-400'
          }`}
        >
          {myConfirmed ? '✓ 선택 완료!' : mySelected ? '선택 확정' : '캐릭터를 선택하세요'}
        </button>
      </div>
    </div>
  )
}

function StatMini({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 w-12">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-white w-6 text-right">{value}</span>
    </div>
  )
}
