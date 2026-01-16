from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
import os
import sys
import sys
import asyncio
import uvicorn

# Fix for Windows asyncpg ConnectionResetError
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from config import get_settings
from adapters.api.routes import auth, users, characters, rooms, battle
from adapters.socket.handlers import register_socket_handlers
from adapters.db.database import init_db

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Voice-Anime-Fighter API",
    description="마법소녀 루루핑 - 음성 기반 대전 게임 백엔드",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
async def on_startup():
    init_db()


# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용: 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for assets
assets_dir = os.path.join(os.path.dirname(__file__), "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Socket.io setup - allow all origins for development
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"  # 개발용: 모든 origin 허용
)
socket_app = socketio.ASGIApp(sio, app)

# Register socket handlers
register_socket_handlers(sio)

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(characters.router, prefix="/api/v1/characters", tags=["Characters"])
app.include_router(rooms.router, prefix="/api/v1/rooms", tags=["Rooms"])
app.include_router(battle.router, prefix="/api/v1/battle", tags=["Battle"])


@app.get("/")
async def root():
    return {
        "message": "🌟 마법소녀 카와이 러블리 루루핑! 🌟",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Export socket_app for uvicorn
application = socket_app

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    uvicorn.run("main:application", host="0.0.0.0", port=8000, reload=True)
