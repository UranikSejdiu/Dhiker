'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { themes, ThemeName, ThemeColors, themeNames } from './theme'

interface ThemeContextType {
  themeName: ThemeName
  colors: ThemeColors
  setTheme: (name: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeState] = useState<ThemeName>('dark-gold')

  useEffect(() => {
    const saved = localStorage.getItem('dhikr_theme')
    if (saved && themeNames.includes(saved as ThemeName)) {
      setThemeState(saved as ThemeName)
    }
  }, [])

  const setTheme = useCallback((name: ThemeName) => {
    setThemeState(name)
    localStorage.setItem('dhikr_theme', name)
  }, [])

  useEffect(() => {
    const c = themes[themeName]
    const root = document.documentElement
    Object.entries(c).forEach(([key, val]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVar, val)
    })
  }, [themeName])

  return (
    <ThemeContext.Provider value={{ themeName, colors: themes[themeName], setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider')
  return ctx
}
