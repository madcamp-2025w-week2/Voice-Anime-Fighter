import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
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
    }),
    {
      name: 'voice-anime-fighter-user', // localStorage key
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isLoggedIn: state.isLoggedIn 
      }),
    }
  )
)

