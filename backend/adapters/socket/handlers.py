from datetime import datetime
from typing import Any
import socketio
import logging
import asyncio
from jose import jwt, JWTError

# Logger Setup
logger = logging.getLogger(__name__)

# Config for JWT verification
from config import get_settings
settings = get_settings()

# Redis Battle State Manager
from adapters.redis.battle_state import battle_state_manager

# Room Service for status updates
from use_cases.room_service import RoomService
room_service = RoomService()

# Connected users mapping: sid -> user_info
connected_users: dict[str, dict[str, Any]] = {}

# Room memberships: room_id -> list of sids
room_members: dict[str, list[str]] = {}

# Matchmaking queue: list of waiting user sids
waiting_queue: list[str] = []

# Battle ready tracking: room_id -> {player_id: sid, first_turn_player_id: str}
battle_ready_data: dict[str, dict[str, Any]] = {}

# Pending disconnects for grace period: user_id -> {task, sid, user_info, rooms}
pending_disconnects: dict[str, dict[str, Any]] = {}

# Grace period in seconds (time to wait for reconnection)
DISCONNECT_GRACE_PERIOD = 10


def register_socket_handlers(sio: socketio.AsyncServer):
    """Register all Socket.io event handlers."""
    
    @sio.event
    async def connect(sid, environ, auth):
        """Handle client connection with JWT verification."""
        logger.info(f"Client attempting to connect: {sid}")
        
        # ===== JWT Token Verification =====
        if not auth or not auth.get("token"):
            logger.warning(f"[{sid}] Connection rejected: No token provided")
            return False  # Reject connection
        
        token = auth.get("token")
        try:
            # Decode and verify JWT token
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm]
            )
            user_id = payload.get("sub")
            if not user_id:
                logger.warning(f"[{sid}] Connection rejected: Invalid token payload (no sub)")
                return False
            
            logger.info(f"[{sid}] JWT verified for user_id: {user_id}")
            
        except JWTError as e:
            logger.warning(f"[{sid}] Connection rejected: JWT verification failed - {e}")
            return False  # Reject connection
        
        # ===== Extract user info from auth (client-provided, but user_id from token) =====
        nickname = auth.get("nickname") or f"Player_{sid[:6]}"
        elo_rating = auth.get("elo_rating") or 1200
        avatar_url = auth.get("avatar_url") or None
        
        # Check if this user has a pending disconnect (reconnecting)
        str_user_id = str(user_id)
        if str_user_id in pending_disconnects:
            pending = pending_disconnects[str_user_id]
            logger.info(f"User {user_id} reconnecting within grace period! Cancelling disconnect...")
            
            # Cancel the pending disconnect task
            pending["task"].cancel()
            
            # Restore room memberships with new sid
            old_sid = pending["sid"]
            for room_id in pending["rooms"]:
                # Remove old sid from room members first
                if room_id in room_members and old_sid in room_members[room_id]:
                    room_members[room_id].remove(old_sid)
                    logger.info(f"Removed old sid {old_sid} from room {room_id}")
                
                # Add new sid to room
                if room_id not in room_members:
                    room_members[room_id] = []
                if sid not in room_members[room_id]:
                    room_members[room_id].append(sid)
                
                # Join socket room
                await sio.enter_room(sid, room_id)
                logger.info(f"Restored user {user_id} to room {room_id} with new sid {sid}")
            
            # Clean up pending disconnect
            del pending_disconnects[str_user_id]
        
        connected_users[sid] = {
            "user_id": user_id,
            "nickname": nickname,
            "elo_rating": elo_rating,
            "avatar_url": avatar_url,
            "connected_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"[{sid}] Client connected successfully: user_id={user_id}, nickname={nickname}")
        
        # Broadcast user count
        await sio.emit("user:count", {"count": len(connected_users)})
        
        await sio.emit("connected", {"message": "Connected to Voice-Anime-Fighter!"}, room=sid)
    
    async def delayed_disconnect(user_id: str, sid: str, user_info: dict, rooms: list):
        """Execute actual disconnect after grace period."""
        try:
            await asyncio.sleep(DISCONNECT_GRACE_PERIOD)
            
            # Still pending after grace period - execute disconnect
            if user_id in pending_disconnects:
                logger.info(f"Grace period expired for user {user_id}. Executing disconnect...")
                
                # Notify rooms about the player leaving
                for room_id in rooms:
                    if room_id in room_members and sid in room_members[room_id]:
                        room_members[room_id].remove(sid)
                    await sio.emit("room:player_left", {
                        "user_id": user_info.get("user_id", sid)
                    }, room=room_id)
                
                # Clean up
                del pending_disconnects[user_id]
                
                # Broadcast updated user count
                await sio.emit("user:count", {"count": len(connected_users)})
                
        except asyncio.CancelledError:
            logger.info(f"Disconnect cancelled for user {user_id} (reconnected)")
    
    @sio.event
    async def disconnect(sid):
        """Handle client disconnection with grace period for reconnection."""
        logger.info(f"Client disconnected: {sid}")
        
        # Remove from matchmaking queue immediately
        if sid in waiting_queue:
            waiting_queue.remove(sid)
        
        user_info = connected_users.get(sid, {})
        user_id = str(user_info.get("user_id", sid))
        
        # Find all rooms this user is in
        user_rooms = []
        for room_id, members in room_members.items():
            if sid in members:
                user_rooms.append(room_id)
        
        # Remove from connected users immediately
        connected_users.pop(sid, None)
        
        # If user was in any rooms, start grace period instead of immediate removal
        if user_rooms:
            logger.info(f"Starting {DISCONNECT_GRACE_PERIOD}s grace period for user {user_id} in rooms: {user_rooms}")
            
            # Create a task for delayed disconnect
            task = asyncio.create_task(delayed_disconnect(user_id, sid, user_info, user_rooms))
            pending_disconnects[user_id] = {
                "task": task,
                "sid": sid,
                "user_info": user_info,
                "rooms": user_rooms
            }
        else:
            # Not in any rooms, just broadcast user count
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
            
            # Track room members (same as CREATE ROOM flow)
            room_members[battle_id] = [sid, opponent_sid]
            
            # Store battle data for battle:ready handler (same as CREATE ROOM flow)
            player_ids = [str(p1_info.get("user_id", sid)), str(p2_info.get("user_id", opponent_sid))]
            players = [
                {"user_id": p1_info.get("user_id", sid), "nickname": p1_info.get("nickname", "Player 1")},
                {"user_id": p2_info.get("user_id", opponent_sid), "nickname": p2_info.get("nickname", "Player 2")}
            ]
            
            import random
            first_player_index = random.randint(0, 1)
            first_player_id = player_ids[first_player_index]
            
            battle_ready_data[battle_id] = {
                "battle_id": battle_id,
                "players": players,
                "player_ids": player_ids,
                "first_turn_player_id": first_player_id,
                "members": [sid, opponent_sid],
            }
            logger.info(f"[Matchmaking] Stored battle_ready_data for {battle_id}")
            
            # Notify both players
            await sio.emit("match:found", {
                "battle_id": battle_id,
                "opponent": {
                    "user_id": p2_info.get("user_id"),
                    "nickname": p2_info.get("nickname", "Unknown"),
                    "elo_rating": p2_info.get("elo_rating", 1200),
                    "avatar_url": p2_info.get("avatar_url"),
                }
            }, room=sid)
            
            await sio.emit("match:found", {
                "battle_id": battle_id,
                "opponent": {
                    "user_id": p1_info.get("user_id"),
                    "nickname": p1_info.get("nickname", "Unknown"),
                    "elo_rating": p1_info.get("elo_rating", 1200),
                    "avatar_url": p1_info.get("avatar_url"),
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
        
        # Check if this is a new join or a rejoin (e.g., after page refresh)
        is_new_player = sid not in room_members[room_id]
        
        # Get existing members before adding new one (to send to new player)
        existing_members = []
        for existing_sid in room_members[room_id]:
            # Skip self if already in list
            if existing_sid == sid:
                continue
                
            existing_info = connected_users.get(existing_sid, {})
            existing_members.append({
                "user_id": existing_info.get("user_id", existing_sid),
                "nickname": existing_info.get("nickname", "Unknown"),
                "elo_rating": existing_info.get("elo_rating", 1200),
                "avatar_url": existing_info.get("avatar_url")
            })
        
        if is_new_player:
            room_members[room_id].append(sid)
            logger.info(f"[{sid}] Added to room_members[{room_id}]. Current members: {room_members[room_id]}")
        else:
            logger.info(f"[{sid}] Already in room_members[{room_id}] (rejoin)")
        
        user_info = connected_users.get(sid, {})
        logger.info(f"[{sid}] User Info: {user_info}")
        
        # Send existing members to the newly joined player
        if existing_members:
            logger.info(f"[{sid}] Sending existing players to {sid}: {len(existing_members)} players")
            await sio.emit("room:existing_players", {
                "players": existing_members
            }, room=sid)
        
        # Only broadcast player_joined for genuinely new players, not rejoins
        if is_new_player:
            logger.info(f"[{sid}] Broadcasting room:player_joined to room {room_id}")
            await sio.emit("room:player_joined", {
                "user_id": user_info.get("user_id", sid),
                "nickname": user_info.get("nickname", "Unknown"),
                "elo_rating": user_info.get("elo_rating", 1200),
                "avatar_url": user_info.get("avatar_url")
            }, room=room_id)
        else:
            logger.info(f"[{sid}] Skipping player_joined broadcast (rejoin)")

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
        
        logger.info(f"[{sid}] battle_attack received - battle_id: {battle_id}, damage: {damage_data.get('total_damage', 0)}")
        
        if not battle_id:
            logger.warning(f"[{sid}] battle_attack - no battle_id provided!")
            return
        
        # Check who is in the battle room
        room_id = str(battle_id)
        members_in_room = room_members.get(room_id, [])
        logger.info(f"[{sid}] Members in room '{room_id}': {members_in_room}")
        
        user_info = connected_users.get(sid, {})
        user_id = user_info.get("user_id", sid)
        damage = damage_data.get("total_damage", 0)
        
        logger.info(f"[{sid}] Attacker user_id: {user_id}")
        
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
        
        logger.info(f"[{sid}] Emitting battle:damage_received to room '{room_id}' with data: {emit_data}")
        await sio.emit("battle:damage_received", emit_data, room=room_id)
    
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
        
        # Delete the room after game ends
        try:
            from uuid import UUID
            room_uuid = UUID(str(battle_id))
            # Force delete room (bypass host check by using internal method)
            if room_uuid in room_service._rooms:
                del room_service._rooms[room_uuid]
                logger.info(f"[{sid}] Room {battle_id} deleted after game end")
        except Exception as e:
            logger.warning(f"Room cleanup error: {e}")
    
    @sio.event
    async def game_start(sid, data):
        """Start the game (host only) and create Redis battle session."""
        room_id = data.get("room_id")
        battle_id = data.get("battle_id") or room_id
        
        logger.info(f"[{sid}] game_start triggered for room_id: {room_id}, battle_id: {battle_id}")
        
        if not room_id:
            logger.warning(f"[{sid}] game_start failed: No room_id")
            return
        
        # Update room status to PLAYING
        from uuid import UUID
        from domain.entities import RoomStatus
        try:
            room_uuid = UUID(str(room_id))
            # Directly update room status (bypass host check)
            if room_uuid in room_service._rooms:
                room_service._rooms[room_uuid].status = RoomStatus.PLAYING
                logger.info(f"[{sid}] Room {room_id} status changed to PLAYING")
            else:
                logger.warning(f"[{sid}] Room {room_id} not found in room_service._rooms")
        except Exception as e:
            logger.warning(f"[{sid}] Failed to update room status: {e}")
        
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
        
        # Randomly assign first turn (50/50)
        import random
        first_player_index = random.randint(0, 1)
        first_player_id = player_ids[first_player_index] if len(player_ids) >= 2 else player_ids[0] if player_ids else None
        
        logger.info(f"[{sid}] First turn goes to player index {first_player_index}: {first_player_id}")
        
        # Store battle data for when players signal ready from BattleScreen
        battle_ready_data[str(room_id)] = {
            "battle_id": battle_id,
            "players": players,
            "player_ids": player_ids,
            "first_turn_player_id": first_player_id,
            "members": list(members),  # Copy current member sids
        }
        
        logger.info(f"[{sid}] Emitting room:game_start to {room_id} with players: {players}")
        await sio.emit("room:game_start", {
            "battle_id": battle_id,
            "players": players
        }, room=room_id)
    
    @sio.on("battle:ready")
    async def battle_ready(sid, data):
        """Handle player ready signal from BattleScreen and send battle:init."""
        room_id = data.get("room_id")
        if not room_id:
            logger.warning(f"[{sid}] battle:ready without room_id")
            return
        
        room_id = str(room_id)
        logger.info(f"[{sid}] battle:ready received for room: {room_id}")
        
        # Get battle data stored during game_start
        battle_data = battle_ready_data.get(room_id)
        if not battle_data:
            logger.warning(f"[{sid}] No battle data found for room {room_id}")
            return
        
        user_info = connected_users.get(sid, {})
        player_id = user_info.get("user_id", sid)
        first_turn_player_id = battle_data.get("first_turn_player_id")
        goes_first = (str(player_id) == str(first_turn_player_id))
        
        # Determine if this player is host (first in player_ids)
        player_ids = battle_data.get("player_ids", [])
        is_host = (str(player_id) == str(player_ids[0])) if player_ids else False
        
        logger.info(f"[{sid}] Sending battle:init - player_id={player_id}, goes_first={goes_first}, is_host={is_host}")
        
        await sio.emit("battle:init", {
            "battle_id": battle_data.get("battle_id"),
            "players": battle_data.get("players"),
            "goes_first": goes_first,
            "is_host": is_host
        }, room=sid)

