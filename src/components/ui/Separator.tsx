import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../../theme/shadcn-theme';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

export function Separator({ orientation = 'horizontal', style }: SeparatorProps) {
  return <View style={[styles.base, styles[orientation], style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
