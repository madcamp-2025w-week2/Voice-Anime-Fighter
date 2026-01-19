from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from .models import UserModel

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_google_id(self, google_id: str):
        result = await self.db.execute(select(UserModel).filter(UserModel.google_id == google_id))
        return result.scalars().first()
    
    async def get_by_nickname(self, nickname: str):
        result = await self.db.execute(select(UserModel).filter(UserModel.nickname == nickname))
        return result.scalars().first()

    async def create_user(self, nickname: str, google_id: str = None, email: str = None, avatar_url: str = None):
        user = UserModel(
            nickname=nickname,
            google_id=google_id,
            email=email,
            avatar_url=avatar_url or "/assets/avatars/default.png"
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def get_by_id(self, user_id):
        result = await self.db.execute(select(UserModel).filter(UserModel.id == user_id))
        return result.scalars().first()

    async def update_main_character(self, user_id, character_id: str):
        # user_id can be UUID or str
        user = await self.get_by_id(user_id)
        if user:
            user.main_character_id = character_id
            await self.db.commit()
            await self.db.refresh(user)
        return user
    
    async def update_profile(self, user_id, nickname: str = None, avatar_url: str = None):
        user = await self.get_by_id(user_id)
        if user:
            if nickname:
                user.nickname = nickname
            if avatar_url:
                user.avatar_url = avatar_url
            await self.db.commit()
            await self.db.refresh(user)
        return user

    # ---- Ranking Methods ----
    
    async def get_top_rankings(self, limit: int = 10, offset: int = 0):
        """Get top ranked users from database, ordered by elo_rating DESC."""
        result = await self.db.execute(
            select(UserModel)
            .order_by(desc(UserModel.elo_rating))
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_total_users_count(self) -> int:
        """Get total count of all users in database."""
        result = await self.db.execute(select(func.count(UserModel.id)))
        return result.scalar() or 0
    
    async def update_elo_rating(self, user_id, new_rating: int, wins_delta: int = 0, losses_delta: int = 0):
        """Update user's ELO rating and win/loss counts in database."""
        user = await self.get_by_id(user_id)
        if user:
            user.elo_rating = new_rating
            user.wins += wins_delta
            user.losses += losses_delta
            await self.db.commit()
            await self.db.refresh(user)
        return user

    async def get_user_rank(self, user_id) -> int:
        """Get user's rank based on ELO rating."""
        # elo_rating이 현재 유저보다 높은 유저의 수를 셈
        user = await self.get_by_id(user_id)
        if not user:
            return 0
        
        result = await self.db.execute(
            select(func.count(UserModel.id))
            .filter(UserModel.elo_rating > user.elo_rating)
        )
        higher_rank_count = result.scalar() or 0
        return higher_rank_count + 1
