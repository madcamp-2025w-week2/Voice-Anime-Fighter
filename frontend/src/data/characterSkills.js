/**
 * Character Skills Configuration
 * 각 캐릭터의 스킬 및 궁극기 데이터
 * 
 * 스킬 발동 조건:
 * - 일반 스킬: 90% 이상 유사도
 * - 궁극기: 95% 이상 유사도, 게이지 100% 후 다음 턴부터 사용 가능
 */

// 기본 스킬 지속 시간 (ms)
const DEFAULT_SKILL_DURATION = 1500
const DEFAULT_ULTIMATE_DURATION = 3000

/**
 * 캐릭터별 스킬 데이터
 * character_id를 키로 사용
 */
export const CHARACTER_SKILLS = {
  // 찐따 오타쿠 쿠로
  'char_000': {
    defaultImg: '/images/otacu.webp',
    skills: [
      {
        name: '라멘 어택',
        trigger: '뜨거운 라면의 분노를 받아라!',
        image: '/images/otaku_skill_1.png',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '바디필로우 쉴드',
        trigger: '나의 와이프가 지켜줄거야!',
        image: '/images/otaku_skill_2.png',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '미라클 메이크 업',
      trigger: '월화수목금토일 사랑스러운 마법소녀로 변신할거야 미라클 메이크 업!',
      image: '/images/otaku_ultimate.png',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 고졸 사토루
  'char_001': {
    defaultImg: '/images/satoru_v2.webp',
    skills: [
      {
        name: '크린지 윙크',
        trigger: '하트를 담아서 윙크!',
        image: '/images/satoru_skill_1.png',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '하트 빔',
        trigger: '사랑의 빔을 발사!',
        image: '/images/satoru_skill_2.png',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '카와이 러블리 루루핑',
      trigger: '마법소녀 카와이 러블리 루루핑!',
      image: '/images/satoru_ultimate.png',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 몽키 D: 드라이브
  'char_002': {
    defaultImg: '/images/lupy.webp',
    skills: [
      {
        name: '고무고무 펀치',
        trigger: '고무고무 펀치!',
        image: '/images/lupy_skill_1.png',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '총알 배송',
        trigger: '총알보다 빠른 배송!',
        image: '/images/lupy_skill_2.png',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '기어 포스 딜리버리',
      trigger: '고무고무~! 총알 배송! 배달비는 너의 패배다!',
      image: '/images/lupy_ultimate.png',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 바싹 탄지로
  'char_003': {
    defaultImg: '/images/tan.webp',
    skills: [
      {
        name: '물의 호흡',
        trigger: '물의 호흡!',
        image: '/images/tan_skill_1.png',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '히노카미 카구라',
        trigger: '히노카미 카구라!',
        image: '/images/tan_skill_2.png',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '물의 호흡 첫번째 형',
      trigger: '물의 호흡! 첫번째 형!',
      image: '/images/tan_ultimate.png',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 아가미 라이츄
  'char_004': {
    defaultImg: '/images/agami_raichu_v2.webp',
    skills: [
      {
        name: '삭제',
        trigger: '삭제!',
        image: '/images/agami_skill_1.png',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '계획대로',
        trigger: '계획대로다!',
        image: '/images/agami_skill_2.png',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '데스 노트 피날레',
      trigger: '계획대로다... 삭제! 삭제! 삭제! 너의 패배는 이미 결정되었다!',
      image: '/images/agami_ultimate.png',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 고양이 집사 냥댕이
  'char_005': {
    defaultImg: '/images/nyang.webp',
    skills: [
      {
        name: '냥냥펀치',
        trigger: '냥냥펀치!',
        image: '/images/nyang_skill_1.png',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '고양이 발톱',
        trigger: '고양이의 발톱 공격!',
        image: '/images/nyang_skill_2.png',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '고양이 군단 소환',
      trigger: '냥냥펀치! 고양이의 힘을 빌려라!',
      image: '/images/nyang_ultimate.png',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 오타쿠 전사 오글이
  'char_006': {
    defaultImg: '/images/ogeul.webp',
    skills: [
      {
        name: '피규어 어택',
        trigger: '피규어의 힘이여!',
        image: '/images/ogeul_skill_1.png',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '피규어 슬래시',
        trigger: '오타쿠의 자존심!',
        image: '/images/ogeul_skill_2.png',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '오타쿠 디멘션',
      trigger: '오타쿠의 자존심! 피규어 슬래시!',
      image: '/images/ogeul_ultimate.png',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 딸바이
  'char_007': {
    defaultImg: '/images/livi.webp',
    skills: [
      {
        name: '부릉부릉',
        trigger: '부릉부릉~!',
        image: '/images/livi.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '팩트 폭력',
        trigger: '팩트 폭력 배달!',
        image: '/images/livi.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '특급 배달',
      trigger: '부릉부릉~! 주문하신 팩트 폭력 배달 왔습니다! 수령 거부는 안돼!',
      image: '/images/livi.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 흑염룡 카이토
  'char_008': {
    defaultImg: '/images/dark_sword.webp',
    skills: [
      {
        name: '다크니스 슬래시',
        trigger: '다크니스 슬래시!',
        image: '/images/dark_sword.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '흑염룡의 눈',
        trigger: '눈을 떠라 흑염룡!',
        image: '/images/dark_sword.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '다크니스 디멘션 슬래시',
      trigger: '눈을 떠라... 내 안의 흑염룡! 다크니스 디멘션 슬래시!',
      image: '/images/dark_sword.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 바겐세일러문
  'char_009': {
    defaultImg: '/images/bargain_moon.webp',
    skills: [
      {
        name: '할인 스티커',
        trigger: '50% 할인!',
        image: '/images/bargain_moon.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '마감 세일',
        trigger: '마감 세일 시작!',
        image: '/images/bargain_moon.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '영혼 할인',
      trigger: '오늘의 특가! 마감 세일! 당신의 영혼도 50% 할인해드리죠!',
      image: '/images/bargain_moon.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 손오공주님
  'char_010': {
    defaultImg: '/images/goku_princess.webp',
    skills: [
      {
        name: '여의봉 어택',
        trigger: '여의봉 커져라!',
        image: '/images/goku_princess.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '치키치키 차카차카',
        trigger: '치키치키 차카차카!',
        image: '/images/goku_princess.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '소원 거부',
      trigger: '치키치키 차카차카 초코초코 쵸! 호잇! 너의 소원을 들어주지 않겠다!',
      image: '/images/goku_princess.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  }
}

/**
 * 캐릭터 ID로 스킬 데이터 가져오기
 * @param {string} characterId - 캐릭터 ID
 * @returns {Object|null} - 스킬 데이터 또는 null
 */
export function getCharacterSkills(characterId) {
  return CHARACTER_SKILLS[characterId] || null
}

/**
 * 기본 스킬 데이터 생성 (스킬 데이터가 없는 캐릭터용)
 * @param {Object} character - 캐릭터 객체
 * @returns {Object} - 기본 스킬 데이터
 */
export function createDefaultSkills(character) {
  const defaultImg = character?.sprite_url || character?.thumbnail_url || '/images/otacu.webp'
  const spellText = character?.spell_text || '마법의 주문!'
  
  return {
    defaultImg,
    skills: [
      {
        name: '기본 공격 1',
        trigger: spellText.split('!')[0] + '!',
        image: defaultImg,
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '기본 공격 2',
        trigger: '필살기 발동!',
        image: defaultImg,
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '궁극기',
      trigger: spellText,
      image: defaultImg,
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  }
}

/**
 * 캐릭터 스킬 데이터 가져오기 (없으면 기본값 생성)
 * @param {Object} character - 캐릭터 객체
 * @returns {Object} - 스킬 데이터
 */
export function getOrCreateCharacterSkills(character) {
  if (!character) return null
  
  const skills = getCharacterSkills(character.id)
  if (skills) return skills
  
  return createDefaultSkills(character)
}
