from datetime import datetime
from typing import Any
import socketio


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
        print(f"Client connected: {sid}")
        
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
        print(f"Client disconnected: {sid}")
        
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
        print(f"User {sid} joined matchmaking queue")
        
        if sid in waiting_queue:
            return
            
        # Check if anyone is waiting
        if waiting_queue:
            opponent_sid = waiting_queue.pop(0)
            
            # Create a match
            battle_id = f"battle_{datetime.utcnow().timestamp()}"
            
            p1_info = connected_users.get(sid, {})
            p2_info = connected_users.get(opponent_sid, {})
            
            # Notify both players
            await sio.emit("match:found", {
                "battle_id": battle_id,
                "opponent": {
                    "nickname": p2_info.get("nickname", "Unknown"),
                    "elo_rating": p2_info.get("elo_rating", 1200),
                    # TODO: Pass character info if available
                }
            }, room=sid)
            
            await sio.emit("match:found", {
                "battle_id": battle_id,
                "opponent": {
                    "nickname": p1_info.get("nickname", "Unknown"),
                    "elo_rating": p1_info.get("elo_rating", 1200),
                }
            }, room=opponent_sid)
            
            print(f"Match found: {sid} vs {opponent_sid}")
            
        else:
            waiting_queue.append(sid)
            await sio.emit("match:searching", {}, room=sid)

    @sio.on("match:leave_queue")
    async def leave_queue(sid, data):
        """Leave matchmaking queue."""
        if sid in waiting_queue:
            waiting_queue.remove(sid)
            print(f"User {sid} left matchmaking queue")
            await sio.emit("match:cancelled", {}, room=sid)
    
    @sio.event
    async def room_join(sid, data):
        """Join a room."""
        room_id = data.get("room_id")
        if not room_id:
            print(f"[{sid}] room_join failed: No room_id provided")
            return
        
        # Ensure room_id is string
        room_id = str(room_id)
        
        print(f"[{sid}] Attempting to join room: {room_id}")
        
        sio.enter_room(sid, room_id)
        print(f"[{sid}] Entered socket room: {room_id}")
        
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
            print(f"[{sid}] Added to room_members[{room_id}]. Current members: {room_members[room_id]}")
        else:
            print(f"[{sid}] Already in room_members[{room_id}]")
        
        user_info = connected_users.get(sid, {})
        print(f"[{sid}] User Info: {user_info}")
        
        # Send existing members to the newly joined player
        if existing_members:
            print(f"[{sid}] Sending existing players to {sid}: {len(existing_members)} players")
            await sio.emit("room:existing_players", {
                "players": existing_members
            }, room=sid)
        
        # Notify room members (including new player)
        print(f"[{sid}] Broadcasting room:player_joined to room {room_id}")
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
        
        sio.leave_room(sid, room_id)
        
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
        """Handle chat message."""
        room_id = data.get("room_id")
        message = data.get("message", "")
        
        if not room_id or not message:
            return
        
        user_info = connected_users.get(sid, {})
        
        await sio.emit("chat:new_message", {
            "user_id": user_info.get("user_id", sid),
            "nickname": user_info.get("nickname", "Unknown"),
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }, room=room_id)

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
        """Handle battle attack."""
        battle_id = data.get("battle_id")
        damage_data = data.get("damage_data", {})
        
        if not battle_id:
            return
        
        user_info = connected_users.get(sid, {})
        
        # Broadcast damage to battle room
        await sio.emit("battle:damage_received", {
            "attacker_id": user_info.get("user_id", sid),
            "damage": damage_data.get("total_damage", 0),
            "grade": damage_data.get("grade", "F"),
            "animation_trigger": damage_data.get("animation_trigger", "miss")
        }, room=battle_id)
    
    @sio.event
    async def battle_result(sid, data):
        """Handle battle result."""
        battle_id = data.get("battle_id")
        winner_id = data.get("winner_id")
        stats = data.get("stats", {})
        
        if not battle_id:
            return
        
        await sio.emit("battle:result", {
            "winner_id": winner_id,
            "stats": stats
        }, room=battle_id)
    
    @sio.event
    async def game_start(sid, data):
        """Start the game (host only)."""
        room_id = data.get("room_id")
        battle_id = data.get("battle_id")
        
        print(f"[{sid}] game_start triggered for room_id: {room_id}, battle_id: {battle_id}")
        
        if not room_id:
            print(f"[{sid}] game_start failed: No room_id")
            return
        
        # Get players in room
        players = []
        members = room_members.get(str(room_id), [])
        print(f"[{sid}] Members in room {room_id}: {members}")
        
        for member_sid in members:
            user_info = connected_users.get(member_sid, {})
            players.append({
                "user_id": user_info.get("user_id", member_sid),
                "nickname": user_info.get("nickname", "Unknown")
            })
        
        print(f"[{sid}] Emitting room:game_start to {room_id} with players: {players}")
        await sio.emit("room:game_start", {
            "battle_id": battle_id or room_id,
            "players": players
        }, room=room_id)
