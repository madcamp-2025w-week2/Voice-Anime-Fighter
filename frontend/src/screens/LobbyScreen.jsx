import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Users, Sword, 
  PlusCircle, Search, Menu, Lock, Crown, Loader2, ArrowLeft, Send
} from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function LobbyScreen() {
  const navigate = useNavigate();
  const { user, token } = useUserStore();
  const { characters, selectedCharacter } = useGameStore();
  const { socket, emit, joinRoom, sendMessage, startGame, isConnected } = useSocket();

  // State
  const [rankingTab, setRankingTab] = useState('GLOBAL');
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  
  // Data State
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]); // For search
  const [searchTerm, setSearchTerm] = useState("");
  const [rankings, setRankings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  // Matchmaking State
  const [matchState, setMatchState] = useState('IDLE');
  const [opponent, setOpponent] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const chatEndRef = useRef(null);
  const mainCharacter = selectedCharacter || characters[0];

  // --- API Effects ---
  useEffect(() => {
    if (!token) return;

    const fetchRankings = async () => {
      try {
        const res = await fetch(`${API_URL}/users/ranking?limit=10`);
        if (res.ok) {
          const data = await res.json();
          setRankings(data.rankings);
        }
      } catch (err) {
        console.error("Failed to fetch rankings", err);
      }
    };

    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms);
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };

    fetchRankings();
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);

    return () => clearInterval(interval);
  }, [token]);

  // Search Filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(rooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())));
    }
  }, [searchTerm, rooms]);

  // --- Socket Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!socket) return;
    
    // Matchmaking
    const handleMatchFound = (data) => {
      setOpponent(data.opponent);
      setMatchState('FOUND');
      setTimeout(() => setCountdown(3), 1000);
    };
    
    // Room Events
    const handlePlayerJoined = (data) => {
      if (data.user_id !== user?.id) {
          if (matchState !== 'FOUND') {
             setOpponent({
                 id: data.user_id,
                 nickname: data.nickname || 'Opponent',
                 elo_rating: data.elo_rating || 1200
             });
             setChatMessages(prev => [...prev, {
                 id: Date.now(),
                 user: 'System',
                 text: `${data.nickname || 'Unknown'} joined the room.`,
                 type: 'system'
             }]);
             setSelectedRoom(prev => prev ? { ...prev, player_count: 2 } : null);
          }
      }
    };

    const handlePlayerLeft = (data) => {
       if (data.user_id !== user?.id) {
          setOpponent(null);
          setChatMessages(prev => [...prev, {
              id: Date.now(),
              user: 'System',
              text: 'Opponent left the room.',
              type: 'system'
          }]);
          setSelectedRoom(prev => prev ? { ...prev, player_count: 1 } : null);
       }
    };
    
    const handleNewMessage = (data) => {
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            user: data.nickname,
            text: data.message,
            type: 'normal'
        }]);
    };

    const handleGameStart = (data) => {
       navigate('/multi-select', { state: { room_id: selectedRoom?.room_id } });
    };

    socket.on('match:found', handleMatchFound);
    socket.on('match:searching', () => setMatchState('SEARCHING'));
    socket.on('match:cancelled', () => setMatchState('IDLE'));
    
    socket.on('room:player_joined', handlePlayerJoined);
    socket.on('room:player_left', handlePlayerLeft);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('room:game_start', handleGameStart);

    return () => {
      socket.off('match:found');
      socket.off('match:searching');
      socket.off('match:cancelled');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('chat:new_message');
      socket.off('room:game_start');
    };
  }, [socket, user?.id, navigate, selectedRoom, matchState]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      navigate('/battle'); 
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  // --- Handlers ---
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    if (selectedRoom) {
        sendMessage(selectedRoom.room_id, chatInput.trim());
    } else {
        setChatMessages(prev => [...prev, { id: Date.now(), user: user?.nickname || "Me", text: chatInput, type: "normal" }]);
    }
    setChatInput("");
  };

  const handleMatchmaking = () => {
    if (matchState === 'IDLE') {
      emit('match:join_queue', {});
    } else {
      emit('match:leave_queue', {});
      setMatchState('IDLE');
    }
  };

  const handleCreateRoom = async () => {
      if (!newRoomName.trim()) return;
      try {
          const res = await fetch(`${API_URL}/rooms`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ name: newRoomName }),
          });
          if (res.ok) {
              const data = await res.json();
              const newRoom = {
                  room_id: data.room_id,
                  name: newRoomName,
                  host_nickname: user?.nickname || 'Host',
                  player_count: 1,
                  max_players: 2,
                  status: 'waiting',
                  is_private: false
              };
              setRooms(prev => [newRoom, ...prev]);
              setSelectedRoom(newRoom);
              setOpponent(null);
              setChatMessages([]);
              setShowCreateModal(false);
              setNewRoomName("");
              joinRoom(data.room_id);
          }
      } catch (err) {
          console.error("Create room failed", err);
      }
  };

  const handleJoinRoom = async (room) => {
      try {
          const res = await fetch(`${API_URL}/rooms/${room.room_id}/join`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({}),
          });
          if (res.ok) {
               const joinedRoom = { ...room, player_count: room.player_count + 1 };
               setSelectedRoom(joinedRoom);
               setOpponent(null);
               setChatMessages([]);
               joinRoom(room.room_id);
          }
      } catch (err) {
          console.error("Join room failed", err);
      }
  };

  const handleStartGame = () => {
      if (!selectedRoom) return;
      startGame(selectedRoom.room_id, selectedRoom.room_id);
  };
  
  const handleLeaveRoom = () => {
      setSelectedRoom(null);
      setOpponent(null);
      setChatMessages([]);
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col overflow-hidden relative font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.8)_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0.8)_2px,transparent_2px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

      {/* VS Overlay */}
      {matchState === 'FOUND' && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          {/* ... VS Content ... */}
           <div className="flex items-center justify-center gap-8 mb-12 scale-150">
            <div className="glass rounded-2xl p-6 w-48 text-center border border-cyan-500/30 bg-cyan-900/20">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center mb-4 border-2 border-cyan-500">
                <span className="text-4xl">🌟</span>
              </div>
              <h3 className="font-black text-lg italic">{user?.nickname || 'ME'}</h3>
            </div>
            <div className="relative mx-8">
              <div className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 animate-pulse tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">VS</div>
              {countdown !== null && <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-5xl font-black text-white">{countdown}</div>}
            </div>
            <div className="glass rounded-2xl p-6 w-48 text-center border border-pink-500/30 bg-pink-900/20">
               <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center mb-4 border-2 border-pink-500">
                <span className="text-4xl">😈</span>
              </div>
              <h3 className="font-black text-lg italic">{opponent?.nickname || 'Unknown'}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-sm z-30 shrink-0 h-[80px]">
        {/* Same Header */}
         <div className="flex items-center gap-6">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_2px_0_rgba(255,255,255,0.1)]">
            오타쿠 대변신 대작전 <span className="text-cyan-400">Lobby</span>
          </h1>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded border border-zinc-700">
                <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'}`}></div>
                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Menu size={24} className="text-zinc-400" /></button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden z-20">
        
        {/* Left Panel */}
        <section className="flex-1 flex flex-col min-w-0 pl-8 py-6 pr-4 gap-4 overflow-hidden">
          
          {!selectedRoom ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search Bar Bar */}
              <div className="flex items-center gap-4 mb-4 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 backdrop-blur-md">
                 <div className="flex items-center gap-2 px-2 text-zinc-500">
                    <Sword size={18} />
                    <span className="font-black italic uppercase tracking-wider">Battle Rooms</span>
                 </div>
                 <div className="h-6 w-[1px] bg-zinc-700"></div>
                 <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search rooms..." 
                      className="w-full bg-black/30 border border-zinc-700 rounded text-sm px-10 py-1.5 focus:border-cyan-500 focus:outline-none text-white placeholder:text-zinc-600 transition-colors"
                    />
                 </div>
                 <div className="text-xs font-bold text-zinc-600 px-2 whitespace-nowrap">
                    {filteredRooms.length} Active
                 </div>
              </div>

              {/* Grid List */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-3 content-start pb-4">
                {/* ... Room Items ... */}
                 {filteredRooms.length === 0 && (
                    <div className="col-span-full text-center py-12 text-zinc-600 font-bold italic">
                        {rooms.length === 0 ? "NO ROOMS CREATED YET" : "NO MATCHING ROOMS"}
                    </div>
                )}
                {filteredRooms.map(room => (
                  <div 
                    key={room.room_id}
                    className={`group relative bg-zinc-900/60 backdrop-blur-sm border-l-4 p-4 transition-all duration-200 hover:bg-zinc-800 ${
                      room.status === 'waiting' 
                        ? 'border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                        : 'border-red-600 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border border-zinc-700 rounded truncate max-w-[120px]">
                        HOST: {room.host_nickname}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${room.status === 'waiting' ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-900' : 'text-red-500 bg-red-950/30 border border-red-900'}`}>
                        {room.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-black italic text-white group-hover:text-cyan-300 transition-colors truncate mb-3">
                      {room.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-bold bg-black/30 px-2 py-0.5 rounded-full">
                        {room.is_private ? <Lock size={12} /> : <Users size={12} />}
                        <span className="text-white text-xs">{room.player_count}</span>
                        <span className="text-[10px] opacity-60">/ {room.max_players}</span>
                      </div>
                      <button 
                        onClick={() => handleJoinRoom(room)}
                        disabled={room.status !== 'waiting' || room.player_count >= room.max_players}
                        className={`px-4 py-1 font-black text-[10px] uppercase tracking-widest skew-x-[-10deg] transition-all ${
                          room.status === 'waiting' && room.player_count < room.max_players
                            ? 'bg-zinc-200 text-black hover:bg-pink-600 hover:text-white hover:scale-105'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <span className="block skew-x-[10deg]">{room.status === 'waiting' ? 'JOIN' : 'FULL'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             // Selected Room
            <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right duration-300">
               <div className="flex items-center gap-4 mb-6 shrink-0">
                  <button onClick={handleLeaveRoom} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-black italic text-white uppercase tracking-widest truncate">
                    {selectedRoom.name}
                  </h2>
               </div>
               
               <div className="flex gap-4 mb-4 shrink-0">
                  <div className="flex-1 glass p-4 rounded-xl flex items-center gap-4 border border-cyan-500/30">
                     <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center text-2xl border border-cyan-500">🌟</div>
                     <div className="min-w-0">
                        <div className="font-black italic text-lg truncate">{user?.nickname}</div>
                        <div className="text-xs text-cyan-400 font-bold">READY</div>
                     </div>
                  </div>
                  <div className="flex items-center justify-center"><Sword size={32} className="text-zinc-600" /></div>
                  <div className="flex-1 glass p-4 rounded-xl flex items-center gap-4 border border-pink-500/30">
                     <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center text-2xl border border-pink-500">{opponent ? '😈' : '❓'}</div>
                     <div className="min-w-0">
                        <div className={`font-black italic text-lg truncate ${opponent ? 'text-white' : 'text-zinc-500'}`}>{opponent ? opponent.nickname : 'Waiting...'}</div>
                        <div className="text-xs text-pink-400 font-bold">{opponent ? `ELO ${opponent.elo_rating}` : 'WAITING'}</div>
                     </div>
                  </div>
               </div>

               <div className="mt-auto mb-4 shrink-0">
                   <button 
                      onClick={handleStartGame}
                      disabled={!opponent}
                      className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 rounded-xl font-black italic text-xl uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale shadow-[0_4px_0_rgba(185,28,28,0.5)] active:translate-y-[4px] active:shadow-none"
                   >
                      {opponent ? 'START BATTLE !!!' : 'WAITING FOR PLAYER . . .'}
                   </button>
               </div>
            </div>
          )}

          {/* Chat (Same) */}
          <div className="h-[220px] bg-black/60 backdrop-blur-md border border-zinc-800 rounded-tr-2xl rounded-tl-lg overflow-hidden flex flex-col shrink-0 mb-4 mr-2 shadow-lg">
             {/* ... Chat UI ... */}
             <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2 shrink-0">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate">
                   {selectedRoom ? `Chat: ${selectedRoom.name}` : 'Global Chat'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="text-xs break-words">
                    <span className={`font-bold mr-2 ${msg.user === (user?.nickname||'Me') ? 'text-cyan-400' : 'text-pink-400'}`}>{msg.user}:</span>
                    <span className="text-zinc-300">{msg.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendChat} className="p-2 bg-zinc-900/50 border-t border-zinc-800 flex gap-2 shrink-0">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/50 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors rounded placeholder:text-zinc-600"
                />
                <button type="submit" className="p-2 bg-zinc-800 rounded hover:bg-cyan-600 transition text-white"><Send size={14} /></button>
              </form>
          </div>
        </section>

        {/* Right Panel */}
        <section className="w-[350px] bg-black/20 border-l border-white/5 flex flex-col p-6 gap-6 relative shrink-0 overflow-y-auto custom-scrollbar">
          
          {/* Action Buttons (Equal Size) */}
          {!selectedRoom && (
            <div className="flex flex-col gap-3 shrink-0">
                {/* Create Room */}
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="w-full h-14 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_0_rgba(219,39,119,1)] active:shadow-none active:translate-y-[4px]"
                >
                    <PlusCircle size={20} /> Create Room
                </button>
                {/* Fast Matching */}
                <button 
                    onClick={handleMatchmaking}
                    className={`w-full h-14 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:shadow-none active:translate-y-[4px] ${
                        matchState === 'SEARCHING' 
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_0_rgba(220,38,38,1)]' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_4px_0_rgba(8,145,178,1)]'
                    }`}
                >
                {matchState === 'SEARCHING' ? (
                    <>
                    <Loader2 size={20} className="mb-1 animate-spin" />
                    <span>Searching...</span>
                    </>
                ) : (
                    <>
                    <Search size={20} className="mb-1" />
                    <span>Fast Matching</span>
                    </>
                )}
                </button>
            </div>
          )}

          {/* Stats / Ranking Panel */}
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-xl overflow-hidden flex flex-col shrink-0 shadow-lg">
             {/* ... Stats/Ranking ... */}
             <div className="flex border-b border-zinc-700">
              <button 
                onClick={() => setRankingTab('RANKING')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    rankingTab === 'RANKING' ? 'bg-zinc-800 text-white border-b-2 border-cyan-500' : 'text-zinc-500 hover:bg-zinc-800/50'
                }`}
              >
                Top Ranking
              </button>
              <button 
                onClick={() => setRankingTab('MY')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  rankingTab === 'MY' ? 'bg-zinc-800 text-white border-b-2 border-pink-500' : 'text-zinc-500 hover:bg-zinc-800/50'
                }`}
              >
                My Stats
              </button>
            </div>
            <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
                {rankingTab === 'MY' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-2 bg-black/40 rounded-lg border border-zinc-800">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded flex items-center justify-center text-2xl shadow-inner">🌟</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black italic text-white">{user?.nickname || 'Guest'}</span>
                        <Crown size={14} className="text-yellow-400" />
                      </div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">RANK: MASTER</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Rating</span>
                      <span className="text-sm font-black text-yellow-400">{user?.elo_rating || 1200}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {rankings.map((rank, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <span className={`font-black italic w-4 text-center ${idx < 3 ? 'text-yellow-400' : 'text-zinc-600'}`}>{idx + 1}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-300">{rank.nickname}</span>
                          <span className="text-[9px] text-zinc-500">ELO {rank.elo_rating}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-500">{rank.wins} Wins</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Character Display (Moved Up & Clickable) */}
          <div 
             onClick={() => navigate('/select')}
             className="flex-1 flex items-center justify-center relative min-h-[200px] cursor-pointer group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 rounded-xl group-hover:from-pink-900/50 transition-colors"></div>
            
             {/* Character Emoji/Image */}
            <div className="relative z-0 transition-transform hover:scale-105 duration-500 origin-center h-[280px] flex items-center justify-center">
               {(() => {
                  const CHARACTER_IMAGES = {
                    'char_000': '/images/char_otaku.png',
                    'char_001': '/images/char_satoru.png',
                    'char_003': '/images/char_satoru.png',
                    'char_005': '/images/char_satoru.png',
                    'char_007': '/images/char_satoru.png',
                    'default': '/images/char_otaku.png'
                  };

                  const imgSrc = mainCharacter?.image 
                        || CHARACTER_IMAGES[mainCharacter?.id] 
                        || CHARACTER_IMAGES['default'];

                  return (
                     <img 
                        src={imgSrc} 
                        alt={mainCharacter?.name || 'Character'}
                        className="h-full object-contain filter drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                        onError={(e) => { e.currentTarget.style.display='none'; }}
                     />
                  );
               })()}
               {/* Fallback Emoji if image fails to load (handled by onError above but also structural fallback) */}

            </div>
            
            <div className="absolute bottom-6 z-20 bg-black/80 backdrop-blur px-4 py-1 border-l-2 border-pink-500 w-full text-center group-hover:bg-pink-900/80 transition-colors">
              <p className="text-xs font-black text-pink-500 uppercase tracking-widest group-hover:text-white">MAIN CHARACTER</p>
              <p className="text-sm font-black text-white italic">{mainCharacter?.name || 'Lulu Ping'}</p>
            </div>
            
            <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full">
               <Users size={16} />
            </div>
          </div>
        </section>
      </div>
      
      {/* Create Modal (Same) */}
       {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
           {/* ... Modal Content ... */}
           <div className="glass rounded-2xl p-6 w-full max-w-md border border-cyan-500/30 bg-black/80">
            <h2 className="text-xl font-black italic text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="text-cyan-500" /> Create Room
            </h2>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter Room Name..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-cyan-500 text-white placeholder:text-zinc-600 mb-6 font-bold"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition font-bold uppercase tracking-wider text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim()}
                className="flex-1 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition font-bold uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
      `}</style>
    </div>
  );
}
