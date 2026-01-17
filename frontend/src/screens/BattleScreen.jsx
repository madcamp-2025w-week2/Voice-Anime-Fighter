import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, Sparkles, Zap } from 'lucide-react'
import { useBattleStore } from '../stores/battleStore'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAudioVisualizer } from '../hooks/useAudioVisualizer'
import { useSocket } from '../hooks/useSocket'
import { useOtakuAudio } from '../hooks/useOtakuAudio'

export default function BattleScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomId = location.state?.room_id

  const battle = useBattleStore()
  const { selectedCharacter, opponentCharacter, isHost } = useGameStore()
  const { sendAttack, on, off, joinRoom, emit } = useSocket()
  const {
    isRecording,
    isAnalyzing,
    startRecording,
    stopRecording,
    analyzeVoice,
    result,
    reset,
    liveTranscript  // Real-time transcription
  } = useSpeechRecognition()
  const { analyzerData, start: startVisualizer, stop: stopVisualizer } = useAudioVisualizer()
  const { playOtakuSound, playCriticalHitSound, cleanup: cleanupAudio } = useOtakuAudio()

  const [showDamage, setShowDamage] = useState(null)
  const [timer, setTimer] = useState(30)
  const [isAttacking, setIsAttacking] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [countdown, setCountdown] = useState(3) // 3, 2, 1, FIGHT!
  const [showCritical, setShowCritical] = useState(false)

  // 캐릭터 이미지 - Dynamic based on selected characters
  const myCharImage = selectedCharacter?.image || selectedCharacter?.sprite_url || '/images/otacu.webp'
  const opponentCharImage = opponentCharacter?.image || opponentCharacter?.sprite_url || '/images/satoru.webp'

  // Position logic: Host = left, Guest = right
  // If I'm host: I'm on left (leftChar = me), opponent on right (rightChar = opponent)
  // If I'm guest: Opponent (host) on left, I'm on right
  const leftCharImage = isHost ? myCharImage : opponentCharImage
  const rightCharImage = isHost ? opponentCharImage : myCharImage
  const leftLabel = isHost ? 'Me' : 'Opponent'
  const rightLabel = isHost ? 'Opponent' : 'Me'
  const leftHP = isHost ? battle.player : battle.opponent
  const rightHP = isHost ? battle.opponent : battle.player

  // Get spell text for current character
  const currentSpell = selectedCharacter?.spell_text || '월화수목금토일 사랑스러운 마법소녀로 변신할거야 미라클 메이크 업!'

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => cleanupAudio()
  }, [cleanupAudio])

  // 게임 시작 카운트다운
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setTimeout(() => {
        setGameStarted(true)
        setCountdown(-1)
      }, 1000)
    }
  }, [countdown])


  // Battle is now initialized via 'battle:init' socket event from server
  // (Removed local initBattle - server assigns random first turn)

  // Join battle room on mount and signal ready
  useEffect(() => {
    if (roomId) {
      console.log('🎮 BattleScreen: Joining room and signaling ready:', roomId)
      joinRoom(roomId)
      // Tell server we're ready to receive battle:init
      emit('battle:ready', { room_id: roomId })
    }
  }, [roomId, joinRoom, emit])

  // Fallback: If game starts but battle:init was never received, init locally
  useEffect(() => {
    if (gameStarted && !battle.isActive) {
      console.log('⚠️ Fallback: battle:init not received, initializing locally with isHost from store')
      battle.initBattle({
        battleId: roomId || `battle_${Date.now()}`,
        playerCharacterId: selectedCharacter?.id || 'char_000',
        opponentCharacterId: opponentCharacter?.id || 'char_001',
        opponentNickname: 'Opponent',
        goesFirst: isHost,  // Host goes first as fallback
      })
    }
  }, [gameStarted, battle.isActive, battle, roomId, selectedCharacter, opponentCharacter, isHost])

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || !battle.isActive) return

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          if (isRecording) stopRecording()
          return 30
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, battle.isActive, isRecording, stopRecording])

  // Socket event handlers
  useEffect(() => {
    // Initialize battle with server-assigned first turn
    on('battle:init', (data) => {
      console.log('battle:init received', data)
      battle.initBattle({
        battleId: data.battle_id,
        playerCharacterId: selectedCharacter?.id || 'char_000',
        opponentCharacterId: opponentCharacter?.id || 'char_001',
        opponentNickname: 'Opponent',
        goesFirst: data.goes_first,
      })
    })

    // Handle turn changes from server
    on('battle:turn_change', (data) => {
      console.log('battle:turn_change received', data)
      battle.setTurn(data.is_my_turn)
    })

    on('battle:damage_received', async (data) => {
      // Only the NON-attacker should take damage
      // Attacker already applied damage locally via dealDamage
      const currentUserId = useUserStore.getState().user?.id
      if (data.attacker_id === currentUserId) {
        console.log('battle:damage_received - I am the attacker, skipping takeDamage')
        return  // Attacker should not apply damage to self
      }

      console.log('battle:damage_received - I am the defender, applying damage:', data.damage)
      battle.takeDamage(data.damage)
      setShowDamage({ value: data.damage, isPlayer: true, grade: data.grade, isCritical: data.is_critical })

      // After receiving damage, it's now my turn
      battle.setTurn(true)

      // Play opponent's attack audio with otaku effects
      if (data.audio_url) {
        await playOtakuSound(data.audio_url)
      }

      // Critical hit effect
      if (data.is_critical) {
        playCriticalHitSound()
      }
    })

    on('battle:result', (data) => {
      battle.endBattle(data.winner_id)
      navigate('/result')
    })

    return () => {
      off('battle:init')
      off('battle:turn_change')
      off('battle:damage_received')
      off('battle:result')
    }
  }, [on, off, battle, navigate, playOtakuSound, playCriticalHitSound, selectedCharacter, opponentCharacter])

  // Handle recording
  const handleRecordToggle = useCallback(async () => {
    if (!gameStarted) return

    if (isRecording) {
      stopRecording()
      stopVisualizer()
      setIsAttacking(true)

      setTimeout(async () => {
        // Use roomId as battleId (they're the same, and roomId is always available)
        const battleId = roomId || battle.battleId || 'demo'
        const analysisResult = await analyzeVoice(
          battleId,
          currentSpell,
          selectedCharacter?.id
        )

        if (analysisResult && analysisResult.success) {
          const damage = analysisResult.damage.total_damage
          const isCritical = analysisResult.is_critical || analysisResult.damage.is_critical

          battle.dealDamage(damage, analysisResult)
          setShowDamage({ value: damage, isPlayer: false, grade: analysisResult.grade, isCritical })
          sendAttack(battleId, { ...analysisResult.damage, audio_url: analysisResult.audio_url })

          // Show critical effect
          if (isCritical) {
            setShowCritical(true)
            playCriticalHitSound()
            setTimeout(() => setShowCritical(false), 1000)
          }

          // End my turn after attack
          battle.setTurn(false)
        } else {
          setShowDamage({ value: 0, isPlayer: false, grade: 'F', isCritical: false })
          // Even on miss, end turn
          battle.setTurn(false)
        }

        setIsAttacking(false)
        reset()
        setTimer(30)
      }, 500)
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      startVisualizer(stream)
      startRecording()
    }
  }, [gameStarted, isRecording, startRecording, stopRecording, analyzeVoice, battle, selectedCharacter, currentSpell, sendAttack, startVisualizer, stopVisualizer, reset, playCriticalHitSound, roomId])

  // Check for winner
  useEffect(() => {
    if (battle.player.hp <= 0 || battle.opponent.hp <= 0) {
      setTimeout(() => navigate('/result'), 2000)
    }
  }, [battle.player.hp, battle.opponent.hp, navigate])

  // Clear damage popup
  useEffect(() => {
    if (showDamage) {
      const t = setTimeout(() => setShowDamage(null), 1500)
      return () => clearTimeout(t)
    }
  }, [showDamage])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Battle Arena Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/battle_bg.png')" }}
      />
      <div className="absolute inset-0 bg-black/20" />

      {/* Critical Hit Flash Effect */}
      {showCritical && (
        <div className="absolute inset-0 bg-yellow-500/30 z-40 animate-pulse" />
      )}

      {/* 3, 2, 1 카운트다운 */}
      {countdown >= 0 && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
          {countdown > 0 ? (
            <div className="text-9xl font-bold text-white animate-pulse" style={{ textShadow: '0 0 30px rgba(255,255,255,0.5)' }}>
              {countdown}
            </div>
          ) : (
            <div className="text-7xl font-bold text-yellow-400 animate-bounce" style={{ textShadow: '0 0 30px rgba(255,200,0,0.5)' }}>
              FIGHT!
            </div>
          )}
        </div>
      )}

      {/* HUD - Top HP Bars */}
      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left Player HP */}
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

          {/* Timer + Turn Indicator */}
          <div className="flex flex-col items-center px-4">
            <div className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="font-bold text-3xl text-white">{timer}</span>
            </div>
            {/* Turn Indicator */}
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${battle.isMyTurn ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
              {battle.isMyTurn ? 'YOUR TURN' : 'WAIT'}
            </div>
          </div>

          {/* Right Player HP */}
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

      {/* Battle Arena - Characters with Images */}
      <div className="flex-1 relative z-10 flex items-end justify-between px-4 pb-4">
        {/* Left Character */}
        <div className={`w-1/3 flex flex-col items-center ${showDamage && ((isHost && showDamage.isPlayer) || (!isHost && !showDamage.isPlayer)) ? '' : (showDamage ? 'animate-shake' : '')}`}>
          <img
            src={leftCharImage}
            alt={leftLabel}
            className="h-48 md:h-64 object-contain"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.3))' }}
          />
        </div>

        {/* Damage Popup */}
        {showDamage && (
          <div className={`absolute ${showDamage.isPlayer ? 'right-1/3' : 'left-1/3'} top-1/3 z-20`}>
            {/* Critical Hit Badge */}
            {showDamage.isCritical && (
              <div className="flex items-center justify-center gap-2 mb-2 animate-bounce">
                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold text-2xl">CRITICAL!</span>
                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </div>
            )}
            <div className={`text-6xl font-bold ${showDamage.grade === 'SSS' ? 'text-yellow-300' :
              showDamage.grade === 'S' ? 'text-pink-400' :
                showDamage.grade === 'A' ? 'text-purple-400' :
                  showDamage.grade === 'B' ? 'text-blue-400' :
                    'text-gray-400'
              } drop-shadow-lg animate-bounce`}>
              {showDamage.value > 0 ? `-${showDamage.value}` : 'MISS'}
            </div>
            <div className={`text-center text-3xl font-bold mt-2 ${showDamage.grade === 'SSS' ? 'text-yellow-300' : 'text-white'
              }`}>
              {showDamage.grade}
            </div>
          </div>
        )}

        {/* Right Character */}
        <div className={`w-1/3 flex flex-col items-center ${isAttacking || showCritical ? 'animate-shake' : ''}`}>
          <img
            src={rightCharImage}
            alt={rightLabel}
            className="h-48 md:h-64 object-contain transform scale-x-[-1]"
            style={{ filter: `drop-shadow(0 0 10px ${showCritical ? 'rgba(255,255,0,0.8)' : 'rgba(0,200,255,0.3)'})` }}
          />
        </div>
      </div>

      {/* Bottom - Spell Subtitle */}
      <div className="relative z-10 p-4">
        {/* 주문 자막 */}
        <div className="bg-pink-500/90 rounded-2xl p-4 shadow-lg mb-4">
          <div className="text-white text-lg md:text-xl font-bold leading-relaxed">
            {currentSpell}
          </div>

          {/* Real-time Live Transcript (Fast Track) */}
          {isRecording && liveTranscript && (
            <div className="mt-2 p-2 bg-white/20 rounded-lg">
              <p className="text-sm text-pink-100 mb-1">🎤 실시간 인식 중...</p>
              <p className="text-white font-medium">{liveTranscript}</p>
            </div>
          )}

          {/* Final Transcription Result */}
          {result?.transcription && !isRecording && (
            <div className="mt-2 text-pink-100 text-sm">
              인식됨: "{result.transcription}"
            </div>
          )}
        </div>

        {/* Voice Visualizer */}
        {isRecording && (
          <div className="h-12 bg-black/50 rounded-xl flex items-center justify-center px-4 mb-4">
            <div className="voice-wave h-full flex items-center gap-1">
              {analyzerData.slice(0, 32).map((value, i) => (
                <div
                  key={i}
                  className="voice-wave-bar bg-pink-400"
                  style={{ height: `${Math.max(4, value * 0.4)}px` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Record Button */}
        <button
          onClick={handleRecordToggle}
          disabled={isAnalyzing || !gameStarted || !battle.isMyTurn}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3 ${!gameStarted
            ? 'bg-gray-600 text-gray-400'
            : !battle.isMyTurn
              ? 'bg-gray-700 text-gray-400'
              : isRecording
                ? 'bg-red-500 animate-pulse'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105'
            } disabled:opacity-50`}
        >
          {!gameStarted ? (
            '게임 시작 대기 중...'
          ) : !battle.isMyTurn ? (
            '상대 턴입니다...'
          ) : isAnalyzing ? (
            <>
              <Sparkles className="w-7 h-7 animate-spin" />
              분석 중...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="w-7 h-7" />
              터치하여 공격!
            </>
          ) : (
            <>
              <Mic className="w-7 h-7" />
              주문 외치기
            </>
          )}
        </button>
      </div>
    </div>
  )
}
