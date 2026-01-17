import { useNavigate } from 'react-router-dom'
import { useErrorStore, ERROR_TYPES } from '../stores/errorStore'
import { useUserStore } from '../stores/userStore'
import { useSocket } from '../hooks/useSocket'

export default function ErrorModal() {
  const navigate = useNavigate()
  const { error, clearError } = useErrorStore()
  const { logout } = useUserStore()
  
  if (!error) return null
  
  const handleAction = () => {
    switch (error.actionType) {
      case 'LOGIN':
        logout()
        clearError()
        navigate('/')
        break
      case 'RECONNECT':
      case 'REFRESH':
        // 페이지 새로고침
        clearError()
        window.location.reload()
        break
      case 'NAVIGATE_LOBBY':
        clearError()
        navigate('/lobby')
        break
      case 'RETRY':
      case 'DISMISS':
      default:
        clearError()
    }
  }
  
  const handleClose = () => {
    // 401 에러는 닫기만으로 무시할 수 없음
    if (error.type === ERROR_TYPES.UNAUTHORIZED) {
      handleAction()
    } else {
      clearError()
    }
  }
  
  // 에러 타입에 따른 아이콘
  const getIcon = () => {
    switch (error.type) {
      case ERROR_TYPES.UNAUTHORIZED:
        return '🔒'
      case ERROR_TYPES.SOCKET_DISCONNECT:
        return '🔌'
      case ERROR_TYPES.NETWORK_ERROR:
        return '📡'
      case ERROR_TYPES.SERVER_ERROR:
        return '🔥'
      case ERROR_TYPES.NOT_FOUND:
        return '🔍'
      case ERROR_TYPES.CONFLICT:
        return '✋'
      default:
        return '⚠️'
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 px-6 py-4 border-b border-red-500/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getIcon()}</span>
              <h2 className="text-xl font-bold text-white">
                {error.title || '오류 발생'}
              </h2>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-gray-300 text-center leading-relaxed">
              {error.message}
            </p>
          </div>
          
          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            {error.type !== ERROR_TYPES.UNAUTHORIZED && (
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                닫기
              </button>
            )}
            <button
              onClick={handleAction}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30"
            >
              {error.actionLabel || '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
