// src/utils/theme.ts

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  card: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  error: string;
  success: string;
  warning: string;
  border: string;
  overlay: string;
  gradientPrimary: readonly [string, string, string];
  gradientSecondary: readonly [string, string, string];
  gradientBackground: readonly [string, string, string];
}

export type ThemeName = 'dark-gold' | 'pure-light' | 'emerald' | 'midnight' | 'amoled';

export const predefinedThemes: Record<ThemeName, ThemeColors> = {
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
    gradientPrimary: ['#C9A84C', '#E8D48B', '#C9A84C'] as const,
    gradientSecondary: ['#1A7A52', '#2BA06D', '#1A7A52'] as const,
    gradientBackground: ['#060D1B', '#0F1A2E', '#060D1B'] as const,
  },
  'pure-light': {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceLight: '#F3F4F6',
    card: '#FFFFFF',
    primary: '#B8860B', // Darker gold for light bg contrast
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
    gradientPrimary: ['#B8860B', '#DAA520', '#B8860B'] as const,
    gradientSecondary: ['#1A7A52', '#2BA06D', '#1A7A52'] as const,
    gradientBackground: ['#F9FAFB', '#FFFFFF', '#F9FAFB'] as const,
  },
  'emerald': {
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
    gradientPrimary: ['#059669', '#10B981', '#059669'] as const,
    gradientSecondary: ['#B8860B', '#DAA520', '#B8860B'] as const,
    gradientBackground: ['#022C22', '#064E3B', '#022C22'] as const,
  },
  'midnight': {
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
    gradientPrimary: ['#0284C7', '#38BDF8', '#0284C7'] as const,
    gradientSecondary: ['#6366F1', '#818CF8', '#6366F1'] as const,
    gradientBackground: ['#020617', '#0F172A', '#020617'] as const,
  },
  'amoled': {
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
    gradientPrimary: ['#D4A843', '#E8C87A', '#D4A843'] as const,
    gradientSecondary: ['#2DD4BF', '#5EEAD4', '#2DD4BF'] as const,
    gradientBackground: ['#000000', '#0A0A0A', '#000000'] as const,
  }
};

export const theme = {
  colors: predefinedThemes['dark-gold'], // Fallback for things not in context yet
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  borderRadius: {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const },
    h2: { fontSize: 24, fontWeight: '600' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodySmall: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
    counter: { fontSize: 72, fontWeight: '700' as const },
    counterSmall: { fontSize: 48, fontWeight: '600' as const },
  },
};

export type Theme = typeof theme;
