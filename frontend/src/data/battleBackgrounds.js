/**
 * 배틀 배경 데이터
 * CSS 그라데이션 또는 이미지 URL 사용
 */
export const BATTLE_BACKGROUNDS = [
  {
    id: 'battle_arena',
    name: '배틀 아레나',
    thumbnail: '/images/battle_bg.webp',
    style: {
      backgroundImage: "url('/images/battle_bg.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_dojo',
    name: '평온한 도장',
    thumbnail: '/images/bg_dojo.webp',
    style: {
      backgroundImage: "url('/images/bg_dojo.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_tennis',
    name: '우주 테니스장',
    thumbnail: '/images/bg_tennis.webp',
    style: {
      backgroundImage: "url('/images/bg_tennis.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_idol',
    name: '아이돌 스테이지',
    thumbnail: '/images/bg_idol.webp',
    style: {
      backgroundImage: "url('/images/bg_idol.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_mountain',
    name: '거대한 바위산',
    thumbnail: '/images/bg_mountain.webp',
    style: {
      backgroundImage: "url('/images/bg_mountain.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_magic',
    name: '매지컬 아레나',
    thumbnail: '/images/bg_magic.webp',
    style: {
      backgroundImage: "url('/images/bg_magic.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_skull_island',
    name: '스컬 아일랜드',
    thumbnail: '/images/bg_skull_island.webp',
    style: {
      backgroundImage: "url('/images/bg_skull_island.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_night_sakura',
    name: '달빛 벚꽃 정원',
    thumbnail: '/images/bg_night_sakura.webp',
    style: {
      backgroundImage: "url('/images/bg_night_sakura.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_sunset_temple',
    name: '황혼의 사원',
    thumbnail: '/images/bg_sunset_temple.webp',
    style: {
      backgroundImage: "url('/images/bg_sunset_temple.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_akihabara',
    name: '아키하바라 거리',
    thumbnail: '/images/bg_akihabara.webp',
    style: {
      backgroundImage: "url('/images/bg_akihabara.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_shibuya',
    name: '시부야 크로싱',
    thumbnail: '/images/bg_shibuya.webp',
    style: {
      backgroundImage: "url('/images/bg_shibuya.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_titan_wall',
    name: '거인의 성벽',
    thumbnail: '/images/bg_titan_wall.webp',
    style: {
      backgroundImage: "url('/images/bg_titan_wall.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_demon_lord',
    name: '마왕의 성',
    thumbnail: '/images/bg_demon_lord.webp',
    style: {
      backgroundImage: "url('/images/bg_demon_lord.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_modern_city',
    name: '아카데미 캠퍼스',
    thumbnail: '/images/bg_modern_city.webp',
    style: {
      backgroundImage: "url('/images/bg_modern_city.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_supermarket',
    name: '대형 마트',
    thumbnail: '/images/bg_supermarket.webp',
    style: {
      backgroundImage: "url('/images/bg_supermarket.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_kaimaru',
    name: '카이마루',
    thumbnail: '/images/bg_kaimaru.webp',
    style: {
      backgroundImage: "url('/images/bg_kaimaru.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_night_store',
    name: '심야 잡화점',
    thumbnail: '/images/bg_night_store.webp',
    style: {
      backgroundImage: "url('/images/bg_night_store.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_waterfall_castle',
    name: '폭포의 성',
    thumbnail: '/images/bg_waterfall_castle.webp',
    style: {
      backgroundImage: "url('/images/bg_waterfall_castle.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'bg_ice_palace',
    name: '얼음 궁전',
    thumbnail: '/images/bg_ice_palace.webp',
    style: {
      backgroundImage: "url('/images/bg_ice_palace.webp')",
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
