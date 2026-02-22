import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, radii, spacing } from '../../theme/shadcn-theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outline' | 'ghost';
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]} {...props}>
      {children}
    </View>
  );
}

Card.Header = function CardHeader({ style, children, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props}>{children}</View>;
};

Card.Title = function CardTitle({ style, children, ...props }: ViewProps) {
  return <View style={[styles.title, style]} {...props}>{children}</View>;
};

Card.Description = function CardDescription({ style, children, ...props }: ViewProps) {
  return <View style={[styles.description, style]} {...props}>{children}</View>;
};

Card.Content = function CardContent({ style, children, ...props }: ViewProps) {
  return <View style={[styles.content, style]} {...props}>{children}</View>;
};

Card.Footer = function CardFooter({ style, children, ...props }: ViewProps) {
  return <View style={[styles.footer, style]} {...props}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(24, 24, 27, 0.4)', // transparent backgroundElevated (zinc-900ish)
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  default: {},
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  header: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {},
  description: {},
  content: {
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: 0,
    flexDirection: 'row',
    gap: spacing.md,
  },
});
