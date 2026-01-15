import io
import tempfile
import os
from dataclasses import dataclass
from difflib import SequenceMatcher

import numpy as np

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
        
        Args:
            audio_data: 음성 파일 바이너리
            expected_spell: 정답 주문 텍스트
            azure_speech_key: Azure Speech 키
            azure_speech_region: Azure Speech 리전
        """
        # Lazy imports to avoid import errors if libraries not installed
        try:
            import azure.cognitiveservices.speech as speechsdk
            import librosa
        except ImportError:
            # Fallback for development without Azure SDK
            return VoiceAnalysisResult(
                transcription="마법소녀 카와이 러블리 루루핑",
                text_accuracy=0.85,
                volume_db=75.0,
                pitch_variance=0.3,
                confidence=0.9
            )
        
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
                # Get confidence from detailed results if available
                confidence = 0.9  # Default high confidence for successful recognition
            else:
                transcription = ""
                confidence = 0.0
                
        except Exception as e:
            print(f"Speech recognition error: {e}")
            transcription = ""
            confidence = 0.0
        
        # Librosa audio analysis
        try:
            y, sr = librosa.load(tmp_path, sr=None)
            
            # Volume (RMS to dB)
            rms = librosa.feature.rms(y=y)
            volume_db = float(librosa.amplitude_to_db(rms).mean()) + 80  # Normalize to positive
            
            # Pitch variance
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = pitches[magnitudes > np.median(magnitudes)]
            pitch_variance = float(np.std(pitch_values)) if len(pitch_values) > 0 else 0.0
            
        except Exception as e:
            print(f"Librosa analysis error: {e}")
            volume_db = 60.0
            pitch_variance = 0.2
        
        finally:
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
