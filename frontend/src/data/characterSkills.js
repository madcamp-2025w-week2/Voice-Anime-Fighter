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
    hitImg: '/images/hit/otaku_hit.webp',
    skills: [
      { name: '야메로', trigger: '크큭, 야메로! 이런 싸움은 모 야메룽다!', image: '/images/attack/otaku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '야레야레', trigger: '야레야레... 도망칠 수 없다는 건가.', image: '/images/attack/otaku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '페로몬 어택', trigger: '후욱... 후욱... 내 페로몬을 받아라!!', image: '/images/attack/otaku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '위험 발언', trigger: '5252. 잠깐 스톱. 방금 그 발언... 상당히 위험했다구?', image: '/images/attack/otaku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '와이프 수호', trigger: '나의 피규어에 손대지 마라! 그녀는 나의 전재산이자 영혼이라능!', image: '/images/attack/otaku_attack.webp', duration: DEFAULT_SKILL_DURATION }
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
    hitImg: '/images/hit/gojo_hit.webp',
    skills: [
      { name: '료이키텐카이', trigger: '료이키텐카이 무료쿠쇼! 죽어라 이새끼야!', image: '/images/attack/gojo_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '술식 순전 아오', trigger: '살짝, 난폭한 짓 좀 해볼까? 훗. 위상, 황혼 지혜의 눈동자, 술식 순전 출력 최대 아오', image: '/images/attack/gojo_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '술식 반전 아카', trigger: '살짝, 난폭한 짓 좀 해볼까? 훗. 위상, 바라밑 빛의 기둥 술식 반전 아카', image: '/images/attack/gojo_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '무하한의 벽', trigger: '닿을 수 없겠지? 너와 나 사이엔 영원이라는 이름의 무하한이 존재하니까!', image: '/images/attack/gojo_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '육안 개방', trigger: '나의 눈은 모든 것을 꿰뚫어 본다. 네가 패배할 미래까지도 말이야!', image: '/images/attack/gojo_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '허식 무라사키',
      trigger: '천상천하 유아독존 이것은 고죠 가문 안에서도 극히 일부의 인간밖에 모르는 기술! 순전과 반전, 허식, 무라사키',
      image: '/images/attack/gojo_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 몽키 D: 드라이브 (컴공 컨셉 유지)
  'char_002': {
    defaultImg: '/images/normal/luffy_normal.webp',
    hitImg: '/images/hit/luffy_hit.webp',
    skills: [
      { name: '고무고무 제트 D 드라이브', trigger: '기어 세컨드, 고무고무 제트 D 드라이브!', image: '/images/attack/luffy_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '로컬 디버깅', trigger: '내 로컬에선... 돌아간다고오오오!!!!! 수도, 깃, 도커, 머지', image: '/images/attack/luffy_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '포스 푸시', trigger: '컨플릭트 무시해! 포스 푸시로 깃허브 서버를 박살내주마!', image: '/images/attack/luffy_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '깃 리셋', trigger: '오늘의 개발 내역은 없던 일로 하겠다! 깃 리셋 하드 헤드 원!', image: '/images/attack/luffy_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '무한 루프', trigger: '빠져나갈 수 없을걸? 너의 멘탈을 스택 오버플로우로 터뜨려주마!', image: '/images/attack/luffy_attack.webp', duration: DEFAULT_SKILL_DURATION }
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
    hitImg: '/images/hit/tanjiro_hit.webp',
    skills: [
      { name: 'NTR의 호흡', trigger: '씨익, 네 동생, 쩔더라? NTR의 호흡 제1 형 빼앗기', image: '/images/attack/tanjiro_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '해의 호흡 두무', trigger: '킁카킁카!! 용이 춤추는 듯한 움직임으로 재빨리 접근! 해의 호흡 제11형 햇무리의 용 두무', image: '/images/attack/tanjiro_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '빈틈의 실', trigger: '보였다! 네 녀석의 하찮은 빈틈의 실! 단숨에 베어 넘겨주마!', image: '/images/attack/tanjiro_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '네즈코 함함', trigger: '네즈코! 상자 밖으로 나오지 마! 오빠가 다 알아서 할게!', image: '/images/attack/tanjiro_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '물의 호흡 잔잔함', trigger: '잔잔한 물결처럼 네 녀석의 공격을 전부 흘려보내주지. 제 11형 잔잔함!', image: '/images/attack/tanjiro_attack.webp', duration: DEFAULT_SKILL_DURATION }
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
    hitImg: '/images/hit/light_hit.webp',
    skills: [
      { name: '지우 때리기', trigger: '치지직, 지우를 때리고 싶다고 생각한 건 난생 처음이다. 삐까', image: '/images/attack/light_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '키라 백만볼트', trigger: '으햿으허으하하하하하허하히하 소다, 보쿠가 키라다. 어쩔 거지? 백만볼트', image: '/images/attack/light_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '감자칩 처단', trigger: '난 오른손으로 이름을 적고 왼손으로 감자칩을 먹는다! 사악!', image: '/images/attack/light_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '엘과의 두뇌싸움', trigger: '내가 정의다! 나를 쫓는 너야말로 세상의 악이라는 걸 증명해주마!', image: '/images/attack/light_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '사과가 먹고싶니', trigger: '류크, 사과를 줄 테니 저 녀석의 이름이 뭔지 똑똑히 말하라구!', image: '/images/attack/light_attack.webp', duration: DEFAULT_SKILL_DURATION }
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
    defaultImg: '/images/normal/nyang_normal.webp',
    hitImg: '/images/hit/nyang_hit.webp',
    skills: [
      { name: '냥냥펀치', trigger: '냥냥펀치! 냥녕뇽냥늉냥뇽뇽냥늉녕늉뇽냥!', image: '/images/attack/nyang_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '고양이 발톱', trigger: '고양이의 발톱 공격! 미야아아아아옹~', image: '/images/attack/nyang_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '츄르 유혹', trigger: '이 츄르를 받아라! 냥이의 간식 앞에 무릎 꿇지 않을 자 없다냥!', image: '/images/attack/nyang_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '꾹꾹이 마사지', trigger: '너의 심장을 꾹꾹이로 떡 반죽처럼 만들어주겠다냥!', image: '/images/attack/nyang_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '헤어볼 발사', trigger: '나의 사랑이 담긴 불순물! 헤어볼 발사! 더러워해도 소용없다냥!', image: '/images/attack/nyang_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '고양이 군단 소환',
      trigger: '냥냥펀치! 고양이의 힘을 빌려라!',
      image: '/images/attack/nyang_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 돌려막기 나루토
  'char_006': {
    defaultImg: '/images/normal/naruto_normal.webp',
    hitImg: '/images/hit/naruto_hit.webp',
    skills: [
      { name: '그림자 분신술', trigger: '그림자 분신술! 천 명의 나로 빚을 돌려막겠다니깐!', image: '/images/attack/naruto_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '라센간', trigger: '회전하는 차크라의 폭풍! 라센간!! 채권자는 날아가랏!', image: '/images/attack/naruto_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '선인모드', trigger: '자연 에너지를 모아... 선인모드! 이 이자는 자연에서 가져왔다!', image: '/images/attack/naruto_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '나루토 사스케', trigger: '사스케에에!! 돌아와!! 너의 빚은 내가 다 갚아주겠다니깐!', image: '/images/attack/naruto_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '주둥아리술', trigger: '넌 원래 착한 녀석이었어. 그러니까 나의 빚을 대신 좀 갚아주라니깐!', image: '/images/attack/naruto_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '구미 차크라 모드',
      trigger: '미안하다 이거 보여주려고 어그로끌었다.. 나루토 사스케 싸움수준 ㄹㅇ실화냐? 진짜 세계관최강자들의 싸움이다.. 그찐따같던 나루토가 맞나? 진짜 나루토는 전설이다..',
      image: '/images/attack/naruto_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 딸바이 (진격거)
  'char_007': {
    defaultImg: '/images/normal/levi_normal.webp',
    hitImg: '/images/hit/levi_hit.webp',
    skills: [
      { name: '골든 타임', trigger: '부아앙 비켜라!! 급한 건... 치킨의 골든 타임이다!!', image: '/images/attack/levi_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '사사게요', trigger: '사사게요!! 사사게요!! 별점 5점을 사사게요!!!!', image: '/images/attack/levi_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '회전 배달', trigger: '나의 오토바이는 거인의 뒷덜미보다 빠르게 코너를 돈다!', image: '/images/attack/levi_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '먼지 한 톨 금지', trigger: '이 구역에 먼지가 있는 건 용납 못 해! 전부 썰어버리겠다!', image: '/images/attack/levi_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '감자튀김 갈취', trigger: '60분 넘었으니 너의 감자튀김은 내가 압수하도록 하겠다!', image: '/images/attack/levi_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '치킨의 분노',
      trigger: '이것은 인류의 반격이 아니다, 식어버린 치킨에 대한 나의 분노다! 60분 내 도착하지 않으면 거인이고 뭐고 전부 썰어버리겠다!',
      image: '/images/attack/levi_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 흑염룡 소드마스터
  'char_008': {
    defaultImg: '/images/normal/darksword_normal.webp',
    hitImg: '/images/hit/darksword_hit.webp',
    skills: [
      { name: '게임 속 사람들', trigger: '내가 게임을 하고 싶어서 그랬겠어? 게임 안에 사람들이 있잖아!!', image: '/images/attack/darksword_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '순애 애니', trigger: '너희들, 애니메이션을 뭐라고 생각하는 거냐! 이건 단순한 그림이 아니라 한 사람의 영혼이 담긴 결정체라고! 무례하긴, 순애다!!', image: '/images/attack/darksword_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '이도류 인생', trigger: '내 손에는 두 명의 여자친구를 위한 칼이 쥐어져 있다!', image: '/images/attack/darksword_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '스타버스트 크린지', trigger: '더 빠르게! 나의 끓어오르는 피보다 더 빠르게 오글거려주마!', image: '/images/attack/darksword_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '봉인된 오른손', trigger: '보지 마! 내 오른손이 힘을 주체 못 하고 근질거린다구!', image: '/images/attack/darksword_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '다크니스 디멘션 슬래시',
      trigger: '눈을 떠라... 내 안의 흑염룡! 코리안 소드마스터 등장!! 다크니스 디멘션 슬래시!',
      image: '/images/attack/darksword_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 바겐세일러문
  'char_009': {
    defaultImg: '/images/normal/moon_normal.webp',
    hitImg: '/images/hit/moon_hit.webp',
    skills: [
      { name: '품절주의', trigger: '미안해, 솔직하지 못한 내 지갑이... 하지만 세일 품목 앞에선 몸이 먼저 반응하는걸? 앗, 품절주의!!', image: '/images/attack/moon_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '소매넣기', trigger: '바겐세일~! 시식만하고 도망 가는 널 용서하지 않겠다! 소매넣기!!', image: '/images/attack/moon_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '1플러스1의 심판', trigger: '덤을 챙기지 않은 자, 정의의 이름으로 영수증을 끊겠다!', image: '/images/attack/moon_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '유통기한 카운트', trigger: '3, 2, 1... 유통기한 임박! 90프로 할인의 힘을 보여주마!', image: '/images/attack/moon_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '마감 세일러', trigger: '마감 10분 전! 타임 세일의 마법이 너의 멘탈을 털어버릴 거다!', image: '/images/attack/moon_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '70프로 할인',
      trigger: '사랑과 정의의 이름으로 70프로 할인을 용서하지 않겠다! 오늘이 지나면 다시는 오지 않을 이 가격, 지금 당장 결제해라!',
      image: '/images/attack/moon_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 손오공주님
  'char_010': {
    defaultImg: '/images/normal/goku_normal.webp',
    hitImg: '/images/hit/goku_hit.webp',
    skills: [
      { name: '아름다울 미', trigger: '나를 보고 반해라! 아름다울 미!!!! 오호호!', image: '/images/attack/goku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '소원 거부', trigger: '치키치키 차카차카 초코초코 쵸! 호잇! 너의 소원을 들어주지 않겠다!', image: '/images/attack/goku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '미라클 메이크업', trigger: '나는 핑크빛 용으로 변신할 거야! 미라클 메이크 업 뾰로롱!', image: '/images/attack/goku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '공주병 말기', trigger: '세상에서 누가 제일 예쁘니? 바로 나! 공주의 빔을 받아라!', image: '/images/attack/goku_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '거절의 한자', trigger: '싫을 오! 안될 부! 너의 공격은 나에게 통하지 않는다구!', image: '/images/attack/goku_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '큐티뽀짝 여의봉',
      trigger: '나와라! 큐티뽀짝 여의봉!! 어딜 감히 쳐다보느냐! 이 오징어 쩌꾸미들아!! 내 미모에... 정신을 못 차리고... 넋을 잃어라!!!! 홀릴 혹',
      image: '/images/attack/goku_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 이계의 반요 이누야샤
  'char_011': {
    defaultImg: '/images/normal/inuyasha_normal.webp',
    hitImg: '/images/hit/inuyasha_hit.webp',
    skills: [
      { name: '산혼철조', trigger: '내 손톱에 깃든 영혼의 조각! 너의 킹받는 얼굴을 산산조각 내주마! 산혼철조!!', image: '/images/attack/inuyasha_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '바람의 상처', trigger: '바람이 부딪히는 그곳이 바로 너의 빈틈이다! 냄새로 찾아내겠다! 바람의 상처!!', image: '/images/attack/inuyasha_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '금강창파', trigger: '다이아몬드는 부서지지 않는다! 나의 비싼 다이아몬드 화살촉 공격을 받아랏! 금강창파!', image: '/images/attack/inuyasha_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '명도잔월파', trigger: '어둠의 구멍으로 꺼져버려라! 너에게 영원한 퇴근을 명하노니... 명도잔월파!!', image: '/images/attack/inuyasha_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '붉은 철쇄아', trigger: '결계 따위는 종잇장처럼 찢어주마! 붉게 물든 나의 칼날을 봐라! 붉은 철쇄아!!', image: '/images/attack/inuyasha_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '폭류파',
      trigger: '가영아 지금이야!! 우리의 합체... 아차차 화살이 없네? 어쨌든 휘몰아치는 요기의 태풍! 폭류파!!',
      image: '/images/attack/inuyasha_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 찡긋 짱구
  'char_012': {
    defaultImg: '/images/normal/winking_jjanggu_normal.webp',
    hitImg: '/images/hit/winking_jjanggu_hit.webp',
    skills: [
      { name: '액션가면 변신', trigger: '액션~ 가면! 으하하하! 정의의 용사가 나타났다!', image: '/images/attack/winking_jjanggu_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '부리부리 댄스', trigger: '부리부리~ 부리부리~ 내 엉덩이 춤을 받아라!', image: '/images/attack/winking_jjanggu_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '초코비 내놔', trigger: '엄마! 초코비 사줘! 안 사주면 바닥에서 뒹굴거야! 으앙!', image: '/images/attack/winking_jjanggu_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '예쁜 누나 발견', trigger: '호호이! 거기 예쁜 누나~ 나랑 피망 먹으러 갈래요? 찡긋!', image: '/images/attack/winking_jjanggu_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '흰둥아 물어', trigger: '흰둥아! 솜사탕이다! 가서 앙 물어버려!', image: '/images/attack/winking_jjanggu_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '울트라 액션가면 슛',
      trigger: '와하하! 지구의 평화는 내가 지킨다! 받아라! 울트라... 액션~~~ 빔!!!!',
      image: '/images/attack/winking_jjanggu_attack.webp',
      effectClass: 'ultimate-effect',
      duration: DEFAULT_ULTIMATE_DURATION
    }
  },

  // 체인소민석
  'char_013': {
    defaultImg: '/images/normal/chainsawminsuk_normal.webp',
    hitImg: '/images/hit/chainsawminsuk_hit.webp',
    skills: [
      { name: '멍멍이 모드', trigger: '왕! 왕왕!! 포치타! 나 산책시켜줘!! 왈왈!! 으르렁!!!', image: '/images/attack/chainsawminsuk_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '시동 불량', trigger: '부릉.. 부르릉.. 어라? 시동이 안 걸려.. 기름값이 너무 비싸서 못 넣었어!!', image: '/images/attack/chainsawminsuk_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '악마의 계약', trigger: '내 심장을 줄게... 대신 군면제 시켜줘!!! 제발!!! 훈련소 가기 싫어!!!', image: '/images/attack/chainsawminsuk_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '식빵 먹방', trigger: '식빵엔... 딸기잼이지... 포치타... 잼 뚜껑 좀 따줘... 손이 톱이라 못 따...', image: '/images/attack/chainsawminsuk_attack.webp', duration: DEFAULT_SKILL_DURATION },
      { name: '꿈의 문', trigger: '열지 마... 열지 말라고 했잖아!! 냉장고 문 열지 마!! 내 아이스크림 먹지 마!!', image: '/images/attack/chainsawminsuk_attack.webp', duration: DEFAULT_SKILL_DURATION }
    ],
    ultimate: {
      name: '예비군 지각',
      trigger: '부아아앙!!! 다 비켜!!! 나 예비군 늦었다고!!!! 지각하면 입구컷이란 말이야!!! 부아아아앙!!!!',
      image: '/images/attack/chainsawminsuk_ultimate.webp',
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
  const defaultImg = character?.sprite_url || character?.thumbnail_url || '/images/error_placeholder.webp'
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
