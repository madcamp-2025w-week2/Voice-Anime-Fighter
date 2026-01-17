from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from uuid import UUID
from typing import Optional
import os
import tempfile
import shutil
from datetime import datetime

from adapters.api.routes.users import get_current_user_id
from adapters.api.routes.characters import CHARACTERS
from use_cases.battle_service import BattleService
from config import get_settings

router = APIRouter()
battle_service = BattleService()
settings = get_settings()

# Temporary audio storage directory
TEMP_AUDIO_DIR = os.path.join(tempfile.gettempdir(), "battles")
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)


class AnalysisData(BaseModel):
    text_accuracy: float
    volume_db: float
    pitch_variance: float
    confidence: float


class DamageData(BaseModel):
    base_damage: int
    cringe_bonus: int
    volume_bonus: int
    accuracy_multiplier: float
    total_damage: int
    is_critical: bool = False


class VoiceAnalyzeResponse(BaseModel):
    success: bool
    transcription: str
    analysis: AnalysisData
    damage: DamageData
    grade: str
    animation_trigger: str
    is_critical: bool = False
    audio_url: Optional[str] = None


class VoiceAnalyzeErrorResponse(BaseModel):
    success: bool
    error: str
    damage: dict
    grade: str


def save_audio_file(audio_data: bytes, battle_id: str, user_id: str) -> str:
    """Save audio file temporarily and return URL path"""
    battle_dir = os.path.join(TEMP_AUDIO_DIR, battle_id)
    os.makedirs(battle_dir, exist_ok=True)
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"{timestamp}_{user_id}.webm"
    filepath = os.path.join(battle_dir, filename)
    
    with open(filepath, "wb") as f:
        f.write(audio_data)
    
    # Return URL path for frontend to access
    return f"/api/v1/battle/audio/{battle_id}/{filename}"


def cleanup_battle_audio(battle_id: str):
    """Delete all audio files for a battle"""
    battle_dir = os.path.join(TEMP_AUDIO_DIR, battle_id)
    if os.path.exists(battle_dir):
        shutil.rmtree(battle_dir)
        print(f"🗑️ Cleaned up audio files for battle: {battle_id}")


@router.get("/audio/{battle_id}/{filename}")
async def get_audio_file(battle_id: str, filename: str):
    """Serve temporary audio file for opponent playback"""
    filepath = os.path.join(TEMP_AUDIO_DIR, battle_id, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(filepath, media_type="audio/webm")


@router.post("/voice-analyze", response_model=VoiceAnalyzeResponse)
async def analyze_voice(
    audio_file: UploadFile = File(...),
    battle_id: str = Form(...),
    expected_spell: str = Form(...),
    stt_text: str = Form(default=""),  # Frontend Web Speech API result
    character_id: str = Form(default="char_001"),
    user_id: UUID = Depends(get_current_user_id)
):
    """
    🎤 음성 분석 및 데미지 계산 (Two-Track System)
    
    Fast Track (Frontend): Web Speech API -> stt_text
    Deep Track (Backend): Librosa + Wav2Vec2 -> emotional analysis + damage
    
    - stt_text: 프론트엔드에서 인식한 텍스트
    - audio_file: 녹음된 음성 파일
    - expected_spell: 정답 주문 텍스트
    """
    # Get character
    character = None
    for c in CHARACTERS:
        if c.id == character_id:
            character = c
            break
    
    if not character:
        character = CHARACTERS[0]  # Default to first character
    
    # Read audio file
    audio_data = await audio_file.read()
    
    if not audio_data:
        return VoiceAnalyzeResponse(
            success=False,
            transcription="",
            analysis=AnalysisData(
                text_accuracy=0,
                volume_db=0,
                pitch_variance=0,
                confidence=0
            ),
            damage=DamageData(
                base_damage=0,
                cringe_bonus=0,
                volume_bonus=0,
                accuracy_multiplier=0,
                total_damage=0,
                is_critical=False
            ),
            grade="F",
            animation_trigger="miss",
            is_critical=False,
            audio_url=None
        )
    
    try:
        # Save audio file for opponent playback
        audio_url = save_audio_file(audio_data, battle_id, str(user_id))
        
        # Analyze voice using the Two-Track system
        analysis = await battle_service.analyze_voice(
            audio_data=audio_data,
            stt_text=stt_text,
            expected_spell=expected_spell
        )
        
        # Calculate damage
        damage = battle_service.calculate_damage(analysis, character)
        
        return VoiceAnalyzeResponse(
            success=True,
            transcription=analysis.transcription,
            analysis=AnalysisData(
                text_accuracy=round(analysis.text_accuracy, 2),
                volume_db=round(analysis.volume_db, 1),
                pitch_variance=round(analysis.pitch_variance, 4),
                confidence=round(analysis.confidence, 2)
            ),
            damage=DamageData(
                base_damage=damage.base_damage,
                cringe_bonus=damage.cringe_bonus,
                volume_bonus=damage.volume_bonus,
                accuracy_multiplier=damage.accuracy_multiplier,
                total_damage=damage.total_damage,
                is_critical=damage.is_critical
            ),
            grade=damage.grade,
            animation_trigger=damage.animation_trigger,
            is_critical=damage.is_critical,
            audio_url=audio_url
        )
        
    except Exception as e:
        print(f"Voice analysis error: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Voice analysis failed: {str(e)}"
        )


@router.delete("/cleanup/{battle_id}")
async def cleanup_audio(battle_id: str):
    """Clean up audio files after battle ends"""
    cleanup_battle_audio(battle_id)
    return {"success": True, "message": f"Audio files for battle {battle_id} cleaned up"}
