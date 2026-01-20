import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Users, Sword,
  PlusCircle, Search, Menu, Lock, Crown, Loader2, ArrowLeft, Send, LogOut, Volume2, Mic, Video, Settings, MapPin, Smile, X, Pencil, Camera
} from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { handleApiError } from '../utils/errorHandler';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Extract base URL from API_URL (remove /api/v1 suffix if present)
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl.includes('/api')) {
    return apiUrl.split('/api')[0];
  }
  return apiUrl;
};

// Helper to get full avatar URL
const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  // If it's a full URL (http/https) or emoji, return as-is
  if (avatarUrl.startsWith('http')) return avatarUrl;
  // If it's a relative path starting with /, prepend base URL
  if (avatarUrl.startsWith('/')) {
    const baseUrl = getBaseUrl();
    return baseUrl ? `${baseUrl}${avatarUrl}` : avatarUrl;
  }
  return avatarUrl;
};

// Check if avatarUrl is an image path (not emoji)
const isImageUrl = (avatarUrl) => {
  if (!avatarUrl) return false;
  return avatarUrl.startsWith('/') || avatarUrl.startsWith('http');
};


export default function LobbyScreen() {
  const navigate = useNavigate();
  const { user, token, disconnectSocket, updateUser } = useUserStore();
  const { characters, setCharacters, selectedCharacter, selectCharacter, setOpponentInfo } = useGameStore();
  const { socket, emit, joinRoom, leaveRoom: socketLeaveRoom, sendMessage, startGame, isConnected } = useSocket();

  const [onlineCount, setOnlineCount] = useState(1);

  // Private Room Join State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingRoom, setPendingRoom] = useState(null);

  // Profile Edit States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // BGM State
  const bgmRef = useRef(null);
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [showBgmMenu, setShowBgmMenu] = useState(false);

  // Edit Profile 모달이 열릴 때만 초기화 (모달 열리는 순간에만)
  useEffect(() => {
    if (isEditModalOpen && user) {
      // 모달이 열리는 순간에만 초기화 (polling 중 덮어쓰기 방지)
      setEditNickname(prev => prev || user.nickname || '');
      setEditAvatar(prev => prev || user.avatar_url || '🌟');
    }
  }, [user]);

  // BGM 재생 (로비 진입 시)
  useEffect(() => {
    const audio = new Audio('/audio/Untitled.mp3');
    audio.loop = true;
    audio.volume = bgmVolume;
    bgmRef.current = audio;

    // 자동 재생 시도
    const playBgm = () => {
      audio.play().catch(err => console.log('Lobby BGM autoplay blocked:', err));
    };

    document.addEventListener('click', playBgm, { once: true });
    document.addEventListener('touchstart', playBgm, { once: true });
    playBgm();

    return () => {
      audio.pause();
      audio.src = '';
      document.removeEventListener('click', playBgm);
      document.removeEventListener('touchstart', playBgm);
    };
  }, []);

  // 볼륨 변경 시 적용
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = bgmVolume;
    }
  }, [bgmVolume]);
  
  // 모달이 닫힌 후 edit 필드 초기화
  useEffect(() => {
    if (!isEditModalOpen) {
      setEditNickname(user?.nickname || '');
      setEditAvatar(user?.avatar_url || '🌟');
    }
  }, [isEditModalOpen, user?.nickname, user?.avatar_url]);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nickname: editNickname,
          avatar_url: editAvatar
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setIsEditModalOpen(false);
        alert("Profile updated successfully! ✨");
      } else {
        await handleApiError(res);
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  // Image compression to WebP
  const compressImageToWebP = (file, maxSize = 256) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if larger than maxSize
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(new File([blob], 'avatar.webp', { type: 'image/webp' })),
          'image/webp',
          0.8 // 80% quality
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsUploading(true);

    try {
      // Compress to WebP
      const compressedFile = await compressImageToWebP(file);
      console.log(`📸 Compressed: ${file.size} → ${compressedFile.size} bytes`);

      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setEditAvatar(updatedUser.avatar_url);
        alert("Profile image uploaded successfully! 📸");
      } else {
        await handleApiError(res);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Sync selected character with user's saved choice
  useEffect(() => {
    if (user?.main_character_id) {
      const isPlaceholder = selectedCharacter?.name === 'Main Character';
      const isMismatch = !selectedCharacter || selectedCharacter.id !== user.main_character_id;

      if (isMismatch || isPlaceholder) {
        const fullChar = characters.find(c => c.id === user.main_character_id);

        if (fullChar) {
          // 캐릭터 정보가 로드되었으면 교체
          selectCharacter(fullChar);
        } else if (isMismatch) {
          // 로드 전이고 ID가 다르면 임시 객체 설정 (이미지는 뜸)
          selectCharacter({ id: user.main_character_id, name: 'Main Character' });
        }
      }
    }
  }, [user?.main_character_id, characters, selectedCharacter, selectCharacter]);

  // Online Count Listener
  useEffect(() => {
    if (socket) {
      socket.on('user:count', (data) => {
        setOnlineCount(data.count);
      });
      return () => {
        socket.off('user:count');
      };
    }
  }, [socket]);

  // State
  const [rankingTab, setRankingTab] = useState('RANKING');
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  // Restore room state from sessionStorage (for page refresh)
  const getSavedRoomState = () => {
    try {
      const saved = sessionStorage.getItem('voiceAnime_currentRoom');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to restore room state:', e);
      sessionStorage.removeItem('voiceAnime_currentRoom');
    }
    return null;
  };
  const savedRoomState = getSavedRoomState();

  // Data State
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]); // For search
  const [searchTerm, setSearchTerm] = useState("");
  const [rankings, setRankings] = useState([]);
  const [selectedRankingUser, setSelectedRankingUser] = useState(null); // Selected user from ranking list to view profile
  const [selectedRoom, setSelectedRoom] = useState(savedRoomState?.room || null);
  const [isHost, setIsHost] = useState(savedRoomState?.isHost || false); // Track if current user is the room creator

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState("");

  // ... (Matchmaking State) ...
  const [matchState, setMatchState] = useState('IDLE');
  const [opponent, setOpponent] = useState(savedRoomState?.opponent || null);
  const [countdown, setCountdown] = useState(null);
  const [battleId, setBattleId] = useState(null);  // Store matched battle ID
  const [isReady, setIsReady] = useState(false);  // Guest ready state (my status)
  const [opponentReady, setOpponentReady] = useState(false);  // Opponent's ready state

  const chatEndRef = useRef(null);
  const mainCharacter = selectedCharacter || characters[0];

  // --- API Effects ---
  useEffect(() => {
    if (!token) return;

    const fetchRankings = async () => {
      try {
        const res = await fetch(`${API_URL}/users/ranking?limit=10`);
        if (!res.ok) {
          await handleApiError(res);
          return;
        }
        const data = await res.json();
        setRankings(data.rankings);
      } catch (err) {
        handleApiError(err);
      }
    };

    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          await handleApiError(res);
          return;
        }

        const data = await res.json();
        setRooms(data.rooms);
      } catch (err) {
        handleApiError(err);
      }
    };

    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          // userStore 업데이트 (최신 main_character_id 반영)
          useUserStore.getState().updateUser(userData);
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    const fetchCharacters = async () => {
      if (characters.length > 0) return; // 이미 있으면 스킵
      try {
        const res = await fetch(`${API_URL}/characters`);
        if (res.ok) {
          const data = await res.json();
          const charsWithImages = data.characters.map(c => ({
            ...c,
            image: c.sprite_url || c.thumbnail_url
          }));
          useGameStore.getState().setCharacters(charsWithImages);
        }
      } catch (err) {
        console.error("Failed to fetch characters:", err);
      }
    };

    // Initial fetch
    fetchRankings();
    fetchRooms();
    fetchUserInfo();
    fetchCharacters();

    // Polling every 5 seconds to keep data fresh
    // 단, Edit Profile 모달이 열려있을 때는 userInfo 폴링 중단
    const interval = setInterval(() => {
      fetchRankings();
      fetchRooms();
      // Edit Profile 모달이 닫혀있을 때만 userInfo 폴링
      if (!isEditModalOpen) {
        fetchUserInfo();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, isEditModalOpen]);


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
      console.log('[Matchmaking] match:found received:', data);
      setOpponent(data.opponent);
      setBattleId(data.battle_id);  // Save battle ID
      setMatchState('FOUND');
      // Also set opponent info in gameStore for MultiCharacterSelect and BattleScreen
      setOpponentInfo({
        nickname: data.opponent?.nickname || 'Opponent',
        elo: data.opponent?.elo_rating || 1200,
        avatarUrl: data.opponent?.avatar_url || null,
      });
      setTimeout(() => setCountdown(3), 1000);
    };

    // Room Events
    const handlePlayerJoined = (data) => {
      console.log('socket: [room:player_joined]', data);
      if (data.user_id !== user?.id) {
        if (matchState !== 'FOUND') {
          setOpponent({
            id: data.user_id,
            nickname: data.nickname || 'Opponent',
            elo_rating: data.elo_rating || 1200,
            avatar_url: data.avatar_url || null
          });
          // Also set in gameStore for BattleScreen (including ELO and avatar)
          setOpponentInfo({
            nickname: data.nickname || 'Opponent',
            elo: data.elo_rating || 1200,
            avatarUrl: data.avatar_url || null,
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
      // 자기 자신이 보낸 메시지는 이미 추가했으므로 스킵 (중복 방지)
      // 서버에서 오는 메시지만 추가
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        user: data.nickname,
        text: data.message,
        type: data.user_id === user?.id ? 'self' : 'normal',
        timestamp: data.timestamp
      }]);
    };

    const handleHostChanged = (data) => {
      console.log('socket: [room:host_changed]', data);
      if (data.new_host_id === user?.id) {
        setIsHost(true);
        // Reset ready states when becoming host
        setIsReady(false);
        setOpponentReady(false);
        // Previous host left, so no opponent now
        setOpponent(null);
        setOpponentInfo({ nickname: null, elo: null, avatarUrl: null });
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          user: 'System',
          text: '방장이 되었습니다! 상대를 기다려 주세요.',
          type: 'system'
        }]);
        setSelectedRoom(prev => prev ? { ...prev, player_count: 1 } : null);
      }

      setSelectedRoom(prev => prev ? {
        ...prev,
        host_id: data.new_host_id,
        host_nickname: data.new_host_nickname
      } : null);
    };

    const handleGameStart = (data) => {
      console.log('socket: [room:game_start]', data);
      // Pass players data for Room flow (like Fast Matching does)
      const isRanking = selectedRoom?.name?.startsWith('[RANK]') || false;
      const players = [
        { user_id: user?.id, nickname: user?.nickname, elo_rating: user?.elo_rating || 1200, avatar_url: user?.avatar_url },
        { user_id: opponent?.user_id || opponent?.id, nickname: opponent?.nickname, elo_rating: opponent?.elo_rating || 1200, avatar_url: opponent?.avatar_url }
      ];
      navigate('/multi-select', { state: { room_id: selectedRoom?.room_id, is_host: isHost, players, is_ranking: isRanking } });
    };

    // Handle existing players when joining a room
    const handleExistingPlayers = (data) => {
      console.log('socket: [room:existing_players]', data);
      if (data.players && data.players.length > 0) {
        // Get the first player (the host) as opponent
        const existingPlayer = data.players.find(p => p.user_id !== user?.id);
        if (existingPlayer) {
          setOpponent({
            id: existingPlayer.user_id,
            nickname: existingPlayer.nickname || 'Opponent',
            elo_rating: existingPlayer.elo_rating || 1200,
            avatar_url: existingPlayer.avatar_url || null
          });
          // Also set in gameStore for character select and battle screens (including ELO and avatar)
          setOpponentInfo({
            nickname: existingPlayer.nickname || 'Opponent',
            elo: existingPlayer.elo_rating || 1200,
            avatarUrl: existingPlayer.avatar_url || null,
          });
        }
      }
    };

    socket.on('match:found', handleMatchFound);
    socket.on('match:searching', () => setMatchState('SEARCHING'));
    socket.on('match:cancelled', () => setMatchState('IDLE'));

    socket.on('room:player_joined', handlePlayerJoined);
    socket.on('room:player_left', handlePlayerLeft);
    socket.on('room:host_changed', handleHostChanged);
    socket.on('room:existing_players', handleExistingPlayers);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('room:game_start', handleGameStart);

    // Ready system events
    socket.on('room:ready_status', (data) => {
      console.log('socket: [room:ready_status]', data);
      if (data.user_id !== user?.id) {
        setOpponentReady(data.is_ready);
      }
    });

    return () => {
      socket.off('match:found');
      socket.off('match:searching');
      socket.off('match:cancelled');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:host_changed');
      socket.off('room:existing_players');
      socket.off('room:ready_status');
      socket.off('chat:new_message');
      socket.off('room:game_start');
    };
  }, [socket, user?.id, navigate, selectedRoom, matchState, isHost]);

  // Save room state to sessionStorage when in a room
  useEffect(() => {
    if (selectedRoom) {
      sessionStorage.setItem('voiceAnime_currentRoom', JSON.stringify({
        room: selectedRoom,
        isHost: isHost,
        opponent: opponent
      }));
    } else {
      sessionStorage.removeItem('voiceAnime_currentRoom');
    }
  }, [selectedRoom, isHost, opponent]);

  // Log if room state was restored from sessionStorage
  useEffect(() => {
    if (savedRoomState?.room) {
      console.log('Restored room state from sessionStorage:', savedRoomState.room);
    }
  }, []); // Only on mount

  // Re-join room on connection restore - with validation
  useEffect(() => {
    if (isConnected && selectedRoom) {
      console.log('Socket Connected/Room Selected - Validating and rejoining:', selectedRoom.room_id);

      // Validate that the room still exists before rejoining
      const validateAndJoin = async () => {
        try {
          const res = await fetch(`${API_URL}/rooms/${selectedRoom.room_id}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ password: selectedRoom.clientPassword || null }),
          });

          if (res.ok) {
            // Room exists and we can join
            joinRoom(selectedRoom.room_id, selectedRoom.clientPassword);
          } else {
            // Room doesn't exist or we can't join - clear state
            console.log('Room no longer available, clearing saved state');
            sessionStorage.removeItem('voiceAnime_currentRoom');
            setSelectedRoom(null);
            setOpponent(null);
            setIsHost(false);
            setChatMessages([]);
          }
        } catch (err) {
          console.error('Failed to validate room:', err);
          // On error, clear state to be safe
          sessionStorage.removeItem('voiceAnime_currentRoom');
          setSelectedRoom(null);
          setOpponent(null);
          setIsHost(false);
          setChatMessages([]);
        }
      };

      validateAndJoin();
    }
  }, [isConnected, selectedRoom?.room_id, joinRoom, token]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      // Navigate to character select (same as CREATE ROOM flow)
      // Use battle_id as room_id since they serve the same purpose
      // Also pass players data for Fast Matching (like room flow does)
      const players = [
        { user_id: user?.id, nickname: user?.nickname, elo_rating: user?.elo_rating || 1200, avatar_url: user?.avatar_url },
        { user_id: opponent?.user_id, nickname: opponent?.nickname, elo_rating: opponent?.elo_rating || 1200, avatar_url: opponent?.avatar_url }
      ];
      navigate('/multi-select', { state: { room_id: battleId, is_host: true, players, is_ranking: true } });
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate, battleId]);

  // --- Handlers ---
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (selectedRoom) {
      // Room chat - 서버로 전송 (해당 방에만 broadcast)
      sendMessage(selectedRoom.room_id, chatInput.trim());
    } else {
      // Global chat - 서버로 전송 (모든 연결된 소켓에 broadcast)
      sendMessage(null, chatInput.trim());
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
    if (newRoomIsPrivate && !newRoomPassword.trim()) {
      alert("Please set a password for private room.");
      return;
    }

    const finalName = newRoomName;

    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: finalName,
          is_private: newRoomIsPrivate,
          password: newRoomPassword || null
        }),
      });

      if (!res.ok) {
        await handleApiError(res);
        return;
      }

      const data = await res.json();
      const newRoom = {
        room_id: data.room_id,
        name: finalName,
        host_nickname: user?.nickname || 'Host',
        host_id: user?.id, // 추가: 방장 ID 명시
        player_count: 1,
        max_players: 2,
        status: 'waiting',
        is_private: newRoomIsPrivate
      };

      setRooms(prev => [newRoom, ...prev]);
      setSelectedRoom(newRoom);
      setIsHost(true); // Creator is the host
      setOpponent(null);
      setChatMessages([]); // Clear chat for new room
      setShowCreateModal(false);
      setNewRoomName("");
      setNewRoomIsPrivate(false);
      setNewRoomPassword("");

      console.log('Creating room and joining:', data.room_id);
      joinRoom(data.room_id); // Join socket room

    } catch (err) {
      handleApiError(err);
    }
  };


  const processJoinRoom = async (room, password = null) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${room.room_id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 400 && (errorData.detail?.includes('password') || errorData.detail?.includes('비밀번호'))) {
          await handleApiError(res, '비밀번호가 일치하지 않습니다. 다시 시도해 주세요.');
        } else {
          // Fallback for other errors
          await handleApiError(res, errorData.detail || '방 입장에 실패했습니다.');
        }
        return;
      }

      const data = await res.json();
      // Save password for re-joining
      const roomWithData = { ...room, clientPassword: password };
      const joinedRoom = { ...roomWithData, player_count: room.player_count + 1 };

      setSelectedRoom(joinedRoom);
      setIsHost(false); // Joiner is NOT the host
      setChatMessages([]);

      // Set opponent if host already exists (we're joining as 2nd player)
      if (room.player_count >= 1 && room.host_nickname) {
        setOpponent({
          id: room.host_id,
          nickname: room.host_nickname,
          elo_rating: room.host_elo || 1200
        });
      } else {
        setOpponent(null);
        // Wait for connect?
      }

      // Join socket room
      joinRoom(room.room_id, password);

      // Close modal if open
      setPasswordModalOpen(false);
      setPasswordInput('');
      setPendingRoom(null);

    } catch (err) {
      handleApiError(err);
    }
  };

  const handleJoinRoom = (room) => {
    if (room.is_private) {
      setPendingRoom(room);
      setPasswordInput('');
      setPasswordModalOpen(true);
    } else {
      processJoinRoom(room);
    }
  };

  const handleStartGame = () => {
    if (!selectedRoom) return;
    startGame(selectedRoom.room_id, selectedRoom.room_id);
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;

    try {
      const isLastMember = selectedRoom.player_count <= 1;

      if (isLastMember) {
        // Only me in room - DELETE the room via API
        const res = await fetch(`${API_URL}/rooms/${selectedRoom.room_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          await handleApiError(res);
        }
      }

      // Always emit socket leave event (backend handles room_service.leave_room and host transfer)
      socketLeaveRoom(selectedRoom.room_id);
    } catch (err) {
      handleApiError(err);
    }

    // Clear local state regardless
    setSelectedRoom(null);
    setOpponent(null);
    setChatMessages([]);
    setIsReady(false);
    setOpponentReady(false);
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col overflow-hidden relative font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
      {/* Purple Neon Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(88,28,135,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(88,28,135,0.3)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-purple-900/30 pointer-events-none"></div>

      {/* VS Overlay - Enhanced with Profile Info */}
      {matchState === 'FOUND' && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          {/* Title */}
          <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-8 drop-shadow-lg animate-pulse">
            MATCH FOUND!
          </h1>

          {/* VS Cards */}
          <div className="flex items-stretch justify-center gap-8 md:gap-16 mb-8">

            {/* Player Card (Me) */}
            <div className="w-64 bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              {/* Avatar + Character Badge */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl shadow-lg border-3 border-cyan-400/50 overflow-hidden">
                  {isImageUrl(user?.avatar_url) ? (
                    <img src={getAvatarUrl(user.avatar_url)} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    user?.avatar_url || '🌟'
                  )}
                </div>
                {mainCharacter?.image && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-cyan-400 overflow-hidden bg-black shadow-lg">
                    <img src={mainCharacter.image} alt="Character" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Nickname */}
              <h3 className="font-black italic text-xl text-white">{user?.nickname || 'ME'}</h3>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-2">
                <div className="bg-black/40 rounded-xl p-2 text-center border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">MMR</p>
                  <p className="text-lg font-black text-yellow-400">{user?.elo_rating || 1200}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-2 text-center border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Win Rate</p>
                  <p className={`text-lg font-black ${((user?.wins || 0) / ((user?.wins || 0) + (user?.losses || 0) || 1) * 100) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {(user?.wins && user?.losses !== undefined) ? (((user.wins) / ((user.wins) + (user.losses) || 1)) * 100).toFixed(0) : '0'}%
                  </p>
                </div>
              </div>
            </div>

            {/* VS Logo & Countdown */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-red-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-pulse tracking-tighter">
                VS
              </div>
              {countdown !== null && (
                <div className="mt-6 text-7xl font-black text-white animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                  {countdown}
                </div>
              )}
            </div>

            {/* Opponent Card */}
            <div className="w-64 bg-black/60 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
              {/* Avatar + Character Badge */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg border-3 border-pink-400/50 overflow-hidden">
                  {isImageUrl(opponent?.avatar_url) ? (
                    <img src={getAvatarUrl(opponent.avatar_url)} alt="Opponent" className="w-full h-full object-cover" />
                  ) : (
                    opponent?.avatar_url || '😈'
                  )}
                </div>
                {opponent?.main_character_id && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-pink-400 overflow-hidden bg-black shadow-lg">
                    <img
                      src={characters?.find(c => c.id === opponent.main_character_id)?.image || '/images/otacu.webp'}
                      alt="Opponent Character"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Nickname */}
              <h3 className="font-black italic text-xl text-white">{opponent?.nickname || 'Unknown'}</h3>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-2">
                <div className="bg-black/40 rounded-xl p-2 text-center border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">MMR</p>
                  <p className="text-lg font-black text-yellow-400">{opponent?.elo_rating || '???'}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-2 text-center border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Win Rate</p>
                  <p className={`text-lg font-black ${opponent?.wins !== undefined ? (((opponent.wins || 0) / ((opponent.wins || 0) + (opponent.losses || 0) || 1)) * 100 >= 50 ? 'text-green-400' : 'text-red-400') : 'text-zinc-500'}`}>
                    {opponent?.wins !== undefined ? (((opponent.wins || 0) / ((opponent.wins || 0) + (opponent.losses || 0) || 1)) * 100).toFixed(0) : '?'}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-purple-500/30 bg-black/60 backdrop-blur-sm z-30 shrink-0 h-[80px] shadow-[0_4px_20px_-10px_rgba(168,85,247,0.5)]">
        {/* Same Header */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] whitespace-nowrap pr-2">
            오타쿠 대변신 대작전 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500 animate-pulse inline-block pr-2">Lobby</span>
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {/* Online Status */}
            <div className="flex items-center gap-2 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'}`}></div>
              <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            {/* Online User Count */}
            <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">
              <Users size={12} />
              <span className="text-[10px] font-bold">{onlineCount}</span>
            </div>
          </div>
        </div>

        {/* Menu Button with BGM Control */}
        <div className="relative">
          <button
            onClick={() => setShowBgmMenu(!showBgmMenu)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Menu size={24} className="text-zinc-400" />
          </button>

          {/* BGM Volume Menu */}
          {showBgmMenu && (
            <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-xl z-50 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 size={16} className="text-purple-400" />
                  BGM Volume
                </span>
                <button
                  onClick={() => setShowBgmMenu(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>🔇</span>
                <span>{Math.round(bgmVolume * 100)}%</span>
                <span>🔊</span>
              </div>
            </div>
          )}
        </div>
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
                    className={`group relative bg-black/40 backdrop-blur-sm border p-4 transition-all duration-300 hover:scale-[1.02] ${room.status === 'waiting'
                      ? 'border-purple-500/50 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'border-red-900/50 hover:border-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border border-zinc-700 rounded truncate max-w-[150px] shrink-0">
                        HOST: {room.host_nickname}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${room.status === 'waiting' ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-900' : 'text-orange-500 bg-orange-950/30 border border-orange-900'}`}>
                        {room.status === 'waiting' ? 'WAITING' : '🎮 IN GAME'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black italic text-white group-hover:text-cyan-300 transition-colors mb-3 line-clamp-2 min-h-[1.75rem] leading-tight">
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
                        className={`px-4 py-1 font-black text-[10px] uppercase tracking-widest skew-x-[-10deg] transition-all ${room.status === 'waiting' && room.player_count < room.max_players
                          ? 'bg-zinc-200 text-black hover:bg-pink-600 hover:text-white hover:scale-105'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                      >
                        <span className="block skew-x-[10deg]">{room.status === 'waiting' ? 'JOIN' : 'IN GAME'}</span>
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
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center text-2xl border border-cyan-500 overflow-hidden">
                    {isImageUrl(user?.avatar_url) ? (
                      <img src={getAvatarUrl(user.avatar_url)} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                      user?.avatar_url || '🌟'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black italic text-lg truncate">{user?.nickname}</div>
                    <div className="text-xs text-cyan-400 font-bold">READY</div>
                  </div>
                </div>
                <div className="flex items-center justify-center"><Sword size={32} className="text-zinc-600" /></div>
                <div className="flex-1 glass p-4 rounded-xl flex items-center gap-4 border border-pink-500/30">
                  <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center text-2xl border border-pink-500 overflow-hidden">
                    {isImageUrl(opponent?.avatar_url) ? (
                      <img src={getAvatarUrl(opponent.avatar_url)} alt="Opponent" className="w-full h-full object-cover" />
                    ) : (
                      opponent ? (opponent.avatar_url || '😈') : '❓'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-black italic text-lg truncate ${opponent ? 'text-white' : 'text-zinc-500'}`}>{opponent ? opponent.nickname : 'Waiting...'}</div>
                    <div className="text-xs text-pink-400 font-bold">{opponent ? `MMR ${opponent.elo_rating}` : 'WAITING'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-auto mb-4 shrink-0">
                {isHost ? (
                  /* Host sees Start button - enabled only when opponent is ready */
                  <button
                    onClick={handleStartGame}
                    disabled={!opponent || !opponentReady}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 rounded-xl font-black italic text-xl uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale shadow-[0_4px_0_rgba(185,28,28,0.5)] active:translate-y-[4px] active:shadow-none"
                  >
                    {!opponent ? 'WAITING FOR PLAYER . . .' : !opponentReady ? 'WAITING FOR READY . . .' : 'START BATTLE !!!'}
                  </button>
                ) : (
                  /* Guest sees Ready/Unready toggle button */
                  <button
                    onClick={() => {
                      const newReadyState = !isReady;
                      setIsReady(newReadyState);
                      emit('room:ready', { room_id: selectedRoom?.room_id, is_ready: newReadyState });
                    }}
                    disabled={!opponent}
                    className={`w-full py-4 rounded-xl font-black italic text-xl uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_4px_0] active:translate-y-[4px] active:shadow-none ${isReady ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-600/50' : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-600/50'}`}
                  >
                    {isReady ? 'CANCEL READY' : 'READY!'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chat (Neon Box) */}
          <div className="h-[220px] bg-black/80 backdrop-blur-md border border-purple-500/30 rounded-tr-2xl rounded-tl-lg overflow-hidden flex flex-col shrink-0 mb-4 mr-2 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            {/* ... Chat UI ... */}
            <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate">
                {selectedRoom ? `Chat: ${selectedRoom.name}` : 'Global Chat'}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`text-xs break-words ${msg.type === 'system' ? 'text-center italic' : ''}`}>
                  {msg.type === 'system' ? (
                    <span className="text-yellow-500/70">{msg.text}</span>
                  ) : (
                    <div className="flex items-baseline">
                      {msg.timestamp && (
                        <span className="text-[10px] text-emerald-500/70 font-mono mr-2 font-bold">
                          [{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
                        </span>
                      )}
                      <span className={`font-black mr-2 ${msg.type === 'self' ? 'text-cyan-400' : 'text-pink-400'}`}>{msg.user}:</span>
                      <span className="text-zinc-300">{msg.text}</span>
                    </div>
                  )}
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
                className={`w-full h-14 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:shadow-none active:translate-y-[4px] ${matchState === 'SEARCHING'
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


          {/* Stats / Ranking Panel (Purple/Red LED) */}
          <div className="flex-1 bg-black/80 backdrop-blur-md border border-red-900/40 rounded-xl overflow-hidden flex flex-col shrink-0 shadow-[0_0_15px_rgba(153,27,27,0.2)] min-h-0">
            {/* ... Stats/Ranking Title ... */}
            <div className="flex border-b border-zinc-700 shrink-0">
              <button
                onClick={() => { setRankingTab('RANKING'); setSelectedRankingUser(null); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${rankingTab === 'RANKING' ? 'bg-zinc-800 text-white border-b-2 border-cyan-500' : 'text-zinc-500 hover:bg-zinc-800/50'
                  }`}
              >
                Top Ranking
              </button>
              <button
                onClick={() => setRankingTab('MY')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${rankingTab === 'MY' ? 'bg-zinc-800 text-white border-b-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-500 hover:bg-zinc-800/50'
                  }`}
              >
                My Stats
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              {rankingTab === 'MY' ? (
                <div className="flex flex-col gap-4">
                  {/* MAIN Character Display - Moved to top of MyStats */}
                  <div
                    onClick={() => navigate('/select')}
                    className="h-[200px] flex items-center justify-center relative cursor-pointer group shrink-0 bg-black/40 rounded-xl border border-zinc-800 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 rounded-xl group-hover:from-pink-900/50 transition-colors"></div>

                    {/* Character Emoji/Image */}
                    <div className="relative z-0 transition-transform hover:scale-105 duration-500 origin-center h-[180px] flex items-center justify-center">
                      {(() => {
                        const imgSrc = mainCharacter?.image
                          || mainCharacter?.sprite_url
                          || mainCharacter?.thumbnail_url
                          || '/images/otacu.webp';

                        return (
                          <img
                            src={imgSrc}
                            alt={mainCharacter?.name || 'Character'}
                            className="h-full object-contain filter drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        );
                      })()}
                    </div>

                    <div className="absolute bottom-2 z-20 bg-black/80 backdrop-blur px-4 py-1 border-l-2 border-pink-500 w-full text-center group-hover:bg-pink-900/80 transition-colors">
                      <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest group-hover:text-white">MAIN CHARACTER</p>
                      <p className="text-xs font-black text-white italic truncate">{mainCharacter?.name || 'Lulu Ping'}</p>
                    </div>
                  </div>

                  {/* 메인 정보 (Rating, Tier) with Edit Hover */}
                  <div
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-zinc-800 relative overflow-hidden group cursor-pointer hover:border-pink-500/50 transition-colors"
                  >
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                      <p className="text-white font-bold tracking-widest flex items-center gap-2">EDIT PROFILE <Pencil size={14} /></p>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-purple-900/50 z-10 border-2 border-white/10 overflow-hidden">
                      {isImageUrl(user?.avatar_url) ? (
                        <img src={getAvatarUrl(user.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.avatar_url || '🌟'
                      )}
                    </div>
                    <div className="z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black italic text-white">{user?.nickname || 'Guest'}</span>
                        <Crown size={16} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                      </div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                        {user?.rank ? `GLOBAL RANK #${user.rank}` : 'UNRANKED'}
                      </p>
                    </div>
                  </div>

                  {/* Rating & Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Rating Box */}
                    <div className="col-span-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">MMR</span>
                      <span className="text-2xl font-black text-yellow-400 tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                        {user?.elo_rating || 1200}
                      </span>
                    </div>

                    {/* Stats Calculation */}
                    {(() => {
                      const wins = user?.wins || 0;
                      const losses = user?.losses || 0;
                      const totalGames = wins + losses;
                      const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

                      return (
                        <>
                          {/* Win Rate */}
                          <div className="col-span-2 flex gap-2">
                            <div className="flex-1 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800 flex flex-col items-center justify-center gap-1">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase">Win Rate</span>
                              <span className={`text-lg font-black ${Number(winRate) >= 50 ? 'text-red-400' : 'text-zinc-400'}`}>
                                {winRate}%
                              </span>
                            </div>
                            <div className="flex-1 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800 flex flex-col items-center justify-center gap-1">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase">Total Matches</span>
                              <span className="text-lg font-black text-white">{totalGames}</span>
                            </div>
                          </div>

                          {/* Wins / Losses */}
                          <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800 flex flex-col items-center">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">Wins</span>
                            <span className="text-base font-black text-cyan-400">{wins}</span>
                          </div>
                          <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800 flex flex-col items-center">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">Losses</span>
                            <span className="text-base font-black text-pink-500">{losses}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Show User Profile if selected, otherwise show ranking list */}
                  {selectedRankingUser ? (
                    <div className="flex flex-col gap-4">
                      {/* Back Button */}
                      <button
                        onClick={() => setSelectedRankingUser(null)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
                      >
                        <ArrowLeft size={16} /> Back to Ranking
                      </button>

                      {/* Main Character Display (Read-Only) */}
                      {(() => {
                        const userMainChar = characters.find(c => c.id === selectedRankingUser?.main_character_id) || characters[0];
                        const imgSrc = userMainChar?.image
                          || userMainChar?.sprite_url
                          || userMainChar?.thumbnail_url
                          || '/images/otacu.webp';

                        return (
                          <div className="h-[200px] flex items-center justify-center relative shrink-0 bg-black/40 rounded-xl border border-zinc-800 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 rounded-xl"></div>

                            {/* Character Emoji/Image */}
                            <div className="relative z-0 h-[180px] flex items-center justify-center">
                              <img
                                src={imgSrc}
                                alt={userMainChar?.name || 'Character'}
                                className="h-full object-contain filter drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>

                            <div className="absolute bottom-2 z-20 bg-black/80 backdrop-blur px-4 py-1 border-l-2 border-pink-500 w-full text-center">
                              <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">MAIN CHARACTER</p>
                              <p className="text-xs font-black text-white italic truncate">{userMainChar?.name || 'Unknown'}</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* User Profile Header */}
                      <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-zinc-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20"></div>
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl shadow-lg shadow-purple-900/50 z-10 border-2 border-white/10 overflow-hidden">
                          {isImageUrl(selectedRankingUser?.avatar_url) ? (
                            <img src={getAvatarUrl(selectedRankingUser.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            selectedRankingUser?.avatar_url || '🌟'
                          )}
                        </div>
                        <div className="z-10">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black italic text-white">{selectedRankingUser?.nickname || 'Unknown'}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">PLAYER PROFILE</p>
                        </div>
                      </div>

                      {/* User Stats Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Rating Box */}
                        <div className="col-span-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">MMR</span>
                          <span className="text-2xl font-black text-yellow-400 tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                            {selectedRankingUser?.elo_rating || 1200}
                          </span>
                        </div>

                        {/* Stats Calculation */}
                        {(() => {
                          const wins = selectedRankingUser?.wins || 0;
                          const losses = selectedRankingUser?.losses || 0;
                          const totalGames = wins + losses;
                          const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

                          return (
                            <>
                              {/* Win Rate */}
                              <div className="col-span-2 flex gap-2">
                                <div className="flex-1 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800 flex flex-col items-center justify-center gap-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Win Rate</span>
                                  <span className={`text-lg font-black ${Number(winRate) >= 50 ? 'text-red-400' : 'text-zinc-400'}`}>
                                    {winRate}%
                                  </span>
                                </div>
                                <div className="flex-1 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800 flex flex-col items-center justify-center gap-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Total Matches</span>
                                  <span className="text-lg font-black text-white">{totalGames}</span>
                                </div>
                              </div>

                              {/* Wins / Losses */}
                              <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800 flex flex-col items-center">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Wins</span>
                                <span className="text-base font-black text-cyan-400">{wins}</span>
                              </div>
                              <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800 flex flex-col items-center">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase">Losses</span>
                                <span className="text-base font-black text-pink-500">{losses}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* Ranking List */
                    /* Ranking List */
                    Array(10).fill(null).map((_, idx) => {
                      let rank = rankings[idx];
                      let currentRank = idx + 1;

                      // 내가 10위권 밖이라면, 마지막 10번째 칸(index 9)에 내 정보를 보여줌
                      const showMyRankAtBottom = user?.rank > 10 && idx === 9;

                      if (showMyRankAtBottom) {
                        rank = user ? { ...user, user_id: user.id } : null; // user 정보를 rank 포맷으로 매핑
                        currentRank = user.rank;
                      }

                      const isTop3 = currentRank <= 3;
                      const isMe = rank && user && (rank.user_id === user.id || rank.id === user.id);

                      // 1,2,3등은 메달 이모티콘, 나머지는 숫자
                      const rankDisplay = currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : currentRank === 3 ? '🥉' : currentRank;

                      return (
                        <div
                          key={idx}
                          onClick={() => rank && setSelectedRankingUser(rank)}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all group relative ${rank
                            ? isMe
                              ? 'bg-pink-900/40 border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.2)] cursor-pointer hover:bg-pink-900/60'
                              : 'hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/10'
                            : 'opacity-20 pointer-events-none'
                            } ${showMyRankAtBottom ? 'mt-4 scale-105 z-10' : ''}`}
                        >
                          {/* 10위권 밖 내 순위 표시일 때 구분선 효과 */}
                          {showMyRankAtBottom && (
                            <div className="absolute -top-4 left-0 w-full flex justify-center items-center h-4">
                              <div className="w-1 bg-zinc-700/50 h-2 rounded-full mx-1"></div>
                              <div className="w-1 bg-zinc-700/50 h-2 rounded-full mx-1"></div>
                              <div className="w-1 bg-zinc-700/50 h-2 rounded-full mx-1"></div>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            {/* 1. 순위 */}
                            <div className={`font-black italic w-10 text-center text-xl flex items-center justify-center ${isTop3 ? 'drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] scale-110' : 'text-zinc-600'
                              } ${isMe ? 'text-pink-400' : ''}`}>
                              {rankDisplay}
                            </div>

                            {/* 2. 이름 */}
                            <div className={`font-bold text-sm truncate max-w-[120px] ${rank ? (isMe ? 'text-pink-100' : 'text-white') : 'text-zinc-700'
                              }`}>
                              {rank ? (isMe ? `${rank.nickname} (ME)` : rank.nickname) : '-'}
                            </div>
                          </div>

                          {/* 3. Rating */}
                          {rank && <div className={`font-mono font-black text-sm tracking-wider ${isMe ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'text-yellow-400'}`}>
                            {rank.elo_rating} <span className={`text-[10px] font-bold ${isMe ? 'text-pink-500/70' : 'text-zinc-500'}`}>MMR</span>
                          </div>}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass rounded-2xl p-6 w-full max-w-sm border border-pink-500/30 bg-black/90 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
            <h2 className="text-xl font-black italic text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="text-pink-500" /> Create Room
            </h2>

            <div className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter Room Name..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-pink-500 text-white placeholder:text-zinc-600 font-bold transition-all"
                />
              </div>



              {/* Private Toggle */}
              <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 cursor-pointer" onClick={() => setNewRoomIsPrivate(!newRoomIsPrivate)}>
                <div className="flex items-center gap-2">
                  <Lock size={16} className={newRoomIsPrivate ? "text-pink-500" : "text-zinc-600"} />
                  <span className={`text-sm font-bold ${newRoomIsPrivate ? "text-white" : "text-zinc-500"}`}>Private Room</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${newRoomIsPrivate ? "bg-pink-600" : "bg-zinc-700"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newRoomIsPrivate ? "left-6" : "left-1"}`}></div>
                </div>
              </div>

              {/* Password Input */}
              {newRoomIsPrivate && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Password</label>
                  <input
                    type="password"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    placeholder="Secret Code"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-red-500 text-white placeholder:text-zinc-600 font-bold"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition font-bold uppercase tracking-wider text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || (newRoomIsPrivate && !newRoomPassword)}
                className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg hover:scale-105 transition font-black uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                Create!
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

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>

            <h2 className="text-2xl font-black italic text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Pencil className="text-pink-500" /> Edit Profile
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Left Column: Live Preview */}
              <div className="w-full md:w-1/3 flex flex-col items-center gap-3 shrink-0">
                <div className="w-full aspect-square rounded-2xl bg-black border-2 border-zinc-800 overflow-hidden relative shadow-lg group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 z-0"></div>

                  {/* Avatar Display */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center text-6xl">
                    {isImageUrl(editAvatar) ? (
                      <img src={getAvatarUrl(editAvatar)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      editAvatar || '🌟'
                    )}
                  </div>

                  {/* Overlay upload hint */}
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer z-20 backdrop-blur-sm"
                  >
                    <Camera className="w-8 h-8 text-pink-500 mb-2" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Change Photo</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center mb-2">
                  Live Preview
                </p>

                {/* Title Prefix Selection */}
                <div className="w-full border-t border-zinc-800 pt-3 mt-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block text-center flex items-center justify-center gap-1">
                    Select Title <span className="text-zinc-600 text-[9px]">(Append Prefix)</span>
                  </label>

                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const title = e.target.value;
                        if (!title) return;
                        setEditNickname(prev => {
                          const parts = prev.split('_');
                          const coreName = parts.length > 1 ? parts.slice(1).join('_') : prev;
                          return `${title}_${coreName}`;
                        });
                      }}
                      className="w-full bg-zinc-900 text-white text-xs font-bold py-2.5 pl-3 pr-8 rounded-xl border border-zinc-700 hover:border-pink-500/50 focus:border-pink-500 outline-none appearance-none cursor-pointer transition-colors text-center"
                    >
                      <option value="">Choose a Title...</option>
                      {[
                        '어둠의 다크니스', '심연의 지배자', '봉인된 흑염룡', '전설의 마법기사',
                        '이세계의 방랑자', '신이 버린 아이', '피의 계약자', '광기의 매드사이언티스트',
                        '천재 미소녀 해커', '운명을 거스르는 자', '타락천사 루시퍼', '칠흑의 날개',
                        '제3의 눈 개안자', '세계관 최강자', '먼치킨 주인공', '복수의 화신',
                        '고독한 늑대', '마계의 프린스', '천상의 가희', '차원 여행자'
                      ].map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                    {/* Dropdown Arrow Icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Controls */}
              <div className="w-full md:flex-1 min-w-0">
                {/* Avatar Selection */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Avatar Settings</label>
                  </div>

                  {/* Upload Button */}
                  <div className="mb-4">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition font-bold text-xs uppercase flex items-center justify-center gap-2 text-zinc-300 border border-zinc-700 hover:border-zinc-500 group"
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="animate-spin text-pink-500" size={16} /> : <><Camera size={16} className="text-pink-500 group-hover:scale-110 transition-transform" /> Upload Photo</>}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Or Select Icon</label>

                  {/* Scrollable Icon Grid */}
                  <div className="h-40 overflow-y-auto pr-2 custom-scrollbar bg-black/30 rounded-xl p-2 border border-white/5">
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        '🌟', '💀', '🤖', '👾', '👽', '🎃', '👻', '🤡', '👺', '👹',
                        '🦄', '🐱', '🐶', '🦊', '🦁', '🐯', '🐷', '🐸', '🐙', '🦖',
                        '🔥', '💧', '⚡', '❄️', '🌪️', '🌈', '☀️', '🌙', '⭐', '☄️',
                        '⚔️', '🛡️', '🏹', '🔮', '💊', '💣', '💎', '👑', '🏆', '🎮',
                        '😀', '😎', '😡', '😱', '🤔', '🤯', '🥶', '🥵', '🤢', '🤮'
                      ].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setEditAvatar(emoji)}
                          className={`text-2xl aspect-square rounded-lg border transition-all hover:scale-110 flex items-center justify-center ${editAvatar === emoji ? 'border-pink-500 bg-pink-900/20 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nickname Input */}
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">Nickname</label>
                  <input
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-pink-500 outline-none font-bold transition-colors text-sm"
                    placeholder="Enter nickname..."
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions - Full Width */}
            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl font-bold text-zinc-400 hover:bg-zinc-700 transition uppercase tracking-widest text-sm">
                Cancel
              </button>
              <button onClick={handleSaveProfile} className="flex-[2] py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-black text-white hover:scale-[1.02] transition-all uppercase tracking-widest shadow-[0_4px_0_rgba(219,39,119,0.5)] active:translate-y-[2px] active:shadow-none text-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Private Room Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-pink-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-black italic text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Lock className="text-pink-500" /> Private Room
            </h3>
            <p className="text-zinc-400 mb-4 text-sm">Enter password to join <span className="text-white font-bold">{pendingRoom?.name}</span></p>

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter room password..."
              className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-pink-500 transition-colors font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') processJoinRoom(pendingRoom, passwordInput);
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold transition-all uppercase text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => processJoinRoom(pendingRoom, passwordInput)}
                className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold transition-all uppercase text-sm shadow-lg shadow-pink-500/20"
              >
                Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
