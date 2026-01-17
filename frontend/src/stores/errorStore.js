import { create } from 'zustand'

export const ERROR_TYPES = {
  UNAUTHORIZED: 'UNAUTHORIZED',      // 401 인증 에러
  NOT_FOUND: 'NOT_FOUND',            // 404 리소스 없음
  CONFLICT: 'CONFLICT',              // 409 충돌 (이미 참여 등)
  SERVER_ERROR: 'SERVER_ERROR',      // 5xx 서버 에러
  SOCKET_DISCONNECT: 'SOCKET_DISCONNECT',  // Socket 연결 끊김
  NETWORK_ERROR: 'NETWORK_ERROR',    // 네트워크 에러
  GENERAL: 'GENERAL',                // 일반 에러
}

export const useErrorStore = create((set) => ({
  error: null,
  
  showError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // 편의 메서드들
  showUnauthorized: () => set({
    error: {
      type: ERROR_TYPES.UNAUTHORIZED,
      title: '세션 만료',
      message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
      actionLabel: '다시 로그인',
      actionType: 'LOGIN',
    }
  }),

  // 서버 에러 (500, 502, 503...)
  showServerError: (message) => set({
    error: {
      type: ERROR_TYPES.SERVER_ERROR,
      title: '서버 오류',
      message: message || '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      actionLabel: '새로고침',
      actionType: 'REFRESH',
    }
  }),

  // 404 Not Found
  showNotFound: (message) => set({
    error: {
      type: ERROR_TYPES.NOT_FOUND,
      title: '알 수 없음',
      message: message || '요청하신 리소스를 찾을 수 없습니다.',
      actionLabel: '확인',
      actionType: 'DISMISS', // 기본값은 닫기
    }
  }),

  // 409 Conflict
  showConflict: (message) => set({
    error: {
      type: ERROR_TYPES.CONFLICT,
      title: '요청 불가',
      message: message || '현재 상태에서는 요청을 처리할 수 없습니다.',
      actionLabel: '확인',
      actionType: 'DISMISS',
    }
  }),
  
  showSocketDisconnect: () => set({
    error: {
      type: ERROR_TYPES.SOCKET_DISCONNECT,
      title: '연결 끊김',
      message: '서버와 연결이 끊어졌습니다. 네트워크 상태를 확인해주세요.',
      actionLabel: '재연결',
      actionType: 'RECONNECT',
    }
  }),
  
  showNetworkError: () => set({
    error: {
      type: ERROR_TYPES.NETWORK_ERROR,
      title: '네트워크 오류',
      message: '네트워크 연결을 확인해주세요.',
      actionLabel: '다시 시도',
      actionType: 'RETRY',
    }
  }),

  // 커스텀 에러
  showCustomError: ({ title, message, actionLabel, actionType = 'DISMISS' }) => set({
    error: {
      type: ERROR_TYPES.GENERAL,
      title: title || '오류',
      message: message || '알 수 없는 오류가 발생했습니다.',
      actionLabel: actionLabel || '확인',
      actionType,
    }
  }),
}))
