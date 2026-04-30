export const COLORS = {
  primary: '#6366f1',
  primaryLight: '#818cf8',
  secondary: '#4f46e5',
  surface: '#ffffff',
  background: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  outline: '#e2e8f0',
  error: '#ef4444',
  success: '#22c55e',
  white: '#ffffff',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const theme = {
  colors: COLORS,
  spacing: SPACING,
  shadows: {
    sm: SHADOWS.small,
    md: SHADOWS.medium,
    lg: SHADOWS.large,
  }
};
