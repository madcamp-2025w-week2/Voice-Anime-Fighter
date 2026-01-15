from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from uuid import UUID
from jose import jwt, JWTError

from config import get_settings
from use_cases.ranking_service import RankingService

router = APIRouter()
security = HTTPBearer()
settings = get_settings()
ranking_service = RankingService()


class UserDetailResponse(BaseModel):
    id: UUID
    nickname: str
    elo_rating: int
    wins: int
    losses: int
    main_character_id: str
    created_at: str


class RankingEntry(BaseModel):
    rank: int
    user_id: UUID
    nickname: str
    elo_rating: int
    wins: int
    main_character_id: str


class RankingResponse(BaseModel):
    rankings: list[RankingEntry]
    total: int


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UUID:
    """Verify JWT and extract user ID."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UUID(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/me", response_model=UserDetailResponse)
async def get_current_user(user_id: UUID = Depends(get_current_user_id)):
    """현재 로그인한 유저 정보"""
    user = await ranking_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserDetailResponse(
        id=user.id,
        nickname=user.nickname,
        elo_rating=user.elo_rating,
        wins=user.wins,
        losses=user.losses,
        main_character_id=user.main_character_id,
        created_at=user.created_at.isoformat()
    )


@router.get("/ranking", response_model=RankingResponse)
async def get_rankings(limit: int = 50, offset: int = 0):
    """글로벌 랭킹 조회"""
    users = await ranking_service.get_rankings(limit, offset)
    total = await ranking_service.get_total_users()
    
    rankings = [
        RankingEntry(
            rank=offset + i + 1,
            user_id=user.id,
            nickname=user.nickname,
            elo_rating=user.elo_rating,
            wins=user.wins,
            main_character_id=user.main_character_id
        )
        for i, user in enumerate(users)
    ]
    
    return RankingResponse(rankings=rankings, total=total)
