// shadcn/ui Modern Web3 Design System for NEXUS
// Dark theme with zinc-based palette and minimal aesthetics

import { FONT_FAMILY } from './fonts';

export const colors = {
  // Background layers - true zinc dark
  background: '#09090b',         // zinc-950
  backgroundSecondary: '#18181b', // zinc-900
  backgroundTertiary: '#27272a',  // zinc-800
  backgroundElevated: '#3f3f46',  // zinc-700

  // Foreground (text)
  foreground: '#fafafa',
  foregroundMuted: '#a1a1aa',
  foregroundSubtle: '#71717a',
  foregroundInverse: '#18181b',

  // Border
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  borderFocus: '#8b5cf6',

  // Accent colors
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  primaryMuted: 'rgba(139, 92, 246, 0.15)',

  secondary: '#06b6d4',
  secondaryMuted: 'rgba(6, 182, 212, 0.15)',

  // Semantic colors
  success: '#22c55e',
  successMuted: 'rgba(34, 197, 94, 0.15)',

  error: '#ef4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',

  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.15)',

  // Gradients - use sparingly
  gradientPrimary: ['#8b5cf6', '#06b6d4'] as const,
  gradientSuccess: ['#22c55e', '#06b6d4'] as const,
  gradientError: ['#ef4444', '#f59e0b'] as const,
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
  sizeXs: 11,
  sizeSm: 13,
  sizeBase: 15,
  sizeLg: 17,
  sizeXl: 19,
  size2xl: 23,
  size3xl: 28,
  size4xl: 34,

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
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
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
