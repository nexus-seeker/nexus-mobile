import React, { forwardRef } from 'react';
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
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ icon, containerStyle, style, ...props }, ref) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          ref={ref}
          style={[styles.input, icon && styles.inputWithIcon, style]}
          placeholderTextColor={colors.foregroundSubtle}
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
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
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
