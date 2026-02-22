# Shadcn/UI Modern Dark Theme Rewrite

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace react-native-paper components with a custom shadcn-style UI library featuring refined dark aesthetics, solid layered backgrounds, and distinctive typography.

**Architecture:** Create a centralized `/src/components/ui/` component library with design tokens in `/src/theme/`. Remove react-native-paper dependency entirely. Use Geist font family for modern tech aesthetic. Keep the app strictly dark mode with zinc-based color palette.

**Tech Stack:** React Native, Expo, TypeScript, expo-font (Geist), expo-linear-gradient (sparingly)

---

## Prerequisites

- Worktree: `/Users/bene/Documents/bene/seeker-hack/nexus-mobile/.worktrees/ui-rewrite`
- Branch: `feature/ui-rewrite`
- Baseline: 34 tests passing

---

## Task 1: Install Geist Font Family

**Files:**
- Create: `assets/fonts/Geist-Regular.otf`, `Geist-Medium.otf`, `Geist-SemiBold.otf`, `Geist-Bold.otf`, `GeistMono-Regular.otf`
- Modify: `app.json`
- Modify: `App.tsx`

**Context:** Shadcn/ui uses distinctive typography. We'll use Geist (Vercel's font) for that modern tech aesthetic.

**Step 1: Download Geist fonts**

Run:
```bash
cd /Users/bene/Documents/bene/seeker-hack/nexus-mobile/.worktrees/ui-rewrite
mkdir -p assets/fonts
cd assets/fonts

# Download Geist fonts from jsDelivr CDN
curl -L -o Geist-Regular.otf "https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-Regular.otf"
curl -L -o Geist-Medium.otf "https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-Medium.otf"
curl -L -o Geist-SemiBold.otf "https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-SemiBold.otf"
curl -L -o Geist-Bold.otf "https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-Bold.otf"
curl -L -o GeistMono-Regular.otf "https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/GeistMono-Regular.otf"
```

**Step 2: Configure app.json for fonts**

Modify: `app.json`

```json
{
  "expo": {
    "name": "nexus-mobile",
    "slug": "nexus-mobile",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "fonts": {
      "Geist-Regular": "./assets/fonts/Geist-Regular.otf",
      "Geist-Medium": "./assets/fonts/Geist-Medium.otf",
      "Geist-SemiBold": "./assets/fonts/Geist-SemiBold.otf",
      "Geist-Bold": "./assets/fonts/Geist-Bold.otf",
      "GeistMono-Regular": "./assets/fonts/GeistMono-Regular.otf"
    }
  }
}
```

**Step 3: Create font loading hook**

Create: `src/theme/fonts.ts`

```typescript
import { useFonts } from 'expo-font';

export const FONT_FAMILY = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  mono: 'GeistMono-Regular',
} as const;

export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.otf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.otf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.otf'),
    'Geist-Bold': require('../../assets/fonts/Geist-Bold.otf'),
    'GeistMono-Regular': require('../../assets/fonts/GeistMono-Regular.otf'),
  });

  return { fontsLoaded, fontError };
}
```

**Step 4: Update App.tsx to load fonts**

Modify: `App.tsx`

Replace the font loading logic:

```typescript
import { useAppFonts } from './src/theme/fonts';

export default function App() {
  const { fontsLoaded, fontError } = useAppFonts();

  if (!fontsLoaded && !fontError) {
    return null; // Or a splash screen
  }

  // ... rest of App.tsx
}
```

**Step 5: Run tests to verify nothing broken**

Run: `npm test`
Expected: 34 tests passing

**Step 6: Commit**

```bash
git add assets/fonts/ src/theme/fonts.ts app.json App.tsx
git commit -m "feat: add Geist font family"
```

---

## Task 2: Update Design Tokens (shadcn-style colors)

**Files:**
- Modify: `src/theme/shadcn-theme.ts`

**Context:** Current colors are too purple-heavy. Shadcn uses zinc grays with minimal accent.

**Step 1: Replace color tokens**

Modify: `src/theme/shadcn-theme.ts`

Replace the colors object:

