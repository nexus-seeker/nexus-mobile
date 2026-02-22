import React from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';
import { colors, typography } from '../../theme/shadcn-theme';

interface CustomTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'lead' | 'small' | 'muted';
}

export function Text({ variant = 'p', style, children, ...props }: CustomTextProps) {
  return (
    <RNText style={[styles.base, styles[variant], style]} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.fontSans,
    color: colors.foreground,
  },
  h1: {
    fontSize: typography.size4xl,
    fontWeight: typography.weightBold,
    lineHeight: typography.leadingTight,
  },
  h2: {
    fontSize: typography.size3xl,
    fontWeight: typography.weightSemibold,
    lineHeight: typography.leadingTight,
  },
  h3: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightSemibold,
    lineHeight: typography.leadingTight,
  },
  h4: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    lineHeight: typography.leadingNormal,
  },
  p: {
    fontSize: typography.sizeBase,
    fontWeight: typography.weightNormal,
    lineHeight: typography.leadingNormal,
  },
  lead: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightNormal,
    lineHeight: typography.leadingRelaxed,
    color: colors.foregroundMuted,
  },
  small: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightNormal,
  },
  muted: {
    fontSize: typography.sizeBase,
    fontWeight: typography.weightNormal,
    color: colors.foregroundMuted,
  },
});
