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
    defaultImg: '/images/normal/otaku_normal.webp',
    skills: [
      {
        name: '야메로',
        trigger: '크큭, 야메로! 이런 싸움은 모 야메룽다!',
        image: '/images/attack/otaku_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '야레야레',
        trigger: '야레야레... 도망칠 수 없다는 건가.',
        image: '/images/attack/otaku_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '페로몬 어택',
        trigger: '후욱... 후욱... 내 페로몬을 받아라!!',
        image: '/images/attack/otaku_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '위험 발언',
        trigger: '5252. 잠깐 스톱. 방금 그 발언... 상당히 위험했다구?',
        image: '/images/attack/otaku_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '미쿠쨩 수호',
      trigger: '미쿠쨩 내가 지키겠다능. 나 그날 결심했어! 내가 미쿠쨩을 지키겠다고... 사랑해요...! 미쿠쨩!',
      image: '/images/attack/otaku_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 고졸 사토루
  'char_001': {
    defaultImg: '/images/normal/gojo_normal.webp',
    skills: [
      {
        name: '료이키텐카이',
        trigger: '료이키텐카이 무료쿠쇼! 죽어라 이새끼야!',
        image: '/images/attack/gojo_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '술식 순전 아오',
        trigger: '살짝, 난폭한 짓 좀 해볼까? 훗. 위상, 황혼 지혜의 눈동자, 술식 순전 출력 최대 아오',
        image: '/images/attack/gojo_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '술식 반전 아카',
        trigger: '살짝, 난폭한 짓 좀 해볼까? 훗. 위상, 바라밑 빛의 기둥 술식 반전 아카',
        image: '/images/attack/gojo_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '허식 무라사키',
      trigger: '천상천하 유아독존 이것은 고죠 가문 안에서도 극히 일부의 인간밖에 모르는 기술! 순전과 반전, 허식, 무라사키',
      image: '/images/attack/gojo_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 몽키 D: 드라이브
  'char_002': {
    defaultImg: '/images/normal/luffy_normal.webp',
    skills: [
      {
        name: '고무고무 제트 D 드라이브',
        trigger: '기어 세컨드, 고무고무 제트 D 드라이브!',
        image: '/images/attack/luffy_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '로컬 디버깅',
        trigger: '내 로컬에선... 돌아간다고오오오!!!!! 수도, 깃, 도커, 머지',
        image: '/images/attack/luffy_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '조이보이 귀환',
      trigger: '해방의 드럼이 들린다. 800년만에 듣는구나...! 틀림없이 거기 있어!! 조이보이가 돌아왔다!! 고무고무 스타 건',
      image: '/images/attack/luffy_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 바싹 탄지로
  'char_003': {
    defaultImg: '/images/normal/tanjiro_normal.webp',
    skills: [
      {
        name: 'NTR의 호흡',
        trigger: '씨익, 네 동생, 쩔더라? NTR의 호흡 제1 형 빼앗기',
        image: '/images/attack/tanjiro_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '해의 호흡 두무',
        trigger: '킁카킁카!! 용이 춤추는 듯한 움직임으로 재빨리 접근! 해의 호흡 제11형 햇무리의 용 두무',
        image: '/images/attack/tanjiro_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '히노카미 카구라 원무',
      trigger: '보였다! 빈틈의 실! 히노카미 카구라 원무!',
      image: '/images/attack/tanjiro_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 아가미 라이츄
  'char_004': {
    defaultImg: '/images/normal/light_normal.webp',
    skills: [
      {
        name: '지우 때리기',
        trigger: '치지직, 지우를 때리고 싶다고 생각한 건 난생 처음이다. 삐까',
        image: '/images/attack/light_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '키라 백만볼트',
        trigger: '으햿으허으하하하하하허하히하 소다, 보쿠가 키라다. 어쩔 거지? 백만볼트',
        image: '/images/attack/light_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '신세계의 신',
      trigger: '내가 악이라고?! 나는 정의야!! 악에 두려워 떠는 자들을 구원하고 누구나 이상으로 생각하는 신세계의 신이 될 몸이라고. 따라서, 그 신을 거역하는 자! 그 자가 바로 악이야!! 넌 너무 멍청해!',
      image: '/images/attack/light_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 고양이 집사 냥댕이
  'char_005': {
    defaultImg: '/images/profile/nyang.webp',
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

  // 딸바이 (진격거)
  'char_007': {
    defaultImg: '/images/normal/levi_normal.webp',
    skills: [
      {
        name: '골든 타임',
        trigger: '부아앙 비켜라!! 급한 건... 치킨의 골든 타임이다!!',
        image: '/images/attack/levi_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '사사게요',
        trigger: '사사게요!! 사사게요!! 신죠오 사사게요!!!!',
        image: '/images/attack/levi_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '치킨의 분노',
      trigger: '이것은 인류의 반격이 아니다, 식어버린 치킨에 대한 나의 분노다! 60분 내 도착하지 않으면 거인이고 뛐고 전부 썬어버리겠다!',
      image: '/images/attack/levi_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 흑염룡 소드마스터
  'char_008': {
    defaultImg: '/images/normal/dark_sword_normal.webp',
    skills: [
      {
        name: '게임 속 사람들',
        trigger: '내가 게임을 하고 싶어서 그랬겠어? 게임 안에 사람들이 있잖아!!',
        image: '/images/attack/dark_sword_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '순애 애니',
        trigger: '너희들, 애니메이션을 뭐라고 생각하는 거냐! 이건 단순한 그림이 아니라 한 사람의 영혼이 담긴 결정체라고! 무례하긴, 순애다!!',
        image: '/images/attack/dark_sword_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '다크니스 디멘션 슬래시',
      trigger: '눈을 떠라... 내 안의 흑염룡! 코리안 소드마스터 등장!! 다크니스 디멘션 슬래시!',
      image: '/images/attack/dark_sword_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 바겐세일러문
  'char_009': {
    defaultImg: '/images/normal/bargain_moon_normal.webp',
    skills: [
      {
        name: '품절주의',
        trigger: '미안해, 솔직하지 못한 내 지갑이... 하지만 세일 품목 앞에선 몸이 먼저 반응하는걸? 앗, 품절주의!!',
        image: '/images/attack/bargain_moon_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '소매넣기',
        trigger: '바겐세일~! 시식만하고 도망 가는 널 용서하지 않겠다! 소매넣기!!',
        image: '/images/attack/bargain_moon_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '70% 할인',
      trigger: '사랑과 정의의 이름으로 70% 할인을 용서하지 않겠다! 오늘이 지나면 다시는 오지 않을 이 가격, 지금 당장 결제해라!',
      image: '/images/attack/bargain_moon_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 손오공주님
  'char_010': {
    defaultImg: '/images/normal/goku_princess_normal.webp',
    skills: [
      {
        name: '아름다울 미',
        trigger: '나를 보고 반해라! 아름다울 미!!!! 오호호!',
        image: '/images/attack/goku_princess_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '소원 거부',
        trigger: '치키치키 차카차카 초코초코 쵸! 호잇! 너의 소원을 들어주지 않겠다!',
        image: '/images/attack/goku_princess_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '큐티뽀짝 여의봉',
      trigger: '나와라! 큐티뽀짝 여의봉!! 어딜 감히 쳐다보느냐! 이 오징어 쩌꾸미들아!! 내 미모에... 정신을 못 차리고... 넋을 잃어라!!!! 홀릴 혹',
      image: '/images/attack/goku_princess_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 돌려막기 나루토
  'char_011': {
    defaultImg: '/images/normal/naruto.webp',
    hitImg: '/images/hit/naruto_hit.webp',
    skills: [
      {
        name: '그림자 분신술',
        trigger: '다테바요! 그림자 분신술! 천 명의 나로 빚을 돌려막겠다!',
        image: '/images/attack/naruto_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '라센간',
        trigger: '회전하는 차크라의 폭풍! 라센간!! 채권자는 날아가랏!',
        image: '/images/attack/naruto_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      },
      {
        name: '선인모드',
        trigger: '자연 에너지를 모아... 선인모드! 이자는 자연에서 가져왔다!',
        image: '/images/attack/naruto_attack.webp',
        duration: DEFAULT_SKILL_DURATION
      }
    ],
    ultimate: {
      name: '구미 차크라 모드',
      trigger: '쿠라마! 힘을 빌려줘! 미수옥! 다테바요! 모든 빚을 날려버리겠다! 구미 차크라 폭발!',
      image: '/images/attack/naruto_ultimate.webp',
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
  const defaultImg = character?.sprite_url || character?.thumbnail_url || '/images/normal/otacu_normal.webp'
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
