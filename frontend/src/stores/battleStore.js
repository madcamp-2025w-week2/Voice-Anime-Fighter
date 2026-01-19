import { create } from 'zustand'

const INITIAL_HP = 100

export const useBattleStore = create((set, get) => ({
  // Battle state
  battleId: null,
  isActive: false,

  // Players
  player: {
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    characterId: null,
  },
  opponent: {
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    characterId: null,
    nickname: '',
  },

  // Turn state
  isMyTurn: true,
  turnTimer: 30,

  // Attack result
  lastAttack: null,
  lastDamage: null,

  // Battle result
  winnerId: null,
  loserId: null,
  isWinner: null,
  eloChange: 0,

  // Actions
  initBattle: (battleData) => set({
    battleId: battleData.battleId,
    isActive: true,
    player: {
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      characterId: battleData.playerCharacterId,
    },
    opponent: {
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      characterId: battleData.opponentCharacterId,
      nickname: battleData.opponentNickname || 'Opponent',
    },
    isMyTurn: battleData.goesFirst ?? true,
    turnTimer: 30,
    lastAttack: null,
    lastDamage: null,
  }),

  takeDamage: (damage) => set((state) => ({
    player: {
      ...state.player,
      hp: Math.max(0, state.player.hp - damage),
    },
  })),

  dealDamage: (damage, attackResult) => set((state) => ({
    opponent: {
      ...state.opponent,
      hp: Math.max(0, state.opponent.hp - damage),
    },
    lastAttack: attackResult,
    lastDamage: damage,
  })),

  setTurn: (isMyTurn) => set({ isMyTurn }),

  setTimer: (time) => set({ turnTimer: time }),

  clearLastAttack: () => set({ lastAttack: null, lastDamage: null }),

  endBattle: (winnerId, loserId, stats, currentUserId) => set((state) => {
    const isWinner = String(winnerId) === String(currentUserId)
    const eloChange = isWinner
      ? (stats?.winner_elo_change || 0)
      : (stats?.loser_elo_change || 0)

    return {
      isActive: false,
      winnerId,
      loserId,
      isWinner,
      eloChange,
    }
  }),

  reset: () => set({
    battleId: null,
    isActive: false,
    player: { hp: INITIAL_HP, maxHp: INITIAL_HP, characterId: null },
    opponent: { hp: INITIAL_HP, maxHp: INITIAL_HP, characterId: null, nickname: '' },
    isMyTurn: true,
    turnTimer: 30,
    lastAttack: null,
    lastDamage: null,
    winnerId: null,
    loserId: null,
    isWinner: null,
    eloChange: 0,
  }),
}))
