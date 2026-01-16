import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Users, Trophy, MessageSquare, Send, Crown, Swords } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useUserStore } from '../stores/userStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export default function SocialScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, token } = useUserStore()
  const { on, off, joinRoom, sendMessage, sendReady, startGame } = useSocket()
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'rooms')
  const [rooms, setRooms] = useState([])
  const [rankings, setRankings] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [opponent, setOpponent] = useState(null) // 상대방 정보
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  const chatEndRef = useRef(null)

  // Fetch rooms
  useEffect(() => {
    const mockRooms = [
      { room_id: '1', name: '초보자 환영!', host_nickname: '루루핑마스터', player_count: 1, max_players: 2, status: 'waiting' },
      { room_id: '2', name: '고수만 와라', host_nickname: '다크플레임', player_count: 1, max_players: 2, status: 'waiting' },
      { room_id: '3', name: '친선 경기', host_nickname: '냥댕이', player_count: 2, max_players: 2, status: 'playing' },
    ]
    
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          // 서버 방이 없으면 mock 데이터 표시
          setRooms(data.rooms.length > 0 ? data.rooms : mockRooms)
        } else {
          setRooms(mockRooms)
        }
      } catch (err) {
        // Mock data for demo
        setRooms(mockRooms)
      }
    }
    fetchRooms()
  }, [token])

  // Fetch rankings
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch(`${API_URL}/users/ranking?limit=10`)
        if (res.ok) {
          const data = await res.json()
          setRankings(data.rankings)
        }
      } catch (err) {
        // Mock data for demo
        setRankings([
          { rank: 1, nickname: '전설의 루루핑', elo_rating: 2500, wins: 150 },
          { rank: 2, nickname: '다크플레임마스터', elo_rating: 2350, wins: 120 },
          { rank: 3, nickname: '냥냥펀치킹', elo_rating: 2200, wins: 100 },
          { rank: 4, nickname: '오글거림의신', elo_rating: 2100, wins: 85 },
          { rank: 5, nickname: '초보마법소녀', elo_rating: 1950, wins: 70 },
        ])
      }
    }
    fetchRankings()
  }, [])

  // Socket events for room and chat
  useEffect(() => {
    // 채팅 메시지 수신
    on('chat:new_message', (data) => {
      setChatMessages(prev => [...prev, data])
    })

    // 플레이어 입장 이벤트
    on('room:player_joined', (data) => {
      console.log('Player joined:', data)
      // 상대방 정보 설정
      if (data.user_id !== user?.id) {
        setOpponent({
          id: data.user_id,
          nickname: data.nickname || '상대방',
          elo_rating: data.elo_rating || 1200
        })
        // 채팅에 입장 메시지
        setChatMessages(prev => [...prev, {
          nickname: 'System',
          message: `${data.nickname || '상대방'}님이 입장했습니다.`,
          timestamp: new Date().toISOString()
        }])
        // 방 정보 업데이트
        setSelectedRoom(prev => prev ? { ...prev, player_count: 2 } : null)
      }
    })

    // 플레이어 퇴장 이벤트
    on('room:player_left', (data) => {
      console.log('Player left:', data)
      if (data.user_id !== user?.id) {
        setOpponent(null)
        setChatMessages(prev => [...prev, {
          nickname: 'System',
          message: '상대방이 퇴장했습니다.',
          timestamp: new Date().toISOString()
        }])
        setSelectedRoom(prev => prev ? { ...prev, player_count: 1 } : null)
      }
    })

    // 게임 시작 이벤트
    on('room:game_start', (data) => {
      console.log('Game starting:', data)
      navigate('/battle')
    })

    return () => {
      off('chat:new_message')
      off('room:player_joined')
      off('room:player_left')
      off('room:game_start')
    }
  }, [on, off, user?.id, navigate])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleJoinRoom = (room) => {
    setSelectedRoom({ ...room, player_count: room.player_count })
    setOpponent(null)
    joinRoom(room.room_id)
    // Mock previous messages
    setChatMessages([
      { nickname: room.host_nickname, message: '안녕하세요! 환영합니다!', timestamp: new Date().toISOString() },
      { nickname: 'System', message: `${user?.nickname || '게스트'}님이 입장했습니다.`, timestamp: new Date().toISOString() },
    ])
    // 내가 호스트가 아니면 호스트를 상대방으로 설정
    if (room.host_nickname !== user?.nickname) {
      setOpponent({
        id: 'host',
        nickname: room.host_nickname,
        elo_rating: 1300
      })
      setSelectedRoom(prev => prev ? { ...prev, player_count: 2 } : null)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return
    sendMessage(selectedRoom.room_id, newMessage)
    setChatMessages(prev => [...prev, {
      nickname: user?.nickname || '나',
      message: newMessage,
      timestamp: new Date().toISOString()
    }])
    setNewMessage('')
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return
    // 데모 모드 - 직접 방 생성
    const newRoom = { 
      room_id: `room_${Date.now()}`, 
      name: newRoomName, 
      host_nickname: user?.nickname || '나', 
      player_count: 1, 
      max_players: 2, 
      status: 'waiting' 
    }
    setRooms(prev => [newRoom, ...prev])
    setShowCreateModal(false)
    setNewRoomName('')
    handleJoinRoom(newRoom)
  }

  const handleStartGame = () => {
    if (selectedRoom) {
      startGame(selectedRoom.room_id, `battle_${Date.now()}`)
      navigate('/multi-select') // 철권 스타일 캐릭터 선택으로
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Room List or Room Detail */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => selectedRoom ? setSelectedRoom(null) : navigate('/lobby')} className="p-2 glass rounded-lg hover:bg-white/20">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-title text-2xl text-magical-pink-400">
              {selectedRoom ? selectedRoom.name : '친구와 대결'}
            </h1>
          </div>
          {!selectedRoom && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-magical-pink-500 rounded-lg flex items-center gap-2 hover:bg-magical-pink-600 transition"
            >
              <Plus className="w-5 h-5" />
              방 만들기
            </button>
          )}
        </div>

        {/* Tabs (when no room selected) */}
        {!selectedRoom && (
          <div className="flex gap-2 mb-4">
            <TabButton 
              active={activeTab === 'rooms'} 
              onClick={() => setActiveTab('rooms')}
              icon={<Users className="w-4 h-4" />}
              label="방 목록"
            />
            <TabButton 
              active={activeTab === 'ranking'} 
              onClick={() => setActiveTab('ranking')}
              icon={<Trophy className="w-4 h-4" />}
              label="랭킹"
            />
          </div>
        )}

        {/* Content */}
        {!selectedRoom ? (
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'rooms' ? (
              <div className="space-y-3">
                {rooms.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>열린 방이 없습니다</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <button
                      key={room.room_id}
                      onClick={() => room.status === 'waiting' && handleJoinRoom(room)}
                      disabled={room.status === 'playing'}
                      className={`w-full glass rounded-xl p-4 text-left transition hover:bg-white/10 ${
                        room.status === 'playing' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold flex items-center gap-2">
                            <Crown className="w-4 h-4 text-star-gold" />
                            {room.name}
                          </h3>
                          <p className="text-sm text-gray-400">{room.host_nickname}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${
                            room.status === 'waiting' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {room.status === 'waiting' ? '대기 중' : '게임 중'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {room.player_count}/{room.max_players}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              // Rankings tab content will be in sidebar for desktop
              <div className="md:hidden space-y-2">
                {rankings.map((rank) => (
                  <RankingItem key={rank.rank} {...rank} />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Room Detail with Chat
          <div className="flex-1 flex flex-col">
            {/* Player Cards */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 glass rounded-xl p-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-magical-pink-500/30 flex items-center justify-center mb-2">
                  <span className="text-2xl">🌟</span>
                </div>
                <p className="font-bold">{user?.nickname || '나'}</p>
                <p className="text-xs text-magical-pink-400">ELO {user?.elo_rating || 1200}</p>
              </div>
              <div className="flex items-center">
                <Swords className="w-8 h-8 text-magical-purple-400" />
              </div>
              <div className="flex-1 glass rounded-xl p-4 text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  opponent ? 'bg-magical-purple-500/30' : 'bg-gray-500/30 animate-pulse'
                }`}>
                  <span className="text-2xl">{opponent ? '👿' : '❓'}</span>
                </div>
                <p className="font-bold">{opponent?.nickname || '대기 중...'}</p>
                {opponent ? (
                  <p className="text-xs text-magical-purple-400">ELO {opponent.elo_rating}</p>
                ) : (
                  <p className="text-xs text-gray-400">상대를 기다리는 중</p>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass rounded-xl p-4 flex flex-col mb-4">
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-sm ${msg.nickname === 'System' ? 'text-gray-400 italic' : ''}`}>
                    <span className={`font-bold ${msg.nickname === (user?.nickname || '나') ? 'text-magical-pink-400' : 'text-magical-purple-400'}`}>
                      {msg.nickname}:
                    </span>{' '}
                    {msg.message}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="메시지 입력..."
                  className="flex-1 bg-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-magical-pink-400"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-magical-pink-500 rounded-lg hover:bg-magical-pink-600 transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              disabled={!opponent}
              className="w-full py-4 bg-gradient-to-r from-magical-pink-500 to-magical-purple-500 rounded-xl font-bold text-xl hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {opponent ? '🎮 게임 시작!' : '⏳ 상대방 대기 중...'}
            </button>
          </div>
        )}
      </div>

      {/* Right Panel - Rankings Sidebar (Desktop) */}
      <div className="hidden md:block w-80 p-4 border-l border-white/10">
        <h2 className="font-title text-xl text-star-gold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          글로벌 랭킹
        </h2>
        <div className="space-y-2">
          {rankings.map((rank) => (
            <RankingItem key={rank.rank} {...rank} />
          ))}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">🎮 방 만들기</h2>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="방 이름"
              className="w-full bg-white/10 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-magical-pink-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 glass rounded-lg hover:bg-white/20 transition"
              >
                취소
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim()}
                className="flex-1 py-3 bg-magical-pink-500 rounded-lg hover:bg-magical-pink-600 transition disabled:opacity-50"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
        active 
          ? 'bg-magical-pink-500 text-white' 
          : 'glass text-gray-400 hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function RankingItem({ rank, nickname, elo_rating, wins }) {
  const getRankColor = () => {
    if (rank === 1) return 'text-star-gold'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-400'
    return 'text-gray-400'
  }

  const getRankEmoji = () => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="glass rounded-lg p-3 flex items-center gap-3">
      <div className={`w-8 text-center font-bold ${getRankColor()}`}>
        {getRankEmoji()}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{nickname}</p>
        <p className="text-xs text-magical-pink-400">ELO {elo_rating}</p>
      </div>
      <div className="text-xs text-star-gold">
        {wins}승
      </div>
    </div>
  )
}
