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
    id: 'default',
    name: '우주',
    thumbnail: null,
    style: {
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0520 100%)',
    },
  },
  {
    id: 'sunset',
    name: '석양',
    thumbnail: null,
    style: {
      background: 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 30%, #ff6b6b 60%, #4a0e0e 100%)',
    },
  },
  {
    id: 'ocean',
    name: '심해',
    thumbnail: null,
    style: {
      background: 'linear-gradient(180deg, #000428 0%, #004e92 50%, #001f3f 100%)',
    },
  },
  {
    id: 'forest',
    name: '숲속',
    thumbnail: null,
    style: {
      background: 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    },
  },
  {
    id: 'neon',
    name: '네온 시티',
    thumbnail: null,
    style: {
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    },
  },
  {
    id: 'volcano',
    name: '화산',
    thumbnail: null,
    style: {
      background: 'linear-gradient(180deg, #1a0000 0%, #4a0000 30%, #ff4500 70%, #8b0000 100%)',
    },
  },
  {
    id: 'sakura',
    name: '벚꽃',
    thumbnail: null,
    style: {
      background: 'linear-gradient(180deg, #ffecd2 0%, #fcb69f 30%, #ffa69e 60%, #fad0c4 100%)',
    },
  },
  {
    id: 'thunder',
    name: '뇌운',
    thumbnail: null,
    style: {
      background: 'linear-gradient(180deg, #1f1c18 0%, #0f0c0a 30%, #3d3d3d 60%, #141414 100%)',
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
