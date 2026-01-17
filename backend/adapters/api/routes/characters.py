from fastapi import APIRouter
from pydantic import BaseModel

from domain.entities import Character, CharacterStats

router = APIRouter()


class CharacterStatsResponse(BaseModel):
    cringe_level: int
    volume_req: int
    precision: int


class CharacterResponse(BaseModel):
    id: str
    name: str
    description: str
    stats: CharacterStatsResponse
    spell_text: str
    thumbnail_url: str
    sprite_url: str
    is_unlocked: bool


class CharacterListResponse(BaseModel):
    characters: list[CharacterResponse]


# Static character data - 실제 이미지 파일에 매핑
CHARACTERS = [
    Character(
        id="char_000",
        name="찐따 오타쿠 쿠로",
        description="방에서 라면만 먹으며 애니만 보는 진정한 오타쿠. 그의 오글거림은 세계 최강.",
        stats=CharacterStats(cringe_level=100, volume_req=60, precision=85),
        spell_text="월화수목금토일 사랑스러운 마법소녀로 변신할거야 미라클 메이크 업!",
        thumbnail_url="/images/otacu.webp",
        sprite_url="/images/otacu.webp",
        is_unlocked=True
    ),
    Character(
        id="char_001",
        name="고졸 사토루",
        description="오글거림의 여왕. 오타쿠 세계를 지배하는 언더독 마법소녀.",
        stats=CharacterStats(cringe_level=95, volume_req=70, precision=80),
        spell_text="마법소녀 카와이 러블리 루루핑!",
        thumbnail_url="/images/satoru.webp",
        sprite_url="/images/satoru.webp",
        is_unlocked=True
    ),
    Character(
        id="char_002",
        name="마법소녀 루피",
        description="마음을 읽는 초능력 소녀. 와쿠와쿠 에너지로 공격.",
        stats=CharacterStats(cringe_level=75, volume_req=60, precision=90),
        spell_text="와쿠와쿠! 피넛츠가 좋아!",
        thumbnail_url="/images/lupy.webp",
        sprite_url="/images/lupy.webp",
        is_unlocked=True
    ),
    Character(
        id="char_003",
        name="바싹 탄지로",
        description="불의 호흡을 사용하는 귀살대 대원. 박력 넘치는 기합으로 상대를 압도.",
        stats=CharacterStats(cringe_level=50, volume_req=95, precision=60),
        spell_text="물의 호흡! 첫번째 형!",
        thumbnail_url="/images/tan.webp",
        sprite_url="/images/tan.webp",
        is_unlocked=True
    ),
    Character(
        id="char_004",
        name="중2병 리카",
        description="사역눈을 가진 진정한 중2병 환자. 다크플레임 마스터.",
        stats=CharacterStats(cringe_level=100, volume_req=65, precision=75),
        spell_text="폭렬하라! 다크 플레임 마스터!",
        thumbnail_url="/images/rika.webp",
        sprite_url="/images/rika.webp",
        is_unlocked=True
    ),
    Character(
        id="char_005",
        name="고양이 집사 냥댕이",
        description="고양이와 대화하는 신비로운 집사. 냥냥펀치로 공격.",
        stats=CharacterStats(cringe_level=85, volume_req=55, precision=85),
        spell_text="냥냥펀치! 고양이의 힘을 빌려라!",
        thumbnail_url="/images/nyang.webp",
        sprite_url="/images/nyang.webp",
        is_unlocked=True
    ),
    Character(
        id="char_006",
        name="오타쿠 전사 오글이",
        description="분홍 머리띠의 오타쿠. 피규어 파워로 공격.",
        stats=CharacterStats(cringe_level=90, volume_req=80, precision=70),
        spell_text="오타쿠의 자존심! 피규어 슬래시!",
        thumbnail_url="/images/ogeul.webp",
        sprite_url="/images/ogeul.webp",
        is_unlocked=True
    ),
    Character(
        id="char_007",
        name="마법의검 리비",
        description="신비로운 마법의 검을 사용하는 소녀. 빛의 힘을 다룬다.",
        stats=CharacterStats(cringe_level=88, volume_req=50, precision=92),
        spell_text="빛이여! 나의 검에 깃들어라!",
        thumbnail_url="/images/livi.webp",
        sprite_url="/images/livi.webp",
        is_unlocked=True
    ),
    Character(
        id="char_008",
        name="흑염룡 카이토",
        description="오른손에 흑염룡을 봉인한 중2병 소드마스터. 시공의 폭풍을 부른다.",
        stats=CharacterStats(cringe_level=100, volume_req=80, precision=70),
        spell_text="눈을 떠라... 내 안의 흑염룡! 다크니스 디멘션 슬래시!",
        thumbnail_url="/images/dark_sword.webp",
        sprite_url="/images/dark_sword.webp",
        is_unlocked=True
    ),
]


def to_response(char: Character) -> CharacterResponse:
    return CharacterResponse(
        id=char.id,
        name=char.name,
        description=char.description,
        stats=CharacterStatsResponse(
            cringe_level=char.stats.cringe_level,
            volume_req=char.stats.volume_req,
            precision=char.stats.precision
        ),
        spell_text=char.spell_text,
        thumbnail_url=char.thumbnail_url,
        sprite_url=char.sprite_url,
        is_unlocked=char.is_unlocked
    )


@router.get("", response_model=CharacterListResponse)
async def get_characters():
    """전체 캐릭터 목록"""
    return CharacterListResponse(
        characters=[to_response(c) for c in CHARACTERS]
    )


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(character_id: str):
    """특정 캐릭터 상세 정보"""
    for char in CHARACTERS:
        if char.id == character_id:
            return to_response(char)
    
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Character not found")
