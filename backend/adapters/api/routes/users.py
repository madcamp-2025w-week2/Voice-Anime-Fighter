from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from uuid import UUID
from jose import jwt, JWTError

from config import get_settings
from use_cases.ranking_service import RankingService
from sqlalchemy.ext.asyncio import AsyncSession
from adapters.db.database import get_db
from adapters.db.repository import UserRepository

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
    avatar_url: str | None = None
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
async def get_current_user(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """현재 로그인한 유저 정보"""
    # DB에서 조회하도록 변경
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserDetailResponse(
        id=user.id,
        nickname=user.nickname,
        elo_rating=user.elo_rating,
        wins=user.wins,
        losses=user.losses,
        main_character_id=user.main_character_id,
        avatar_url=user.avatar_url,
        created_at=user.created_at.isoformat()
    )


@router.get("/ranking", response_model=RankingResponse)
async def get_rankings(limit: int = 50, offset: int = 0):
    """글로벌 랭킹 조회"""
    # 랭킹은 일단 인메모리 서비스 유지 (추후 DB 기반으로 변경 권장)
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


class UpdateCharacterRequest(BaseModel):
    character_id: str

class UpdateProfileRequest(BaseModel):
    nickname: str | None = None
    avatar_url: str | None = None



@router.put("/me/character", response_model=UserDetailResponse)
async def update_main_character(
    request: UpdateCharacterRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """주 캐릭터 변경"""
    repo = UserRepository(db)
    
    # 1. DB 업데이트
    user = await repo.update_main_character(user_id, request.character_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. 인메모리 서비스 싱크 (선택적)
    # 현재 RankingService가 메모리에 유저를 들고 있다면 거기에도 업데이트 해줌
    await ranking_service.update_user_character(user_id, request.character_id)
        
    return UserDetailResponse(
        id=user.id,
        nickname=user.nickname,
        elo_rating=user.elo_rating,
        wins=user.wins,
        losses=user.losses,
        main_character_id=user.main_character_id,
        avatar_url=user.avatar_url,
        created_at=user.created_at.isoformat()
    )

@router.put("/me", response_model=UserDetailResponse)
async def update_profile(
    request: UpdateProfileRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """프로필(닉네임, 아바타) 변경"""
    repo = UserRepository(db)
    user = await repo.update_profile(user_id, request.nickname, request.avatar_url)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 인메모리 싱크
    await ranking_service.update_user_profile(user_id, request.nickname, request.avatar_url)
    
    return UserDetailResponse(
        id=user.id,
        nickname=user.nickname,
        elo_rating=user.elo_rating,
        wins=user.wins,
        losses=user.losses,
        main_character_id=user.main_character_id,
        avatar_url=user.avatar_url,
        created_at=user.created_at.isoformat()
    )
