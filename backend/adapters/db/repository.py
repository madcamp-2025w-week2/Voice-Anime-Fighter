from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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
