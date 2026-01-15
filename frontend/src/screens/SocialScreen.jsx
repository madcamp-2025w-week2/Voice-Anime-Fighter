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
  const { on, off, joinRoom, sendMessage, sendReady } = useSocket()
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'rooms')
  const [rooms, setRooms] = useState([])
  const [rankings, setRankings] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  const chatEndRef = useRef(null)

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRooms(data.rooms)
        }
      } catch (err) {
        // Mock data for demo
        setRooms([
          { room_id: '1', name: '초보자 환영!', host_nickname: '루루핑마스터', player_count: 1, max_players: 2, status: 'waiting' },
          { room_id: '2', name: '고수만 와라', host_nickname: '다크플레임', player_count: 1, max_players: 2, status: 'waiting' },
          { room_id: '3', name: '친선 경기', host_nickname: '냥댕이', player_count: 2, max_players: 2, status: 'playing' },
        ])
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

  // Socket events for chat
  useEffect(() => {
    on('chat:new_message', (data) => {
      setChatMessages(prev => [...prev, data])
    })

    return () => off('chat:new_message')
  }, [on, off])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleJoinRoom = (room) => {
    setSelectedRoom(room)
    joinRoom(room.room_id)
    // Mock previous messages
    setChatMessages([
      { nickname: room.host_nickname, message: '안녕하세요!', timestamp: new Date().toISOString() },
      { nickname: 'System', message: `${user?.nickname || '게스트'}님이 입장했습니다.`, timestamp: new Date().toISOString() },
    ])
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
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newRoomName })
      })
      if (res.ok) {
        const data = await res.json()
        setShowCreateModal(false)
        setNewRoomName('')
        // Refresh rooms
        const newRoom = { room_id: data.room_id, name: newRoomName, host_nickname: user?.nickname, player_count: 1, max_players: 2, status: 'waiting' }
        setRooms(prev => [newRoom, ...prev])
        handleJoinRoom(newRoom)
      }
    } catch (err) {
      console.error('Failed to create room:', err)
    }
  }

  const handleStartGame = () => {
    sendReady(selectedRoom.room_id, true)
    navigate('/matchmaking')
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
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-500/30 flex items-center justify-center mb-2">
                  <span className="text-2xl">{selectedRoom.player_count > 1 ? '👿' : '❓'}</span>
                </div>
                <p className="font-bold">{selectedRoom.player_count > 1 ? selectedRoom.host_nickname : '대기 중'}</p>
                {selectedRoom.player_count > 1 && (
                  <p className="text-xs text-magical-purple-400">ELO 1300</p>
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
              disabled={selectedRoom.player_count < 2}
              className="w-full py-4 bg-gradient-to-r from-magical-pink-500 to-magical-purple-500 rounded-xl font-bold text-xl hover:scale-105 transition disabled:opacity-50"
            >
              {selectedRoom.player_count < 2 ? '상대방 대기 중...' : '🎮 게임 시작!'}
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