```typescript
export const colors = {
  // Background layers - true zinc dark
  background: '#09090b',         // zinc-950 (deepest)
  backgroundSecondary: '#18181b', // zinc-900 (cards)
  backgroundTertiary: '#27272a',  // zinc-800 (inputs)
  backgroundElevated: '#3f3f46',  // zinc-700 (hover states)

  // Foreground (text)
  foreground: '#fafafa',         // zinc-50 (primary text)
  foregroundMuted: '#a1a1aa',    // zinc-400 (secondary text)
  foregroundSubtle: '#71717a',   // zinc-500 (placeholder)
  foregroundInverse: '#18181b',  // zinc-900 (text on light bg)

  // Border
  border: 'rgba(255, 255, 255, 0.08)',      // very subtle
  borderStrong: 'rgba(255, 255, 255, 0.15)', // stronger
  borderFocus: '#8b5cf6',                    // violet-500

  // Accent colors - use sparingly
  primary: '#8b5cf6',        // violet-500
  primaryLight: '#a78bfa',   // violet-400
  primaryDark: '#7c3aed',    // violet-600
  primaryMuted: 'rgba(139, 92, 246, 0.15)',

  secondary: '#06b6d4',      // cyan-500
  secondaryMuted: 'rgba(6, 182, 212, 0.15)',

  // Semantic colors
  success: '#22c55e',        // green-500
  successMuted: 'rgba(34, 197, 94, 0.15)',

  error: '#ef4444',          // red-500
  errorMuted: 'rgba(239, 68, 68, 0.15)',

  warning: '#f59e0b',        // amber-500
  warningMuted: 'rgba(245, 158, 11, 0.15)',

  // Gradients - use sparingly
  gradientPrimary: ['#8b5cf6', '#06b6d4'] as const,
  gradientSuccess: ['#22c55e', '#06b6d4'] as const,
  gradientError: ['#ef4444', '#f59e0b'] as const,

  // Remove gradientSurface - use solid backgrounds instead
};
```

**Step 2: Update typography to use Geist**

Replace typography section:

```typescript
import { FONT_FAMILY } from './fonts';

export const typography = {
  fontSans: FONT_FAMILY.regular,
  fontMono: FONT_FAMILY.mono,

  // Font sizes - slightly smaller for mobile refinement
  sizeXs: 11,
  sizeSm: 13,
  sizeBase: 15,
  sizeLg: 17,
  sizeXl: 19,
  size2xl: 23,
  size3xl: 28,
  size4xl: 34,

  // Font weights - Geist has specific weights
  weightNormal: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,

  // Line heights
  leadingTight: 18,
  leadingNormal: 22,
  leadingRelaxed: 26,
};
```

**Step 3: Update radii for consistency**

Replace radii:

```typescript
export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  full: 9999,
};
```

**Step 4: Remove glow shadows (too heavy)**

Replace shadows:

```typescript
export const shadows = {
  // Minimal shadows - shadcn is mostly flat
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
  // Remove glow shadows entirely
};
```

**Step 5: Run tests**

Run: `npm test`
Expected: 34 tests passing

**Step 6: Commit**

```bash
git add src/theme/shadcn-theme.ts
git commit -m "feat: update design tokens to shadcn zinc dark palette"
```

---

## Task 3: Create UI Component Library - Button

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/index.ts`

**Context:** shadcn buttons are flat, minimal, with clear variants.

**Step 1: Create Button component**

Create: `src/components/ui/Button.tsx`

```typescript
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type PressableProps,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/shadcn-theme';

interface ButtonProps extends PressableProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
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

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyles,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      disabled={disabled || loading}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
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
    backgroundColor: colors.error,
  },
  // Sizes
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
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
    color: colors.foreground,
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
```

**Step 2: Create UI index file**

Create: `src/components/ui/index.ts`

```typescript
export { Button } from './Button';
```

**Step 3: Run tests**

Run: `npm test`
Expected: 34 tests passing

**Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Button component with shadcn variants"
```

---

## Task 4: Create Card Component

**Files:**
- Create: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/index.ts`

**Context:** shadcn cards are solid, layered, minimal borders.

**Step 1: Create Card component**

Create: `src/components/ui/Card.tsx`

```typescript
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

