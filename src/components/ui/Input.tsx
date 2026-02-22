import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  type TextInputProps,
  ViewProps,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/shadcn-theme';

interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewProps['style'];
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ icon, leftIcon, containerStyle, style, onFocus, onBlur, ...props }, ref) => {
    const iconToUse = leftIcon || icon;
    const [isFocused, setIsFocused] = useState(false);
    return (
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        containerStyle
      ]}>
        {iconToUse && <View style={styles.iconContainer}>{iconToUse}</View>}
        <TextInput
          ref={ref}
          style={[styles.input, iconToUse ? styles.inputWithIcon : undefined, style]}
          placeholderTextColor={colors.foregroundSubtle}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          {...props}
        />
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  containerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  iconContainer: {
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    fontFamily: typography.fontSans,
    fontSize: typography.sizeBase,
    fontWeight: typography.weightNormal,
  },
  inputWithIcon: {
    paddingLeft: spacing.sm,
  },
});
