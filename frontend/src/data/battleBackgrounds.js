/**
 * 배틀 배경 데이터
 * CSS 그라데이션 또는 이미지 URL 사용
 */
export const BATTLE_BACKGROUNDS = [
  {
    id: 'battle_arena',
    name: '배틀 아레나',
    thumbnail: '/images/battle_bg.png',
    style: {
      backgroundImage: "url('/images/battle_bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_dojo',
    name: '평온한 도장',
    thumbnail: '/images/bg_dojo.jpg',
    style: {
      backgroundImage: "url('/images/bg_dojo.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_tennis',
    name: '우주 테니스장',
    thumbnail: '/images/bg_tennis.jpg',
    style: {
      backgroundImage: "url('/images/bg_tennis.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_idol',
    name: '아이돌 스테이지',
    thumbnail: '/images/bg_idol.jpg',
    style: {
      backgroundImage: "url('/images/bg_idol.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_mountain',
    name: '거대한 바위산',
    thumbnail: '/images/bg_mountain.jpg',
    style: {
      backgroundImage: "url('/images/bg_mountain.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_magic',
    name: '매지컬 아레나',
    thumbnail: '/images/bg_magic.jpg',
    style: {
      backgroundImage: "url('/images/bg_magic.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_skull_island',
    name: '스컬 아일랜드',
    thumbnail: '/images/bg_skull_island.jpg',
    style: {
      backgroundImage: "url('/images/bg_skull_island.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_night_sakura',
    name: '달빛 벚꽃 정원',
    thumbnail: '/images/bg_night_sakura.jpg',
    style: {
      backgroundImage: "url('/images/bg_night_sakura.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_sunset_temple',
    name: '황혼의 사원',
    thumbnail: '/images/bg_sunset_temple.jpg',
    style: {
      backgroundImage: "url('/images/bg_sunset_temple.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_akihabara',
    name: '아키하바라 거리',
    thumbnail: '/images/bg_akihabara.jpg',
    style: {
      backgroundImage: "url('/images/bg_akihabara.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_shibuya',
    name: '시부야 크로싱',
    thumbnail: '/images/bg_shibuya.jpg',
    style: {
      backgroundImage: "url('/images/bg_shibuya.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_titan_wall',
    name: '거인의 성벽',
    thumbnail: '/images/bg_titan_wall.jpg',
    style: {
      backgroundImage: "url('/images/bg_titan_wall.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_demon_lord',
    name: '마왕의 성',
    thumbnail: '/images/bg_demon_lord.jpg',
    style: {
      backgroundImage: "url('/images/bg_demon_lord.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_modern_city',
    name: '아카데미 캠퍼스',
    thumbnail: '/images/bg_modern_city.jpg',
    style: {
      backgroundImage: "url('/images/bg_modern_city.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_supermarket',
    name: '대형 마트',
    thumbnail: '/images/bg_supermarket.jpg',
    style: {
      backgroundImage: "url('/images/bg_supermarket.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_kaimaru',
    name: '카이마루',
    thumbnail: '/images/bg_kaimaru.jpg',
    style: {
      backgroundImage: "url('/images/bg_kaimaru.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_night_store',
    name: '심야 잡화점',
    thumbnail: '/images/bg_night_store.jpg',
    style: {
      backgroundImage: "url('/images/bg_night_store.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_waterfall_castle',
    name: '폭포의 성',
    thumbnail: '/images/bg_waterfall_castle.jpg',
    style: {
      backgroundImage: "url('/images/bg_waterfall_castle.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_ice_palace',
    name: '얼음 궁전',
    thumbnail: '/images/bg_ice_palace.jpg',
    style: {
      backgroundImage: "url('/images/bg_ice_palace.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
]

export const getBackgroundById = (id) => {
  return BATTLE_BACKGROUNDS.find(bg => bg.id === id) || BATTLE_BACKGROUNDS[0]
}

export const getRandomBackground = () => {
  const randomIndex = Math.floor(Math.random() * BATTLE_BACKGROUNDS.length)
  return BATTLE_BACKGROUNDS[randomIndex]
}