// Sub-components for structured cards
Card.Header = function CardHeader({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
};

Card.Title = function CardTitle({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.title, style]} {...props}>
      {children}
    </View>
  );
};

Card.Description = function CardDescription({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.description, style]} {...props}>
      {children}
    </View>
  );
};

Card.Content = function CardContent({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
};

Card.Footer = function CardFooter({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  default: {
    // Default is the base style
  },
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
  title: {
    // Style applied to Text children
  },
  description: {
    // Style applied to Text children
  },
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
```

**Step 2: Export Card**

Modify: `src/components/ui/index.ts`

```typescript
export { Button } from './Button';
export { Card } from './Card';
```

**Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Card component with sub-components"
```

---

## Task 5: Create Input Component

**Files:**
- Create: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/index.ts`

**Context:** Clean native input, no Paper dependency.

**Step 1: Create Input component**

Create: `src/components/ui/Input.tsx`

```typescript
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
```

**Step 2: Export Input**

Modify: `src/components/ui/index.ts`

```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
```

**Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Input component"
```

---

## Task 6: Create Badge, Separator, and Text Components

**Files:**
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Separator.tsx`
- Create: `src/components/ui/Text.tsx`
- Modify: `src/components/ui/index.ts`

**Step 1: Create Badge**

Create: `src/components/ui/Badge.tsx`

```typescript
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
```

**Step 2: Create Separator**

Create: `src/components/ui/Separator.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/shadcn-theme';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
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
```

**Step 3: Create Text component with variants**

Create: `src/components/ui/Text.tsx`

```typescript
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
```

**Step 4: Update exports**

Modify: `src/components/ui/index.ts`

```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Badge } from './Badge';
export { Separator } from './Separator';
export { Text } from './Text';
```

**Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Badge, Separator, and Text components"
```

---

## Task 7: Remove react-native-paper - Update ChatScreen

**Files:**
- Modify: `src/screens/ChatScreen.tsx`
- Modify: `src/screens/index.ts` (if needed)

**Context:** Replace Paper components with our UI library. Remove gradients from header, use solid colors.

**Step 1: Replace imports and components**

Modify: `src/screens/ChatScreen.tsx`

Replace imports:

```typescript
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthorization } from '../utils/useAuthorization';
import { useAgentRun } from '../hooks/useAgentRun';
import { StepCard } from '../components/StepCard';
import { ApprovalSheet } from '../components/ApprovalSheet';
import { Button, Card, Input, Text, Badge } from '../components/ui';
import { colors, spacing, radii, typography } from '../theme/shadcn-theme';
```

**Step 2: Replace header (remove gradient, use solid)**

Replace header section:

```typescript
{/* Header - solid background */}
<View style={styles.header}>
  <View style={styles.headerContent}>
    <View style={styles.headerTitleContainer}>
      <MaterialCommunityIcons
        name="hexagon-multiple"
        size={24}
        color={colors.foreground}
        style={{ marginRight: spacing.sm }}
      />
      <Text variant="h4">NEXUS</Text>
    </View>
    <View style={styles.walletChip}>
      <View style={[styles.statusDot, { backgroundColor: selectedAccount ? colors.success : colors.error }]} />
      <Text style={styles.walletChipText}>{shortPubkey}</Text>
    </View>
  </View>
</View>
```

Update header styles:

```typescript
header: {
  paddingTop: Platform.OS === 'ios' ? 60 : 20,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},
```

**Step 3: Replace agent card (use Card component)**

Replace agent card:

```typescript
{/* Agent Steps */}
{steps.length > 0 && (
  <Card style={styles.agentCard}>
    <View style={styles.agentCardHeader}>
      <MaterialCommunityIcons name="robot" size={18} color={colors.primaryLight} />
      <Text style={styles.agentLabel}>NEXUS AGENT</Text>
    </View>
    <View style={styles.stepsContainer}>
      {steps.map((step, i) => (
        <StepCard key={`${step.node}-${i}`} step={step} index={i} />
      ))}
    </View>
  </Card>
)}
```

**Step 4: Replace input area (use Input component)**

Replace input container:

```typescript
{/* Input Area */}
<View style={styles.inputContainer}>
  <View style={styles.inputRow}>
    <Input
      placeholder="Type your intent..."
      value={intent}
      onChangeText={setIntent}
      style={styles.input}
      editable={!isRunning && !isSigning}
      onSubmitEditing={handleSend}
    />
    <Pressable
      onPress={handleSend}
      disabled={isRunning || isSigning || !intent.trim()}
      style={({ pressed }) => [
        styles.sendButton,
        pressed && styles.sendButtonPressed,
        (isRunning || isSigning || !intent.trim()) && styles.sendButtonDisabled,
      ]}
    >
      {isRunning ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : (
        <MaterialCommunityIcons name="send" size={18} color={colors.foreground} />
      )}
    </Pressable>
  </View>
</View>
```

**Step 5: Replace buttons (use Button component)**

Replace GradientButton usage with Button:

```typescript
{/* Approve Button */}
{showApproval && (
  <View style={styles.approvalSection}>
    <Card variant="outline" style={styles.approvalCard}>
      <MaterialCommunityIcons name="shield-key" size={36} color={colors.primary} />
      <Text variant="h4" style={{ marginTop: spacing.md }}>Action Required</Text>
      <Text variant="muted" style={{ textAlign: 'center', marginTop: spacing.xs }}>
        Review transaction details before signing
      </Text>
    </Card>
    <Button onPress={() => setIsApprovalSheetVisible(true)} size="lg">
      Approve with Seed Vault
    </Button>
  </View>
)}

{/* Reset Button */}
{(runState === 'confirmed' || runState === 'rejected' || runState === 'error') && (
  <Button variant="outline" onPress={handleReset}>
    New Intent
  </Button>
)}
```

**Step 6: Run tests**

Run: `npm test`
Expected: 34 tests passing

**Step 7: Commit**

```bash
git add src/screens/ChatScreen.tsx
git commit -m "refactor: remove react-native-paper from ChatScreen"
```

---

## Task 8: Remove react-native-paper - Update ProfileScreen

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

**Step 1: Replace imports**

Modify: `src/screens/ProfileScreen.tsx`

Replace imports:

```typescript
import React, { useMemo, useState } from "react";
import { StyleSheet, View, Pressable, ScrollView, Clipboard, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { ellipsify } from "../utils/ellipsify";
import { Button, Card, Text, Badge } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme/shadcn-theme";
```

**Step 2: Replace header (remove gradient)**

Replace header:

```typescript
{/* Header - solid with border */}
<View style={styles.header}>
  <View style={styles.headerContent}>
    <View style={styles.avatarContainer}>
      <View style={styles.avatarGradient}>
        <MaterialCommunityIcons
          name={selectedAccount ? "account-circle" : "account-circle-outline"}
          size={44}
          color={colors.foreground}
        />
      </View>
    </View>
    <Text variant="h3">Profile</Text>
    <Badge variant={selectedAccount ? "default" : "destructive"}>
      {selectedAccount ? 'Connected' : 'Disconnected'}
    </Badge>
  </View>
</View>
```

Update header styles (remove gradient):

```typescript
header: {
  paddingTop: 60,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},
avatarGradient: {
  width: 72,
  height: 72,
  borderRadius: radii.full,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.backgroundTertiary,
  borderWidth: 1,
  borderColor: colors.border,
},
```

**Step 3: Replace info cards with Card component**

Replace InfoCard usage:

```typescript
{/* Wallet Info Section */}
<View style={styles.section}>
  <Text variant="small" style={{ color: colors.foregroundMuted, marginBottom: spacing.md }}>
    Wallet Information
  </Text>

  {selectedAccount ? (
    <Card>
      <Card.Content>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="wallet" size={18} color={colors.foregroundMuted} />
          <View style={styles.infoContent}>
            <Text variant="small" style={{ color: colors.foregroundMuted }}>Public Key</Text>
            <Pressable onPress={handleCopy} style={styles.valueContainer}>
              <Text style={styles.infoValue}>{ellipsify(publicKey, 12)}</Text>
              <MaterialCommunityIcons name="content-copy" size={14} color={colors.foregroundMuted} />
            </Pressable>
          </View>
        </View>
      </Card.Content>
    </Card>
  ) : (
    // ... connect prompt
  )}
</View>
```

**Step 4: Replace buttons with Button component**

Replace GradientButton:

```typescript
{/* Action Buttons */}
<View style={styles.actionSection}>
  {!selectedAccount ? (
    <Button onPress={onConnect} loading={isBusy} disabled={isBusy} size="lg">
      Connect Wallet
    </Button>
  ) : (
    <Button variant="destructive" onPress={onDisconnect} loading={isBusy} disabled={isBusy} size="lg">
      Disconnect
    </Button>
  )}
</View>
```

**Step 5: Run tests**

Run: `npm test`
Expected: 34 tests passing

**Step 6: Commit**

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "refactor: remove react-native-paper from ProfileScreen"
```

---

## Task 9: Remove react-native-paper - Update PolicyScreen

**Files:**
- Modify: `src/screens/PolicyScreen.tsx`

**Step 1: Replace imports**

Modify: `src/screens/PolicyScreen.tsx`

Replace imports:

```typescript
import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Pressable, Switch } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePolicy } from "../contexts/PolicyContext";
import { type PolicyProtocol } from "../features/policy/policy-engine";
import { Button, Card, Input, Text, Separator } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme/shadcn-theme";
```

**Step 2: Replace header (remove gradient)**

Replace header:

```typescript
{/* Header - solid */}
<View style={styles.header}>
  <View style={styles.headerContent}>
    <MaterialCommunityIcons name="shield" size={28} color={colors.foreground} />
    <Text variant="h3" style={{ marginTop: spacing.sm }}>Permission Vault</Text>
    <Text variant="muted" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
      Control your agent's permissions
    </Text>
  </View>
