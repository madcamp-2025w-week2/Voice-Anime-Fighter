"""Redis 기반 배틀 세션 관리"""
import redis.asyncio as redis
import json
from typing import Optional
from dataclasses import dataclass, asdict
from config import get_settings

settings = get_settings()


@dataclass
class BattleState:
    """실시간 배틀 상태"""
    battle_id: str
    player1_id: str
    player2_id: str
    player1_hp: int = 300
    player2_hp: int = 300
    player1_character_id: Optional[str] = None
    player2_character_id: Optional[str] = None
    current_turn: int = 1  # 1 = player1, 2 = player2
    round_number: int = 1
    status: str = "waiting"  # waiting, character_select, battle, finished
    is_ranked: bool = False  # ELO 반영 여부
    

class BattleStateManager:
    """Redis를 사용한 배틀 상태 관리"""
    
    def __init__(self):
        self.redis_client = None
        self.prefix = "battle:"
        
    async def connect(self):
        """Redis 연결"""
        if self.redis_client is None:
            self.redis_client = redis.from_url(settings.redis_url)
        return self.redis_client
    
    async def create_battle(self, battle_id: str, player1_id: str, player2_id: str, is_ranked: bool = False) -> BattleState:
        """새 배틀 세션 생성"""
        await self.connect()
        
        state = BattleState(
            battle_id=battle_id,
            player1_id=player1_id,
            player2_id=player2_id,
            status="character_select",
            is_ranked=is_ranked
        )
        
        await self.redis_client.set(
            f"{self.prefix}{battle_id}",
            json.dumps(asdict(state)),
            ex=3600  # 1시간 후 자동 만료
        )
        
        return state
    
    async def get_battle(self, battle_id: str) -> Optional[BattleState]:
        """배틀 상태 조회"""
        await self.connect()
        
        data = await self.redis_client.get(f"{self.prefix}{battle_id}")
        if not data:
            return None
            
        state_dict = json.loads(data)
        return BattleState(**state_dict)
    
    async def update_hp(self, battle_id: str, player_id: str, damage: int) -> Optional[dict]:
        """플레이어 HP 업데이트 및 새 상태 반환"""
        await self.connect()
        
        state = await self.get_battle(battle_id)
        if not state:
            return None
        
        # 어느 플레이어인지 확인하고 HP 감소
        if player_id == state.player1_id:
            state.player2_hp = max(0, state.player2_hp - damage)  # 상대방 HP 감소
        elif player_id == state.player2_id:
            state.player1_hp = max(0, state.player1_hp - damage)
        
        # 게임 종료 확인
        winner_id = None
        if state.player1_hp <= 0:
            state.status = "finished"
            winner_id = state.player2_id
        elif state.player2_hp <= 0:
            state.status = "finished"
            winner_id = state.player1_id
        
        # 턴 전환
        state.current_turn = 2 if state.current_turn == 1 else 1
        
        # Redis 업데이트
        await self.redis_client.set(
            f"{self.prefix}{battle_id}",
            json.dumps(asdict(state)),
            ex=3600
        )
        
        return {
            "player1_hp": state.player1_hp,
            "player2_hp": state.player2_hp,
            "current_turn": state.current_turn,
            "status": state.status,
            "winner_id": winner_id
        }
    
    async def set_character(self, battle_id: str, player_id: str, character_id: str) -> bool:
        """플레이어 캐릭터 선택 저장"""
        await self.connect()
        
        state = await self.get_battle(battle_id)
        if not state:
            return False
        
        if player_id == state.player1_id:
            state.player1_character_id = character_id
        elif player_id == state.player2_id:
            state.player2_character_id = character_id
        
        # 둘 다 선택했으면 battle 상태로 전환
        if state.player1_character_id and state.player2_character_id:
            state.status = "battle"
        
        await self.redis_client.set(
            f"{self.prefix}{battle_id}",
            json.dumps(asdict(state)),
            ex=3600
        )
        
        return True
    
    async def delete_battle(self, battle_id: str):
        """배틀 세션 삭제 (게임 종료 시)"""
        await self.connect()
        await self.redis_client.delete(f"{self.prefix}{battle_id}")
        print(f"🗑️ Battle session deleted: {battle_id}")


# 싱글톤 인스턴스
battle_state_manager = BattleStateManager()
