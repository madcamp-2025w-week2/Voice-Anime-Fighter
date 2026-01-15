from datetime import datetime
from typing import Any
import socketio


# Connected users mapping: sid -> user_info
connected_users: dict[str, dict[str, Any]] = {}

# Room memberships: room_id -> list of sids
room_members: dict[str, list[str]] = {}


def register_socket_handlers(sio: socketio.AsyncServer):
    """Register all Socket.io event handlers."""
    
    @sio.event
    async def connect(sid, environ, auth):
        """Handle client connection."""
        print(f"Client connected: {sid}")
        
        # Store user info (in production, verify JWT from auth)
        user_id = auth.get("user_id", sid) if auth else sid
        connected_users[sid] = {
            "user_id": user_id,
            "nickname": f"Player_{sid[:6]}",
            "connected_at": datetime.utcnow().isoformat()
        }
        
        await sio.emit("connected", {"message": "Connected to Voice-Anime-Fighter!"}, room=sid)
    
    @sio.event
    async def disconnect(sid):
        """Handle client disconnection."""
        print(f"Client disconnected: {sid}")
        
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
    
    @sio.event
    async def room_join(sid, data):
        """Join a room."""
        room_id = data.get("room_id")
        if not room_id:
            return
        
        sio.enter_room(sid, room_id)
        
        if room_id not in room_members:
            room_members[room_id] = []
        room_members[room_id].append(sid)
        
        user_info = connected_users.get(sid, {})
        
        # Notify room members
        await sio.emit("room:player_joined", {
            "user_id": user_info.get("user_id", sid),
            "nickname": user_info.get("nickname", "Unknown")
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
        
        if not room_id:
            return
        
        # Get players in room
        players = []
        for member_sid in room_members.get(room_id, []):
            user_info = connected_users.get(member_sid, {})
            players.append({
                "user_id": user_info.get("user_id", member_sid),
                "nickname": user_info.get("nickname", "Unknown")
            })
        
        await sio.emit("room:game_start", {
            "battle_id": battle_id or room_id,
            "players": players
        }, room=room_id)