</View>
```

**Step 3: Replace stat cards with Card**

Replace StatCard usage:

```typescript
{/* Stats Row */}
<View style={styles.statsRow}>
  <Card style={styles.statCard}>
    <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
    <Text style={styles.statValue}>{policy.dailyLimitSol} SOL</Text>
    <Text variant="small" style={{ color: colors.foregroundMuted }}>Daily Limit</Text>
  </Card>
  <Card style={styles.statCard}>
    <MaterialCommunityIcons name="cash-minus" size={20} color={colors.secondary} />
    <Text style={styles.statValue}>{policy.dailySpentSol.toFixed(4)} SOL</Text>
    <Text variant="small" style={{ color: colors.foregroundMuted }}>Spent Today</Text>
  </Card>
  <Card style={styles.statCard}>
    <MaterialCommunityIcons name="shield-check" size={20} color={isActive ? colors.success : colors.error} />
    <Text style={styles.statValue}>{isActive ? "Active" : "Paused"}</Text>
    <Text variant="small" style={{ color: colors.foregroundMuted }}>Status</Text>
  </Card>
</View>
```

**Step 4: Replace input with Input component**

Replace TextInput:

```typescript
<View style={styles.inputGroup}>
  <Text variant="small" style={{ color: colors.foregroundMuted, marginBottom: spacing.sm }}>
    Daily Spend Limit (SOL)
  </Text>
  <Input
    value={dailyLimitSol}
    onChangeText={setDailyLimitSol}
    keyboardType="decimal-pad"
    icon={<MaterialCommunityIcons name="currency-usd" size={18} color={colors.foregroundMuted} />}
  />
  {isLimitInvalid && (
    <Text variant="small" style={{ color: colors.error, marginTop: spacing.sm }}>
      Enter a valid non-negative SOL limit
    </Text>
  )}
