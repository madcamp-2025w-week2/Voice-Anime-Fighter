from datetime import datetime
from typing import Any
import socketio
import logging

# Logger Setup
logger = logging.getLogger(__name__)

# Redis Battle State Manager
from adapters.redis.battle_state import battle_state_manager

# Connected users mapping: sid -> user_info
connected_users: dict[str, dict[str, Any]] = {}

# Room memberships: room_id -> list of sids
room_members: dict[str, list[str]] = {}

# Matchmaking queue: list of waiting user sids
waiting_queue: list[str] = []


def register_socket_handlers(sio: socketio.AsyncServer):
    """Register all Socket.io event handlers."""
    
    @sio.event
    async def connect(sid, environ, auth):
        """Handle client connection."""
        logger.info(f"Client connected: {sid}")
        
        # Store user info (in production, verify JWT from auth)
        user_id = auth.get("user_id", sid) if auth else sid
        nickname = auth.get("nickname") if auth else None
        elo_rating = auth.get("elo_rating") if auth else 1200
        
        connected_users[sid] = {
            "user_id": user_id,
            "nickname": nickname or f"Player_{sid[:6]}",
            "elo_rating": elo_rating or 1200,
            "connected_at": datetime.utcnow().isoformat()
        }
        
        # Broadcast user count
        await sio.emit("user:count", {"count": len(connected_users)})
        
        await sio.emit("connected", {"message": "Connected to Voice-Anime-Fighter!"}, room=sid)
    
    @sio.event
    async def disconnect(sid):
        """Handle client disconnection."""
        logger.info(f"Client disconnected: {sid}")
        
        # Remove from matchmaking queue
        if sid in waiting_queue:
            waiting_queue.remove(sid)
        
        # Remove from all rooms
        for room_id, members in list(room_members.items()):
            if sid in members:
                members.remove(sid)
                user_info = connected_users.get(sid, {})
                await sio.emit("room:player_left", {
                    "user_id": user_info.get("user_id", sid)
                }, room=room_id)
        
        # Remove from connected users
        connected_users.pop(sid, None)
        
        # Broadcast user count
        await sio.emit("user:count", {"count": len(connected_users)})

    # --- Matchmaking Handlers ---
    @sio.on("match:join_queue")
    async def join_queue(sid, data):
        """Join matchmaking queue."""
        logger.info(f"[Matchmaking] User {sid} requesting to join queue")
        logger.info(f"[Matchmaking] Current queue: {waiting_queue}")
        
        if sid in waiting_queue:
            logger.info(f"[Matchmaking] User {sid} already in queue, ignoring")
            return
            
        # Check if anyone is waiting
        if waiting_queue:
            opponent_sid = waiting_queue.pop(0)
            logger.info(f"[Matchmaking] Found opponent {opponent_sid} in queue")
            
            # Verify opponent is still connected
            if opponent_sid not in connected_users:
                logger.warning(f"[Matchmaking] Opponent {opponent_sid} disconnected, adding {sid} to queue")
                waiting_queue.append(sid)
                await sio.emit("match:searching", {}, room=sid)
                return
            
            # Create a match
            battle_id = f"battle_{int(datetime.utcnow().timestamp() * 1000)}"
            
            p1_info = connected_users.get(sid, {})
            p2_info = connected_users.get(opponent_sid, {})
            
            # Add both players to the battle room for real-time communication
            await sio.enter_room(sid, battle_id)
            await sio.enter_room(opponent_sid, battle_id)
            logger.info(f"[Matchmaking] Both players joined battle room: {battle_id}")
            
            # Notify both players
            await sio.emit("match:found", {
                "battle_id": battle_id,
                "opponent": {
                    "user_id": p2_info.get("user_id"),
                    "nickname": p2_info.get("nickname", "Unknown"),
                    "elo_rating": p2_info.get("elo_rating", 1200),
                }
            }, room=sid)
            
            await sio.emit("match:found", {
                "battle_id": battle_id,
                "opponent": {
                    "user_id": p1_info.get("user_id"),
                    "nickname": p1_info.get("nickname", "Unknown"),
                    "elo_rating": p1_info.get("elo_rating", 1200),
                }
            }, room=opponent_sid)
            
            logger.info(f"[Matchmaking] ✅ Match found: {p1_info.get('nickname')} vs {p2_info.get('nickname')} (battle_id: {battle_id})")
            
        else:
            waiting_queue.append(sid)
            logger.info(f"[Matchmaking] No opponent available, {sid} added to queue. Queue size: {len(waiting_queue)}")
            await sio.emit("match:searching", {}, room=sid)

    @sio.on("match:leave_queue")
    async def leave_queue(sid, data):
        """Leave matchmaking queue."""
        if sid in waiting_queue:
            waiting_queue.remove(sid)
            logger.info(f"User {sid} left matchmaking queue")
            await sio.emit("match:cancelled", {}, room=sid)
    
    @sio.event
    async def room_join(sid, data):
        """Join a room."""
        room_id = data.get("room_id")
        if not room_id:
            logger.warning(f"[{sid}] room_join failed: No room_id provided")
            return
        
        # Ensure room_id is string
        room_id = str(room_id)
        
        logger.info(f"[{sid}] Attempting to join room: {room_id}")
        
        await sio.enter_room(sid, room_id)
        logger.info(f"[{sid}] Entered socket room: {room_id}")
        
        if room_id not in room_members:
            room_members[room_id] = []
        
        # Get existing members before adding new one (to send to new player)
        existing_members = []
        for existing_sid in room_members[room_id]:
            # Skip self if already in list (shouldn't happen with logic below, but safety check)
            if existing_sid == sid:
                continue
                
            existing_info = connected_users.get(existing_sid, {})
            existing_members.append({
                "user_id": existing_info.get("user_id", existing_sid),
                "nickname": existing_info.get("nickname", "Unknown"),
                "elo_rating": existing_info.get("elo_rating", 1200)
            })
        
        if sid not in room_members[room_id]:
            room_members[room_id].append(sid)
            logger.info(f"[{sid}] Added to room_members[{room_id}]. Current members: {room_members[room_id]}")
        else:
            logger.info(f"[{sid}] Already in room_members[{room_id}]")
        
        user_info = connected_users.get(sid, {})
        logger.info(f"[{sid}] User Info: {user_info}")
        
        # Send existing members to the newly joined player
        if existing_members:
            logger.info(f"[{sid}] Sending existing players to {sid}: {len(existing_members)} players")
            await sio.emit("room:existing_players", {
                "players": existing_members
            }, room=sid)
        
        # Notify room members (including new player)
        logger.info(f"[{sid}] Broadcasting room:player_joined to room {room_id}")
        await sio.emit("room:player_joined", {
            "user_id": user_info.get("user_id", sid),
            "nickname": user_info.get("nickname", "Unknown"),
            "elo_rating": user_info.get("elo_rating", 1200)
        }, room=room_id)

    @sio.event
    async def room_leave(sid, data):
        """Leave a room."""
        room_id = data.get("room_id")
        if not room_id:
            return
        
        await sio.leave_room(sid, room_id)
        
        if room_id in room_members and sid in room_members[room_id]:
            room_members[room_id].remove(sid)
        
        user_info = connected_users.get(sid, {})
        
        await sio.emit("room:player_left", {
            "user_id": user_info.get("user_id", sid)
        }, room=room_id)
    
    @sio.event
    async def room_ready(sid, data):
        """Toggle ready state."""
        room_id = data.get("room_id")
        is_ready = data.get("is_ready", False)
        
        if not room_id:
            return
        
        user_info = connected_users.get(sid, {})
        
        await sio.emit("room:player_ready", {
            "user_id": user_info.get("user_id", sid),
            "is_ready": is_ready
        }, room=room_id)
    
    @sio.event
    async def chat_message(sid, data):
        """Handle chat message. If room_id is provided, sends to that room only.
        If room_id is empty/None, broadcasts to ALL connected sockets (Global Chat).
        """
        print(f"🔥 chat_message received! sid={sid}, data={data}")
        room_id = data.get("room_id")
        message = data.get("message", "")
        
        if not message:
            return
        
        user_info = connected_users.get(sid, {})
        nickname = user_info.get("nickname", "Unknown")
        
        chat_data = {
            "user_id": user_info.get("user_id", sid),
            "nickname": nickname,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "is_global": not bool(room_id)
        }
        
        if room_id:
            # Room-specific chat
            logger.info(f"[Chat] Room {room_id} | {nickname}: {message}")
            await sio.emit("chat:new_message", chat_data, room=room_id)
        else:
            # Global broadcast to ALL connected sockets
            logger.info(f"[Global Chat] {nickname}: {message}")
            await sio.emit("chat:new_message", chat_data)

    # --- Character Selection Handlers ---
    @sio.on("character:select")
    async def character_select(sid, data):
        """Character select (preview)."""
        room_id = data.get("room_id") # 프론트에서 room_id도 보내줘야 함
        character_id = data.get("character_id")
        if not room_id: return

        user_info = connected_users.get(sid, {})
        await sio.emit("character:selected", {
            "user_id": user_info.get("user_id", sid),
            "character_id": character_id
        }, room=room_id)

    @sio.on("character:confirm")
    async def character_confirm(sid, data):
        """Character confirm."""
        room_id = data.get("room_id") # 프론트에서 room_id 보낸다고 가정
        character_id = data.get("character_id")
        if not room_id: return

        user_info = connected_users.get(sid, {})
        await sio.emit("character:confirmed", {
            "user_id": user_info.get("user_id", sid),
            "character_id": character_id
        }, room=room_id)
    
    @sio.on("battle:countdown")
    async def battle_countdown(sid, data):
        """Trigger countdown."""
        room_id = data.get("room_id")
        count = data.get("count", 3)
        await sio.emit("battle:countdown", {"count": count}, room=room_id)

    @sio.on("battle:start")
    async def battle_start_trigger(sid, data):
        """Trigger battle start."""
        room_id = data.get("room_id")
        await sio.emit("battle:start", {}, room=room_id)

    # ------------------------------------
    
    @sio.event
    async def battle_attack(sid, data):
        """Handle battle attack with Redis HP synchronization."""
        battle_id = data.get("battle_id")
        damage_data = data.get("damage_data", {})
        
        if not battle_id:
            return
        
        user_info = connected_users.get(sid, {})
        user_id = user_info.get("user_id", sid)
        damage = damage_data.get("total_damage", 0)
        
        # Redis에서 HP 업데이트 및 동기화
        hp_update = None
        try:
            hp_update = await battle_state_manager.update_hp(battle_id, user_id, damage)
        except Exception as e:
            logger.warning(f"Redis HP update failed: {e}")
        
        # Broadcast damage to battle room (includes audio_url for opponent playback)
        emit_data = {
            "attacker_id": user_id,
            "damage": damage,
            "grade": damage_data.get("grade", "F"),
            "animation_trigger": damage_data.get("animation_trigger", "miss"),
            "is_critical": damage_data.get("is_critical", False),
            "audio_url": damage_data.get("audio_url", None)
        }
        
        # Redis에서 동기화된 HP 정보 추가
        if hp_update:
            emit_data["player1_hp"] = hp_update["player1_hp"]
            emit_data["player2_hp"] = hp_update["player2_hp"]
            emit_data["current_turn"] = hp_update["current_turn"]
            emit_data["game_status"] = hp_update["status"]
            emit_data["winner_id"] = hp_update.get("winner_id")
        
        await sio.emit("battle:damage_received", emit_data, room=battle_id)
    
    @sio.event
    async def battle_result(sid, data):
        """Handle battle result and cleanup."""
        battle_id = data.get("battle_id")
        winner_id = data.get("winner_id")
        stats = data.get("stats", {})
        
        if not battle_id:
            return
        
        await sio.emit("battle:result", {
            "winner_id": winner_id,
            "stats": stats
        }, room=battle_id)
        
        # Cleanup audio files
        try:
            from adapters.api.routes.battle import cleanup_battle_audio
            cleanup_battle_audio(battle_id)
        except Exception as e:
            logger.warning(f"Audio cleanup error: {e}")
        
        # Cleanup Redis battle session
        try:
            await battle_state_manager.delete_battle(battle_id)
        except Exception as e:
            logger.warning(f"Redis cleanup error: {e}")
    
    @sio.event
    async def game_start(sid, data):
        """Start the game (host only) and create Redis battle session."""
        room_id = data.get("room_id")
        battle_id = data.get("battle_id") or room_id
        
        logger.info(f"[{sid}] game_start triggered for room_id: {room_id}, battle_id: {battle_id}")
        
        if not room_id:
            logger.warning(f"[{sid}] game_start failed: No room_id")
            return
        
        # Get players in room
        players = []
        player_ids = []
        members = room_members.get(str(room_id), [])
        logger.info(f"[{sid}] Members in room {room_id}: {members}")
        
        for member_sid in members:
            user_info = connected_users.get(member_sid, {})
            player_id = user_info.get("user_id", member_sid)
            players.append({
                "user_id": player_id,
                "nickname": user_info.get("nickname", "Unknown")
            })
            player_ids.append(player_id)
        
        # Create Redis battle session for HP synchronization
        if len(player_ids) >= 2:
            try:
                await battle_state_manager.create_battle(
                    battle_id=str(battle_id),
                    player1_id=str(player_ids[0]),
                    player2_id=str(player_ids[1])
                )
                logger.info(f"[{sid}] Redis battle session created: {battle_id}")
            except Exception as e:
                logger.warning(f"[{sid}] Redis battle creation failed: {e}")
        
        logger.info(f"[{sid}] Emitting room:game_start to {room_id} with players: {players}")
        await sio.emit("room:game_start", {
            "battle_id": battle_id,
            "players": players
        }, room=room_id)

