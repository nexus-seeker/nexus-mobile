// shadcn/ui Modern Web3 Design System for NEXUS
// Dark theme with zinc-based palette and minimal aesthetics

import { FONT_FAMILY } from './fonts';

export const colors = {
  // Background layers - deep black / fintech void
  background: '#000000',
  backgroundSecondary: '#09090b', // zinc-950
  backgroundTertiary: '#121214',
  backgroundElevated: '#18181b',  // zinc-900

  // Foreground (text)
  foreground: '#fafafa',
  foregroundMuted: '#a1a1aa',
  foregroundSubtle: '#71717a',
  foregroundInverse: '#000000',

  // Border
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  borderFocus: '#a855f7', // solana purple

  // Accent colors
  primary: '#a855f7',
  primaryLight: '#d8b4fe',
  primaryDark: '#7e22ce',
  primaryMuted: 'rgba(168, 85, 247, 0.15)',

  secondary: '#06b6d4',
  secondaryMuted: 'rgba(6, 182, 212, 0.15)',

  // Semantic colors
  success: '#10b981', // emerald
  successMuted: 'rgba(16, 185, 129, 0.15)',

  error: '#f43f5e', // rose
  errorMuted: 'rgba(244, 63, 94, 0.15)',

  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.15)',

  // Additional tokens
  accent: '#a855f7',
  accentMuted: 'rgba(168, 85, 247, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Gradients - use sparingly
  gradientPrimary: ['#a855f7', '#06b6d4'] as const,
  gradientSuccess: ['#10b981', '#06b6d4'] as const,
  gradientError: ['#f43f5e', '#f59e0b'] as const,
  gradientSurface: ['rgba(168, 85, 247, 0.1)', 'rgba(6, 182, 212, 0.05)'] as const,
};

// Font weights as const for type safety
export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const typography = {
  fontSans: FONT_FAMILY.regular,
  fontMono: FONT_FAMILY.mono,

  // Font sizes
  sizeXs: 12,
  sizeSm: 13,
  sizeBase: 16,
  sizeLg: 17,
  sizeXl: 19,
  size2xl: 24,
  size3xl: 28,
  size4xl: 32,

  // Font weights
  weightNormal: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,

  // Line heights
  leadingTight: 18,
  leadingNormal: 22,
  leadingRelaxed: 26,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  glowSuccess: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const animations = {
  // Timing
  fast: 150,
  normal: 250,
  slow: 350,

  // Easing
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'spring',
};

// Common style patterns
export const glassCard = {
  backgroundColor: colors.backgroundSecondary,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radii.xl,
  ...shadows.md,
};

export const elevatedCard = {
  backgroundColor: colors.backgroundElevated,
  borderRadius: radii.xl,
  ...shadows.lg,
};

export const gradientBorder = {
  borderWidth: 1,
  borderColor: colors.primary,
  // Note: Real gradient borders require a wrapper with linear gradient background
};

export const buttonPrimary = {
  backgroundColor: colors.primary,
  borderRadius: radii.lg,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
};

export const buttonSecondary = {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: colors.borderStrong,
  borderRadius: radii.lg,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
};

export const inputBase = {
  backgroundColor: colors.backgroundTertiary,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radii.lg,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  color: colors.foreground,
  fontSize: typography.sizeBase,
};

export const textGradient = {
  // For web, we'd use background-clip: text
  // In RN, we simulate with the primary color
  color: colors.primaryLight,
};

export const badgeBase = {
  borderRadius: radii.full,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
};

export const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.foreground,
    background: colors.background,
    card: colors.backgroundSecondary,
    text: colors.foreground,
    border: colors.border,
    notification: colors.primary,
  },
};

export const tabBarOptions = {
  tabBarStyle: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 0,
    height: 64,
    paddingBottom: 8,
  },
  tabBarActiveTintColor: colors.foreground,
  tabBarInactiveTintColor: colors.foregroundSubtle,
  tabBarLabelStyle: {
    fontFamily: typography.fontSans,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
};
