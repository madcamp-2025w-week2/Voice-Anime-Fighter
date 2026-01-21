import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useUserStore } from '../stores/userStore'

/**
 * KeyMashGame - F/J 키 연타 미니게임 컴포넌트
 * 먼저 targetCount에 도달한 플레이어가 선공권 획득
 */
export default function KeyMashGame({ roomId, targetCount = 50, onComplete }) {
    const [myCount, setMyCount] = useState(0)
    const [opponentCount, setOpponentCount] = useState(0)
    const [winner, setWinner] = useState(null)
    const [isStarted, setIsStarted] = useState(false)
    const [countdown, setCountdown] = useState(3)

    const { emit, on, off } = useSocket()
    const user = useUserStore((s) => s.user)
    const myUserId = user?.id

    const hasEmittedWinner = useRef(false)

    // 카운트다운 후 게임 시작
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (countdown === 0 && !isStarted) {
            setIsStarted(true)
        }
    }, [countdown, isStarted])

    // 상대방 진행도 수신
    useEffect(() => {
        const handleProgress = (data) => {
            if (data.user_id !== myUserId) {
                setOpponentCount(data.count)
            }
        }

        const handleWinner = (data) => {
            setWinner(data.winner_id)
            // 1.5초 후 게임 종료 콜백
            setTimeout(() => {
                onComplete?.(data.winner_id === myUserId)
            }, 1500)
        }

        on('minigame:progress', handleProgress)
        on('minigame:winner', handleWinner)

        return () => {
            off('minigame:progress')
            off('minigame:winner')
        }
    }, [on, off, myUserId, onComplete])

    // 키 입력 핸들러
    const handleKeyDown = useCallback((e) => {
        if (!isStarted || winner) return

        // F, J, ㄹ(r), ㅓ(j) 키 허용
        const validKeys = ['f', 'j', 'F', 'J', 'ㄹ', 'ㅓ']
        if (!validKeys.includes(e.key)) return

        e.preventDefault()

        setMyCount((prev) => {
            const newCount = prev + 1

            // 진행도 전송
            emit('minigame:progress', {
                room_id: roomId,
                count: newCount
            })

            // 승리 조건 체크
            if (newCount >= targetCount && !hasEmittedWinner.current) {
                hasEmittedWinner.current = true
                emit('minigame:winner', {
                    room_id: roomId,
                    winner_id: myUserId
                })
            }

            return newCount
        })
    }, [isStarted, winner, emit, roomId, targetCount, myUserId])

    // 키 이벤트 등록
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    const myProgress = Math.min((myCount / targetCount) * 100, 100)
    const opponentProgress = Math.min((opponentCount / targetCount) * 100, 100)
    const isMyWin = winner === myUserId

    return (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 z-50 flex flex-col items-center justify-center">
            {/* 배경 효과 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500 rounded-full blur-3xl opacity-20 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* 카운트다운 */}
            {countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="text-9xl font-black text-white animate-bounce" style={{ textShadow: '0 0 40px rgba(255,255,255,0.8)' }}>
                        {countdown}
                    </div>
                </div>
            )}

            {/* 승리 화면 */}
            {winner && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <div className={`text-5xl md:text-7xl font-black animate-pulse ${isMyWin ? 'text-green-400' : 'text-red-400'}`}
                        style={{ textShadow: `0 0 40px ${isMyWin ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)'}` }}>
                        {isMyWin ? '🎉 선공권 획득!' : '😢 상대방 선공...'}
                    </div>
                </div>
            )}

            {/* 게임 UI */}
            <div className="relative z-0 w-full max-w-2xl px-8">
                {/* 타이틀 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300"
                        style={{ textShadow: '0 0 20px rgba(255,200,100,0.5)' }}>
                        ⚡ KEY MASH BATTLE ⚡
                    </h1>
                    <p className="mt-2 text-xl text-white/80">
                        F 또는 J 키를 연타하세요!
                    </p>
                </div>

                {/* 내 진행 바 */}
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-lg font-bold text-cyan-300">나</span>
                        <span className="text-lg font-bold text-white">{myCount} / {targetCount}</span>
                    </div>
                    <div className="h-8 bg-gray-800/80 rounded-full overflow-hidden border-2 border-cyan-400/50">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75 relative"
                            style={{ width: `${myProgress}%` }}
                        >
                            {myProgress > 10 && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>

                {/* 상대방 진행 바 */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        <span className="text-lg font-bold text-pink-300">상대방</span>
                        <span className="text-lg font-bold text-white">{opponentCount} / {targetCount}</span>
                    </div>
                    <div className="h-8 bg-gray-800/80 rounded-full overflow-hidden border-2 border-pink-400/50">
                        <div
                            className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-75 relative"
                            style={{ width: `${opponentProgress}%` }}
                        >
                            {opponentProgress > 10 && (
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>

                {/* 키 힌트 */}
                <div className="flex justify-center gap-8">
                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-black transition-all duration-100 ${isStarted && !winner ? 'bg-white/90 text-gray-800 shadow-lg shadow-white/30' : 'bg-gray-700/50 text-gray-500'}`}>
                        F
                    </div>
                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-black transition-all duration-100 ${isStarted && !winner ? 'bg-white/90 text-gray-800 shadow-lg shadow-white/30' : 'bg-gray-700/50 text-gray-500'}`}>
                        J
                    </div>
                </div>
            </div>
        </div>
    )
}