</View>
```

**Step 5: Replace buttons with Button**

Replace GradientButton:

```typescript
<Button onPress={onSavePolicy} loading={isSaving} disabled={isSaving || isLimitInvalid} size="lg">
  Save Policy
</Button>
```

**Step 6: Run tests**

Run: `npm test`
Expected: 34 tests passing

**Step 7: Commit**

```bash
git add src/screens/PolicyScreen.tsx
git commit -m "refactor: remove react-native-paper from PolicyScreen"
```

---

## Task 10: Remove react-native-paper Dependency

**Files:**
- Modify: `package.json`
- Modify: `App.tsx`
- Run: `npm uninstall react-native-paper`

**Step 1: Remove from package.json**

Remove the `react-native-paper` line from dependencies.

**Step 2: Remove PaperProvider from App.tsx**

Modify: `App.tsx`

Remove:
```typescript
import { PaperProvider } from 'react-native-paper';
```

And remove the `<PaperProvider>` wrapper from the component tree.

**Step 3: Uninstall package**

Run:
```bash
npm uninstall react-native-paper
```

**Step 4: Run tests**

Run: `npm test`
Expected: 34 tests passing

**Step 5: Commit**

```bash
git add package.json package-lock.json App.tsx
git commit -m "chore: remove react-native-paper dependency"
```

---

## Task 11: Update Navigation (Bottom Tabs)

**Files:**
- Modify: `src/navigators/HomeNavigator.tsx`
- Modify: `src/theme/shadcn-theme.ts` (add navigation theme)

**Step 1: Add navigation theme tokens**

Modify: `src/theme/shadcn-theme.ts`

Add at end of file:

```typescript
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
```

**Step 2: Update HomeNavigator**

Modify: `src/navigators/HomeNavigator.tsx`

```typescript
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ChatScreen,
  HistoryScreen,
  PolicyScreen,
  ProfileScreen,
} from "../screens";
import { tabBarOptions, colors } from "../theme/shadcn-theme";

