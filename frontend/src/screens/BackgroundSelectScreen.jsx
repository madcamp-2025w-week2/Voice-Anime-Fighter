import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useSocket } from '../hooks/useSocket'
import { BATTLE_BACKGROUNDS, getRandomBackground } from '../data/battleBackgrounds'

// 선택 BGM 중지 함수 (전역 오디오 객체 참조)
const stopSelectBgm = () => {
  // MultiCharacterSelect에서 생성된 전역 오디오 객체 중지
  const audio = window.__selectBgmAudio;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};

export default function BackgroundSelectScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomId = location.state?.room_id

  const { setBackground, selectedCharacter, opponentNickname } = useGameStore()
  const { user } = useUserStore()
  const { on, off, emit, joinRoom } = useSocket()

  // 내 선택
  const [mySelection, setMySelection] = useState(null)
  const [myConfirmed, setMyConfirmed] = useState(false)

  // 상대방 선택
  const [opponentSelection, setOpponentSelection] = useState(null)
  const [opponentConfirmed, setOpponentConfirmed] = useState(false)

  // 최종 결정된 배경 & 카운트다운
  const [finalBackground, setFinalBackground] = useState(null)
  const [countdown, setCountdown] = useState(null) // 3, 2, 1, 'FIGHT'
  const [showResult, setShowResult] = useState(false)

  // 미리보기용 현재 선택 (호버 또는 내 선택)
  const [previewBg, setPreviewBg] = useState(BATTLE_BACKGROUNDS[0])

  // 플레이어 색상
  const myColor = '#00d4ff' // 시안
  const opponentColor = '#ff4d6d' // 핑크/레드

  // 캐릭터 없으면 로비로
  useEffect(() => {
    if (!selectedCharacter) {
      navigate('/lobby')
    }
  }, [selectedCharacter, navigate])

  // 소켓 방 참여
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId)
    }
  }, [roomId, joinRoom])

  // 소켓 이벤트 핸들링
  useEffect(() => {
    // 상대방 배경 선택 수신
    on('background:selected', (data) => {
      if (data.user_id !== user?.id) {
        const selectedBg = BATTLE_BACKGROUNDS.find(bg => bg.id === data.background_id)
        setOpponentSelection(selectedBg)
      }
    })

    // 상대방 확정 수신
    on('background:confirmed', (data) => {
      if (data.user_id !== user?.id) {
        setOpponentConfirmed(true)
      }
    })

    // 최종 결정 수신 (서버에서 결정)
    on('background:final', (data) => {
      const chosenBg = BATTLE_BACKGROUNDS.find(bg => bg.id === data.background_id)
      if (chosenBg) {
        setFinalBackground(chosenBg)
        setBackground(chosenBg)
        setShowResult(true)

        // 1.5초 후 카운트다운 시작
        setTimeout(() => {
          setCountdown(3)
        }, 1500)
      }
    })

    return () => {
      off('background:selected')
      off('background:confirmed')
      off('background:final')
    }
  }, [on, off, user?.id, setBackground])

  // (제거됨: 클라이언트 측 최종 결정 로직)

  // 카운트다운 처리
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 800)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      // 0이 되면 'FIGHT' 표시 후 배틀로 이동
      const timer = setTimeout(() => {
        stopSelectBgm() // BGM 중지
        navigate('/battle', { state: { room_id: roomId } })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, navigate, roomId])

  // 배경 선택 (소켓 전송)
  const handleSelect = (bg) => {
    if (myConfirmed) return
    setMySelection(bg)
    setPreviewBg(bg)
    emit('background:select', { background_id: bg.id, room_id: roomId })
  }

  // 선택 확정
  const handleConfirm = () => {
    if (!mySelection || myConfirmed) return
    setMyConfirmed(true)
    emit('background:confirm', { background_id: mySelection.id, room_id: roomId })
  }

  // 배경에 플레이어 표시 체크
  const getPlayerBadges = (bgId) => {
    const badges = []
    if (mySelection?.id === bgId) {
      badges.push({ color: myColor, name: user?.nickname || 'You' })
    }
    if (opponentSelection?.id === bgId) {
      badges.push({ color: opponentColor, name: opponentNickname || 'Opponent' })
    }
    return badges
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 배경 미리보기 (전체 화면) */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={previewBg?.style || { background: '#0a0a0a' }}
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* 날아다니는 파편 효과 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rotate-45"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* 최종 배경 결정 & 카운트다운 오버레이 */}
      {showResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          {countdown === null ? (
            // 배경 결정 로딩
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
              <p className="text-white text-2xl font-bold">배경 결정 중...</p>
              <div className="text-cyan-400 text-xl">"{finalBackground?.name}"</div>
            </div>
          ) : countdown > 0 ? (
            // 카운트다운 숫자
            <div
              className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500"
              style={{
                textShadow: '0 0 60px rgba(255,200,0,0.8)',
                animation: 'pulse 0.3s ease-in-out'
              }}
            >
              {countdown}
            </div>
          ) : (
            // FIGHT!
            <div
              className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 animate-pulse"
              style={{
                textShadow: '0 0 80px rgba(255,100,0,0.9), 0 0 120px rgba(255,0,0,0.6)',
              }}
            >
              ⚔️ FIGHT! ⚔️
            </div>
          )}
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="relative z-10 p-4 flex items-center justify-between border-b border-cyan-500/30 bg-black/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: myColor }} />
          <span className="text-white font-bold">{user?.nickname || 'You'}</span>
          {myConfirmed && <Check className="w-5 h-5 text-green-400" />}
        </div>

        <h1 className="font-black text-2xl text-white uppercase tracking-wider">
          🗳️ 배경 투표 🗳️
        </h1>

        <div className="flex items-center gap-3">
          {opponentConfirmed && <Check className="w-5 h-5 text-green-400" />}
          <span className="text-white font-bold">{opponentNickname || 'Opponent'}</span>
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: opponentColor }} />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 relative z-10 flex flex-col p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* 상단: 대형 미리보기 & 정보 */}
        <div className="flex-1 flex gap-8 min-h-0">
          {/* 대형 미리보기 */}
          <div
            className="flex-1 relative rounded-3xl overflow-hidden border-4 border-cyan-500/30 shadow-[0_0_50px_rgba(0,212,255,0.2)] group"
            style={previewBg?.style || { background: '#1a1a2e' }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Background Name */}
            <div className="absolute bottom-8 left-8">
              <h2 className="text-5xl font-black text-white italic tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] uppercase">
                {previewBg?.name || 'SELECT STAGE'}
              </h2>
            </div>

            {/* Player Badges on Preview */}
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              {getPlayerBadges(previewBg?.id).map((badge, idx) => (
                <div
                  key={idx}
                  className="px-6 py-2 rounded-xl backdrop-blur-md border border-white/20 text-white font-bold shadow-xl flex items-center gap-3"
                  style={{ background: `linear-gradient(90deg, ${badge.color}88, ${badge.color}44)` }}
                >
                  <div className="w-3 h-3 rounded-full animate-pulse bg-white" />
                  {badge.name}
                </div>
              ))}
            </div>
          </div>

          {/* 우측 정보 & 확정 패널 */}
          <div className="w-80 flex flex-col gap-4">
            {/* 현재 선택 상태 카드 */}
            <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex-col gap-4 flex shadow-2xl">
              <h3 className="text-zinc-400 font-bold uppercase text-sm tracking-widest border-b border-white/10 pb-2">Current Status</h3>

              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: myColor }} />
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 font-bold">YOU</span>
                    <span className="text-white font-bold">{user?.nickname}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs ${myConfirmed ? 'text-green-400 border-green-900/50' : 'text-zinc-500'}`}>
                  {myConfirmed ? 'READY' : 'SELECTING'}
                </div>
              </div>

              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: opponentColor }} />
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 font-bold">OPPONENT</span>
                    <span className="text-white font-bold">{opponentNickname || 'Waiting...'}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs ${opponentConfirmed ? 'text-green-400 border-green-900/50' : 'text-zinc-500'}`}>
                  {opponentConfirmed ? 'READY' : '...'}
                </div>
              </div>
            </div>

            {/* 확정 버튼 */}
            <button
              onClick={handleConfirm}
              disabled={!mySelection || myConfirmed}
              className={`flex-1 rounded-2xl font-black text-2xl italic uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${myConfirmed
                ? 'bg-zinc-800 text-green-500 border-2 border-green-500/50'
                : mySelection
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:scale-[1.02] border-2 border-orange-400/50 shadow-[0_0_30px_rgba(220,38,38,0.4)]'
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border-2 border-zinc-800'
                }`}
            >
              {myConfirmed ? (
                <>
                  <Check className="w-8 h-8" /> COMPLETE
                </>
              ) : (
                'CONFIRM'
              )}
            </button>
          </div>
        </div>

        {/* 하단: 배경 그리드 (전체 표시) */}
        <div className="h-64 shrink-0 bg-black/60 backdrop-blur-md rounded-2xl p-6 border-t border-white/10 overflow-y-auto custom-scrollbar">
          <div className="flex flex-wrap gap-4 justify-center">
            {BATTLE_BACKGROUNDS.map((bg) => {
              const isMySelected = mySelection?.id === bg.id
              const isOpponentSelected = opponentSelection?.id === bg.id

              return (
                <button
                  key={bg.id}
                  onClick={() => handleSelect(bg)}
                  onMouseEnter={() => !myConfirmed && setPreviewBg(bg)}
                  onMouseLeave={() => !myConfirmed && setPreviewBg(mySelection || BATTLE_BACKGROUNDS[0])}
                  disabled={myConfirmed}
                  className={`relative w-48 aspect-video rounded-lg overflow-hidden transition-all duration-200 group ${isMySelected
                    ? 'border-4 border-cyan-400 scale-110 z-20 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                    : isOpponentSelected
                      ? 'border-4 border-pink-500 scale-110 z-20 shadow-[0_0_20px_rgba(236,72,153,0.6)]'
                      : 'border-2 border-zinc-700 hover:border-white hover:scale-105 hover:z-10'
                    } ${myConfirmed ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* 배경 썸네일 */}
                  {bg.thumbnail ? (
                    <img
                      src={bg.thumbnail}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full" style={bg.style} />
                  )}

                  {/* 이름 오버레이 (작게) */}
                  <div className={`absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 to-transparent transition-all ${isMySelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider block truncate text-center">{bg.name}</span>
                  </div>

                  {/* 선택 표시 뱃지 */}
                  {isMySelected && (
                    <div className="absolute top-1 left-1 bg-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg">P1</div>
                  )}
                  {isOpponentSelected && (
                    <div className="absolute top-1 right-1 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg">P2</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="relative z-10 p-3 text-center border-t border-white/10 bg-black/70 backdrop-blur-sm">
        <p className="text-white/60 text-sm">
          {myConfirmed && opponentConfirmed
            ? '🎮 배경을 결정하고 있습니다...'
            : myConfirmed
              ? '⏳ 상대방을 기다리는 중...'
              : '🗳️ 같은 배경을 선택하면 해당 배경, 다르면 랜덤 선택!'}
        </p>
      </div>

      {/* 플로팅 애니메이션 CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(45deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(90deg); opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
