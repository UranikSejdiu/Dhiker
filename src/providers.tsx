'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/lib/theme-context'
import { LanguageProvider } from '@/lib/language-context'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
