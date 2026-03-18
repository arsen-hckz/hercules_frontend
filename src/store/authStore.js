import { create } from 'zustand'
import api from '../api/axios'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    const me = await api.get('/auth/me/')
    set({ user: me.data, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    set({ user: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me/')
      set({ user: data, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },
}))

export default useAuthStore
