from typing import Optional
from uuid import UUID

from domain.entities import User


class RankingService:
    """ELO 랭킹 서비스"""
    
    # In-memory storage for development
    _users: dict[UUID, User] = {}
    
    async def get_user(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        return self._users.get(user_id)
    
    async def create_user(self, nickname: str) -> User:
        """Create new user with default ELO."""
        user = User(nickname=nickname)
        self._users[user.id] = user
        return user
    
    async def update_elo_after_match(
        self,
        winner_id: UUID,
        loser_id: UUID
    ) -> tuple[int, int]:
        """
        Update ELO ratings after a match.
        Returns (winner_change, loser_change).
        """
        winner = self._users.get(winner_id)
        loser = self._users.get(loser_id)
        
        if not winner or not loser:
            return 0, 0
        
        loser_elo = loser.elo_rating
        winner_elo = winner.elo_rating
        
        winner_change = winner.update_elo(loser_elo, won=True)
        loser_change = loser.update_elo(winner_elo, won=False)
        
        return winner_change, loser_change
    
    async def get_rankings(self, limit: int = 50, offset: int = 0) -> list[User]:
        """Get top ranked users."""
        sorted_users = sorted(
            self._users.values(),
            key=lambda u: u.elo_rating,
            reverse=True
        )
        return sorted_users[offset:offset + limit]
    
    async def get_total_users(self) -> int:
        """Get total user count."""
        return len(self._users)
    
    async def get_user_rank(self, user_id: UUID) -> Optional[int]:
        """Get a user's current rank."""
        sorted_users = sorted(
            self._users.values(),
            key=lambda u: u.elo_rating,
            reverse=True
        )
        for i, user in enumerate(sorted_users, 1):
            if user.id == user_id:
                return i
        return None
