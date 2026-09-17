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

  accent: '#166534', // Sohoj Pathshala forest green — the main brand color
  accentPressed: '#14532D', // darker green for pressed/active states

  highlight: '#EAB308', // gold — the warm accent, use sparingly (streaks, scores, CTAs that need to pop)

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

// Hind Siliguri everywhere — renders both Bangla and Latin text well, so
// it's used regardless of the active language. Loaded via useFonts() in
// App.js. Only Regular and SemiBold are bundled; "bold" tokens map to
// SemiBold since custom font files don't respond to a fontWeight override
// the way system fonts do.
const FONT_REGULAR = 'HindSiliguri-Regular';
const FONT_SEMIBOLD = 'HindSiliguri-SemiBold';

export const typography = {
  largeTitle: { fontSize: 34, fontFamily: FONT_SEMIBOLD, letterSpacing: 0.2 },
  title: { fontSize: 22, fontFamily: FONT_SEMIBOLD },
  headline: { fontSize: 17, fontFamily: FONT_SEMIBOLD },
  body: { fontSize: 17, fontFamily: FONT_REGULAR },
  subhead: { fontSize: 15, fontFamily: FONT_REGULAR },
  caption: { fontSize: 13, fontFamily: FONT_REGULAR },
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
