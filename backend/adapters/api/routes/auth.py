from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from jose import jwt

from config import get_settings
from use_cases.ranking_service import RankingService
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from adapters.db.database import get_db
from adapters.db.repository import UserRepository
import httpx

router = APIRouter()
settings = get_settings()
ranking_service = RankingService()


class LoginRequest(BaseModel):
    provider: str = "guest"  # guest, google, kakao
    token: str | None = None


class GoogleLoginRequest(BaseModel):
    access_token: str


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


async def _handle_google_login(access_token: str, db: AsyncSession) -> LoginResponse:
    if not access_token:
        raise HTTPException(status_code=400, detail="Access token is required")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            user_info = resp.json()
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Google auth error: {exc}")
        raise HTTPException(status_code=401, detail="Google authentication failed")

    google_id = user_info.get("sub")
    if not google_id:
        raise HTTPException(status_code=401, detail="Invalid Google user info")

    repo = UserRepository(db)
    user = await repo.get_by_google_id(google_id)

    if not user:
        nickname = user_info.get("name") or user_info.get("email") or f"user_{google_id[:6]}"
        if await repo.get_by_nickname(nickname):
            nickname = f"{nickname}_{google_id[:6]}"

        user = await repo.create_user(
            nickname=nickname,
            google_id=google_id,
            email=user_info.get("email"),
            avatar_url=user_info.get("picture"),
        )

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


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    로그인/게스트 플레이
    
    - **guest**: 닉네임 자동 생성
    - **google**: 구글 소셜 로그인
    """
    if request.provider == "guest":
        # Create guest user in DB
        nickname = f"마법소녀_{uuid4().hex[:6]}"
        repo = UserRepository(db)
        
        # Ensure nickname uniqueness (simple retry or check)
        # For simplicity, we assume uuid hex is unique enough or handle collision later
        user = await repo.create_user(nickname=nickname)
        
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
    elif request.provider == "google":
        if not request.token:
            raise HTTPException(status_code=400, detail="Token is required for Google login")
        return await _handle_google_login(request.token, db)
    else:
        raise HTTPException(status_code=400, detail="Unsupported login provider")
    
@router.post("/google", response_model=LoginResponse)
async def google_login_endpoint(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Google Login Endpoint"""
    return await _handle_google_login(request.access_token, db)

