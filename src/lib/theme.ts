export const themeNames = ['dark-gold', 'pure-light', 'emerald', 'midnight', 'amoled'] as const
export type ThemeName = (typeof themeNames)[number]

export interface ThemeColors {
  background: string
  surface: string
  surfaceLight: string
  card: string
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight: string
  accent: string
  text: string
  textSecondary: string
  textMuted: string
  error: string
  success: string
  warning: string
  border: string
  overlay: string
}

export const themes: Record<ThemeName, ThemeColors> = {
  'dark-gold': {
    background: '#060D1B',
    surface: '#0F1A2E',
    surfaceLight: '#162240',
    card: '#1A2744',
    primary: '#C9A84C',
    primaryLight: '#E8D48B',
    primaryDark: '#9B7E2E',
    secondary: '#1A7A52',
    secondaryLight: '#2BA06D',
    accent: '#4A90D9',
    text: '#F5F0E8',
    textSecondary: '#8A94A6',
    textMuted: '#4A5568',
    error: '#E74C3C',
    success: '#2ECC71',
    warning: '#F39C12',
    border: 'rgba(201, 168, 76, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  'pure-light': {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceLight: '#F3F4F6',
    card: '#FFFFFF',
    primary: '#B8860B',
    primaryLight: '#DAA520',
    primaryDark: '#8B6508',
    secondary: '#1A7A52',
    secondaryLight: '#2BA06D',
    accent: '#2563EB',
    text: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    border: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  emerald: {
    background: '#022C22',
    surface: '#064E3B',
    surfaceLight: '#065F46',
    card: '#064E3B',
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    secondary: '#C9A84C',
    secondaryLight: '#E8D48B',
    accent: '#3B82F6',
    text: '#ECFDF5',
    textSecondary: '#A7F3D0',
    textMuted: '#6EE7B7',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    border: 'rgba(16, 185, 129, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  midnight: {
    background: '#020617',
    surface: '#0F172A',
    surfaceLight: '#1E293B',
    card: '#0F172A',
    primary: '#38BDF8',
    primaryLight: '#7DD3FC',
    primaryDark: '#0284C7',
    secondary: '#818CF8',
    secondaryLight: '#A5B4FC',
    accent: '#F472B6',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    error: '#F43F5E',
    success: '#22C55E',
    warning: '#EAB308',
    border: 'rgba(56, 189, 248, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  amoled: {
    background: '#000000',
    surface: '#0A0A0A',
    surfaceLight: '#141414',
    card: '#0A0A0A',
    primary: '#D4A843',
    primaryLight: '#E8C87A',
    primaryDark: '#B8860B',
    secondary: '#2DD4BF',
    secondaryLight: '#5EEAD4',
    accent: '#818CF8',
    text: '#F8F8F8',
    textSecondary: '#A0A0A0',
    textMuted: '#555555',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    border: 'rgba(212, 168, 67, 0.12)',
    overlay: 'rgba(0, 0, 0, 0.85)',
  },
}
