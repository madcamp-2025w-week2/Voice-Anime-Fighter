import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, Sparkles, Zap, Star } from 'lucide-react'
import { useBattleStore } from '../stores/battleStore'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAudioVisualizer } from '../hooks/useAudioVisualizer'
import { useSocket } from '../hooks/useSocket'
import { useOtakuAudio } from '../hooks/useOtakuAudio'
import { useBattleCharacter } from '../hooks/useBattleCharacter'
import { getOrCreateCharacterSkills } from '../data/characterSkills'
import { checkSkillMatch, checkUltimateMatch } from '../utils/stringSimilarity'
import EnergyChargeEffect from '../components/EnergyChargeEffect'
import KeyMashGame from '../components/KeyMashGame'
import { stopSelectBgm } from './MultiCharacterSelect'

// 캐릭터별 궁극기 테마 색상 (ultimate 이미지 기반)
const ULTIMATE_THEME_COLORS = {
  gojo: { primary: '#9333ea', secondary: '#c084fc', glow: 'rgba(147, 51, 234, 0.8)', name: '무량공처' },
  tanjiro: { primary: '#ea580c', secondary: '#fb923c', glow: 'rgba(234, 88, 12, 0.8)', name: '히노카미 카구라' },
  goku: { primary: '#ec4899', secondary: '#f9a8d4', glow: 'rgba(236, 72, 153, 0.8)', name: '겐키다마' },
  luffy: { primary: '#f8fafc', secondary: '#e2e8f0', glow: 'rgba(248, 250, 252, 0.9)', name: '기어5' },
  darksword: { primary: '#1e293b', secondary: '#475569', glow: 'rgba(30, 41, 59, 0.8)', name: '다크슬래시' },
  light: { primary: '#facc15', secondary: '#fef08a', glow: 'rgba(250, 204, 21, 0.8)', name: '라이트닝' },
  levi: { primary: '#14b8a6', secondary: '#5eead4', glow: 'rgba(20, 184, 166, 0.8)', name: '치유의 빛' },
  moon: { primary: '#6366f1', secondary: '#a5b4fc', glow: 'rgba(99, 102, 241, 0.8)', name: '문라이트' },
  nyang: { primary: '#f472b6', secondary: '#fbcfe8', glow: 'rgba(244, 114, 182, 0.8)', name: '냥냥펀치' },
  otaku: { primary: '#06b6d4', secondary: '#67e8f9', glow: 'rgba(6, 182, 212, 0.8)', name: '오타쿠빔' },
}

// 캐릭터 ID -> 내부 이름 매핑 (파일/테마 키)
const CHARACTER_ID_TO_NAME = {
  'char_000': 'otaku',
  'char_001': 'gojo',
  'char_002': 'luffy',
  'char_003': 'tanjiro',
  'char_004': 'light',
  'char_005': 'nyang',
  'char_006': 'naruto', // 돌려막기 나루토
  'char_007': 'levi',
  'char_008': 'darksword',
  'char_009': 'moon',
  'char_010': 'goku',
}

