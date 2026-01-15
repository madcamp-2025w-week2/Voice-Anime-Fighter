import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Heart, Sparkles, Zap } from 'lucide-react'
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
  const { analyzerData, volume, start: startVisualizer, stop: stopVisualizer } = useAudioVisualizer()
  
  const [showDamage, setShowDamage] = useState(null)
  const [spellText, setSpellText] = useState('')
  const [timer, setTimer] = useState(30)
  const [isAttacking, setIsAttacking] = useState(false)

  // Get spell text for current character
  const currentSpell = selectedCharacter?.spell_text || '마법소녀 카와이 러블리 루루핑!'

  // Initialize battle on mount
  useEffect(() => {
    if (!battle.isActive) {
      battle.initBattle({
        battleId: `battle_${Date.now()}`,
        playerCharacterId: selectedCharacter?.id || 'char_001',
        opponentCharacterId: 'char_002',
        opponentNickname: 'AI 상대',
        goesFirst: true,
      })
    }
  }, [battle, selectedCharacter])

  // Timer countdown
  useEffect(() => {
    if (!battle.isActive) return
    
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          // Time's up - auto attack
          if (isRecording) stopRecording()
          return 30
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [battle.isActive, isRecording, stopRecording])

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
    if (isRecording) {
      stopRecording()
      stopVisualizer()
      setIsAttacking(true)
      
      // Analyze voice and deal damage
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
          
          // Send to opponent via socket
          sendAttack(battle.battleId, analysisResult.damage)
        } else {
          // Miss attack
          setShowDamage({ value: 0, isPlayer: false, grade: 'F' })
        }
        
        setIsAttacking(false)
        setSpellText('')
        reset()
        setTimer(30)
      }, 500)
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      startVisualizer(stream)
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording, analyzeVoice, battle, selectedCharacter, currentSpell, sendAttack, startVisualizer, stopVisualizer, reset])

  // Check for winner
  useEffect(() => {
    if (battle.player.hp <= 0 || battle.opponent.hp <= 0) {
      setTimeout(() => navigate('/result'), 2000)
    }
  }, [battle.player.hp, battle.opponent.hp, navigate])

  // Clear damage popup
  useEffect(() => {
    if (showDamage) {
      const timer = setTimeout(() => setShowDamage(null), 1000)
      return () => clearTimeout(timer)
    }
  }, [showDamage])

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Battle Arena Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 via-pink-900/30 to-blue-900/50" />
      <div className="absolute inset-0 stars-bg opacity-30" />

      {/* HUD - Top */}
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Player 1 HP */}
          <HealthBar 
            hp={battle.player.hp} 
            maxHp={battle.player.maxHp}
            name={selectedCharacter?.name || '나'}
            isPlayer={true}
            isShaking={showDamage?.isPlayer}
          />
          
          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Heart className="w-16 h-16 text-magical-pink-500 fill-magical-pink-500/50" />
              <span className="absolute inset-0 flex items-center justify-center font-bold text-xl text-white">
                {timer}
              </span>
            </div>
          </div>
          
          {/* Player 2 HP */}
          <HealthBar 
            hp={battle.opponent.hp} 
            maxHp={battle.opponent.maxHp}
            name={battle.opponent.nickname}
            isPlayer={false}
            isShaking={showDamage && !showDamage.isPlayer}
          />
        </div>

        {/* Voice Visualizer */}
        <div className="mt-4 h-16 glass rounded-xl flex items-center justify-center px-4">
          {isRecording ? (
            <div className="voice-wave h-full flex items-center gap-1">
              {analyzerData.slice(0, 32).map((value, i) => (
                <div
                  key={i}
                  className="voice-wave-bar"
                  style={{ height: `${Math.max(4, value * 0.6)}px` }}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">🎤 아래 버튼을 눌러 주문을 외치세요!</p>
          )}
        </div>
      </div>

      {/* Battle Arena - Characters */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-8">
        {/* Player Character */}
        <div className="absolute left-8 bottom-32 w-32 h-48">
          <div className={`w-full h-full bg-gradient-to-t from-magical-pink-500/30 to-transparent rounded-lg flex items-end justify-center pb-4 ${
            isRecording ? 'animate-pulse' : ''
          } ${isAttacking ? 'animate-shake' : ''}`}>
            <span className="text-6xl">🌟</span>
          </div>
        </div>

        {/* Damage Popup */}
        {showDamage && (
          <div className={`absolute ${showDamage.isPlayer ? 'left-32' : 'right-32'} top-1/2 damage-popup`}>
            <div className={`text-4xl font-bold grade-${showDamage.grade}`}>
              {showDamage.value > 0 ? `-${showDamage.value}` : 'MISS'}
            </div>
            <div className={`text-center text-2xl grade-badge grade-${showDamage.grade}`}>
              {showDamage.grade}
            </div>
          </div>
        )}

        {/* Opponent Character */}
        <div className="absolute right-8 bottom-32 w-32 h-48">
          <div className={`w-full h-full bg-gradient-to-t from-magical-purple-500/30 to-transparent rounded-lg flex items-end justify-center pb-4 ${
            showDamage && !showDamage.isPlayer ? 'animate-shake' : ''
          }`}>
            <span className="text-6xl">👿</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 p-4 space-y-4">
        {/* Spell Subtitle */}
        <div className="glass rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">외칠 주문</div>
          <div className="text-xl text-magical-pink-300 font-bold">
            "{currentSpell}"
          </div>
          {result?.transcription && (
            <div className="mt-2 text-sm text-green-400">
              인식됨: "{result.transcription}"
            </div>
          )}
        </div>

        {/* Record Button */}
        <button
          onClick={handleRecordToggle}
          disabled={isAnalyzing}
          className={`w-full py-6 rounded-2xl font-bold text-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
            isRecording 
              ? 'bg-red-500 animate-pulse glow-pink' 
              : 'bg-gradient-to-r from-magical-pink-500 to-magical-purple-500 hover:scale-105'
          } disabled:opacity-50`}
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="w-8 h-8 animate-spin" />
              분석 중...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="w-8 h-8" />
              녹음 중지 (터치하여 공격!)
            </>
          ) : (
            <>
              <Mic className="w-8 h-8" />
              주문 외치기
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function HealthBar({ hp, maxHp, name, isPlayer, isShaking }) {
  const percentage = (hp / maxHp) * 100
  const barColor = 
    percentage > 60 ? 'from-green-500 to-emerald-500' :
    percentage > 30 ? 'from-yellow-500 to-orange-500' :
    'from-red-500 to-rose-600'

  return (
    <div className={`flex-1 max-w-[40%] ${isShaking ? 'animate-shake' : ''}`}>
      <div className={`text-sm font-bold mb-1 ${isPlayer ? 'text-left' : 'text-right'}`}>
        {name}
      </div>
      <div className="h-6 bg-black/50 rounded-full overflow-hidden border border-white/20">
        <div 
          className={`h-full bg-gradient-to-r ${barColor} health-bar-fill rounded-full ${
            isPlayer ? '' : 'ml-auto'
          }`}
          style={{ 
            width: `${percentage}%`,
            transformOrigin: isPlayer ? 'left' : 'right'
          }}
        />
      </div>
      <div className={`text-xs mt-1 ${isPlayer ? 'text-left' : 'text-right'} text-gray-400`}>
        {hp} / {maxHp}
      </div>
    </div>
  )
}
