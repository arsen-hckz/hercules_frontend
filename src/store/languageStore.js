import { create } from 'zustand'

const useLanguageStore = create((set) => ({
  lang: localStorage.getItem('hercules_lang') || 'en',
  setLang: (lang) => {
    localStorage.setItem('hercules_lang', lang)
    set({ lang })
  },
}))

export default useLanguageStore
