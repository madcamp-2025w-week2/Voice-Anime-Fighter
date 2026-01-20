import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useSocket } from '../hooks/useSocket'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// 전역 오디오 객체 (화면 전환 시에도 유지)
let selectBgmAudio = null;

// 선택 BGM 중지 함수 (외부에서 호출 가능)
export const stopSelectBgm = () => {
  if (selectBgmAudio) {
    selectBgmAudio.pause();
    selectBgmAudio.currentTime = 0;
    selectBgmAudio = null;
  }
};

export default function MultiCharacterSelect() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomId = location.state?.room_id
  const isHostFromState = location.state?.is_host ?? false
  const playersFromState = location.state?.players || []
  const isRanking = location.state?.is_ranking ?? false
  const { user } = useUserStore()
  const { selectCharacter, setOpponentCharacter, setIsHost, opponentNickname, opponentElo, opponentAvatarUrl } = useGameStore()
  const { on, off, emit, joinRoom } = useSocket()

  // 캐릭터 데이터 (API에서 로드)
  const [characters, setCharacters] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // 캐릭터 목록 API 호출
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${API_URL}/characters`)
        if (res.ok) {
          const data = await res.json()
          // 백엔드에서 받은 데이터에 image 필드 추가 (sprite_url 사용)
          const charsWithImages = data.characters.map(c => ({
            ...c,
            image: c.sprite_url || c.thumbnail_url
          }))
          setCharacters(charsWithImages)
        }
      } catch (err) {
        console.error('Failed to fetch characters:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCharacters()
  }, [])

  // 방 ID가 없으면 로비로 리다이렉트
  useEffect(() => {
    if (!roomId) {
      navigate('/lobby')
    }
  }, [roomId, navigate])

  // 선택 BGM 재생 (캐릭터/배경 선택 공유)
  useEffect(() => {
    // 이미 재생 중이면 스킵
    if (!selectBgmAudio) {
      selectBgmAudio = new Audio('/audio/select_bgm.mp3');
      selectBgmAudio.loop = true;
      selectBgmAudio.volume = 0.4;
    }

    const playBgm = () => {
      if (selectBgmAudio.paused) {
        selectBgmAudio.play().catch(err => console.log('Select BGM autoplay blocked:', err));
      }
    };

    document.addEventListener('click', playBgm, { once: true });
    playBgm();

    // Cleanup은 하지 않음 - 배경 선택 화면에서도 계속 재생
    return () => {
      document.removeEventListener('click', playBgm);
    };
  }, []);

  // 소켓 방 참여 (진입 시)
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId)
    }
  }, [roomId, joinRoom])

  // Player 1 (나) / Player 2 (상대)
  const [mySelected, setMySelected] = useState(null)
  const [opponentSelected, setOpponentSelected] = useState(null)
  const [myConfirmed, setMyConfirmed] = useState(false)
  const [opponentConfirmed, setOpponentConfirmed] = useState(false)

  // Socket events
  useEffect(() => {
    on('character:selected', (data) => {
      if (data.user_id !== user?.id) {
        // characters 배열에서 상대방이 선택한 캐릭터 찾기
        const selectedChar = characters.find(c => c.id === data.character_id)
        if (selectedChar) {
          setOpponentSelected(selectedChar)
        }
      }
    })

    on('character:confirmed', (data) => {
      if (data.user_id !== user?.id) {
        setOpponentConfirmed(true)
      }
    })


    on('battle:start', () => {
      navigate('/battle', { state: { room_id: roomId } })
    })

    return () => {
      off('character:selected')
      off('character:confirmed')
      off('battle:start')
    }
  }, [on, off, user?.id, navigate, roomId, characters])

  // 둘 다 확정하면 배경 선택 화면으로 이동
  useEffect(() => {
    if (myConfirmed && opponentConfirmed) {
      // Save selections to global store before navigating
      selectCharacter(mySelected)
      setOpponentCharacter(opponentSelected)
      setIsHost(isHostFromState)
      // 배경 선택 화면으로 이동
      navigate('/background-select', { state: { room_id: roomId } })
    }
  }, [myConfirmed, opponentConfirmed, mySelected, opponentSelected, isHostFromState, navigate, selectCharacter, setOpponentCharacter, setIsHost, roomId])

  // 캐릭터 선택
  const handleSelect = (char) => {
    if (!myConfirmed) {
      setMySelected(char)
      emit('character:select', { character_id: char.id, room_id: roomId })
    }
  }

  // 선택 확정
  const handleConfirm = () => {
    if (mySelected && !myConfirmed) {
      setMyConfirmed(true)
      emit('character:confirm', { character_id: mySelected.id, room_id: roomId })
    }
  }

  const getStatColor = (value) => {
    if (value >= 90) return 'bg-red-500'
    if (value >= 70) return 'bg-pink-500'
    if (value >= 50) return 'bg-purple-500'
    return 'bg-blue-500'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-red-900/20" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(88,28,135,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(88,28,135,0.2)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />


      {/* 상단 */}
      <div className="relative z-10 p-4 flex items-center justify-between border-b border-purple-500/30 bg-black/60 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="p-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/40 border border-purple-500/30 transition">
          <ArrowLeft className="w-6 h-6 text-purple-300" />
        </button>
        <h1 className="font-black text-2xl text-white uppercase tracking-wider drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
          캐릭터 선택
        </h1>
        <div className="w-10" />
      </div>

      {/* 메인 컨텐츠: 좌 P1 | 중앙 그리드 | 우 P2 */}
      <div className="flex-1 relative z-10 flex items-stretch p-4 gap-4">

        {/* 좌측 - Player 1 (나의 선택) */}
        <div className="w-1/4 min-w-[200px] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <div className="text-cyan-400 font-black text-lg mb-3 uppercase tracking-wider">{user?.nickname || 'Player 1'}</div>

          <div className="relative w-full max-w-[240px] aspect-[3/4] mb-3">
            {mySelected ? (
              mySelected.image ? (
                <img src={mySelected.image} alt={mySelected.name} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              ) : (
                <div className="w-full h-full bg-gradient-to-t from-cyan-500/30 to-transparent rounded-lg flex items-end justify-center pb-4 border border-cyan-500/30">
                  <span className="text-6xl">🌟</span>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-gray-800/50 rounded-lg flex items-center justify-center border-2 border-dashed border-cyan-500/30">
                <span className="text-gray-500 text-sm">선택 대기</span>
              </div>
            )}
            {myConfirmed && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-[0_0_10px_rgba(34,197,94,0.8)]">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {mySelected && (
            <div className="text-center w-full">
              <h2 className="text-white font-bold text-sm truncate">{mySelected.name}</h2>
              <div className="mt-2 space-y-1">
                <StatMini label="오글" value={mySelected.stats.cringe_level} color={getStatColor(mySelected.stats.cringe_level)} />
                <StatMini label="성량" value={mySelected.stats.volume_req} color={getStatColor(mySelected.stats.volume_req)} />
                <StatMini label="정밀" value={mySelected.stats.precision} color={getStatColor(mySelected.stats.precision)} />
              </div>
            </div>
          )}
        </div>

        {/* 중앙 - 캐릭터 그리드 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <span className="text-gray-400">캐릭터 로딩 중...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 max-w-4xl">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleSelect(char)}
                  disabled={myConfirmed}
                  className={`relative w-24 h-28 rounded-xl overflow-hidden border-2 transition-all duration-200 group ${mySelected?.id === char.id
                    ? 'border-purple-400 ring-2 ring-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-105'
                    : 'border-gray-700 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    } ${myConfirmed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {char.image ? (
                    <img src={char.image} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-red-900/50 flex items-center justify-center">
                      <span className="text-3xl">✨</span>
                    </div>
                  )}
                  {/* 캐릭터 이름 오버레이 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                    <span className="text-white text-[10px] font-bold truncate block text-center">{char.name}</span>
                  </div>
                  {/* 선택됨 표시 */}
                  {mySelected?.id === char.id && (
                    <div className="absolute inset-0 border-4 border-purple-400 rounded-xl pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 확정 버튼 */}
          <button
            onClick={handleConfirm}
            disabled={!mySelected || myConfirmed}
            className={`mt-6 px-12 py-4 rounded-xl font-black text-xl uppercase tracking-wider transition-all ${myConfirmed
              ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
              : mySelected
                ? 'bg-gradient-to-r from-purple-600 to-red-600 text-white hover:scale-105 shadow-[0_4px_0_rgba(88,28,135,1)] active:translate-y-[4px] active:shadow-none'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
          >
            {myConfirmed ? '✓ 선택 완료!' : mySelected ? '선택 확정' : '캐릭터를 선택하세요'}
          </button>
        </div>

        {/* 우측 - Player 2 (상대의 선택) */}
        <div className="w-1/4 min-w-[200px] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <div className="text-red-400 font-black text-lg mb-3 uppercase tracking-wider">{opponentNickname || 'Opponent'}</div>

          <div className="relative w-full max-w-[240px] aspect-[3/4] mb-3">
            {opponentSelected ? (
              opponentSelected.image ? (
                <img src={opponentSelected.image} alt={opponentSelected.name} className="w-full h-full object-contain transform scale-x-[-1] drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              ) : (
                <div className="w-full h-full bg-gradient-to-t from-red-500/30 to-transparent rounded-lg flex items-end justify-center pb-4 border border-red-500/30">
                  <span className="text-6xl">👿</span>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-gray-800/50 rounded-lg flex items-center justify-center border-2 border-dashed border-red-500/30 animate-pulse">
                <span className="text-gray-500 text-sm">선택 중...</span>
              </div>
            )}
            {opponentConfirmed && (
              <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1 shadow-[0_0_10px_rgba(34,197,94,0.8)]">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {opponentSelected && (
            <div className="text-center w-full">
              <h2 className="text-white font-bold text-sm truncate">{opponentSelected.name}</h2>
              <div className="mt-2 space-y-1">
                <StatMini label="오글" value={opponentSelected.stats.cringe_level} color={getStatColor(opponentSelected.stats.cringe_level)} />
                <StatMini label="성량" value={opponentSelected.stats.volume_req} color={getStatColor(opponentSelected.stats.volume_req)} />
                <StatMini label="정밀" value={opponentSelected.stats.precision} color={getStatColor(opponentSelected.stats.precision)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatMini({ label, value, color }) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="text-gray-400 w-8">{label}</span>
      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-white w-5 text-right">{value}</span>
    </div>
  )
}
