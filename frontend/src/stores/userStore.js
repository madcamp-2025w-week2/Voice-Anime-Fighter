import { create } from 'zustand'

export const useUserStore = create((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  
  login: (userData, accessToken) => set({
    user: userData,
    token: accessToken,
    isLoggedIn: true,
  }),
  
  logout: () => set({
    user: null,
    token: null,
    isLoggedIn: false,
  }),
  
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
}))
