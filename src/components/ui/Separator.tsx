import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/shadcn-theme';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ orientation = 'horizontal' }: SeparatorProps) {
  return <View style={[styles.base, styles[orientation]]} />;
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
