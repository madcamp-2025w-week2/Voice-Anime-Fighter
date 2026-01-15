from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.entities import User, Character, Room, Battle


class UserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        pass
    
    @abstractmethod
    async def create(self, user: User) -> User:
        pass
    
    @abstractmethod
    async def update(self, user: User) -> User:
        pass
    
    @abstractmethod
    async def get_rankings(self, limit: int = 50, offset: int = 0) -> list[User]:
        pass
    
    @abstractmethod
    async def get_total_count(self) -> int:
        pass


class CharacterRepository(ABC):
    @abstractmethod
    async def get_all(self) -> list[Character]:
        pass
    
    @abstractmethod
    async def get_by_id(self, character_id: str) -> Optional[Character]:
        pass


class RoomRepository(ABC):
    @abstractmethod
    async def get_by_id(self, room_id: UUID) -> Optional[Room]:
        pass
    
    @abstractmethod
    async def create(self, room: Room) -> Room:
        pass
    
    @abstractmethod
    async def update(self, room: Room) -> Room:
        pass
    
    @abstractmethod
    async def delete(self, room_id: UUID) -> bool:
        pass
    
    @abstractmethod
    async def get_open_rooms(self) -> list[Room]:
        pass
    
    @abstractmethod
    async def get_by_invite_code(self, code: str) -> Optional[Room]:
        pass


class BattleRepository(ABC):
    @abstractmethod
    async def get_by_id(self, battle_id: UUID) -> Optional[Battle]:
        pass
    
    @abstractmethod
    async def create(self, battle: Battle) -> Battle:
        pass
    
    @abstractmethod
    async def update(self, battle: Battle) -> Battle:
        pass
    
    @abstractmethod
    async def get_active_by_user(self, user_id: UUID) -> Optional[Battle]:
        pass
