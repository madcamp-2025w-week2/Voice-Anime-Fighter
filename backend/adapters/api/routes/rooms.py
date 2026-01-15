from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import UUID

from adapters.api.routes.users import get_current_user_id
from use_cases.room_service import RoomService

router = APIRouter()
room_service = RoomService()


class CreateRoomRequest(BaseModel):
    name: str
    is_private: bool = False
    password: str | None = None


class RoomResponse(BaseModel):
    room_id: UUID
    invite_code: str
    host_id: UUID
    created_at: str


class RoomListItem(BaseModel):
    room_id: UUID
    name: str
    host_nickname: str
    player_count: int
    max_players: int
    is_private: bool
    status: str


class RoomListResponse(BaseModel):
    rooms: list[RoomListItem]


class JoinRoomRequest(BaseModel):
    password: str | None = None


class MessageResponse(BaseModel):
    success: bool
    message: str


@router.post("", response_model=RoomResponse)
async def create_room(
    request: CreateRoomRequest,
    user_id: UUID = Depends(get_current_user_id)
):
    """새 방 생성"""
    room = await room_service.create_room(
        name=request.name,
        host_id=user_id,
        is_private=request.is_private,
        password=request.password
    )
    
    return RoomResponse(
        room_id=room.id,
        invite_code=room.invite_code,
        host_id=room.host_id,
        created_at=room.created_at.isoformat()
    )


@router.get("", response_model=RoomListResponse)
async def get_rooms():
    """열린 방 목록 조회"""
    rooms = await room_service.get_open_rooms()
    
    return RoomListResponse(
        rooms=[
            RoomListItem(
                room_id=room.id,
                name=room.name,
                host_nickname="Host",  # TODO: Get actual nickname
                player_count=room.player_count,
                max_players=room.max_players,
                is_private=room.is_private,
                status=room.status.value
            )
            for room in rooms
        ]
    )


@router.post("/{room_id}/join", response_model=MessageResponse)
async def join_room(
    room_id: UUID,
    request: JoinRoomRequest = JoinRoomRequest(),
    user_id: UUID = Depends(get_current_user_id)
):
    """방 참가"""
    success, message = await room_service.join_room(room_id, user_id, request.password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return MessageResponse(success=True, message=message)


@router.delete("/{room_id}", response_model=MessageResponse)
async def delete_room(
    room_id: UUID,
    user_id: UUID = Depends(get_current_user_id)
):
    """방 삭제 (호스트만)"""
    success, message = await room_service.delete_room(room_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return MessageResponse(success=True, message=message)


@router.post("/{room_id}/leave", response_model=MessageResponse)
async def leave_room(
    room_id: UUID,
    user_id: UUID = Depends(get_current_user_id)
):
    """방 퇴장"""
    success = await room_service.leave_room(room_id, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to leave room")
    
    return MessageResponse(success=True, message="Left room successfully")
