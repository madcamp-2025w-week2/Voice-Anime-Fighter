import io
import tempfile
import os
import random
from dataclasses import dataclass
from difflib import SequenceMatcher

from domain.entities import VoiceAnalysisResult, DamageResult, Character


@dataclass
class BattleService:
    """배틀 관련 비즈니스 로직"""
    
    async def analyze_voice(
        self,
        audio_data: bytes,
        expected_spell: str,
        azure_speech_key: str,
        azure_speech_region: str
    ) -> VoiceAnalysisResult:
        """
        음성 분석: Azure Speech SDK + Librosa
        (Azure 키가 없으면 데모 모드로 동작)
        
        Args:
            audio_data: 음성 파일 바이너리
            expected_spell: 정답 주문 텍스트
            azure_speech_key: Azure Speech 키
            azure_speech_region: Azure Speech 리전
        """
        # ========== 데모 모드 (Azure 키 없을 때) ==========
        if not azure_speech_key or azure_speech_key == "your_azure_speech_key_here":
            # 데모용 Mock 데이터 생성 (랜덤 변동으로 재미있게)
            accuracy = random.uniform(0.6, 1.0)  # 60~100% 정확도
            volume = random.uniform(65, 95)       # 65~95 dB
            confidence = random.uniform(0.7, 0.98)
            
            # 가끔은 완벽하게, 가끔은 조금 틀리게
            if accuracy > 0.85:
                transcription = expected_spell
            else:
                # 일부 텍스트만 인식된 것처럼
                words = expected_spell.split()
                keep_count = max(1, int(len(words) * accuracy))
                transcription = " ".join(words[:keep_count]) + "..."
            
            return VoiceAnalysisResult(
                transcription=transcription,
                text_accuracy=round(accuracy, 2),
                volume_db=round(volume, 1),
                pitch_variance=round(random.uniform(0.15, 0.45), 2),
                confidence=round(confidence, 2)
            )
        
        # ========== 실제 Azure STT 모드 ==========
        try:
            import azure.cognitiveservices.speech as speechsdk
        except ImportError:
            # SDK 없으면 데모 모드로 폴백
            return await self._mock_analysis(expected_spell)
        
        transcription = ""
        confidence = 0.0
        
        # Azure Speech-to-Text
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            tmp_file.write(audio_data)
            tmp_path = tmp_file.name
        
        try:
            speech_config = speechsdk.SpeechConfig(
                subscription=azure_speech_key,
                region=azure_speech_region
            )
            speech_config.speech_recognition_language = "ko-KR"
            
            audio_config = speechsdk.AudioConfig(filename=tmp_path)
            recognizer = speechsdk.SpeechRecognizer(
                speech_config=speech_config,
                audio_config=audio_config
            )
            
            result = recognizer.recognize_once()
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                transcription = result.text
                confidence = 0.9
            else:
                transcription = ""
                confidence = 0.0
                
        except Exception as e:
            print(f"Speech recognition error: {e}")
            transcription = ""
            confidence = 0.0
        
        # Librosa audio analysis (optional)
        volume_db = 75.0
        pitch_variance = 0.3
        
        try:
            import librosa
            import numpy as np
            y, sr = librosa.load(tmp_path, sr=None)
            
            # Volume (RMS to dB)
            rms = librosa.feature.rms(y=y)
            volume_db = float(librosa.amplitude_to_db(rms).mean()) + 80
            
            # Pitch variance
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = pitches[magnitudes > np.median(magnitudes)]
            pitch_variance = float(np.std(pitch_values)) if len(pitch_values) > 0 else 0.0
        except Exception as e:
            print(f"Librosa analysis error (using defaults): {e}")
        
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        # Text accuracy (similarity)
        text_accuracy = SequenceMatcher(
            None, 
            transcription.lower().replace(" ", ""),
            expected_spell.lower().replace(" ", "")
        ).ratio() if transcription else 0.0
        
        return VoiceAnalysisResult(
            transcription=transcription,
            text_accuracy=text_accuracy,
            volume_db=volume_db,
            pitch_variance=pitch_variance,
            confidence=confidence
        )
    
    async def _mock_analysis(self, expected_spell: str) -> VoiceAnalysisResult:
        """데모용 Mock 분석 결과"""
        accuracy = random.uniform(0.6, 1.0)
        return VoiceAnalysisResult(
            transcription=expected_spell if accuracy > 0.8 else expected_spell[:len(expected_spell)//2] + "...",
            text_accuracy=round(accuracy, 2),
            volume_db=round(random.uniform(65, 95), 1),
            pitch_variance=round(random.uniform(0.15, 0.45), 2),
            confidence=round(random.uniform(0.7, 0.98), 2)
        )
    
    def calculate_damage(
        self,
        analysis: VoiceAnalysisResult,
        character: Character
    ) -> DamageResult:
        """
        데미지 계산
        
        공식:
        - base_damage = 캐릭터 기본 데미지
        - cringe_bonus = 오글거림 수치 * 텍스트 정확도
        - volume_bonus = (volume_db - 60) * 0.5 (최소 0)
        - accuracy_multiplier = 0.5 + 텍스트 정확도
        - total = (base + cringe + volume) * multiplier
        """
        base_damage = 50
        
        # Cringe bonus (higher cringe level = more bonus for accurate spells)
        cringe_bonus = int(character.stats.cringe_level * analysis.text_accuracy * 0.5)
        
        # Volume bonus (louder = more damage, scaled by volume requirement)
        volume_factor = (analysis.volume_db - 60) / 40  # Normalize 60-100 dB to 0-1
        volume_factor = max(0, min(1, volume_factor))
        volume_bonus = int(30 * volume_factor * (character.stats.volume_req / 100))
        
        # Accuracy multiplier
        accuracy_multiplier = 0.5 + (analysis.text_accuracy * 0.5) + (analysis.confidence * 0.2)
        
        # Total damage
        total_damage = int((base_damage + cringe_bonus + volume_bonus) * accuracy_multiplier)
        
        # Grade calculation
        grade = self._calculate_grade(analysis, total_damage)
        
        # Animation trigger based on grade
        animation_map = {
            "SSS": "ultimate_attack",
            "S": "special_attack_02",
            "A": "special_attack_01",
            "B": "normal_attack_02",
            "C": "normal_attack_01",
            "F": "miss"
        }
        
        return DamageResult(
            base_damage=base_damage,
            cringe_bonus=cringe_bonus,
            volume_bonus=volume_bonus,
            accuracy_multiplier=round(accuracy_multiplier, 2),
            total_damage=total_damage,
            grade=grade,
            animation_trigger=animation_map.get(grade, "normal_attack_01")
        )
    
    def _calculate_grade(self, analysis: VoiceAnalysisResult, damage: int) -> str:
        """Calculate grade based on performance."""
        score = (
            analysis.text_accuracy * 40 +
            min(1.0, analysis.volume_db / 80) * 30 +
            analysis.confidence * 20 +
            min(100, damage) / 100 * 10
        )
        
        if score >= 90:
            return "SSS"
        elif score >= 80:
            return "S"
        elif score >= 65:
            return "A"
        elif score >= 50:
            return "B"
        elif score >= 30:
            return "C"
        else:
            return "F"
