import random
import string
from typing import Optional
from uuid import UUID

from domain.entities import Room, RoomStatus


class RoomService:
    """방 관리 서비스 (Singleton)"""
    
    _instance = None
    
    # In-memory storage for development (replace with Redis in production)
    _rooms: dict[UUID, Room] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def generate_invite_code(self, length: int = 6) -> str:
        """Generate random invite code."""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    
    async def create_room(self, name: str, host_id: UUID, is_private: bool = False, password: Optional[str] = None) -> Room:
        """Create a new room."""
        room = Room(
            name=name,
            host_id=host_id,
            invite_code=self.generate_invite_code(),
            is_private=is_private,
            password=password,
            player_ids=[host_id]
        )
        self._rooms[room.id] = room
        return room
    
    async def get_room(self, room_id: UUID) -> Optional[Room]:
        """Get room by ID."""
        return self._rooms.get(room_id)
    
    async def get_room_by_code(self, invite_code: str) -> Optional[Room]:
        """Get room by invite code."""
        for room in self._rooms.values():
            if room.invite_code == invite_code:
                return room
        return None
    
    async def join_room(self, room_id: UUID, user_id: UUID, password: Optional[str] = None) -> tuple[bool, str]:
        """
        Join a room.
        Returns (success, message).
        """
        room = self._rooms.get(room_id)
        if not room:
            return False, "Room not found"
        
        if room.is_full:
            return False, "Room is full"
        
        if room.status != RoomStatus.WAITING:
            return False, "Game already in progress"
        
        if room.is_private and room.password and room.password != password:
            return False, "Incorrect password"
        
        if user_id not in room.player_ids:
            room.player_ids.append(user_id)
        
        return True, "Joined successfully"
    
    async def leave_room(self, room_id: UUID, user_id: UUID) -> bool:
        """Leave a room."""
        room = self._rooms.get(room_id)
        if not room:
            return False
        
        if user_id in room.player_ids:
            room.player_ids.remove(user_id)
        
        # If host leaves, transfer host or close room
        if user_id == room.host_id:
            if room.player_ids:
                room.host_id = room.player_ids[0]
            else:
                room.status = RoomStatus.CLOSED
                del self._rooms[room_id]
        
        return True
    
    async def get_open_rooms(self) -> list[Room]:
        """Get all open (non-private, waiting or playing) rooms."""
        return [
            room for room in self._rooms.values()
            if not room.is_private and room.status in [RoomStatus.WAITING, RoomStatus.PLAYING]
        ]
    
    async def delete_room(self, room_id: UUID, user_id: UUID) -> tuple[bool, str]:
        """Delete a room (host only)."""
        room = self._rooms.get(room_id)
        if not room:
            return False, "Room not found"
        
        if room.host_id != user_id:
            return False, "Only host can delete room"
        
        del self._rooms[room_id]
        return True, "Room deleted"
    
    async def start_game(self, room_id: UUID, user_id: UUID) -> tuple[bool, str]:
        """Start game in room (host only, when full)."""
        room = self._rooms.get(room_id)
        if not room:
            return False, "Room not found"
        
        if room.host_id != user_id:
            return False, "Only host can start game"
        
        if room.player_count < 2:
            return False, "Need at least 2 players"
        
        room.status = RoomStatus.PLAYING
        return True, "Game started"
