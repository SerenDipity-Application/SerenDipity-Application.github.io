import { createContext, useContext, useState } from 'react'
import { t } from './i18n'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('serendipity_lang') || 'zh')
  const toggle = () => setLang(l => {
    const next = l === 'zh' ? 'en' : 'zh'
    localStorage.setItem('serendipity_lang', next)
    return next
  })
  return (
    <LangContext.Provider value={{ lang, toggle, s: t[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
