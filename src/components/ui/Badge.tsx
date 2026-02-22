import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/shadcn-theme';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  children: string;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.foreground,
  },
  secondary: {
    backgroundColor: colors.backgroundTertiary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  destructive: {
    backgroundColor: colors.errorMuted,
  },
  text: {
    fontFamily: typography.fontSans,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
  defaultText: {
    color: colors.foregroundInverse,
  },
  secondaryText: {
    color: colors.foreground,
  },
  outlineText: {
    color: colors.foreground,
  },
  destructiveText: {
    color: colors.error,
  },
});
