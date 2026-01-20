/**
 * String Similarity Utility
 * Levenshtein Distance 기반 문자열 유사도 계산
 */

/**
 * 텍스트 정규화 - 비교를 위해 공백/특수문자 제거
 * @param {string} text - 원본 텍스트
 * @returns {string} - 정규화된 텍스트
 */
export function normalizeText(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[\s!?！？.,。、~～·\-''""`]/g, '') // 공백 및 특수문자 제거
    .trim()
}

/**
 * Levenshtein Distance 계산
 * 두 문자열 간의 편집 거리를 계산
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} - 편집 거리
 */
export function levenshteinDistance(str1, str2) {
  const m = str1.length
  const n = str2.length

  // 빈 문자열 처리
  if (m === 0) return n
  if (n === 0) return m

  // DP 테이블 생성
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  // 초기값 설정
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // DP 채우기
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // 삭제
        dp[i][j - 1] + 1,      // 삽입
        dp[i - 1][j - 1] + cost // 대체
      )
    }
  }

  return dp[m][n]
}

/**
 * 두 문자열 간의 유사도 계산 (0~1 사이 값 반환)
 * 1 = 완전 일치, 0 = 완전 다름
 * @param {string} str1 - 첫 번째 문자열 (사용자 입력)
 * @param {string} str2 - 두 번째 문자열 (기대 텍스트)
 * @returns {number} - 유사도 (0~1)
 */
export function calculateSimilarity(str1, str2) {
  // 정규화
  const normalized1 = normalizeText(str1)
  const normalized2 = normalizeText(str2)

  // 빈 문자열 처리
  if (!normalized1 && !normalized2) return 1
  if (!normalized1 || !normalized2) return 0

  // Levenshtein Distance 계산
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)

  // 유사도 = 1 - (거리 / 최대 길이)
  return 1 - (distance / maxLength)
}

/**
 * 스킬/궁극기 발동 임계값 체크
 * @param {number} similarity - 유사도 값
 * @param {number} threshold - 임계값 (기본 0.9 = 90%)
 * @returns {boolean} - 발동 여부
 */
export function meetsThreshold(similarity, threshold = 0.9) {
  return similarity >= threshold
}

/**
 * 스킬 대사 매칭 체크 (90% 이상)
 * @param {string} transcript - 사용자 음성 텍스트
 * @param {string} trigger - 스킬 트리거 대사
 * @returns {{ isMatch: boolean, similarity: number }}
 */
export function checkSkillMatch(transcript, trigger) {
  const similarity = calculateSimilarity(transcript, trigger)
  return {
    isMatch: meetsThreshold(similarity, 0.9),
    similarity
  }
}

/**
 * 궁극기 대사 매칭 체크 (95% 이상)
 * @param {string} transcript - 사용자 음성 텍스트
 * @param {string} trigger - 궁극기 트리거 대사
 * @returns {{ isMatch: boolean, similarity: number }}
 */
export function checkUltimateMatch(transcript, trigger) {
  const similarity = calculateSimilarity(transcript, trigger)
  return {
    isMatch: meetsThreshold(similarity, 0.95),
    similarity
  }
}
