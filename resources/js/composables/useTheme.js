import { ref, computed, watch } from 'vue'
import { usePage, router } from '@inertiajs/vue3'

const themeNames = ['dark-gold', 'pure-light', 'emerald', 'midnight', 'amoled']

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('').map((value) => value + value)
    return {
      r: Number.parseInt(r, 16),
      g: Number.parseInt(g, 16),
      b: Number.parseInt(b, 16),
    }
  }

  if (normalized.length !== 6) {
    throw new Error(`Unsupported color format: ${hex}`)
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function toRgba(color, alpha) {
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
    return color
  }

  const { r, g, b } = hexToRgb(color)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getReadableForeground(color) {
  const { r, g, b } = hexToRgb(color)
  const srgb = [r, g, b].map((value) => {
    const channel = value / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = (0.2126 * srgb[0]) + (0.7152 * srgb[1]) + (0.0722 * srgb[2])

  return luminance > 0.56 ? '#111827' : '#F8FAFC'
}

function createTheme(theme) {
  return {
    ...theme,
    primaryForeground: getReadableForeground(theme.primary),
    secondaryForeground: getReadableForeground(theme.secondary),
    accentForeground: getReadableForeground(theme.accent),
    destructiveForeground: getReadableForeground(theme.error),
  }
}

const themes = {
  'dark-gold': createTheme({
    background: '#07111F',
    surface: '#0D182A',
    surfaceLight: '#14213A',
    card: '#101B30',
    primary: '#D8B45D',
    primaryLight: '#E8D48B',
    primaryDark: '#9C7C2E',
    secondary: '#4CB38B',
    secondaryLight: '#7AD9B0',
    accent: '#6BA9FF',
    text: '#F5F0E6',
    textSecondary: '#A7B1C3',
    textMuted: '#667488',
    error: '#F76C6C',
    success: '#3CD28D',
    warning: '#F2B65B',
    border: 'rgba(148, 163, 184, 0.16)',
    overlay: 'rgba(2, 6, 23, 0.72)',
    mode: 'dark',
  }),
  'pure-light': createTheme({
    background: '#F7F8FB',
    surface: '#FFFFFF',
    surfaceLight: '#EDF1F7',
    card: '#FFFFFF',
    primary: '#B8871B',
    primaryLight: '#D8A43A',
    primaryDark: '#8B6508',
    secondary: '#1F8A63',
    secondaryLight: '#38B886',
    accent: '#3B82F6',
    text: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#94A3B8',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    border: 'rgba(15, 23, 42, 0.10)',
    overlay: 'rgba(15, 23, 42, 0.16)',
    mode: 'light',
  }),
  emerald: createTheme({
    background: '#071915',
    surface: '#0B2A23',
    surfaceLight: '#12362D',
    card: '#0D332A',
    primary: '#35D19C',
    primaryLight: '#61E0B3',
    primaryDark: '#159874',
    secondary: '#B7D36A',
    secondaryLight: '#D9E79F',
    accent: '#60A5FA',
    text: '#F0FDF7',
    textSecondary: '#A7E7CF',
    textMuted: '#6FBFA3',
    error: '#FB7185',
    success: '#22C55E',
    warning: '#FBBF24',
    border: 'rgba(53, 209, 156, 0.18)',
    overlay: 'rgba(2, 17, 14, 0.76)',
    mode: 'dark',
  }),
  midnight: createTheme({
    background: '#050816',
    surface: '#0C1324',
    surfaceLight: '#131C33',
    card: '#0E1730',
    primary: '#58B8FF',
    primaryLight: '#8FD1FF',
    primaryDark: '#1F8EDC',
    secondary: '#8A7DFF',
    secondaryLight: '#B0A8FF',
    accent: '#38D9C5',
    text: '#F8FAFC',
    textSecondary: '#A7B3C7',
    textMuted: '#718197',
    error: '#FB7185',
    success: '#34D399',
    warning: '#FBBF24',
    border: 'rgba(88, 184, 255, 0.16)',
    overlay: 'rgba(2, 6, 23, 0.76)',
    mode: 'dark',
  }),
  amoled: createTheme({
    background: '#000000',
    surface: '#0B0B0B',
    surfaceLight: '#141414',
    card: '#0F0F0F',
    primary: '#E0BA63',
    primaryLight: '#F0D28E',
    primaryDark: '#B8860B',
    secondary: '#37D6C9',
    secondaryLight: '#6BE6DD',
    accent: '#7C8DFF',
    text: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textMuted: '#666666',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    border: 'rgba(224, 186, 99, 0.14)',
    overlay: 'rgba(0, 0, 0, 0.82)',
    mode: 'dark',
  }),
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
  root.style.setProperty('--background', c.background)
  root.style.setProperty('--foreground', c.text)
  root.style.setProperty('--card-foreground', c.text)
  root.style.setProperty('--popover', c.surface)
  root.style.setProperty('--popover-foreground', c.text)
  root.style.setProperty('--primary-foreground', c.primaryForeground)
  root.style.setProperty('--secondary', c.secondary)
  root.style.setProperty('--secondary-foreground', c.secondaryForeground)
  root.style.setProperty('--muted', c.surfaceLight)
  root.style.setProperty('--muted-foreground', c.textMuted)
  root.style.setProperty('--accent', c.accent)
  root.style.setProperty('--accent-foreground', c.accentForeground)
  root.style.setProperty('--destructive', c.error)
  root.style.setProperty('--destructive-foreground', c.destructiveForeground)
  root.style.setProperty('--input', c.border)
  root.style.setProperty('--ring', c.primary)
  root.style.colorScheme = c.mode
}

export { toRgba }