const Tab = createBottomTabNavigator();

export function HomeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        ...tabBarOptions,
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case "Chat":
              return (
                <MaterialCommunityIcon
                  name={focused ? "message" : "message-outline"}
                  size={size}
                  color={color}
                />
              );
            case "Policy":
              return (
                <MaterialCommunityIcon
                  name={focused ? "shield-check" : "shield-check-outline"}
                  size={size}
                  color={color}
                />
              );
            case "History":
              return (
                <MaterialCommunityIcon
                  name="history"
                  size={size}
                  color={color}
                />
              );
            case "Profile":
              return (
                <MaterialCommunityIcon
                  name={focused ? "account-circle" : "account-circle-outline"}
                  size={size}
                  color={color}
                />
              );
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Policy" component={PolicyScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

**Step 3: Run tests**

Run: `npm test`
Expected: 34 tests passing

**Step 4: Commit**

```bash
git add src/navigators/HomeNavigator.tsx src/theme/shadcn-theme.ts
git commit -m "feat: style bottom tab navigator with shadcn theme"
```

---

## Task 12: Final Review and Cleanup

**Files:**
- Check all imports across modified files
- Run full test suite
- Verify TypeScript compilation

**Step 1: TypeScript check**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors

**Step 2: Run all tests**

Run:
```bash
npm test
```
Expected: 34 tests passing

**Step 3: Lint check**

Run:
```bash
npm run lint 2>/dev/null || npx eslint src/ --ext .ts,.tsx
```

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete shadcn/ui dark theme rewrite

- Add Geist font family for modern typography
- Create UI component library (Button, Card, Input, Badge, Separator, Text)
- Remove react-native-paper dependency
- Update all screens to use new components
- Style navigation with shadcn theme
- Use zinc-based dark palette with minimal accents"
```

---

## Testing Checklist

After each task:
- [ ] `npm test` passes (34 tests)
- [ ] TypeScript compiles without errors
- [ ] App renders without crashes

Final verification:
- [ ] All Paper imports removed
- [ ] All screens use new UI components
- [ ] Consistent spacing and colors
- [ ] Geist font loads correctly
- [ ] Dark theme consistent throughout

---

## Post-Implementation Notes

**Design Changes Summary:**
1. Removed all gradient headers → solid backgrounds with borders
2. Removed glassmorphism cards → solid `backgroundSecondary` cards
3. Removed heavy shadows → flat design with subtle borders
4. Removed purple-cyan color dominance → zinc grays with minimal violet accent
5. Added Geist font → modern tech aesthetic
6. Consistent 8-10px border radius (down from 16-20px)
7. Slightly smaller font sizes for mobile refinement

**Remaining Files to Potentially Update:**
- `src/components/StepCard.tsx` - Update styling
- `src/components/ApprovalSheet.tsx` - Update styling
- `src/components/account/account-ui.tsx` - Update if uses Paper
- `src/components/sign-in/sign-in-ui.tsx` - Update if uses Paper

These can be updated in follow-up tasks if needed.
