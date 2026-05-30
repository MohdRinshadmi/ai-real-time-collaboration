// A small design token set mirroring the web Tailwind preset's intent
// (neutral surfaces, a single brand accent, destructive red).

export const colors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  border: '#e4e4e7',
  accent: '#f4f4f5',
  primary: '#4f46e5',
  primaryForeground: '#ffffff',
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  card: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
} as const;
