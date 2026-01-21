import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useUserStore } from '../stores/userStore'
import { useGameStore } from '../stores/gameStore'
import { Sword, Shield, Zap, Trophy, Timer } from 'lucide-react'

// Helper to get full avatar URL (duplicated from LobbyScreen for self-containment or can be moved to utils)
const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const baseUrl = apiUrl.includes('/api') ? apiUrl.split('/api')[0] : apiUrl;
    if (avatarUrl.startsWith('/')) {
        return baseUrl ? `${baseUrl}${avatarUrl}` : avatarUrl;
    }
    return avatarUrl;
};

// Check if avatarUrl is an image path (not emoji)
const isImageUrl = (avatarUrl) => {
    if (!avatarUrl) return false;
    return avatarUrl.startsWith('/') || avatarUrl.startsWith('http');
};

/**
 * KeyMashGame - F/J 키 연타 미니게임 컴포넌트
 * 먼저 targetCount에 도달한 플레이어가 선공권 획득
 */
export default function KeyMashGame({ roomId, targetCount = 50, onComplete, myAvatarUrl: myAvatarUrlProp, opponentAvatarUrl: opponentAvatarUrlProp }) {
    const [myCount, setMyCount] = useState(0)
    const [opponentCount, setOpponentCount] = useState(0)
    const [winner, setWinner] = useState(null)
    const [isStarted, setIsStarted] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [showResult, setShowResult] = useState(false)

    const { emit, on, off } = useSocket()
    
    const user = useUserStore((s) => s.user)
    const { opponentNickname, opponentAvatarUrl: opponentAvatarUrlFromStore } = useGameStore()
    
    // Use prop if provided, otherwise fallback to store
    const opponentAvatarUrl = opponentAvatarUrlProp || opponentAvatarUrlFromStore
    
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
            setShowResult(true)
            
            // 3초 후 게임 종료 콜백 (결과 화면을 보여주기 위해 시간 늘림)
            setTimeout(() => {
                onComplete?.(data.winner_id === myUserId)
            }, 3000)
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
    
    const myAvatarRaw = myAvatarUrlProp || user?.avatar_url
    const oppAvatarRaw = opponentAvatarUrl
    const myAvatar = isImageUrl(myAvatarRaw) ? getAvatarUrl(myAvatarRaw) : null
    const oppAvatar = isImageUrl(oppAvatarRaw) ? getAvatarUrl(oppAvatarRaw) : null
    const myEmoji = !isImageUrl(myAvatarRaw) ? myAvatarRaw : null
    const oppEmoji = !isImageUrl(oppAvatarRaw) ? oppAvatarRaw : null

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-slate-900">
            {/* 배경 그라디언트 및 효과 */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 animate-gradient-xy" />
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            
            {/* Animated Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] animate-pulse delay-1000" />

            {/* 메인 컨텐츠 */}
            <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
                
                {/* 헤더 타이틀 */}
                <div className="text-center mb-12 transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Zap className="w-8 h-8 text-yellow-400 animate-bounce" />
                        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-cyan-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                            SPEED BATTLE
                        </h1>
                        <Zap className="w-8 h-8 text-yellow-400 animate-bounce" />
                    </div>
                    <p className="text-xl font-medium text-blue-200/80 tracking-widest uppercase">
                        Mash <span className="text-yellow-400 font-bold mx-1">F</span> & <span className="text-yellow-400 font-bold mx-1">J</span> to Attack First!
                    </p>
                </div>

                {/* 대결 구도 UI */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    
                    {/* 나 (왼쪽) */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 p-6 rounded-2xl flex flex-col items-center">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-blue-400 to-cyan-400">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                                        {myAvatar ? (
                                            <img src={myAvatar} alt="Me" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">{myEmoji || '👤'}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-slate-900">
                                    YOU
                                </div>
                            </div>
                            <div className="text-xl font-bold text-white mb-1">{user?.nickname || 'Player 1'}</div>
                            <div className="text-blue-300 text-sm font-medium mb-4">{myCount} / {targetCount}</div>
                            
                            {/* Progress Bar */}
                            <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-100 ease-out"
                                    style={{ width: `${myProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 상대방 (오른쪽) */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-pink-500/30 p-6 rounded-2xl flex flex-col items-center">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-pink-400 to-rose-400">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                                        {oppAvatar ? (
                                            <img src={oppAvatar} alt="Opponent" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">{oppEmoji || '🤖'}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-slate-900">
                                    ENEMY
                                </div>
                            </div>
                            <div className="text-xl font-bold text-white mb-1">{opponentNickname || 'Opponent'}</div>
                            <div className="text-pink-300 text-sm font-medium mb-4">{opponentCount} / {targetCount}</div>
                            
                            {/* Progress Bar */}
                            <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                                <div 
                                    className="h-full bg-gradient-to-r from-pink-600 to-rose-400 transition-all duration-100 ease-out"
                                    style={{ width: `${opponentProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* 키 가이드 */}
                <div className="flex gap-12 justify-center items-center">
                    <div className={`flex flex-col items-center gap-2 transform transition-all duration-100 ${isStarted && !winner ? 'scale-110' : 'opacity-50'}`}>
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 shadow-[0_8px_0_rgb(30,41,59)] border-t border-slate-600 flex items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-lg">F</span>
                        </div>
                    </div>
                    <div className={`flex flex-col items-center gap-2 transform transition-all duration-100 ${isStarted && !winner ? 'scale-110' : 'opacity-50'}`}>
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 shadow-[0_8px_0_rgb(30,41,59)] border-t border-slate-600 flex items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-lg">J</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Countdown Overlay */}
            {countdown > 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="transform animate-[bounce_1s_infinite]">
                        <span className="text-[12rem] font-black text-white transparent-text-stroke drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]">
                            {countdown}
                        </span>
                    </div>
                </div>
            )}

            {/* Result Overlay */}
            {showResult && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl grid grid-cols-2 gap-0 items-center transform scale-110">
                        
                        {/* WINNER SIDE */}
                        <div className={`flex flex-col items-center justify-center p-12 transition-all duration-500 border-y-4 border-r-2 ${isMyWin 
                            ? 'bg-gradient-to-r from-blue-900/80 to-cyan-900/80 border-cyan-400' 
                            : 'bg-gradient-to-r from-gray-900/80 to-slate-900/80 border-gray-600 opacity-60 grayscale'
                        }`}>
                            <div className="relative mb-6">
                                <div className={`w-40 h-40 rounded-full p-2 ${isMyWin ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`}>
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border-4 border-white">
                                        {myAvatar ? (
                                            <img src={myAvatar} alt="Me" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl">{myEmoji || '👤'}</div>
                                        )}
                                    </div>
                                </div>
                                {isMyWin && <CrownBadge />}
                            </div>
                            <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-2 ${isMyWin ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'text-gray-400'}`}>
                                {isMyWin ? 'ATTACK FIRST' : 'ATTACK SECOND'}
                            </h2>
                            <p className="text-white/80 font-bold text-xl">{user?.nickname}</p>
                        </div>

                        {/* LOSER SIDE */}
                        <div className={`flex flex-col items-center justify-center p-12 transition-all duration-500 border-y-4 border-l-2 ${!isMyWin 
                            ? 'bg-gradient-to-l from-pink-900/80 to-rose-900/80 border-pink-400' 
                            : 'bg-gradient-to-l from-gray-900/80 to-slate-900/80 border-gray-600 opacity-60 grayscale'
                        }`}>
                            <div className="relative mb-6">
                                <div className={`w-40 h-40 rounded-full p-2 ${!isMyWin ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`}>
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border-4 border-white">
                                        {oppAvatar ? (
                                            <img src={oppAvatar} alt="Opponent" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl">{oppEmoji || '🤖'}</div>
                                        )}
                                    </div>
                                </div>
                                {!isMyWin && <CrownBadge />}
                            </div>
                            <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-2 ${!isMyWin ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'text-gray-400'}`}>
                                {!isMyWin ? 'ATTACK FIRST' : 'ATTACK SECOND'}
                            </h2>
                            <p className="text-white/80 font-bold text-xl">{opponentNickname || 'Opponent'}</p>
                        </div>

                    </div>
                    
                    <div className="mt-12 animate-bounce">
                        <p className="text-white text-lg font-light tracking-widest opacity-80">STARTING BATTLE...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function CrownBadge() {
    return (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <Trophy className="w-16 h-16 text-yellow-300 drop-shadow-lg fill-yellow-500" />
        </div>
    )
}

