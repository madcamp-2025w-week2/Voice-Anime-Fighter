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
import { stopSelectBgm } from './MultiCharacterSelect'

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
  const [showGameStart, setShowGameStart] = useState(true) // 게임 시작 애니메이션
  const [turnCountdown, setTurnCountdown] = useState(-1) // 턴 시작 시 카운트다운 (-1: 비활성)
  const [showCritical, setShowCritical] = useState(false)
  const [activeSkillImage, setActiveSkillImage] = useState(null) // 내 스킬 발동 시 이미지
  const [opponentSkillImage, setOpponentSkillImage] = useState(null) // 상대 스킬 발동 시 이미지

  // 피격 이미지 상태
  const [myHitImage, setMyHitImage] = useState(null) // 내가 피격당할 때 이미지
  const [opponentHitImage, setOpponentHitImage] = useState(null) // 상대가 피격당할 때 이미지
  const [isBlinking, setIsBlinking] = useState(false) // 피격 깜빡임 상태

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
  const myCharImage = myHitImage || activeSkillImage || myCurrentImage || selectedCharacter?.image || selectedCharacter?.sprite_url || '/images/normal/otaku_normal.webp'
  const opponentCharImage = opponentHitImage || opponentSkillImage || opponentCharacterSkills?.defaultImg || opponentCharacter?.image || opponentCharacter?.sprite_url || '/images/normal/gojo_normal.webp'

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

  // 게임 시작 애니메이션 (최초 1회)
  useEffect(() => {
    if (showGameStart) {
      const timer = setTimeout(() => {
        setShowGameStart(false)
        setGameStarted(true)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [showGameStart])

  // 턴 시작 카운트다운 처리
  useEffect(() => {
    if (turnCountdown > 0) {
      const timer = setTimeout(() => setTurnCountdown(turnCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (turnCountdown === 0) {
      // 카운트다운 완료 후 음성 입력 시작
      setTimeout(async () => {
        setTurnCountdown(-1)
        setIsVoiceInputPhase(true)
        setVoiceInputProgress(5)

        // 자동으로 녹음 시작
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          startVisualizer(stream)
          startRecording()
        } catch (err) {
          console.error('Failed to start recording:', err)
          setIsVoiceInputPhase(false)
        }
      }, 500)
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

    stopRecording()
    stopVisualizer()
    setIsVoiceInputPhase(false)
    setIsAttacking(true)

    // 현재 표시 중인 스킬/궁극기 이미지 저장 (데미지 수신 시 사용)
    const currentSkillForImage = isUltimateReady
      ? myCharacterSkills?.ultimate
      : currentSkills[0]
    lastTriggeredSkillRef.current = currentSkillForImage
    console.log('📸 Current skill for image:', currentSkillForImage?.name, currentSkillForImage?.image)

    // 바로 분석 요청 (백엔드에서 정확도/grade 계산)
    setTimeout(async () => {
      const battleId = roomId || battle.battleId || 'demo'
      const analysisResult = await analyzeVoice(battleId, currentSpell, selectedCharacter?.id)

      if (analysisResult && analysisResult.success) {
        // 백엔드에서 받은 grade를 포함하여 전송 (스킬 이미지 포함)
        sendAttack(battleId, {
          ...analysisResult.damage,
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
    }, 500)
  }, [isRecording, stopRecording, stopVisualizer, analyzeVoice, battle, selectedCharacter, currentSpell, sendAttack, roomId, isUltimateReady, myCharacterSkills, currentSkills])

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

  useEffect(() => {
    if (roomId) {
      console.log('🎮 BattleScreen: Joining room and signaling ready:', roomId)
      joinRoom(roomId)
      emit('battle:ready', { room_id: roomId })
    }
  }, [roomId, joinRoom, emit])

  useEffect(() => {
    // Only init if game started, battle not active, and game hasn't ended (no winner yet)
    if (gameStarted && !battle.isActive && !battle.winnerId) {
      battle.initBattle({
        battleId: roomId || `battle_${Date.now()}`,
        playerCharacterId: selectedCharacter?.id || 'char_000',
        opponentCharacterId: opponentCharacter?.id || 'char_001',
        opponentNickname: 'Opponent',
        goesFirst: isHost,
      })
    }
  }, [gameStarted, battle, roomId, selectedCharacter, opponentCharacter, isHost])

  useEffect(() => {
    on('battle:init', (data) => {
      battle.initBattle({
        battleId: data.battle_id,
        playerCharacterId: selectedCharacter?.id || 'char_000',
        opponentCharacterId: opponentCharacter?.id || 'char_001',
        opponentNickname: 'Opponent',
        goesFirst: data.goes_first,
      })
    })

    on('battle:turn_change', (data) => {
      battle.setTurn(data.is_my_turn)
    })

    on('battle:damage_received', async (data) => {
      const currentUserId = useUserStore.getState().user?.id
      const isAttacker = data.attacker_id === currentUserId

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

      // === 피격 애니메이션 시퀀스 시작 ===

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

        // 백엔드 grade 기반으로 궁극기 게이지 증가 (S, A, B 등급 = 성공)
        if (['SSS', 'SS', 'S', 'A', 'B'].includes(data.grade)) {
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

        // 상대 피격 이미지 복구 (턴 변경 시 normal로)
        setTimeout(() => {
          setOpponentHitImage(null)
        }, 300)
      } else {
        // Defender: take damage on self
        battle.takeDamage(data.damage)
        setShowDamage({ value: data.damage, isPlayer: true, grade: data.grade, isCritical: data.is_critical })
        // Now it's defender's turn
        battle.setTurn(true)

        // 내 피격 이미지 복구 (턴 변경 시 normal로)
        setTimeout(() => {
          setMyHitImage(null)
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

    return () => {
      off('battle:init')
      off('battle:turn_change')
      off('battle:damage_received')
      off('battle:result')
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

      {/* 게임 시작 애니메이션 */}
      {showGameStart && (
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
      <div className="absolute top-[20%] left-0 right-0 z-10 flex items-end justify-between px-4 pointer-events-none">
        {/* 왼쪽 캐릭터 */}
        <div className={`w-1/3 flex flex-col items-center relative ${showDamage && ((isHost && showDamage.isPlayer) || (!isHost && !showDamage.isPlayer)) ? 'animate-shake' : ''} ${leftEffectClass}`}>
          {/* 에너지 차지 이펙트 - 내 캐릭터가 녹음 중일 때 */}
          {isHost && isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <EnergyChargeEffect
                isActive={isRecording}
                intensity={1 + (analyzerData[0] || 0) / 128}
                color="#ff69b4"
              />
            </div>
          )}
          <img src={leftCharImage} alt={leftLabel} className={`h-48 md:h-64 object-contain ${leftEffectClass} ${isBlinking && !isHost && opponentHitImage ? 'animate-hit-blink' : ''} ${isBlinking && isHost && myHitImage ? 'animate-hit-blink' : ''}`} style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.3))' }} />
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
          {/* 에너지 차지 이펙트 - 내 캐릭터가 녹음 중일 때 (비호스트) */}
          {!isHost && isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <EnergyChargeEffect
                isActive={isRecording}
                intensity={1 + (analyzerData[0] || 0) / 128}
                color="#00bfff"
              />
            </div>
          )}
          <img
            src={rightCharImage}
            alt={rightLabel}
            className={`h-48 md:h-64 object-contain transform scale-x-[-1] ${rightEffectClass} ${isBlinking && isHost && opponentHitImage ? 'animate-hit-blink' : ''} ${isBlinking && !isHost && myHitImage ? 'animate-hit-blink' : ''}`}
            style={{ filter: `drop-shadow(0 0 10px ${showCritical ? 'rgba(255,255,0,0.8)' : 'rgba(0,200,255,0.3)'})` }}
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
