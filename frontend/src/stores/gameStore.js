import { create } from 'zustand'

export const useGameStore = create((set) => ({
  // Current screen state
  currentScreen: 'title',

  // Selected character (mine)
  selectedCharacter: null,

  // Opponent's selected character
  opponentCharacter: null,

  // Am I the host (room creator)?
  isHost: false,

  // Room state
  currentRoom: null,

  // Battle state
  currentBattle: null,

  // Characters list
  characters: [],

  // Actions
  setScreen: (screen) => set({ currentScreen: screen }),

  selectCharacter: (character) => set({ selectedCharacter: character }),

  setOpponentCharacter: (character) => set({ opponentCharacter: character }),

  setIsHost: (isHost) => set({ isHost }),

  setRoom: (room) => set({ currentRoom: room }),

  setCharacters: (characters) => set({ characters }),

  startBattle: (battleData) => set({
    currentBattle: battleData,
    currentScreen: 'battle',
  }),

  endBattle: () => set({
    currentBattle: null,
    currentScreen: 'result',
  }),

  resetGame: () => set({
    selectedCharacter: null,
    opponentCharacter: null,
    isHost: false,
    currentRoom: null,
    currentBattle: null,
    currentScreen: 'lobby',
  }),
}))
