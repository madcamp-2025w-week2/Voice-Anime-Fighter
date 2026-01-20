import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useBattleCharacter } from '../hooks/useBattleCharacter'

/**
 * BattleCharacter Component
 * 음성 인식 기반 전투 캐릭터 컴포넌트
 * 
 * Features:
 * - 스킬 2개 + 궁극기 1개 시스템
 * - 게이지 시스템 (3회 성공 = 100%)
 * - 궁극기는 100% 도달 후 다음 턴부터 사용 가능
 * - 스킬/궁극기 발동 시 이미지 전환 및 CSS 애니메이션
 */
export default function BattleCharacter({
  character,
  transcript,
  onSkillTrigger,
  onUltimateTrigger,
  isMyTurn,
  onTurnStart,
  className = '',
  side = 'left' // 'left' or 'right' for positioning
}) {
  const {
    gauge,
    isUltimateReady,
    currentImage,
    effectClass,
    currentSkills,
    isActivating,
    gaugeSegments,
    startNewTurn,
    processTranscript
  } = useBattleCharacter(character)

  // 턴 시작 시 새로운 스킬 설정
  useEffect(() => {
    if (isMyTurn) {
      startNewTurn()
      onTurnStart?.()
    }
  }, [isMyTurn, startNewTurn, onTurnStart])

  // transcript 변경 시 분석 및 스킬/궁극기 발동
  useEffect(() => {
    if (!transcript || !isMyTurn || isActivating) return

    const result = processTranscript(transcript)

    if (result.matched) {
      if (result.type === 'ultimate' && onUltimateTrigger) {
        onUltimateTrigger(result.skill, result.similarity)
      } else if (result.type === 'skill' && onSkillTrigger) {
        onSkillTrigger(result.skill, result.similarity)
      }
    }
  }, [transcript, isMyTurn, isActivating, processTranscript, onSkillTrigger, onUltimateTrigger])

  if (!character) return null

  return (
    <div className={`battle-character ${side} ${className}`}>
      {/* 캐릭터 이미지 */}
      <div className={`character-image-container ${effectClass}`}>
        <img
          src={currentImage || character.defaultImg}
          alt={character.name || 'Character'}
          className={`character-image ${side === 'right' ? 'transform scale-x-[-1]' : ''}`}
          style={{
            height: '200px',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 10px ${effectClass === 'ultimate-effect' ? 'rgba(255,215,0,0.8)' : 'rgba(236,72,153,0.3)'})`
          }}
        />
      </div>

      {/* 궁극기 게이지 */}
      <div className="gauge-container mt-4">
        <div className="gauge-bar bg-gray-800/80 h-4 rounded-full overflow-hidden border border-purple-500/50">
          <div
            className={`gauge-fill h-full transition-all duration-300 ${
              isUltimateReady 
                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
            style={{ width: `${gauge}%` }}
          />
        </div>
        
        {/* 게이지 세그먼트 표시 */}
        <div className="gauge-segments flex justify-between mt-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-6 h-2 rounded ${
                gaugeSegments > i 
                  ? 'bg-pink-400' 
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        
        {/* 궁극기 준비 표시 */}
        {isUltimateReady && (
          <div className="ultimate-ready-indicator text-center mt-2">
            <span className="text-yellow-400 font-bold text-sm animate-pulse">
              ✨ ULTIMATE READY! ✨
            </span>
          </div>
        )}
      </div>

      {/* 현재 스킬 대사 표시 */}
      {isMyTurn && currentSkills.length > 0 && (
        <div className="skills-display mt-4 space-y-2">
          {isUltimateReady && character.ultimate && (
            <div className="skill-trigger p-2 rounded-lg bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400">
              <span className="text-yellow-300 text-xs font-bold">궁극기:</span>
              <p className="text-yellow-100 text-sm">{character.ultimate.trigger}</p>
            </div>
          )}
          {currentSkills.slice(0, 1).map((skill, index) => (
            <div 
              key={index}
              className="skill-trigger p-2 rounded-lg bg-pink-500/20 border border-pink-400/50"
            >
              <span className="text-pink-300 text-xs font-bold">스킬:</span>
              <p className="text-white text-sm">{skill.trigger}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

BattleCharacter.propTypes = {
  character: PropTypes.shape({
    name: PropTypes.string,
    defaultImg: PropTypes.string.isRequired,
    skills: PropTypes.arrayOf(PropTypes.shape({
      trigger: PropTypes.string.isRequired,
      image: PropTypes.string,
      duration: PropTypes.number
    })).isRequired,
    ultimate: PropTypes.shape({
      trigger: PropTypes.string.isRequired,
      image: PropTypes.string,
      effectClass: PropTypes.string,
      duration: PropTypes.number
    }).isRequired
  }),
  transcript: PropTypes.string,
  onSkillTrigger: PropTypes.func,
  onUltimateTrigger: PropTypes.func,
  onTurnStart: PropTypes.func,
  isMyTurn: PropTypes.bool,
  className: PropTypes.string,
  side: PropTypes.oneOf(['left', 'right'])
}
