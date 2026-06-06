import { createContext, useContext, useState } from 'react'
import { t } from './i18n'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState('zh')
  const toggle = () => setLang(l => l === 'zh' ? 'en' : 'zh')
  return (
    <LangContext.Provider value={{ lang, toggle, s: t[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
