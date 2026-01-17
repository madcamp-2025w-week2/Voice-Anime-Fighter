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
    liveTranscript
  } = useSpeechRecognition()
  const { analyzerData, start: startVisualizer, stop: stopVisualizer } = useAudioVisualizer()
  const { playOtakuSound, playCriticalHitSound, cleanup: cleanupAudio } = useOtakuAudio()

  const matchedBattleId = location.state?.battle_id
  const [showDamage, setShowDamage] = useState(null)
  const [timer, setTimer] = useState(30)
  const [isAttacking, setIsAttacking] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [showCritical, setShowCritical] = useState(false)

  const myCharImage = selectedCharacter?.image || selectedCharacter?.sprite_url || '/images/otacu.webp'
  const opponentCharImage = opponentCharacter?.image || opponentCharacter?.sprite_url || '/images/satoru.webp'

  const leftCharImage = isHost ? myCharImage : opponentCharImage
  const rightCharImage = isHost ? opponentCharImage : myCharImage
  const leftLabel = isHost ? 'Me' : 'Opponent'
  const rightLabel = isHost ? 'Opponent' : 'Me'
  const leftHP = isHost ? battle.player : battle.opponent
  const rightHP = isHost ? battle.opponent : battle.player

  const currentSpell = selectedCharacter?.spell_text || '월화수목금토일 사랑스러운 마법소녀로 변신할거야 미라클 메이크 업!'

  useEffect(() => {
    return () => cleanupAudio()
  }, [cleanupAudio])

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

  useEffect(() => {
    if (roomId) {
      console.log('🎮 BattleScreen: Joining room and signaling ready:', roomId)
      joinRoom(roomId)
      emit('battle:ready', { room_id: roomId })
    }
  }, [roomId, joinRoom, emit])

  useEffect(() => {
    if (gameStarted && !battle.isActive) {
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

      // 1. Play attack audio FIRST (same for both attacker and defender)
      if (data.audio_url) {
        await playOtakuSound(data.audio_url)
      }

      // 2. Apply damage after audio finishes
      if (isAttacker) {
        // Attacker: apply damage to opponent
        battle.dealDamage(data.damage, { grade: data.grade })
        setShowDamage({ value: data.damage, isPlayer: false, grade: data.grade, isCritical: data.is_critical })
      } else {
        // Defender: take damage on self
        battle.takeDamage(data.damage)
        setShowDamage({ value: data.damage, isPlayer: true, grade: data.grade, isCritical: data.is_critical })
        // Now it's defender's turn
        battle.setTurn(true)
      }

      // 3. Critical hit effect (both see it)
      if (data.is_critical) {
        setShowCritical(true)
        playCriticalHitSound()
        setTimeout(() => setShowCritical(false), 1000)
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

  const handleRecordToggle = useCallback(async () => {
    if (!gameStarted) return
    if (isRecording) {
      stopRecording()
      stopVisualizer()
      setIsAttacking(true)
      setTimeout(async () => {
        const battleId = roomId || battle.battleId || 'demo'
        const analysisResult = await analyzeVoice(battleId, currentSpell, selectedCharacter?.id)
        if (analysisResult && analysisResult.success) {
          // Just send attack to server - both attacker and defender will receive battle:damage_received
          // and process at the same time (synchronized)
          sendAttack(battleId, { ...analysisResult.damage, audio_url: analysisResult.audio_url })

          // End my turn immediately after sending
          battle.setTurn(false)
        } else {
          setShowDamage({ value: 0, isPlayer: false, grade: 'F', isCritical: false })
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
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/battle_bg.png')" }}
      />
      <div className="absolute inset-0 bg-black/20" />

      {showCritical && (
        <div className="absolute inset-0 bg-yellow-500/30 z-40 animate-pulse" />
      )}

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

          <div className="flex flex-col items-center px-4">
            <div className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="font-bold text-3xl text-white">{timer}</span>
            </div>
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${battle.isMyTurn ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
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

      <div className="flex-1 relative z-10 flex items-end justify-between px-4 pb-4">
        <div className={`w-1/3 flex flex-col items-center ${showDamage && ((isHost && showDamage.isPlayer) || (!isHost && !showDamage.isPlayer)) ? 'animate-shake' : ''}`}>
          <img src={leftCharImage} alt={leftLabel} className="h-48 md:h-64 object-contain" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.3))' }} />
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

        <div className={`w-1/3 flex flex-col items-center ${isAttacking || showCritical ? 'animate-shake' : ''}`}>
          <img
            src={rightCharImage}
            alt={rightLabel}
            className="h-48 md:h-64 object-contain transform scale-x-[-1]"
            style={{ filter: `drop-shadow(0 0 10px ${showCritical ? 'rgba(255,255,0,0.8)' : 'rgba(0,200,255,0.3)'})` }}
          />
        </div>
      </div>

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

        {isRecording && (
          <div className="h-12 bg-black/50 rounded-xl flex items-center justify-center px-4 mb-4">
            <div className="voice-wave h-full flex items-center gap-1">
              {analyzerData.slice(0, 32).map((value, i) => (
                <div key={i} className="voice-wave-bar bg-pink-400" style={{ height: `${Math.max(4, value * 0.4)}px`, width: '4px' }} />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleRecordToggle}
          disabled={isAnalyzing || !gameStarted || !battle.isMyTurn}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3 ${!gameStarted || !battle.isMyTurn ? 'bg-gray-700 text-gray-400' : isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105'
            } disabled:opacity-50`}
        >
          {!gameStarted ? '게임 시작 대기 중...' : !battle.isMyTurn ? '상대 턴입니다...' : isAnalyzing ? (
            <><Sparkles className="w-7 h-7 animate-spin" /> 분석 중...</>
          ) : isRecording ? (
            <><MicOff className="w-7 h-7" /> 터치하여 공격!</>
          ) : (
            <><Mic className="w-7 h-7" /> 주문 외치기</>
          )}
        </button>
      </div>
    </div>
  )
}