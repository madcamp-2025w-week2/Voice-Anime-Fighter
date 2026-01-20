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
        thumbnail_url="/images/profile/otacu.webp",
        sprite_url="/images/profile/otacu.webp",
        is_unlocked=True
    ),
    Character(
        id="char_001",
        name="고졸 사토루",
        description="오글거림의 여왕. 오타쿠 세계를 지배하는 언더독 마법소녀.",
        stats=CharacterStats(cringe_level=95, volume_req=70, precision=80),
        spell_text="영역전개 무량공처! 죽어라 이새끼들아!",
        thumbnail_url="/images/profile/satoru_v2.webp",
        sprite_url="/images/profile/satoru_v2.webp",
        is_unlocked=True
    ),
    Character(
        id="char_002",
        name="몽키 D: 드라이브",
        description="해적왕 대신 배달왕을 꿈꾸는 루키. 드라이브 스루의 속도로 적을 제압한다.",
        stats=CharacterStats(cringe_level=75, volume_req=85, precision=65),
        spell_text="고무고무~! 총알 배송! 배달비는 너의 패배다!",
        thumbnail_url="/images/profile/lupy.webp",
        sprite_url="/images/profile/lupy.webp",
        is_unlocked=True
    ),
    Character(
        id="char_003",
        name="바싹 탄지로",
        description="불의 호흡을 사용하는 귀살대 대원. 박력 넘치는 기합으로 상대를 압도.",
        stats=CharacterStats(cringe_level=50, volume_req=95, precision=60),
        spell_text="물의 호흡! 첫번째 형!",
        thumbnail_url="/images/profile/tanjiro.webp",
        sprite_url="/images/profile/tanjiro.webp",
        is_unlocked=True
    ),
    Character(
        id="char_004",
        name="아가미 라이츄",
        description="노트 한 권으로 신세계를 꿈꾸는 위험한 천재. 하지만 글씨체가 너무 악필이다.",
        stats=CharacterStats(cringe_level=100, volume_req=60, precision=90),
        spell_text="계획대로다... 삭제! 삭제! 삭제! 너의 패배는 이미 결정되었다!",
        thumbnail_url="/images/profile/agami_raichu_v2.webp",
        sprite_url="/images/profile/agami_raichu_v2.webp",
        is_unlocked=True
    ),
    Character(
        id="char_005",
        name="고양이 집사 냥댕이",
        description="고양이와 대화하는 신비로운 집사. 냥냥펀치로 공격.",
        stats=CharacterStats(cringe_level=85, volume_req=55, precision=85),
        spell_text="냥냥펀치! 고양이의 힘을 빌려라!",
        thumbnail_url="/images/profile/nyang.webp",
        sprite_url="/images/profile/nyang.webp",
        is_unlocked=True
    ),
    Character(
        id="char_007",
        name="딸바이",
        description="전설의 폭주족 출신 배달부. 신속 정확하게 적의 멘탈을 배달 사고 낸다.",
        stats=CharacterStats(cringe_level=88, volume_req=90, precision=50),
        spell_text="부릉부릉~! 주문하신 팩트 폭력 배달 왔습니다! 수령 거부는 안돼!",
        thumbnail_url="/images/profile/livi.webp",
        sprite_url="/images/profile/livi.webp",
        is_unlocked=True
    ),
    Character(
        id="char_008",
        name="흑염룡 카이토",
        description="오른손에 흑염룡을 봉인한 중2병 소드마스터. 시공의 폭풍을 부른다.",
        stats=CharacterStats(cringe_level=100, volume_req=80, precision=70),
        spell_text="눈을 떠라... 내 안의 흑염룡! 다크니스 디멘션 슬래시!",
        thumbnail_url="/images/profile/dark_sword.webp",
        sprite_url="/images/profile/dark_sword.webp",
        is_unlocked=True
    ),
    Character(
        id="char_009",
        name="바겐세일러문",
        description="이마트 마감 시간의 지배자. 할인 스티커로 적을 봉인한다.",
        stats=CharacterStats(cringe_level=95, volume_req=90, precision=60),
        spell_text="오늘의 특가! 마감 세일! 당신의 영혼도 50% 할인해드리죠!",
        thumbnail_url="/images/profile/bargain_moon.webp",
        sprite_url="/images/profile/bargain_moon.webp",
        is_unlocked=True
    ),
    Character(
        id="char_010",
        name="손오공주님",
        description="서유기 세계관에서 이세계 전생한 마법소녀. 핑크빛 여의봉을 휘두른다.",
        stats=CharacterStats(cringe_level=88, volume_req=75, precision=85),
        spell_text="치키치키 차카차카 초코초코 쵸! 호잇! 너의 소원을 들어주지 않겠다!",
        thumbnail_url="/images/profile/goku_princess.webp",
        sprite_url="/images/profile/goku_princess.webp",
        is_unlocked=True
    ),
    Character(
        id="char_006",
        name="돌려막기 나루토",
        description="닌자의 길을 걷는 열혈 소년. 그림자 분신술로 빚을 돌려막고 라센간으로 채권자를 날려버린다.",
        stats=CharacterStats(cringe_level=85, volume_req=90, precision=75),
        spell_text="다테바요! 그림자 분신술! 이번 달도 돌려막기 성공이다!",
        thumbnail_url="/images/profile/naruto.webp",
        sprite_url="/images/profile/naruto.webp",
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
