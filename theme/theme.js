// theme.js
// Central design tokens. Keep every screen's styling pulling from here
// so the app stays visually consistent as we add features.

export const colors = {
  background: '#FFFFFF',
  backgroundMuted: '#F5F5F7', // Apple's classic light grey
  surface: '#FFFFFF',
  border: '#E5E5EA',

  textPrimary: '#1D1D1F',
  textSecondary: '#6E6E73',
  textTertiary: '#AEAEB2',

  accent: '#0071E3', // Apple blue — the one accent color in the app
  accentPressed: '#0059B3',

  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9F0A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  // No custom font files — the system font (SF Pro on iOS, Roboto on
  // Android) already gives each platform its native feel, which fits
  // the "clean, native" brief better than importing a web font.
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.2 },
  title: { fontSize: 22, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  subhead: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};
