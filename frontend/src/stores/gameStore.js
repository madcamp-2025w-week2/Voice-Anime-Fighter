import { create } from 'zustand'

export const useGameStore = create((set) => ({
  // Current screen state
  currentScreen: 'title',
  
  // Selected character
  selectedCharacter: null,
  
  // Room state
  currentRoom: null,
  
  // Battle state
  currentBattle: null,
  
  // Characters list
  characters: [],
  
  // Actions
  setScreen: (screen) => set({ currentScreen: screen }),
  
  selectCharacter: (character) => set({ selectedCharacter: character }),
  
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
    currentRoom: null,
    currentBattle: null,
    currentScreen: 'lobby',
  }),
}))
