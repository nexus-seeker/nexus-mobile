// shadcn/ui Modern Web3 Design System for NEXUS
// Dark theme with glassmorphism, gradients, and web3 aesthetics

export const colors = {
  // Background layers
  background: '#0a0a0f',
  backgroundSecondary: '#12121a',
  backgroundTertiary: '#1a1a25',
  backgroundElevated: '#222230',

  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.15)',

  // Brand colors - Web3 gradient palette
  primary: '#8b5cf6', // Violet 500
  primaryLight: '#a78bfa', // Violet 400
  primaryDark: '#7c3aed', // Violet 600
  primaryGlow: 'rgba(139, 92, 246, 0.4)',

  secondary: '#06b6d4', // Cyan 500
  secondaryLight: '#22d3ee', // Cyan 400
  secondaryDark: '#0891b2', // Cyan 600
  secondaryGlow: 'rgba(6, 182, 212, 0.4)',

  accent: '#f59e0b', // Amber 500
  accentGlow: 'rgba(245, 158, 11, 0.4)',

  success: '#10b981', // Emerald 500
  successGlow: 'rgba(16, 185, 129, 0.4)',
  successMuted: 'rgba(16, 185, 129, 0.15)',

  error: '#ef4444', // Red 500
  errorGlow: 'rgba(239, 68, 68, 0.4)',
  errorMuted: 'rgba(239, 68, 68, 0.15)',

  warning: '#f59e0b', // Amber 500
  warningMuted: 'rgba(245, 158, 11, 0.15)',

  // Text colors
  foreground: '#fafafa', // Zinc 50
  foregroundMuted: '#a1a1aa', // Zinc 400
  foregroundSubtle: '#71717a', // Zinc 500
  foregroundInverse: '#18181b', // Zinc 900

  // Border colors
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.2)',
  borderFocus: 'rgba(139, 92, 246, 0.5)',

  // Gradients
  gradientPrimary: ['#8b5cf6', '#06b6d4'] as const,
  gradientSuccess: ['#10b981', '#06b6d4'] as const,
  gradientError: ['#ef4444', '#f59e0b'] as const,
  gradientSurface: ['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.05)'] as const,
};

export const typography = {
  // Font families
  fontSans: 'System',
  fontMono: 'Menlo, Monaco, Consolas, monospace',

  // Font sizes
  sizeXs: 12,
  sizeSm: 14,
  sizeBase: 16,
  sizeLg: 18,
  sizeXl: 20,
  size2xl: 24,
  size3xl: 30,
  size4xl: 36,

  // Font weights
  weightNormal: '400',
  weightMedium: '500',
  weightSemibold: '600',
  weightBold: '700',

  // Line heights
  leadingTight: 20,
  leadingNormal: 24,
  leadingRelaxed: 28,
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
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowSuccess: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowError: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.glassBorder,
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
  ...shadows.glow,
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
