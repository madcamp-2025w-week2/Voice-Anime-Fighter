import io
import tempfile
import os
import random
from dataclasses import dataclass
from Levenshtein import ratio as levenshtein_ratio

from domain.entities import VoiceAnalysisResult, DamageResult, Character

# ========== Korean Emotion Classifier (GPU) ==========
USE_GPU_MODEL = False
emotion_classifier = None

try:
    from transformers import pipeline
    import torch
    
    device = 0 if torch.cuda.is_available() else -1
    
    # 한국어 감정 분석 모델
    # Labels: angry, disgust, fear, happy, neutral, sad, surprise
    emotion_classifier = pipeline(
        "audio-classification",
        model="hun3359/wav2vec2-xlsr-53-korean-emotion",
        device=device
    )
    USE_GPU_MODEL = True
    print(f"✅ Korean Emotion Classifier loaded (device={device})")
except ImportError as e:
    print(f"⚠️ Emotion Classifier not available: {e}")
    USE_GPU_MODEL = False
except Exception as e:
    print(f"⚠️ Failed to load emotion classifier: {e}")
    USE_GPU_MODEL = False


@dataclass
class BattleService:
    """배틀 관련 비즈니스 로직 - Two-Track Voice Analysis"""
    
    async def analyze_voice(
        self,
        audio_data: bytes,
        stt_text: str,
        expected_spell: str,
    ) -> VoiceAnalysisResult:
        """
        음성 분석: Librosa 물리 분석 + 텍스트 비교 + GPU 감정 분석
        
        Args:
            audio_data: 음성 파일 바이너리
            stt_text: 프론트엔드 Web Speech API에서 받은 텍스트
            expected_spell: 정답 주문 텍스트
        """
        # ========== 1. Text Accuracy (Levenshtein Distance) ==========
        # 프론트엔드에서 받은 STT 텍스트와 정답 비교
        text_accuracy = self._calculate_text_accuracy(stt_text, expected_spell)
        
        # ========== 2. Physical Analysis (Librosa) - Volume ==========
        volume_db = 75.0
        pitch_variance = 0.3
        is_critical = False
        
        # Save audio to temp file for analysis
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_file:
            tmp_file.write(audio_data)
            tmp_path = tmp_file.name
        
        try:
            import librosa
            import numpy as np
            
            y, sr = librosa.load(tmp_path, sr=None)
            
            # Volume (RMS to dB)
            rms = librosa.feature.rms(y=y)
            rms_mean = float(np.mean(rms))
            volume_db = rms_mean * 1000  # Scale for game scoring
            volume_db = max(0, min(100, volume_db))  # Clamp 0-100
            
            # Pitch variance (Zero Crossing Rate for CPU fallback)
            zcr = librosa.feature.zero_crossing_rate(y)
            pitch_variance = float(np.var(zcr))
            
            # ========== 3. Emotion Analysis (GPU or CPU Fallback) ==========
            if USE_GPU_MODEL and emotion_classifier is not None:
                # Korean Emotion Model: wav2vec2-xlsr-53-korean-emotion
                # Labels: angry, disgust, fear, happy, neutral, sad, surprise
                try:
                    emotions = emotion_classifier(tmp_path)
                    top_emotion = emotions[0]['label'] if emotions else 'neutral'
                    emotion_score = emotions[0]['score'] if emotions else 0.0
                    
                    # 크리티컬 히트: angry(분노), happy(기쁨), surprise(놀람) + 높은 점수
                    critical_emotions = ['angry', 'happy', 'surprise']
                    if top_emotion in critical_emotions and emotion_score > 0.5:
                        is_critical = True
                    
                    print(f"🎭 Emotion: {top_emotion} ({emotion_score:.2f}) - Critical: {is_critical}")
                except Exception as e:
                    print(f"⚠️ Emotion analysis error: {e}")
                    # Fallback to pitch variance
                    is_critical = pitch_variance > 0.05
            else:
                # CPU Fallback: Use pitch variance for critical hit
                is_critical = pitch_variance > 0.05
                
        except Exception as e:
            print(f"⚠️ Librosa analysis error (using defaults): {e}")
            # Demo fallback values
            volume_db = random.uniform(50, 80)
            pitch_variance = random.uniform(0.02, 0.08)
            is_critical = random.random() > 0.7
        
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        # Confidence based on text accuracy + volume
        confidence = (text_accuracy * 0.7) + (min(1.0, volume_db / 80) * 0.3)
        
        return VoiceAnalysisResult(
            transcription=stt_text,
            text_accuracy=round(text_accuracy, 2),
            volume_db=round(volume_db, 1),
            pitch_variance=round(pitch_variance, 4),
            confidence=round(confidence, 2),
            is_critical=is_critical
        )
    
    def _calculate_text_accuracy(self, stt_text: str, expected_text: str) -> float:
        """Levenshtein ratio로 텍스트 정확도 계산"""
        if not stt_text or not expected_text:
            return 0.0
        
        # Normalize: lowercase, remove spaces and punctuation (., !, ?, ,, ~)
        punctuation_to_remove = " !?,.~"
        
        stt_normalized = stt_text.lower()
        expected_normalized = expected_text.lower()
        
        for char in punctuation_to_remove:
            stt_normalized = stt_normalized.replace(char, "")
            expected_normalized = expected_normalized.replace(char, "")
        
        return levenshtein_ratio(stt_normalized, expected_normalized)
    
    def calculate_damage(
        self,
        analysis: VoiceAnalysisResult,
        character: Character,
        is_ultimate: bool = False
    ) -> DamageResult:
        """
        데미지 계산 (공식은 기존과 동일 + 크리티컬 보너스 + 궁극기 보너스)
        
        공식:
        - base_damage = 50
        - cringe_bonus = 오글거림 수치 * 텍스트 정확도 * 0.5
        - volume_bonus = (volume - 0) * 0.5 (최대 30)
        - accuracy_multiplier = 0.5 + 텍스트 정확도 * 0.5 + 신뢰도 * 0.2
        - total = (base + cringe + volume) * multiplier
        - Critical: total *= 1.5
        - Ultimate: total *= 1.5
        """
        base_damage = 50
        
        # Cringe bonus (higher cringe level = more bonus for accurate spells)
        cringe_bonus = int(character.stats.cringe_level * analysis.text_accuracy * 0.2)
        
        # Volume bonus (louder = more damage, scaled)
        volume_factor = min(1.0, analysis.volume_db / 80)
        volume_bonus = int(10 * volume_factor * (character.stats.volume_req / 100))
        
        # Accuracy multiplier
        accuracy_multiplier = 0.2 + (analysis.text_accuracy * 0.5) + (analysis.confidence * 0.2)
        
        # Total damage
        total_damage = int((base_damage + cringe_bonus + volume_bonus) * accuracy_multiplier)
        
        # Critical hit bonus (1.5x)
        is_critical = getattr(analysis, 'is_critical', False)
        if is_critical:
            total_damage = int(total_damage * 1.5)
        
        # Ultimate skill bonus (1.5x)
        if is_ultimate:
            total_damage = int(total_damage * 1.5)
            print(f"🌟 ULTIMATE ATTACK! Damage boosted: {total_damage}")
        
        # Grade calculation
        grade = self._calculate_grade(analysis, total_damage, is_critical)
        
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
            animation_trigger=animation_map.get(grade, "normal_attack_01"),
            is_critical=is_critical
        )
    
    def _calculate_grade(self, analysis: VoiceAnalysisResult, damage: int, is_critical: bool = False) -> str:
        """Calculate grade based on performance."""
        score = (
            analysis.text_accuracy * 40 +
            min(1.0, analysis.volume_db / 80) * 30 +
            analysis.confidence * 20 +
            min(100, damage) / 100 * 10
        )
        
        # Critical hit bumps grade
        if is_critical:
            score += 10
        
        if score >= 85:
            return "SSS"
        elif score >= 75:
            return "S"
        elif score >= 60:
            return "A"
        elif score >= 40:
            return "B"
        elif score >= 20:
            return "C"
        else:
            return "F"
