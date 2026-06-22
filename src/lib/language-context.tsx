'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { translations, LanguageCode, TranslationKey, languages } from './translations'

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')

  useEffect(() => {
    const saved = localStorage.getItem('dhikr_language')
    if (saved && languages.includes(saved as LanguageCode)) {
      setLanguageState(saved as LanguageCode)
    } else {
      const browserLang = navigator.language?.split('-')[0]
      if (browserLang && languages.includes(browserLang as LanguageCode)) {
        setLanguageState(browserLang as LanguageCode)
      }
    }
  }, [])

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem('dhikr_language', lang)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      let text = translations[language]?.[key] || translations['en'][key] || key
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v))
        })
      }
      return text
    },
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
