import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useSocket } from '../hooks/useSocket'
import { BATTLE_BACKGROUNDS, getRandomBackground } from '../data/battleBackgrounds'

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
    
    return () => {
      off('background:selected')
      off('background:confirmed')
    }
  }, [on, off, user?.id])
  
  // 둘 다 확정하면 최종 배경 결정
  useEffect(() => {
    if (myConfirmed && opponentConfirmed && !finalBackground) {
      // 같은 배경 선택했으면 그걸로, 아니면 랜덤
      let chosen
      if (mySelection?.id === opponentSelection?.id) {
        chosen = mySelection
      } else {
        // 둘 중 하나 랜덤
        const options = [mySelection, opponentSelection].filter(Boolean)
        if (options.length === 2) {
          chosen = options[Math.floor(Math.random() * 2)]
        } else {
          chosen = options[0] || getRandomBackground()
        }
      }
      
      setFinalBackground(chosen)
      setBackground(chosen)
      setShowResult(true)
      
      // 1.5초 후 카운트다운 시작
      setTimeout(() => {
        setCountdown(3)
      }, 1500)
    }
  }, [myConfirmed, opponentConfirmed, mySelection, opponentSelection, finalBackground, setBackground])
  
  // 카운트다운 처리
  useEffect(() => {
    if (countdown === null) return
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 800)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      // 0이 되면 'FIGHT' 표시 후 배틀로 이동
      const timer = setTimeout(() => {
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
      <div className="flex-1 relative z-10 flex">
        {/* 왼쪽: 미리보기 & 선택 정보 */}
        <div className="w-1/3 p-6 flex flex-col items-center justify-center">
          {/* 큰 미리보기 */}
          <div 
            className="w-full aspect-video rounded-2xl overflow-hidden border-4 border-cyan-500/50 shadow-[0_0_40px_rgba(0,212,255,0.3)] mb-6"
            style={previewBg?.style || { background: '#1a1a2e' }}
          >
            <div className="w-full h-full flex items-end justify-center pb-4 bg-gradient-to-t from-black/70 to-transparent">
              <span className="text-white text-3xl font-black drop-shadow-lg tracking-wider">
                {previewBg?.name || '선택 없음'}
              </span>
            </div>
          </div>
          
          {/* 현재 선택 상태 */}
          <div className="w-full bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: myColor }} />
                <span className="text-white text-sm font-bold">{user?.nickname}</span>
              </div>
              <span className="text-cyan-400 text-sm">{mySelection?.name || '선택 대기'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opponentColor }} />
                <span className="text-white text-sm font-bold">{opponentNickname || 'Opponent'}</span>
              </div>
              <span className="text-pink-400 text-sm">{opponentSelection?.name || '선택 대기'}</span>
            </div>
          </div>
          
          {/* 확정 버튼 */}
          <button
            onClick={handleConfirm}
            disabled={!mySelection || myConfirmed}
            className={`mt-6 w-full py-4 rounded-xl font-black text-xl uppercase tracking-wider transition-all ${
              myConfirmed
                ? 'bg-green-600 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                : mySelection
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-105 shadow-[0_6px_0_rgba(6,95,139,1)] active:translate-y-[3px] active:shadow-[0_3px_0_rgba(6,95,139,1)]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {myConfirmed ? '✓ 투표 완료!' : mySelection ? '투표 확정' : '배경을 선택하세요'}
          </button>
        </div>
        
        {/* 오른쪽: 배경 그리드 */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {BATTLE_BACKGROUNDS.map((bg) => {
              const badges = getPlayerBadges(bg.id)
              const isMySelected = mySelection?.id === bg.id
              
              return (
                <button
                  key={bg.id}
                  onClick={() => handleSelect(bg)}
                  onMouseEnter={() => !myConfirmed && setPreviewBg(bg)}
                  onMouseLeave={() => !myConfirmed && setPreviewBg(mySelection || BATTLE_BACKGROUNDS[0])}
                  disabled={myConfirmed}
                  className={`relative aspect-video rounded-xl overflow-hidden border-3 transition-all duration-200 group ${
                    isMySelected
                      ? 'border-cyan-400 ring-4 ring-cyan-400/50 scale-105 shadow-[0_0_30px_rgba(0,212,255,0.5)]'
                      : 'border-white/20 hover:border-white/50 hover:scale-102'
                  } ${myConfirmed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* 배경 썸네일 */}
                  {bg.thumbnail ? (
                    <img 
                      src={bg.thumbnail} 
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full" style={bg.style} />
                  )}
                  
                  {/* 이름 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-2">
                    <span className="text-white text-xs font-bold drop-shadow-lg">{bg.name}</span>
                  </div>
                  
                  {/* 플레이어 뱃지 (네온 그라데이션 + 닉네임) */}
                  {badges.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 flex gap-1 p-1">
                      {badges.map((badge, idx) => (
                        <div
                          key={idx}
                          className="flex-1 px-2 py-1 rounded-b-lg text-center text-[10px] font-bold text-white truncate"
                          style={{
                            background: `linear-gradient(135deg, ${badge.color}aa, ${badge.color}55)`,
                            boxShadow: `0 0 10px ${badge.color}66`,
                          }}
                        >
                          {badge.name}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 체크 마크 */}
                  {isMySelected && (
                    <div className="absolute top-2 right-2 bg-cyan-500 rounded-full p-1 shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
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
