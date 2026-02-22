import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/shadcn-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = 'default',
  size = 'md',
  children,
  loading = false,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    (disabled || loading) && styles.disabled,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  const scale = React.useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = (e: any) => {
    if (disabled || loading) return;
    setIsPressed(true);
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
    }).start();
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled || loading) return;
    setIsPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
    props.onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      style={[
        buttonStyles,
        isPressed && !disabled && !loading && styles.pressed,
        style,
        { transform: [{ scale }] }
      ]}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' ? colors.foregroundInverse : colors.foreground}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={textStyles}>{children}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Variants
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
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: colors.errorMuted,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)', // muted red border
  },
  // Sizes
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  // Text styles
  text: {
    fontFamily: typography.fontSans,
    fontSize: typography.sizeBase,
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
  ghostText: {
    color: colors.foreground,
  },
  destructiveText: {
    color: colors.error,
  },
  // Text sizes
  smText: {
    fontSize: typography.sizeSm,
  },
  mdText: {
    fontSize: typography.sizeBase,
  },
  lgText: {
    fontSize: typography.sizeLg,
  },
});
