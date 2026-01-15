from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from jose import jwt

from config import get_settings
from use_cases.ranking_service import RankingService

router = APIRouter()
settings = get_settings()
ranking_service = RankingService()


class LoginRequest(BaseModel):
    provider: str = "guest"  # guest, google, kakao
    token: str | None = None


class UserResponse(BaseModel):
    id: UUID
    nickname: str
    elo_rating: int
    avatar_url: str


class LoginResponse(BaseModel):
    access_token: str
    user: UserResponse


def create_access_token(user_id: UUID) -> str:
    """Create JWT access token."""
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    payload = {
        "sub": str(user_id),
        "exp": expire
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    로그인/게스트 플레이
    
    - **guest**: 닉네임 자동 생성
    - **google/kakao**: 소셜 로그인 (추후 구현)
    """
    if request.provider == "guest":
        # Create guest user
        nickname = f"마법소녀_{uuid4().hex[:6]}"
        user = await ranking_service.create_user(nickname)
        token = create_access_token(user.id)
        
        return LoginResponse(
            access_token=token,
            user=UserResponse(
                id=user.id,
                nickname=user.nickname,
                elo_rating=user.elo_rating,
                avatar_url=user.avatar_url
            )
        )
    else:
        # TODO: Implement social login
        raise HTTPException(status_code=501, detail="Social login not implemented yet")
