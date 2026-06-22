import { ref, computed, watch } from 'vue'
import { usePage, router } from '@inertiajs/vue3'

const themeNames = ['dark-gold', 'pure-light', 'emerald', 'midnight', 'amoled']

const themes = {
  'dark-gold': {
    background: '#060D1B',
    surface: '#0D1527',
    surfaceLight: '#161F33',
    card: '#161F33',
    primary: '#D4A843',
    primaryLight: '#E8D48B',
    primaryDark: '#9B7E2E',
    secondary: '#1A7A52',
    secondaryLight: '#2BA06D',
    accent: '#4A90D9',
    text: '#E8DCC4',
    textSecondary: '#8892A4',
    textMuted: '#4A5568',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    border: '#1E2D4A',
    overlay: 'rgba(0,0,0,0.6)',
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
    border: '#E5E7EB',
    overlay: 'rgba(0,0,0,0.2)',
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
    border: 'rgba(16, 185, 129, 0.25)',
    overlay: 'rgba(0,0,0,0.7)',
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
    border: 'rgba(56, 189, 248, 0.2)',
    overlay: 'rgba(0,0,0,0.7)',
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
    border: 'rgba(212, 168, 67, 0.15)',
    overlay: 'rgba(0,0,0,0.8)',
  },
}

let initialized = false
const currentThemeName = ref('dark-gold')

function initializeTheme() {
  if (initialized) return
  initialized = true

  const page = usePage()
  const serverTheme = page.props.auth?.user?.theme
  if (serverTheme && themeNames.includes(serverTheme)) {
    currentThemeName.value = serverTheme
    return
  }

  const savedTheme = localStorage.getItem('dhikr_theme')
  currentThemeName.value = savedTheme && themeNames.includes(savedTheme) ? savedTheme : 'dark-gold'
}

export function useTheme() {
  initializeTheme()

  const colors = computed(() => themes[currentThemeName.value])

  const setTheme = (name) => {
    if (themeNames.includes(name)) {
      currentThemeName.value = name
      localStorage.setItem('dhikr_theme', name)
      router.patch(route('settings.update'), { theme: name }, {
        preserveScroll: true,
        preserveState: true,
      })
    }
  }

  watch(currentThemeName, () => {
    applyThemeVariables(colors.value)
  }, { immediate: true })

  return {
    themeName: currentThemeName,
    themeNames,
    colors,
    themes,
    setTheme,
  }
}

export function applyThemeVariables(c) {
  const root = document.documentElement
  root.style.setProperty('--bg', c.background)
  root.style.setProperty('--surface', c.surface)
  root.style.setProperty('--surface-light', c.surfaceLight)
  root.style.setProperty('--card', c.card)
  root.style.setProperty('--primary', c.primary)
  root.style.setProperty('--primary-light', c.primaryLight)
  root.style.setProperty('--primary-dark', c.primaryDark)
  root.style.setProperty('--text', c.text)
  root.style.setProperty('--text-secondary', c.textSecondary)
  root.style.setProperty('--text-muted', c.textMuted)
  root.style.setProperty('--error', c.error)
  root.style.setProperty('--success', c.success)
  root.style.setProperty('--border', c.border)
  root.style.setProperty('--overlay', c.overlay)
}
