import { useErrorStore } from '../stores/errorStore'

const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * 중앙화된 API 호출 래퍼
 * 401 에러 시 자동으로 에러 모달 표시
 */
export async function apiFetch(endpoint, options = {}) {
  const { showUnauthorized, showNetworkError } = useErrorStore.getState()
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options)
    
    // 401 Unauthorized 처리
    if (response.status === 401) {
      showUnauthorized()
      throw new Error('Unauthorized')
    }
    
    // 다른 에러 상태 처리
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP Error: ${response.status}`)
    }
    
    return response
  } catch (error) {
    // 네트워크 에러 (fetch 자체 실패)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showNetworkError()
    }
    throw error
  }
}

/**
 * JSON 응답을 자동으로 파싱하는 래퍼
 */
export async function apiFetchJson(endpoint, options = {}) {
  const response = await apiFetch(endpoint, options)
  return response.json()
}

/**
 * 인증된 요청을 위한 래퍼 (token 자동 포함)
 */
export function createAuthenticatedFetch(token) {
  return async function authenticatedFetch(endpoint, options = {}) {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    }
    return apiFetch(endpoint, { ...options, headers })
  }
}
