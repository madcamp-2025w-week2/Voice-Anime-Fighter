from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from uuid import UUID

from adapters.api.routes.users import get_current_user_id
from adapters.api.routes.characters import CHARACTERS
from use_cases.battle_service import BattleService
from config import get_settings

router = APIRouter()
battle_service = BattleService()
settings = get_settings()


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


class VoiceAnalyzeResponse(BaseModel):
    success: bool
    transcription: str
    analysis: AnalysisData
    damage: DamageData
    grade: str
    animation_trigger: str


class VoiceAnalyzeErrorResponse(BaseModel):
    success: bool
    error: str
    damage: dict
    grade: str


@router.post("/voice-analyze", response_model=VoiceAnalyzeResponse)
async def analyze_voice(
    audio_file: UploadFile = File(...),
    battle_id: str = Form(...),
    expected_spell: str = Form(...),
    character_id: str = Form(default="char_001"),
    user_id: UUID = Depends(get_current_user_id)
):
    """
    🎤 음성 분석 및 데미지 계산
    
    - 음성 파일을 Azure Speech SDK로 STT
    - Librosa로 볼륨/피치 분석
    - 데미지 공식에 따라 최종 점수 계산
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
                total_damage=0
            ),
            grade="F",
            animation_trigger="miss"
        )
    
    try:
        # Analyze voice
        analysis = await battle_service.analyze_voice(
            audio_data=audio_data,
            expected_spell=expected_spell,
            azure_speech_key=settings.azure_speech_key,
            azure_speech_region=settings.azure_speech_region
        )
        
        # Calculate damage
        damage = battle_service.calculate_damage(analysis, character)
        
        return VoiceAnalyzeResponse(
            success=True,
            transcription=analysis.transcription,
            analysis=AnalysisData(
                text_accuracy=round(analysis.text_accuracy, 2),
                volume_db=round(analysis.volume_db, 1),
                pitch_variance=round(analysis.pitch_variance, 2),
                confidence=round(analysis.confidence, 2)
            ),
            damage=DamageData(
                base_damage=damage.base_damage,
                cringe_bonus=damage.cringe_bonus,
                volume_bonus=damage.volume_bonus,
                accuracy_multiplier=damage.accuracy_multiplier,
                total_damage=damage.total_damage
            ),
            grade=damage.grade,
            animation_trigger=damage.animation_trigger
        )
        
    except Exception as e:
        print(f"Voice analysis error: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Voice analysis failed: {str(e)}"
        )