// 궁극기 띠배너 컴포넌트
const UltimateBanner = ({ isVisible, characterId, ultimateImage, characterName }) => {
  const theme = ULTIMATE_THEME_COLORS[characterId] || ULTIMATE_THEME_COLORS.otaku

  if (!isVisible) return null

  return (
    <div
      className="absolute left-0 right-0 z-50 overflow-hidden"
      style={{ top: '25%', height: '50vh' }}
    >
      {/* 배경 띠배너 - 그라데이션 + 깜빡임 */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.primary}dd 20%, ${theme.secondary}ff 50%, ${theme.primary}dd 80%, transparent)`,
          boxShadow: `0 0 60px ${theme.glow}, 0 0 100px ${theme.glow}`,
        }}
      />

      {/* 전기 효과 - 상단 */}
      <div className="absolute top-0 left-0 right-0 h-2">
        <div
          className="h-full animate-electric-top"
          style={{
            background: `repeating-linear-gradient(90deg, transparent, ${theme.secondary} 2px, transparent 4px)`,
            filter: 'blur(1px)',
          }}
        />
      </div>

      {/* 전기 효과 - 하단 */}
      <div className="absolute bottom-0 left-0 right-0 h-2">
        <div
          className="h-full animate-electric-bottom"
          style={{
            background: `repeating-linear-gradient(90deg, transparent, ${theme.secondary} 2px, transparent 4px)`,
            filter: 'blur(1px)',
          }}
        />
      </div>

      {/* 번개 스파크 효과 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-spark"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              width: '4px',
              height: '30px',
              background: theme.secondary,
              borderRadius: '2px',
              filter: `blur(2px) drop-shadow(0 0 10px ${theme.glow})`,
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${-20 + i * 8}deg)`,
            }}
          />
        ))}
      </div>

      {/* 중앙 이미지 + 글로우 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative animate-ultimate-image"
          style={{
            filter: `drop-shadow(0 0 30px ${theme.glow}) drop-shadow(0 0 60px ${theme.glow})`,
          }}
        >
          <img
            src={ultimateImage}
            alt="Ultimate Attack"
            className="h-[50vh] object-contain animate-pulse"
            style={{
              filter: 'brightness(1.2) contrast(1.1)',
            }}
          />
          {/* 이미지 오버레이 글로우 */}
          <div
            className="absolute inset-0 animate-glow-pulse"
            style={{
              background: `radial-gradient(ellipse at center, ${theme.glow} 0%, transparent 70%)`,
              mixBlendMode: 'overlay',
            }}
          />
        </div>
      </div>

      {/* 캐릭터 이름 + 스킬명 */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div
          className="text-2xl md:text-3xl font-black text-white animate-bounce"
          style={{
            textShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}, 2px 2px 4px rgba(0,0,0,0.5)`,
          }}
        >
          {characterName} - {theme.name}
        </div>
      </div>

      {/* 사이드 글로우 라인 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 animate-glow-line"
        style={{ background: `linear-gradient(to bottom, transparent, ${theme.secondary}, transparent)` }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1 animate-glow-line"
        style={{ background: `linear-gradient(to bottom, transparent, ${theme.secondary}, transparent)`, animationDelay: '0.5s' }}
      />
    </div>
  )
}

// 🌟 화려한 공격 이펙트 오버레이 (녹음 중 화면 50% 이상 덮음)
const AttackOverlay = ({ isVisible }) => {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      {/* 화면 50% 이상 덮는 그라데이션 오버레이 */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, rgba(147,51,234,0.2) 30%, rgba(236,72,153,0.15) 50%, transparent 70%)',
        }}
      />

      {/* 별빛 버스트 - 20개 */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute animate-star-burst text-4xl"
          style={{
            left: `${10 + (i * 4.5)}%`,
            top: `${10 + (i * 4)}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.8 + (i % 5) * 0.1}s`,
            opacity: 0.8,
            filter: 'drop-shadow(0 0 10px rgba(255,255,0,0.8))',
          }}
        >
          {['✨', '⭐', '🌟', '💫', '✧', '★'][i % 6]}
        </div>
      ))}

      {/* 번쩍이는 광선 효과 */}
      <div
        className="absolute inset-0 animate-flash-burst"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 50%)',
        }}
      />

      {/* 마법진 효과 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] animate-magic-circle"
        style={{
          border: '3px solid rgba(255,200,100,0.5)',
          borderRadius: '50%',
          boxShadow: '0 0 30px rgba(255,200,100,0.4), inset 0 0 30px rgba(255,200,100,0.2)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[45vw] h-[45vw] max-w-[380px] max-h-[380px] animate-magic-circle-reverse"
        style={{
          border: '2px solid rgba(236,72,153,0.5)',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(236,72,153,0.4)',
        }}
      />

      {/* 양쪽 코너 스파크 */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="animate-corner-spark w-full h-full bg-gradient-to-br from-yellow-300/50 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="animate-corner-spark w-full h-full bg-gradient-to-bl from-pink-300/50 to-transparent" style={{ animationDelay: '0.2s' }} />
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32">
        <div className="animate-corner-spark w-full h-full bg-gradient-to-tr from-cyan-300/50 to-transparent" style={{ animationDelay: '0.4s' }} />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32">
        <div className="animate-corner-spark w-full h-full bg-gradient-to-tl from-purple-300/50 to-transparent" style={{ animationDelay: '0.6s' }} />
      </div>
    </div>
  )
}

// 배틀 BGM 전역 관리
let battleBgmAudio = null;

// 배틀 BGM 중지 함수 (외부에서 호출 가능)
export const stopBattleBgm = () => {
  if (battleBgmAudio) {
    battleBgmAudio.pause();
    battleBgmAudio.currentTime = 0;
    battleBgmAudio = null;
  }
};

export default function BattleScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomId = location.state?.room_id

  const battle = useBattleStore()
  const { selectedCharacter, opponentCharacter, opponentNickname, isHost, selectedBackground } = useGameStore()
  const { sendAttack, on, off, joinRoom, emit } = useSocket()
  const {
    isRecording,
    isAnalyzing,
    startRecording,
    stopRecording,
    analyzeVoice,
    result,
    reset,
    liveTranscript
  } = useSpeechRecognition()
  const { analyzerData, start: startVisualizer, stop: stopVisualizer } = useAudioVisualizer()
  const { playOtakuSound, playCriticalHitSound, cleanup: cleanupAudio } = useOtakuAudio()

  const matchedBattleId = location.state?.battle_id
  const [showDamage, setShowDamage] = useState(null)
  const [isAttacking, setIsAttacking] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showMiniGame, setShowMiniGame] = useState(true) // 미니게임 표시 여부
  const [miniGameGoesFirst, setMiniGameGoesFirst] = useState(null) // 미니게임 승자 선공
  const [showGameStart, setShowGameStart] = useState(false) // 게임 시작 애니메이션 (미니게임 후 시작)
  const [turnCountdown, setTurnCountdown] = useState(-1) // 턴 시작 시 카운트다운 (-1: 비활성)
  const [showCritical, setShowCritical] = useState(false)
  const [activeSkillImage, setActiveSkillImage] = useState(null) // 내 스킬 발동 시 이미지
  const [opponentSkillImage, setOpponentSkillImage] = useState(null) // 상대 스킬 발동 시 이미지
  const [showUltimateBanner, setShowUltimateBanner] = useState(null) // 궁극기 띠배너 표시 상태 { characterId, image, name, isOpponent }
  const [isOpponentRecording, setIsOpponentRecording] = useState(false) // 상대방 녹음 중 여부

  // 피격 이미지 상태
  const [myHitImage, setMyHitImage] = useState(null) // 내가 피격당할 때 이미지
  const [opponentHitImage, setOpponentHitImage] = useState(null) // 상대가 피격당할 때 이미지
  const [isBlinking, setIsBlinking] = useState(false) // 피격 깜빡임 상태

  // 공격자 대시 애니메이션 상태
  const [dashPhase, setDashPhase] = useState(null) // 'dashing' | 'returning' | null
  const [attackerSide, setAttackerSide] = useState(null) // 공격자 위치 ('left' | 'right' | null)

  // 음성 입력 관련 상태
  const [isVoiceInputPhase, setIsVoiceInputPhase] = useState(false)
  const [voiceInputProgress, setVoiceInputProgress] = useState(5) // 5초에서 시작
  const voiceInputIntervalRef = useRef(null)
  const previousIsMyTurn = useRef(null)
  const lastTriggeredSkillRef = useRef(null) // 마지막 발동한 스킬 저장

  // 궁극기 게이지 상태 (로컬 - 소켓 핸들러에서 접근 필요)
  const [gauge, setGauge] = useState(0)
  const [isUltimateReady, setIsUltimateReady] = useState(false)
  const gaugeReachedFullRef = useRef(false)

  // 스킬 시스템 - 캐릭터별 스킬 데이터 가져오기
  const myCharacterSkills = getOrCreateCharacterSkills(selectedCharacter)
  const opponentCharacterSkills = getOrCreateCharacterSkills(opponentCharacter)

  // useBattleCharacter 훅으로 스킬 선택 관리 (게이지는 로컬 상태 사용)
  const {
    currentImage: myCurrentImage,
    effectClass: myEffectClass,
    currentSkills,
    isActivating,
    startNewTurn,
    activateSkill,
    activateUltimate
  } = useBattleCharacter(myCharacterSkills)

  // 게이지 세그먼트 계산 (0, 1, 2, 3)
  const gaugeSegments = Math.floor(gauge / (100 / 3))

  const user = useUserStore((s) => s.user)
  const myNickname = user?.nickname || 'Me'
  const opponentDisplayName = opponentNickname || 'Opponent'

  // 현재 표시할 캐릭터 이미지 (피격 > 스킬 > 기본)
  const myCharImage = myHitImage || activeSkillImage || myCurrentImage || selectedCharacter?.image || selectedCharacter?.sprite_url || '/images/error_placeholder.webp'
  const opponentCharImage = opponentHitImage || opponentSkillImage || opponentCharacterSkills?.defaultImg || opponentCharacter?.image || opponentCharacter?.sprite_url || '/images/error_placeholder.webp'

  const leftCharImage = isHost ? myCharImage : opponentCharImage
  const rightCharImage = isHost ? opponentCharImage : myCharImage
  const leftLabel = isHost ? myNickname : opponentDisplayName
  const rightLabel = isHost ? opponentDisplayName : myNickname
  const leftHP = isHost ? battle.player : battle.opponent
  const rightHP = isHost ? battle.opponent : battle.player
  const leftEffectClass = isHost ? myEffectClass : ''
  const rightEffectClass = isHost ? '' : myEffectClass

  // 현재 턴에서 사용할 스킬/궁극기 대사
  const currentSkill = currentSkills[0] // 첫 번째 스킬 사용
  const currentSpell = isUltimateReady
    ? myCharacterSkills?.ultimate?.trigger
    : currentSkill?.trigger || selectedCharacter?.spell_text || '마법의 주문!'

  useEffect(() => {
    return () => cleanupAudio()
  }, [cleanupAudio])

  // 배틀 BGM 재생 (화면 진입 시)
  useEffect(() => {
    // 선택 화면 BGM 중지
    stopSelectBgm();

    // 이전 배틀 BGM 정리 후 새로 생성
    if (battleBgmAudio) {
      battleBgmAudio.pause();
    }

    battleBgmAudio = new Audio('/audio/battle_bgm.mp3');
    battleBgmAudio.loop = true;
    battleBgmAudio.volume = 0.06; // 더 작은 볼륨

    const playBgm = () => {
      if (battleBgmAudio && battleBgmAudio.paused) {
        battleBgmAudio.play().catch(err => console.log('Battle BGM autoplay blocked:', err));
      }
    };

    document.addEventListener('click', playBgm, { once: true });
    playBgm();

    return () => {
      document.removeEventListener('click', playBgm);
      // 컴포넌트 언마운트 시 BGM 중지
      stopBattleBgm();
    };
  }, []);

  // 미니게임 완료 핸들러
  const handleMiniGameComplete = useCallback((iWon) => {
    console.log('🎮 Mini-game complete! I won:', iWon)
    setMiniGameGoesFirst(iWon)
    setShowMiniGame(false)
    setShowGameStart(true) // 미니게임 후 게임 시작 애니메이션
  }, [])

  // 게임 시작 애니메이션 (미니게임 완료 후)
  useEffect(() => {
    if (showGameStart && !showMiniGame) {
      const timer = setTimeout(() => {
        setShowGameStart(false)
        setGameStarted(true)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [showGameStart, showMiniGame])

  // 턴 시작 카운트다운 처리
  useEffect(() => {
    if (turnCountdown > 0) {
      const timer = setTimeout(() => setTurnCountdown(turnCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (turnCountdown === 0) {
      // 카운트다운 완료 후 음성 입력 시작
      // 카운트다운 완료 후 음성 입력 시작 (즉시)
      setTurnCountdown(-1)
      setIsVoiceInputPhase(true)
      setVoiceInputProgress(5)

      // 자동으로 녹음 시작
      const startRecordingAsync = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          startVisualizer(stream)
          startRecording()

          // 상대방에게 녹음 시작 알림
          if (roomId) {
            emit('battle:voice_start', { room_id: roomId })
          }
        } catch (err) {
          console.error('Failed to start recording:', err)
          setIsVoiceInputPhase(false)
        }
      }
      startRecordingAsync()
    }
  }, [turnCountdown, startRecording, startVisualizer, startNewTurn])

  // 음성 입력 5초 타이머 처리
  useEffect(() => {
    if (isVoiceInputPhase && isRecording) {
      voiceInputIntervalRef.current = setInterval(() => {
        setVoiceInputProgress((prev) => {
          const newValue = prev - 0.1
          if (newValue <= 0) {
            // 5초 끝남 - 녹음 종료 및 공격 처리
            clearInterval(voiceInputIntervalRef.current)
            return 0
          }
          return newValue
        })
      }, 100)

      return () => {
        if (voiceInputIntervalRef.current) {
          clearInterval(voiceInputIntervalRef.current)
        }
      }
    }
  }, [isVoiceInputPhase, isRecording])

  // 음성 입력 시간이 0이 되면 자동으로 녹음 종료
  useEffect(() => {
    if (voiceInputProgress <= 0 && isRecording && isVoiceInputPhase) {
      handleAutoRecordEnd()
    }
  }, [voiceInputProgress, isRecording, isVoiceInputPhase])

  // 자동 녹음 종료 및 공격 처리
  const handleAutoRecordEnd = useCallback(async () => {
    if (!isRecording) return

    // 🔥 stopRecording이 완료되기를 기다리고 blob을 받음
    const recordedBlob = await stopRecording()
    console.log('🎤 Got recorded blob:', recordedBlob?.size)

    stopVisualizer()
    setIsVoiceInputPhase(false)
    setIsAttacking(true)

    // 상대방에게 녹음 종료 알림
    if (roomId) {
      emit('battle:voice_end', { room_id: roomId })
    }

    // 현재 표시 중인 스킬/궁극기 이미지 저장 (데미지 수신 시 사용)
    const currentSkillForImage = isUltimateReady
      ? myCharacterSkills?.ultimate
      : currentSkills[0]
    lastTriggeredSkillRef.current = currentSkillForImage
    console.log('📸 Current skill for image:', currentSkillForImage?.name, currentSkillForImage?.image)

    // 🔥 바로 분석 요청 (setTimeout 제거, blob 직접 전달)
    const battleId = roomId || battle.battleId || 'demo'
    const analysisResult = await analyzeVoice(battleId, currentSpell, selectedCharacter?.id, recordedBlob, isUltimateReady)

    if (analysisResult && analysisResult.success) {
      // 백엔드에서 받은 grade를 포함하여 전송 (스킬 이미지 포함)
      sendAttack(battleId, {
        ...analysisResult.damage,
        grade: analysisResult.grade, // 🔥 Grade를 명시적으로 추가해야 함 (damage 객체 안에 없음)
        audio_url: analysisResult.audio_url,
        is_ultimate: isUltimateReady,
        skill_image: currentSkillForImage?.image || null // 스킬 이미지 URL 전송
      })
      battle.setTurn(false)
    } else {
      setShowDamage({ value: 0, isPlayer: false, grade: 'F', isCritical: false })
      battle.setTurn(false)
    }
    setIsAttacking(false)
  }, [isRecording, stopRecording, stopVisualizer, analyzeVoice, battle, selectedCharacter, currentSpell, sendAttack, roomId, isUltimateReady, myCharacterSkills, currentSkills, emit])

  // 턴 변경 감지 - 내 턴이 되면 카운트다운 시작
  useEffect(() => {
    if (gameStarted && battle.isActive && !isAnalyzing && !isAttacking) {
      // 이전에 내 턴이 아니었다가 내 턴이 되었을 때만 카운트다운 시작
      if (previousIsMyTurn.current === false && battle.isMyTurn === true) {
        // 새 턴 시작 - 게이지가 100%면 궁극기 활성화
        if (gaugeReachedFullRef.current && !isUltimateReady) {
          setIsUltimateReady(true)
          console.log('✨ ULTIMATE READY!')
        }
        startNewTurn() // 스킬 랜덤 선택
        setTurnCountdown(3)
      }
      // 첫 번째 턴 (게임 시작 직후)
      if (previousIsMyTurn.current === null && battle.isMyTurn === true) {
        startNewTurn() // 스킬 랜덤 선택
        setTurnCountdown(3)
      }
      previousIsMyTurn.current = battle.isMyTurn
    }
  }, [gameStarted, battle.isActive, battle.isMyTurn, isAnalyzing, isAttacking, isUltimateReady, startNewTurn])

  // 미니게임 완료 후 room join 및 battle:ready 전송
  useEffect(() => {
    if (roomId && !showMiniGame && miniGameGoesFirst !== null) {
      console.log('🎮 BattleScreen: Mini-game complete, joining room and signaling ready:', roomId)
      joinRoom(roomId)
      emit('battle:ready', { room_id: roomId })
    }
  }, [roomId, joinRoom, emit, showMiniGame, miniGameGoesFirst])

  useEffect(() => {
    // Only init if game started, battle not active, and game hasn't ended (no winner yet)
    if (gameStarted && !battle.isActive && !battle.winnerId && miniGameGoesFirst !== null) {
      battle.initBattle({
        battleId: roomId || `battle_${Date.now()}`,
        playerCharacterId: selectedCharacter?.id || 'char_000',
        opponentCharacterId: opponentCharacter?.id || 'char_001',
        opponentNickname: 'Opponent',
        goesFirst: miniGameGoesFirst, // 미니게임 승자가 선공
      })
    }
  }, [gameStarted, battle, roomId, selectedCharacter, opponentCharacter, miniGameGoesFirst])

  useEffect(() => {
    // battle:init 소켓 이벤트는 무시 (미니게임 결과를 사용)
    // on('battle:init', ...) - 삭제함

    on('battle:turn_change', (data) => {
      battle.setTurn(data.is_my_turn)
    })

    on('battle:damage_received', async (data) => {
      const currentUserId = useUserStore.getState().user?.id
      const isAttacker = data.attacker_id === currentUserId

      // 궁극기일 경우 띠배너 표시 (공격자/방어자 모두)
      if (data.is_ultimate) {
        const attackerChar = isAttacker ? selectedCharacter : opponentCharacter
        const rawCharId = attackerChar?.id || 'char_000'
        // ID를 이름으로 변환 (파일, 테마 키로 사용)
        const charNameKey = CHARACTER_ID_TO_NAME[rawCharId] || 'otaku'

        const ultimateImagePath = `/images/attack/${charNameKey}_ultimate.webp`
        const charName = attackerChar?.name || attackerChar?.id || 'Ultimate'

        console.log('🌟 ULTIMATE BANNER:', charNameKey, ultimateImagePath)
        setShowUltimateBanner({
          characterId: charNameKey, // 테마 키로 사용됨 (ULTIMATE_THEME_COLORS[charNameKey])
          image: ultimateImagePath,
          name: charName,
          isOpponent: !isAttacker
        })

        // 2.5초 후 배너 숨기기
        setTimeout(() => {
          setShowUltimateBanner(null)
        }, 2500)
      }

      // 0. 공격자일 경우 스킬 이미지 활성화 (오디오 재생 전)
      if (isAttacker && lastTriggeredSkillRef.current) {
        const skill = lastTriggeredSkillRef.current
        if (skill.image) {
          console.log('🎯 Setting MY skill image:', skill.image)
          setActiveSkillImage(skill.image)
        }
      }

      // 방어자일 경우 상대방 스킬 이미지 표시 (소켓으로 받은 이미지)
      if (!isAttacker && data.skill_image) {
        console.log('🎯 Setting OPPONENT skill image:', data.skill_image)
        setOpponentSkillImage(data.skill_image)
      }

      // 1. Play attack audio FIRST (same for both attacker and defender)
      if (data.audio_url) {
        await playOtakuSound(data.audio_url)
      }

      // 스킬 이미지 복구 (오디오 재생 후)
      if (isAttacker) {
        setActiveSkillImage(null)
      } else {
        setOpponentSkillImage(null)
      }

      // === 공격자 대시 + 피격 애니메이션 시퀀스 시작 ===

      // 공격자 위치 결정 (isHost: 왼쪽=나, 오른쪽=상대 / !isHost: 왼쪽=상대, 오른쪽=나)
      // 공격자 시점에서: isHost면 내가 왼쪽에서 오른쪽으로 대시, !isHost면 내가 오른쪽에서 왼쪽으로 대시
      // 방어자 시점에서: isHost면 상대가 오른쪽에서 왼쪽으로 대시, !isHost면 상대가 왼쪽에서 오른쪽 대시
      const attackerOnLeft = isAttacker ? isHost : !isHost
      console.log('⚔️ Attacker dash:', attackerOnLeft ? 'LEFT → RIGHT' : 'RIGHT → LEFT')

      // 대시 중 attack 이미지 설정
      if (isAttacker) {
        // 내가 공격자: 내 attack 이미지 설정
        const myAttackImg = myCharacterSkills?.skills?.[0]?.image || myCharacterSkills?.defaultImg
        setActiveSkillImage(myAttackImg)
      } else {
        // 상대가 공격자: 상대 attack 이미지 설정
        const opponentAttackImg = data.skill_image || opponentCharacterSkills?.skills?.[0]?.image || opponentCharacterSkills?.defaultImg
        setOpponentSkillImage(opponentAttackImg)
      }

      // 대시 애니메이션 시작
      setAttackerSide(attackerOnLeft ? 'left' : 'right')
      setDashPhase('dashing')

      // 대시 완료 대기 (300ms)
      await new Promise(resolve => setTimeout(resolve, 300))

      // 피격 SFX 재생
      const playHitSfx = () => {
        const hitAudio = new Audio('/sounds/hit.wav')
        hitAudio.volume = 0.7
        hitAudio.play().catch(err => console.warn('Hit SFX play failed:', err))
      }
      playHitSfx()

      // 피격 이미지 설정 (공격자: 상대 피격 / 방어자: 자신 피격)
      if (isAttacker) {
        // 공격자 시점: 상대방이 맞음 → opponent hit image
        const opponentHitImg = opponentCharacterSkills?.hitImg || opponentCharacterSkills?.defaultImg
        console.log('💥 Setting OPPONENT hit image:', opponentHitImg)
        setOpponentHitImage(opponentHitImg)
      } else {
        // 방어자 시점: 내가 맞음 → my hit image
        const myHitImg = myCharacterSkills?.hitImg || myCharacterSkills?.defaultImg
        console.log('💥 Setting MY hit image:', myHitImg)
        setMyHitImage(myHitImg)
      }

      // 2회 깜빡임 효과 (150ms on, 150ms off × 2회 = 600ms)
      setIsBlinking(true)

      // 깜빡임 시퀀스 후 HP 감소 및 이미지 복구
      await new Promise(resolve => setTimeout(resolve, 600))

      setIsBlinking(false)

      // 2. Apply damage after hit animation
      if (isAttacker) {
        // Attacker: apply damage to opponent
        battle.dealDamage(data.damage, { grade: data.grade })
        setShowDamage({ value: data.damage, isPlayer: false, grade: data.grade, isCritical: data.is_critical })

        // 백엔드 grade 기반으로 궁극기 게이지 증가 (S, A, B, C 등급 = 성공, 약 60% 이상)
        if (['SSS', 'SS', 'S', 'A', 'B', 'C'].includes(data.grade)) {
          // 궁극기 사용 시 게이지 초기화
          if (data.is_ultimate || isUltimateReady) {
            setGauge(0)
            setIsUltimateReady(false)
            gaugeReachedFullRef.current = false
            console.log('🌟 Ultimate used! Gauge reset.')
          } else {
            // 일반 스킬 - 게이지 1/3 증가
            setGauge(prev => {
              const newGauge = Math.min(100, prev + 100 / 3)
              console.log(`⚡ Gauge increased: ${prev.toFixed(1)}% → ${newGauge.toFixed(1)}%`)
              // 게이지 100% 도달 체크
              if (newGauge >= 100) {
                gaugeReachedFullRef.current = true
                console.log('🎯 Gauge FULL! Next turn ultimate ready.')
              }
              return newGauge
            })
          }
        }

        // 대시 복귀 애니메이션 시작
        setDashPhase('returning')

        // 복귀 애니메이션 완료 후 상태 초기화 (300ms)
        setTimeout(() => {
          setOpponentHitImage(null)
          setDashPhase(null)
          setAttackerSide(null)
          setActiveSkillImage(null) // attack 이미지 → normal 이미지
        }, 300)
      } else {
        // Defender: take damage on self
        battle.takeDamage(data.damage)
        setShowDamage({ value: data.damage, isPlayer: true, grade: data.grade, isCritical: data.is_critical })
        // Now it's defender's turn
        battle.setTurn(true)

        // 대시 복귀 애니메이션 시작
        setDashPhase('returning')

        // 복귀 애니메이션 완료 후 상태 초기화 (300ms)
        setTimeout(() => {
          setMyHitImage(null)
          setDashPhase(null)
          setAttackerSide(null)
          setOpponentSkillImage(null) // attack 이미지 → normal 이미지
        }, 300)
      }

      // 3. Critical hit effect (both see it)
      if (data.is_critical) {
        setShowCritical(true)
        playCriticalHitSound()
        setTimeout(() => setShowCritical(false), 1000)
      }

      // 4. If game is finished (winner exists), wait for HP animation then navigate
      if (data.winner_id) {
        // Wait for HP bar animation to complete, then navigate
        // endBattle is called by battle:result handler which sets ELO changes etc.
        setTimeout(() => {
          navigate('/result')
        }, 1500) // 1.5 second delay for HP animation
      }
    })

    on('battle:result', (data) => {
      // Store result data for result screen (ELO changes etc)
      // Navigation is handled by damage_received handler after audio completes
      const currentUserId = useUserStore.getState().user?.id
      battle.endBattle(data.winner_id, data.loser_id, data.stats, currentUserId)
    })

    // --- Voice Sync Handlers ---
    on('battle:voice_start', (data) => {
      console.log('🎤 Opponent started recording')
      setIsOpponentRecording(true)
    })

    on('battle:voice_end', (data) => {
      console.log('🎤 Opponent stopped recording')
      setIsOpponentRecording(false)
    })

    return () => {
      off('battle:init')
      off('battle:turn_change')
      off('battle:damage_received')
      off('battle:result')
      off('battle:voice_start')
      off('battle:voice_end')
    }
  }, [on, off, battle, navigate, playOtakuSound, playCriticalHitSound, selectedCharacter, opponentCharacter])

  useEffect(() => {
    if (battle.player.hp <= 0 || battle.opponent.hp <= 0) {
      setTimeout(() => navigate('/result'), 2000)
    }
  }, [battle.player.hp, battle.opponent.hp, navigate])

  useEffect(() => {
    if (showDamage) {
      const t = setTimeout(() => setShowDamage(null), 1500)
      return () => clearTimeout(t)
    }
  }, [showDamage])

  // 🔥 위기 각성 (Crisis Awakening): HP 30% 이하 시 궁극기 즉시 충전 (1회 한정)
  const hasAwakenedRef = useRef(false)
  useEffect(() => {
    // battle object exists AND hp is valid AND hp <= 30% of maxHp AND not awakened yet
    const threshold = battle.player.maxHp * 0.3
    if (battle.isActive && battle.player.hp > 0 && battle.player.hp <= threshold && !hasAwakenedRef.current) {
      console.log('🔥 CRISIS AWAKENING! Ultimate Gauge Fully Charged!')
      hasAwakenedRef.current = true

      // 즉시 게이지 100% 및 궁극기 준비
      setGauge(100)
      gaugeReachedFullRef.current = true
      setIsUltimateReady(true)

      // 시각적 피드백 (선택사항)
      setShowCritical(true)
      setTimeout(() => setShowCritical(false), 1500)
    }
  }, [battle.player.hp, battle.isActive])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 선택된 배경 또는 기본 배경 */}
      {selectedBackground?.style ? (
        <div className="absolute inset-0" style={selectedBackground.style} />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/background/battle_bg.png')" }}
        />
      )}
      <div className="absolute inset-0 bg-black/20" />

      {showCritical && (
        <div className="absolute inset-0 bg-yellow-500/30 z-40 animate-pulse" />
      )}

      {/* 궁극기 띠배너 */}
      <UltimateBanner
        isVisible={!!showUltimateBanner}
        characterId={showUltimateBanner?.characterId}
        ultimateImage={showUltimateBanner?.image}
        characterName={showUltimateBanner?.name}
      />

      {/* 🌟 화려한 공격 이펙트 오버레이 (녹음 중일 때 양 플레이어 모두에게 표시) */}
      <AttackOverlay isVisible={isRecording || isOpponentRecording} />

      {/* 미니게임 (선공권 결정) */}
      {showMiniGame && roomId && (
        <KeyMashGame
          roomId={roomId}
          targetCount={50}
          onComplete={handleMiniGameComplete}
        />
      )}

      {/* 게임 시작 애니메이션 */}
      {showGameStart && !showMiniGame && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-pink-800/90 to-orange-700/90 z-50 flex items-center justify-center overflow-hidden">
          {/* 배경 효과 */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-50 animate-ping" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-500 rounded-full blur-3xl opacity-40 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-cyan-400 rounded-full blur-2xl opacity-60 animate-bounce" />
          </div>
          {/* 메인 텍스트 */}
          <div className="relative flex flex-col items-center">
            <div
              className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 animate-pulse"
              style={{
                textShadow: '0 0 40px rgba(255,200,100,0.8), 0 0 80px rgba(255,100,200,0.6)',
                animation: 'pulse 0.5s ease-in-out infinite alternate'
              }}
            >
              ✨ GAME START ✨
            </div>
            <div
              className="mt-4 text-2xl md:text-3xl font-bold text-white/80 animate-bounce"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}
            >
              ♪ 오타쿠 배틀 개막! ♪
            </div>
            {/* 스파클 효과 */}
            <div className="absolute -top-8 -left-8 text-4xl animate-spin" style={{ animationDuration: '2s' }}>⭐</div>
            <div className="absolute -top-4 right-0 text-3xl animate-bounce">💫</div>
            <div className="absolute -bottom-8 -right-8 text-4xl animate-ping">🌟</div>
            <div className="absolute -bottom-4 left-0 text-3xl animate-pulse">✧</div>
          </div>
        </div>
      )}

      {/* 턴 시작 카운트다운 */}
      {turnCountdown >= 0 && !showGameStart && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
          {turnCountdown > 0 ? (
            <div className="text-9xl font-bold text-white animate-pulse" style={{ textShadow: '0 0 30px rgba(255,255,255,0.5)' }}>
              {turnCountdown}
            </div>
          ) : (
            <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-cyan-400 to-green-300 animate-bounce" style={{ textShadow: '0 0 40px rgba(0,255,150,0.8)' }}>
              YOUR TURN !!
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="bg-gray-800/80 px-4 py-1 rounded-t-lg inline-block">
              <span className="font-bold text-white">{leftLabel}</span>
            </div>
            <div className="h-8 bg-gray-900/80 rounded-r-lg overflow-hidden border-2 border-gray-700">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                style={{ width: `${(leftHP.hp / leftHP.maxHp) * 100}%` }}
              />
            </div>
            <div className="text-white font-bold mt-1 text-2xl">{leftHP.hp}</div>
          </div>

          {/* 턴 표시 (타이머 제거) */}
          <div className="flex flex-col items-center px-4">
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${battle.isMyTurn ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
              {battle.isMyTurn ? 'YOUR TURN' : 'WAIT'}
            </div>
          </div>

          <div className="flex-1 text-right">
            <div className="bg-gray-800/80 px-4 py-1 rounded-t-lg inline-block">
              <span className="font-bold text-white">{rightLabel}</span>
            </div>
            <div className="h-8 bg-gray-900/80 rounded-l-lg overflow-hidden border-2 border-gray-700">
              <div
                className="h-full bg-gradient-to-l from-red-600 to-red-500 transition-all duration-300 ml-auto"
                style={{ width: `${(rightHP.hp / rightHP.maxHp) * 100}%` }}
              />
            </div>
            <div className="text-white font-bold mt-1 text-2xl">{rightHP.hp}</div>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      {/* 캐릭터 컨테이너 - 2배 크기에 맞춰 아래로 이동, overflow-visible로 잘림 방지 */}
      <div className="absolute top-[50%] left-0 right-0 z-10 flex items-end justify-between px-4 pointer-events-none overflow-visible">
        {/* 왼쪽 캐릭터 */}
        <div className={`w-1/3 flex flex-col items-center relative ${showDamage && ((isHost && showDamage.isPlayer) || (!isHost && !showDamage.isPlayer)) ? 'animate-shake' : ''} ${leftEffectClass}`}>
          {/* 에너지 차지 이펙트 - 내 캐릭터가 녹음 중일 때 */}
          {((isHost && isRecording) || (!isHost && isOpponentRecording)) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <EnergyChargeEffect
                isActive={true}
                intensity={isHost ? (1 + (analyzerData[0] || 0) / 128) : 1.5}
                color={isHost ? "#ff69b4" : "#00bfff"} // Host(Me)=Pink, Opponent(Host-view)=Blue? No.
              // Logic:
              // If I am Host: Left is Me (Pink), Right is Opponent (Blue)
              // If I am Guest: Left is Opponent (Pink on their screen?), Right is Me (Blue)
              // Left Character:
              // - If isHost: It's ME. Show Pink if I am recording.
              // - If !isHost: It's OPPONENT (Host). Show Pink/Blue? Let's keep consistent colors?
              // Let's rely on standard colors: Me=Pink, Opponent=Blue (or variable)
              // Actually:
              // Left is always "Player 1 (Host)" visually to the Host?
              // Wait, logic at line 229:
              // const leftCharImage = isHost ? myCharImage : opponentCharImage
              // const rightCharImage = isHost ? opponentCharImage : myCharImage
              // Therefore:
              // If isHost: Left = Me, Right = Opponent
              // If !isHost: Left = Opponent, Right = Me
              />
            </div>
          )}
          {/* 회전하는 별들 - 녹음 중일 때 */}
          {((isHost && isRecording) || (!isHost && isOpponentRecording)) && (
            <>
              <div className="absolute left-1/2 top-1/2 text-4xl animate-star-slow z-30" style={{ marginTop: '-60px' }}>⭐</div>
              <div className="absolute left-1/2 top-1/2 text-3xl animate-star-medium z-30" style={{ marginTop: '-30px', marginLeft: '40px' }}>🌟</div>
              <div className="absolute left-1/2 top-1/2 text-2xl animate-star-fast z-30" style={{ marginTop: '-10px', marginLeft: '-50px' }}>✨</div>
            </>
          )}
          <img
            src={leftCharImage}
            alt={leftLabel}
            className={`h-48 md:h-64 object-contain scale-[2] transition-all duration-300 ${leftEffectClass} ${((isHost && isRecording) || (!isHost && isOpponentRecording))
              ? 'animate-rainbow-glow z-20'
              : ''
              } ${isBlinking && !isHost && opponentHitImage ? 'animate-hit-blink' : ''} ${isBlinking && isHost && myHitImage ? 'animate-hit-blink' : ''} ${dashPhase === 'dashing' && attackerSide === 'left' ? 'animate-dash-right' : ''} ${dashPhase === 'returning' && attackerSide === 'left' ? 'animate-dash-return-left' : ''}`}
            style={{
              filter: ((isHost && isRecording) || (!isHost && isOpponentRecording))
                ? undefined  // CSS 애니메이션에서 처리
                : 'drop-shadow(0 0 10px rgba(255,0,0,0.3))',
              transformOrigin: 'bottom center'
            }}
          />
        </div>

        {showDamage && (
          <div className={`absolute ${showDamage.isPlayer ? 'left-1/3' : 'right-1/3'} top-1/3 z-20 flex flex-col items-center`}>
            {showDamage.isCritical && (
              <div className="flex items-center justify-center gap-2 mb-2 animate-bounce">
                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold text-2xl">CRITICAL!</span>
                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </div>
            )}
            <div className={`text-6xl font-bold ${['SSS', 'S', 'A'].includes(showDamage.grade) ? 'text-yellow-300' : 'text-gray-400'
              } drop-shadow-lg animate-bounce`}>
              {showDamage.value > 0 ? `-${showDamage.value}` : 'MISS'}
            </div>
            <div className="text-center text-3xl font-bold mt-2 text-white">
              {showDamage.grade}
            </div>
          </div>
        )}

        {/* 오른쪽 캐릭터 */}
        <div className={`w-1/3 flex flex-col items-center relative ${isAttacking || showCritical ? 'animate-shake' : ''} ${rightEffectClass}`}>
          {/* 에너지 차지 이펙트 */}
          {((!isHost && isRecording) || (isHost && isOpponentRecording)) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <EnergyChargeEffect
                isActive={true}
                intensity={!isHost ? (1 + (analyzerData[0] || 0) / 128) : 1.5}
                color={!isHost ? "#00bfff" : "#ff69b4"}
              />
            </div>
          )}
          {/* 회전하는 별들 - 녹음 중일 때 */}
          {((!isHost && isRecording) || (isHost && isOpponentRecording)) && (
            <>
              <div className="absolute left-1/2 top-1/2 text-4xl animate-star-slow z-30" style={{ marginTop: '-60px' }}>⭐</div>
              <div className="absolute left-1/2 top-1/2 text-3xl animate-star-medium z-30" style={{ marginTop: '-30px', marginLeft: '40px' }}>🌟</div>
              <div className="absolute left-1/2 top-1/2 text-2xl animate-star-fast z-30" style={{ marginTop: '-10px', marginLeft: '-50px' }}>✨</div>
            </>
          )}
          <img
            src={rightCharImage}
            alt={rightLabel}
            className={`h-48 md:h-64 object-contain scale-x-[-2] scale-y-[2] transition-all duration-300 ${rightEffectClass} ${((!isHost && isRecording) || (isHost && isOpponentRecording))
              ? 'animate-rainbow-glow z-20'
              : ''
              } ${isBlinking && isHost && opponentHitImage ? 'animate-hit-blink' : ''} ${isBlinking && !isHost && myHitImage ? 'animate-hit-blink' : ''} ${dashPhase === 'dashing' && attackerSide === 'right' ? 'animate-dash-left' : ''} ${dashPhase === 'returning' && attackerSide === 'right' ? 'animate-dash-return-right' : ''}`}
            style={{
              filter: ((!isHost && isRecording) || (isHost && isOpponentRecording))
                ? undefined
                : `drop-shadow(0 0 10px ${showCritical ? 'rgba(255,255,0,0.8)' : 'rgba(0,200,255,0.3)'})`,
              transformOrigin: 'bottom center'
            }}
          />
        </div>
      </div>

      {/* 궁극기 게이지 바 */}
      {battle.isMyTurn && (
        <div className="relative z-10 px-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-bold">✨ 궁극기</span>
            <div className="flex-1 h-4 bg-gray-800/80 rounded-full overflow-hidden border border-purple-500/50">
              <div
                className={`h-full transition-all duration-300 ${isUltimateReady
                  ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                style={{ width: `${gauge}%` }}
              />
            </div>
            {/* 게이지 세그먼트 */}
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${gaugeSegments > i
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600'
                    }`}
                />
              ))}
            </div>
          </div>
          {isUltimateReady && (
            <div className="text-center mt-1">
              <span className="text-yellow-400 font-bold text-sm animate-pulse">
                ✨ ULTIMATE READY! ✨
              </span>
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 p-4">
        <div className="bg-pink-500/90 rounded-2xl p-4 shadow-lg mb-4">
          <div className="text-white text-lg md:text-xl font-bold leading-relaxed">
            {currentSpell}
          </div>
          {isRecording && liveTranscript && (
            <div className="mt-2 p-2 bg-white/20 rounded-lg">
              <p className="text-sm text-pink-100 mb-1">🎤 실시간 인식 중...</p>
              <p className="text-white font-medium">{liveTranscript}</p>
            </div>
          )}
          {result?.transcription && !isRecording && (
            <div className="mt-2 text-pink-100 text-sm">인식됨: "{result.transcription}"</div>
          )}
        </div>

        {/* 음성 입력 진행 바 (5초) */}
        {isVoiceInputPhase && (
          <div className="mb-4">
            <div className="h-3 bg-gray-700/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: `${(voiceInputProgress / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {isRecording && (
          <div className="h-12 bg-black/50 rounded-xl flex items-center justify-center px-4 mb-4">
            <div className="voice-wave h-full flex items-center gap-1">
              {analyzerData.slice(0, 32).map((value, i) => (
                <div key={i} className="voice-wave-bar bg-pink-400" style={{ height: `${Math.max(4, value * 0.4)}px`, width: '4px' }} />
              ))}
            </div>
          </div>
        )}

        {/* 상태 표시 (버튼 제거, 상태 표시만) */}
        <div
          className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 ${!gameStarted || turnCountdown >= 0
            ? 'bg-gray-700 text-gray-400'
            : !battle.isMyTurn
              ? 'bg-gray-700 text-gray-400'
              : isRecording
                ? 'bg-red-500 animate-pulse text-white'
                : isAnalyzing
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400'
            }`}
        >
          {!gameStarted ? (
            '게임 시작 대기 중...'
          ) : turnCountdown >= 0 ? (
            '준비...'
          ) : !battle.isMyTurn ? (
            '상대 턴입니다...'
          ) : isAnalyzing ? (
            <><Sparkles className="w-7 h-7 animate-spin" /> 분석 중...</>
          ) : isRecording ? (
            <><Mic className="w-7 h-7 animate-pulse" /> 녹음 중...</>
          ) : (
            '대기 중...'
          )}
        </div>
      </div>
    </div>
  )
}
