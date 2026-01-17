from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from enum import Enum


class BattleStatus(str, Enum):
    WAITING = "waiting"
    PLAYING = "playing"
    FINISHED = "finished"


class RoomStatus(str, Enum):
    WAITING = "waiting"
    PLAYING = "playing"
    CLOSED = "closed"


@dataclass
class User:
    id: UUID = field(default_factory=uuid4)
    nickname: str = ""
    elo_rating: int = 1200
    wins: int = 0
    losses: int = 0
    main_character_id: str = "char_001"
    avatar_url: str = "/assets/avatars/default.png"
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def update_elo(self, opponent_elo: int, won: bool) -> int:
        """Calculate and update ELO rating."""
        k_factor = 32
        expected = 1 / (1 + 10 ** ((opponent_elo - self.elo_rating) / 400))
        actual = 1.0 if won else 0.0
        change = int(k_factor * (actual - expected))
        self.elo_rating += change
        if won:
            self.wins += 1
        else:
            self.losses += 1
        return change


@dataclass
class CharacterStats:
    cringe_level: int  # 오글거림 수치 (0-100)
    volume_req: int    # 성량 요구도 (0-100)
    precision: int     # 정확도 요구치 (0-100)


@dataclass
class Character:
    id: str
    name: str
    description: str
    stats: CharacterStats
    spell_text: str  # 필살 주문
    thumbnail_url: str
    sprite_url: str
    is_unlocked: bool = True


@dataclass
class Room:
    id: UUID = field(default_factory=uuid4)
    name: str = ""
    host_id: UUID = field(default_factory=uuid4)
    invite_code: str = ""
    is_private: bool = False
    password: Optional[str] = None
    status: RoomStatus = RoomStatus.WAITING
    player_ids: list[UUID] = field(default_factory=list)
    max_players: int = 2
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def player_count(self) -> int:
        return len(self.player_ids)
    
    @property
    def is_full(self) -> bool:
        return self.player_count >= self.max_players


@dataclass
class Battle:
    id: UUID = field(default_factory=uuid4)
    room_id: Optional[UUID] = None
    player1_id: UUID = field(default_factory=uuid4)
    player2_id: UUID = field(default_factory=uuid4)
    player1_hp: int = 100
    player2_hp: int = 100
    player1_character_id: str = "char_001"
    player2_character_id: str = "char_002"
    status: BattleStatus = BattleStatus.WAITING
    winner_id: Optional[UUID] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    def apply_damage(self, attacker_id: UUID, damage: int) -> int:
        """Apply damage to the target. Returns remaining HP."""
        if attacker_id == self.player1_id:
            self.player2_hp = max(0, self.player2_hp - damage)
            return self.player2_hp
        else:
            self.player1_hp = max(0, self.player1_hp - damage)
            return self.player1_hp
    
    def check_winner(self) -> Optional[UUID]:
        """Check if battle is over and return winner ID."""
        if self.player1_hp <= 0:
            self.winner_id = self.player2_id
            self.status = BattleStatus.FINISHED
            self.ended_at = datetime.utcnow()
            return self.player2_id
        elif self.player2_hp <= 0:
            self.winner_id = self.player1_id
            self.status = BattleStatus.FINISHED
            self.ended_at = datetime.utcnow()
            return self.player1_id
        return None


@dataclass
class VoiceAnalysisResult:
    """음성 분석 결과"""
    transcription: str
    text_accuracy: float  # 0.0 - 1.0
    volume_db: float      # 데시벨
    pitch_variance: float # 주파수 변화량
    confidence: float     # 인식 신뢰도 0.0 - 1.0
    is_critical: bool = False  # 크리티컬 히트 여부


@dataclass
class DamageResult:
    """데미지 계산 결과"""
    base_damage: int
    cringe_bonus: int
    volume_bonus: int
    accuracy_multiplier: float
    total_damage: int
    grade: str  # SSS, S, A, B, C, F
    animation_trigger: str
    is_critical: bool = False  # 크리티컬 히트 여부
