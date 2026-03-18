/**
 * Design tokens — single source of truth for colors, fonts, spacing.
 */

export const Colors = {
  // Backgrounds
  bg: '#0A0A0F',
  bgCard: 'rgba(255,255,255,0.05)',
  bgCardBorder: 'rgba(255,255,255,0.12)',

  // Glass layers
  glass: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.15)',

  // Accents
  accent: '#7C3AED',       // purple
  accentLight: '#A78BFA',
  accentGlow: 'rgba(124,58,237,0.35)',
  accentSecondary: '#06B6D4', // cyan

  // Bubbles
  bubbleMe: 'rgba(124,58,237,0.75)',
  bubbleThem: 'rgba(255,255,255,0.08)',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',

  // Status
  online: '#22C55E',
  offline: '#EF4444',
  warning: '#F59E0B',

  // Input
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.18)',
};

export const Fonts = {
  regular: 'System',
  bold: 'System',
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    hero: 34,
  },
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};
