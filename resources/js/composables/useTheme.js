import { ref, computed, watch } from 'vue'
import { usePage, router } from '@inertiajs/vue3'

const themeNames = ['dark-gold', 'warm-sand', 'emerald', 'saffron', 'noor', 'tawheed']

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
    background: '#0B0A08',
    surface: '#161410',
    surfaceLight: '#24201A',
    card: '#1C1914',
    primary: '#D4AF37',
    primaryLight: '#E8C86A',
    primaryDark: '#A08020',
    secondary: '#C9953F',
    accent: '#E8924A',
    text: '#F5EFE0',
    textSecondary: '#BCB0A0',
    textMuted: '#877B6B',
    error: '#F06A6A',
    success: '#4ABF80',
    border: 'rgba(212, 175, 55, 0.15)',
    overlay: 'rgba(8, 6, 4, 0.72)',
    mode: 'dark',
  }),
  'warm-sand': createTheme({
    background: '#FDF8F0',
    surface: '#FFFFFF',
    surfaceLight: '#F5EDE0',
    card: '#FFFFFF',
    primary: '#B8860B',
    primaryLight: '#D4A43A',
    primaryDark: '#8C6008',
    secondary: '#C87A36',
    accent: '#4A9E8A',
    text: '#2C2418',
    textSecondary: '#6B6050',
    textMuted: '#A09888',
    error: '#D64A2A',
    success: '#3D8C60',
    border: 'rgba(44, 36, 24, 0.10)',
    overlay: 'rgba(44, 36, 24, 0.14)',
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
    accent: '#F0A060',
    text: '#F0FDF7',
    textSecondary: '#A7E7CF',
    textMuted: '#6FBFA3',
    error: '#FB7185',
    success: '#22C55E',
    border: 'rgba(53, 209, 156, 0.18)',
    overlay: 'rgba(2, 17, 14, 0.76)',
    mode: 'dark',
  }),
  saffron: createTheme({
    background: '#100B04',
    surface: '#1C150C',
    surfaceLight: '#2A2012',
    card: '#1F170D',
    primary: '#E8923A',
    primaryLight: '#F0B06A',
    primaryDark: '#B06A18',
    secondary: '#D4A373',
    accent: '#5BA88C',
    text: '#FDF6E8',
    textSecondary: '#C4B49A',
    textMuted: '#8C7A5E',
    error: '#E06A4A',
    success: '#4ABF80',
    border: 'rgba(232, 146, 58, 0.16)',
    overlay: 'rgba(10, 6, 2, 0.76)',
    mode: 'dark',
  }),
  noor: createTheme({
    background: '#12080D',
    surface: '#1D0F15',
    surfaceLight: '#2D1820',
    card: '#201116',
    primary: '#D4A373',
    primaryLight: '#E8C09A',
    primaryDark: '#A87A50',
    secondary: '#C06050',
    accent: '#7B8E8A',
    text: '#F5EDE8',
    textSecondary: '#C4B5AD',
    textMuted: '#8C7D75',
    error: '#D46A5A',
    success: '#5A9E7A',
    border: 'rgba(212, 163, 115, 0.16)',
    overlay: 'rgba(10, 4, 6, 0.76)',
    mode: 'dark',
  }),
  tawheed: createTheme({
    background: '#0A0A0A',
    surface: '#141414',
    surfaceLight: '#1E1E1E',
    card: '#181818',
    primary: '#E0E0E0',
    primaryLight: '#F0F0F0',
    primaryDark: '#A0A0A0',
    secondary: '#A0A0A0',
    accent: '#888888',
    text: '#F0F0F0',
    textSecondary: '#A8A8A8',
    textMuted: '#707070',
    error: '#CC6666',
    success: '#66CC99',
    border: 'rgba(255, 255, 255, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.80)',
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
  root.style.setProperty('--surface', c.surface)
  root.style.setProperty('--surface-light', c.surfaceLight)
  root.style.setProperty('--card', c.card)
  root.style.setProperty('--primary', c.primary)
  root.style.setProperty('--text-muted', c.textMuted)
  root.style.setProperty('--error', c.error)
  root.style.setProperty('--success', c.success)
  root.style.setProperty('--border', c.border)
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
