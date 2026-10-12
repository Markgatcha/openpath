import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from '@shared/types'

interface AuthState {
  token: string | null
  user: UserDTO | null
  setAuth: (token: string, user: UserDTO) => void
  setUser: (user: UserDTO) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'openpath-auth' },
  ),
)

export function useTheme(): [string, () => void] {
  const current =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  const toggle = () => {
    const isDark = document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', !isDark)
    try {
      localStorage.setItem('openpath-theme', isDark ? 'light' : 'dark')
    } catch {
      // ignore
    }
  }
  return [current, toggle]
}
