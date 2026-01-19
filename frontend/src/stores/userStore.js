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

      fetchUser: async () => {
        const state = useUserStore.getState()
        if (!state.token) return

        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
          const response = await fetch(`${API_URL}/users/me`, {
            headers: {
              'Authorization': `Bearer ${state.token}`,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            set({ user: userData })
          }
        } catch (error) {
          console.error('Failed to fetch user:', error)
        }
      },
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

