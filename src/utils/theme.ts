export const theme = {
  colors: {
    background: '#060D1B',
    surface: '#0F1A2E',
    surfaceLight: '#162240',
    card: '#1A2744',
    primary: '#C9A84C',      // Rich gold
    primaryLight: '#E8D48B',
    primaryDark: '#9B7E2E',
    secondary: '#1A7A52',    // Emerald green
    secondaryLight: '#2BA06D',
    accent: '#4A90D9',       // Soft blue
    text: '#F5F0E8',         // Warm white
    textSecondary: '#8A94A6',
    textMuted: '#4A5568',
    error: '#E74C3C',
    success: '#2ECC71',
    warning: '#F39C12',
    border: 'rgba(201, 168, 76, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    gradientGold: ['#C9A84C', '#E8D48B', '#C9A84C'] as const,
    gradientEmerald: ['#1A7A52', '#2BA06D', '#1A7A52'] as const,
    gradientDark: ['#060D1B', '#0F1A2E', '#060D1B'] as const,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
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
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    lg: {
      shadowColor: '#C9A84C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: '#C9A84C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

export type Theme = typeof theme;
