import { create } from 'zustand'

export const useGameStore = create((set) => ({
  // Current screen state
  currentScreen: 'title',

  // Selected character (mine)
  selectedCharacter: null,

  // Opponent's selected character
  opponentCharacter: null,

  // Opponent's nickname
  opponentNickname: null,

  // Opponent's ELO rating
  opponentElo: null,

  // Opponent's avatar URL
  opponentAvatarUrl: null,

  // Am I the host (room creator)?
  isHost: false,

  // Room state
  currentRoom: null,

  // Battle state
  currentBattle: null,

  // Characters list
  characters: [],
  
  // Selected battle background
  selectedBackground: null,

  // Actions
  setScreen: (screen) => set({ currentScreen: screen }),

  selectCharacter: (character) => set({ selectedCharacter: character }),

  setOpponentCharacter: (character) => set({ opponentCharacter: character }),

  setOpponentNickname: (nickname) => set({ opponentNickname: nickname }),

  // Set all opponent info at once (nickname, elo, avatar)
  setOpponentInfo: ({ nickname, elo, avatarUrl }) => set({
    opponentNickname: nickname,
    opponentElo: elo,
    opponentAvatarUrl: avatarUrl,
  }),

  setIsHost: (isHost) => set({ isHost }),

  setRoom: (room) => set({ currentRoom: room }),

  setCharacters: (characters) => set({ characters }),
  
  setBackground: (background) => set({ selectedBackground: background }),

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
    opponentNickname: null,
    opponentElo: null,
    opponentAvatarUrl: null,
    isHost: false,
    currentRoom: null,
    currentBattle: null,
    selectedBackground: null,
    currentScreen: 'lobby',
  }),
}))
