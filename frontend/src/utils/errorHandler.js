import { useErrorStore } from '../stores/errorStore'

/**
 * 전역 에러 처리 헬퍼 함수
 * API Response 객체 또는 JavaScript Error 객체를 받아 적절한 에러 모달을 표시합니다.
 * 
 * @param {Response|Error|any} error - 에러 객체 또는 Fetch Response
 * @param {string} customMessage - (옵션) 사용자 정의 메시지
 */
export async function handleApiError(error, customMessage = null) {
  const store = useErrorStore.getState()
  
  console.error('[ErrorHandler] Caught error:', error)

  // 1. Fetch Response 객체인 경우 (HTTP 상태 코드 처리)
  if (error instanceof Response) {
    try {
      // 401 Unauthorized
      if (error.status === 401) {
        store.showUnauthorized()
        return
      }
      
      // 404 Not Found
      if (error.status === 404) {
        store.showNotFound(customMessage)
        return
      }

      // 409 Conflict
      if (error.status === 409) {
        store.showConflict(customMessage)
        return
      }

      // 5xx Server Error
      if (error.status >= 500) {
        store.showServerError(customMessage)
        return
      }
      
      // 알 수 없는 HTTP 상태 (기타 4xx 등)
      if (!error.ok) {
        store.showCustomError({
          title: `오류 (${error.status})`,
          message: customMessage || '요청을 처리하는 중 문제가 발생했습니다.',
          actionLabel: '확인'
        })
        return
      }
    } catch (e) {
      console.error('[ErrorHandler] Failed to parse response:', e)
    }
  }

  // 2. JavaScript Error 객체인 경우
  if (error instanceof Error) {
    // 네트워크 에러 (fetch 실패 시 보통 TypeError 발생)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      store.showNetworkError()
      return
    }

    // 일반 에러
    store.showCustomError({
      title: '오류 발생',
      message: customMessage || error.message || '알 수 없는 오류가 발생했습니다.',
      actionLabel: '확인'
    })
    return
  }

  // 3. 그 외 (문자열 등)
  store.showCustomError({
    message: customMessage || String(error)
  })
}
