import { useState, useCallback, useEffect, useRef } from 'react'
import { calculateSimilarity, checkSkillMatch, checkUltimateMatch } from '../utils/stringSimilarity'

/**
 * useBattleCharacter Hook
 * 캐릭터 전투 상태 관리 - 게이지, 스킬, 궁극기 시스템
 * 
 * @param {Object} character - 캐릭터 데이터
 * @param {string} character.defaultImg - 기본 이미지
 * @param {Array} character.skills - 스킬 배열 (2개)
 * @param {Object} character.ultimate - 궁극기 데이터
 * @returns {Object} - 전투 상태 및 함수들
 */
export function useBattleCharacter(character) {
  // 궁극기 게이지 (0 ~ 100, 3번 성공 = 100%)
  const [gauge, setGauge] = useState(0)

  // 궁극기 사용 가능 상태 (다음 턴부터 활성화)
  const [isUltimateReady, setIsUltimateReady] = useState(false)

  // 게이지가 100%에 도달했는지 추적 (다음 턴에 ultimate 활성화를 위해)
  const gaugeReachedFullRef = useRef(false)

  // 현재 표시 중인 이미지 (스킬/궁극기 발동 시 변경)
  const [currentImage, setCurrentImage] = useState(character?.defaultImg || '')

  // 현재 활성화된 CSS 효과 클래스
  const [effectClass, setEffectClass] = useState('')

  // 턴 카운트 (궁극기 타이밍 추적용)
  const [turnCount, setTurnCount] = useState(0)

  // 이번 턴에 제시된 스킬들 (랜덤 선택)
  const [currentSkills, setCurrentSkills] = useState([])

  // 스킬/궁극기 발동 중 상태
  const [isActivating, setIsActivating] = useState(false)

  // 스킬 풀 (덱 셔플 알고리즘용 - 아직 나오지 않은 스킬들)
  const [availableSkillPool, setAvailableSkillPool] = useState([])

  // 이전 캐릭터 ID 추적 (캐릭터 변경 감지용)
  const prevCharacterIdRef = useRef(null)

  // 캐릭터 변경 시 이미지 및 스킬 풀 초기화
  useEffect(() => {
    if (character?.defaultImg) {
      setCurrentImage(character.defaultImg)
    }

    // 캐릭터가 실제로 변경되었을 때만 스킬 풀 리셋 (무한 루프 방지)
    const currentCharId = character?.id || character?.defaultImg
    if (character?.skills && prevCharacterIdRef.current !== currentCharId) {
      setAvailableSkillPool([...character.skills])
      prevCharacterIdRef.current = currentCharId
    }
  }, [character?.defaultImg, character?.id]) // skills 대신 id를 의존성으로 사용

  /**
   * Fisher-Yates 셔플 알고리즘 (균등한 랜덤 분포)
   */
  const fisherYatesShuffle = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * 새로운 턴 시작 시 호출
   * - 덱 셔플 알고리즘으로 스킬 선택 (모든 스킬이 한 번씩 나온 후 리셋)
   * - 게이지 100% 도달 후 다음 턴이면 궁극기 활성화
   */
  const startNewTurn = useCallback(() => {
    setTurnCount(prev => prev + 1)

    // 게이지 100% 도달 후 다음 턴이면 궁극기 활성화
    if (gaugeReachedFullRef.current && !isUltimateReady) {
      setIsUltimateReady(true)
    }

    // 덱 셔플 알고리즘으로 스킬 선택
    if (character?.skills && character.skills.length >= 2) {
      setAvailableSkillPool(prevPool => {
        // 풀이 비어있으면 모든 스킬로 리셋 (새 사이클 시작)
        let pool = prevPool.length > 0 ? [...prevPool] : [...character.skills]

        // Fisher-Yates로 풀을 셔플
        const shuffledPool = fisherYatesShuffle(pool)

        // 첫 번째 스킬을 선택하고 풀에서 제거
        const selectedSkill = shuffledPool[0]
        const remainingPool = shuffledPool.slice(1)

        // 선택된 스킬을 currentSkills의 첫 번째로, 나머지는 뒤에 배치
        const otherSkills = character.skills.filter(s => s.name !== selectedSkill.name)
        setCurrentSkills([selectedSkill, ...fisherYatesShuffle(otherSkills)])

        console.log(`🎲 Skill selected: ${selectedSkill.name} | Remaining in pool: ${remainingPool.length}/${character.skills.length}`)

        return remainingPool
      })
    }

    // 이미지 초기화
    setCurrentImage(character?.defaultImg || '')
    setEffectClass('')
  }, [character, isUltimateReady])

  /**
   * transcript 분석 및 스킬/궁극기 매칭
   * @param {string} transcript - 음성 인식 결과
   * @returns {Object} - 매칭 결과
   */
  const analyzeTranscript = useCallback((transcript) => {
    if (!transcript || transcript.trim().length === 0) {
      return { matched: false, type: null, skill: null, similarity: 0 }
    }

    // 1. 궁극기 체크 (isUltimateReady일 때만)
    if (isUltimateReady && character?.ultimate) {
      const ultimateResult = checkUltimateMatch(transcript, character.ultimate.trigger)
      if (ultimateResult.isMatch) {
        return {
          matched: true,
          type: 'ultimate',
          skill: character.ultimate,
          similarity: ultimateResult.similarity
        }
      }
    }

    // 2. 일반 스킬 체크
    for (const skill of currentSkills) {
      const skillResult = checkSkillMatch(transcript, skill.trigger)
      if (skillResult.isMatch) {
        return {
          matched: true,
          type: 'skill',
          skill: skill,
          similarity: skillResult.similarity
        }
      }
    }

    // 3. 매칭 실패 - 가장 높은 유사도 반환
    let bestMatch = { similarity: 0, skill: null }
    for (const skill of currentSkills) {
      const sim = calculateSimilarity(transcript, skill.trigger)
      if (sim > bestMatch.similarity) {
        bestMatch = { similarity: sim, skill }
      }
    }

    return {
      matched: false,
      type: null,
      skill: bestMatch.skill,
      similarity: bestMatch.similarity
    }
  }, [character, currentSkills, isUltimateReady])

  /**
   * 스킬 발동 처리
   * @param {Object} skill - 발동할 스킬
   * @param {number} duration - 스킬 지속 시간 (ms)
   */
  const activateSkill = useCallback((skill, duration = 1500) => {
    if (isActivating) return

    setIsActivating(true)

    // 이미지 변경
    if (skill.image) {
      setCurrentImage(skill.image)
    }

    // CSS 효과 클래스 적용
    setEffectClass('skill-effect')

    // 게이지 증가 (1/3 = 약 33.33%)
    setGauge(prev => {
      const newGauge = Math.min(100, prev + 100 / 3)
      // 게이지 100% 도달 체크
      if (newGauge >= 100) {
        gaugeReachedFullRef.current = true
      }
      return newGauge
    })

    // duration 후 원래 상태로 복귀
    setTimeout(() => {
      setCurrentImage(character?.defaultImg || '')
      setEffectClass('')
      setIsActivating(false)
    }, skill.duration || duration)
  }, [character?.defaultImg, isActivating])

  /**
   * 궁극기 발동 처리
   * @param {Object} ultimate - 발동할 궁극기
   */
  const activateUltimate = useCallback((ultimate) => {
    if (isActivating || !isUltimateReady) return

    setIsActivating(true)

    // 이미지 변경
    if (ultimate.image) {
      setCurrentImage(ultimate.image)
    }

    // 궁극기 전용 CSS 효과 클래스 적용
    setEffectClass(ultimate.effectClass || 'ultimate-effect')

    // 궁극기 사용 후 게이지 초기화
    setGauge(0)
    setIsUltimateReady(false)
    gaugeReachedFullRef.current = false

    // 궁극기 효과 duration (기본 3초)
    const ultimateDuration = ultimate.duration || 3000

    setTimeout(() => {
      setCurrentImage(character?.defaultImg || '')
      setEffectClass('')
      setIsActivating(false)
    }, ultimateDuration)
  }, [character?.defaultImg, isActivating, isUltimateReady])

  /**
   * transcript 처리 후 적절한 스킬/궁극기 발동
   * @param {string} transcript - 음성 인식 결과
   * @returns {Object} - 처리 결과
   */
  const processTranscript = useCallback((transcript) => {
    const result = analyzeTranscript(transcript)

    if (result.matched) {
      if (result.type === 'ultimate') {
        activateUltimate(result.skill)
      } else if (result.type === 'skill') {
        activateSkill(result.skill)
      }
    }

    return result
  }, [analyzeTranscript, activateSkill, activateUltimate])

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setGauge(0)
    setIsUltimateReady(false)
    gaugeReachedFullRef.current = false
    setCurrentImage(character?.defaultImg || '')
    setEffectClass('')
    setTurnCount(0)
    setCurrentSkills([])
    setIsActivating(false)
  }, [character?.defaultImg])

  return {
    // 상태
    gauge,
    isUltimateReady,
    currentImage,
    effectClass,
    currentSkills,
    turnCount,
    isActivating,

    // 계산된 값
    gaugePercentage: gauge,
    gaugeSegments: Math.floor(gauge / (100 / 3)), // 0, 1, 2, 3

    // 함수
    startNewTurn,
    analyzeTranscript,
    processTranscript,
    activateSkill,
    activateUltimate,
    reset
  }
}
