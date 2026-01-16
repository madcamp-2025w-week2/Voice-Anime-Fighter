import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Sparkles } from 'lucide-react'
import { useBattleStore } from '../stores/battleStore'
import { useGameStore } from '../stores/gameStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAudioVisualizer } from '../hooks/useAudioVisualizer'
import { useSocket } from '../hooks/useSocket'

export default function BattleScreen() {
  const navigate = useNavigate()
  const battle = useBattleStore()
  const { selectedCharacter } = useGameStore()
  const { sendAttack, on, off } = useSocket()
  const { isRecording, isAnalyzing, startRecording, stopRecording, analyzeVoice, result, reset } = useSpeechRecognition()
  const { analyzerData, start: startVisualizer, stop: stopVisualizer } = useAudioVisualizer()
  
  const [showDamage, setShowDamage] = useState(null)
  const [timer, setTimer] = useState(30)
  const [isAttacking, setIsAttacking] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [countdown, setCountdown] = useState(3) // 3, 2, 1, FIGHT!

  // 캐릭터 이미지
  const myCharImage = selectedCharacter?.image || '/images/char_otaku.png'
  const opponentCharImage = '/images/char_otaku.png' // 상대 캐릭터 (데모)

  // Get spell text for current character
  const currentSpell = selectedCharacter?.spell_text || '월화수목금토일 사랑스러운 마법소녀로 변신할거야 미라클 메이크 업!'

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

  // Initialize battle on mount
  useEffect(() => {
    if (!battle.isActive && gameStarted) {
      battle.initBattle({
        battleId: `battle_${Date.now()}`,
        playerCharacterId: selectedCharacter?.id || 'char_000',
        opponentCharacterId: 'char_001',
        opponentNickname: 'AI 상대',
        goesFirst: true,
      })
    }
  }, [battle, selectedCharacter, gameStarted])

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
    on('battle:damage_received', (data) => {
      battle.takeDamage(data.damage)
      setShowDamage({ value: data.damage, isPlayer: true, grade: data.grade })
    })

    on('battle:result', (data) => {
      battle.endBattle(data.winner_id)
      navigate('/result')
    })

    return () => {
      off('battle:damage_received')
      off('battle:result')
    }
  }, [on, off, battle, navigate])

  // Handle recording
  const handleRecordToggle = useCallback(async () => {
    if (!gameStarted) return
    
    if (isRecording) {
      stopRecording()
      stopVisualizer()
      setIsAttacking(true)
      
      setTimeout(async () => {
        const analysisResult = await analyzeVoice(
          battle.battleId || 'demo',
          currentSpell,
          selectedCharacter?.id
        )
        
        if (analysisResult && analysisResult.success) {
          const damage = analysisResult.damage.total_damage
          battle.dealDamage(damage, analysisResult)
          setShowDamage({ value: damage, isPlayer: false, grade: analysisResult.grade })
          sendAttack(battle.battleId, analysisResult.damage)
        } else {
          setShowDamage({ value: 0, isPlayer: false, grade: 'F' })
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
  }, [gameStarted, isRecording, startRecording, stopRecording, analyzeVoice, battle, selectedCharacter, currentSpell, sendAttack, startVisualizer, stopVisualizer, reset])

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
          {/* Opponent HP (왼쪽) */}
          <div className="flex-1">
            <div className="bg-gray-800/80 px-4 py-1 rounded-t-lg inline-block">
              <span className="font-bold text-white">Opponent</span>
            </div>
            <div className="h-8 bg-gray-900/80 rounded-r-lg overflow-hidden border-2 border-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                style={{ width: `${(battle.opponent.hp / battle.opponent.maxHp) * 100}%` }}
              />
            </div>
            <div className="text-white font-bold mt-1 text-2xl">{battle.opponent.hp}</div>
          </div>
          
          {/* Timer */}
          <div className="flex flex-col items-center px-4">
            <div className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="font-bold text-3xl text-white">{timer}</span>
            </div>
          </div>
          
          {/* Me HP (오른쪽) */}
          <div className="flex-1 text-right">
            <div className="bg-gray-800/80 px-4 py-1 rounded-t-lg inline-block">
              <span className="font-bold text-white">Me</span>
            </div>
            <div className="h-8 bg-gray-900/80 rounded-l-lg overflow-hidden border-2 border-gray-700">
              <div 
                className="h-full bg-gradient-to-l from-red-600 to-red-500 transition-all duration-300 ml-auto"
                style={{ width: `${(battle.player.hp / battle.player.maxHp) * 100}%` }}
              />
            </div>
            <div className="text-white font-bold mt-1 text-2xl">{battle.player.hp}</div>
          </div>
        </div>
      </div>

      {/* Battle Arena - Characters with Images */}
      <div className="flex-1 relative z-10 flex items-end justify-between px-4 pb-4">
        {/* Opponent Character (왼쪽) */}
        <div className={`w-1/3 flex flex-col items-center ${
          showDamage && !showDamage.isPlayer ? 'animate-shake' : ''
        }`}>
          <img 
            src={opponentCharImage} 
            alt="Opponent"
            className="h-48 md:h-64 object-contain transform scale-x-[-1]"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.3))' }}
          />
        </div>

        {/* Damage Popup */}
        {showDamage && (
          <div className={`absolute ${showDamage.isPlayer ? 'right-1/3' : 'left-1/3'} top-1/3 z-20`}>
            <div className={`text-6xl font-bold ${
              showDamage.grade === 'SSS' ? 'text-yellow-300' :
              showDamage.grade === 'S' ? 'text-pink-400' :
              showDamage.grade === 'A' ? 'text-purple-400' :
              showDamage.grade === 'B' ? 'text-blue-400' :
              'text-gray-400'
            } drop-shadow-lg animate-bounce`}>
              {showDamage.value > 0 ? `-${showDamage.value}` : 'MISS'}
            </div>
            <div className={`text-center text-3xl font-bold mt-2 ${
              showDamage.grade === 'SSS' ? 'text-yellow-300' : 'text-white'
            }`}>
              {showDamage.grade}
            </div>
          </div>
        )}

        {/* My Character (오른쪽) */}
        <div className={`w-1/3 flex flex-col items-center ${
          isRecording ? 'animate-pulse' : ''
        } ${isAttacking ? 'animate-shake' : ''}`}>
          <img 
            src={myCharImage} 
            alt="Me"
            className="h-48 md:h-64 object-contain"
            style={{ filter: 'drop-shadow(0 0 10px rgba(0,200,255,0.3))' }}
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
          {result?.transcription && (
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
          disabled={isAnalyzing || !gameStarted}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-3 ${
            !gameStarted
              ? 'bg-gray-600 text-gray-400'
              : isRecording 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105'
          } disabled:opacity-50`}
        >
          {!gameStarted ? (
            '게임 시작 대기 중...'
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
