import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthorization } from '../utils/useAuthorization';
import { useAgentRun } from '../hooks/useAgentRun';
import { StepCard } from '../components/StepCard';
import { ApprovalSheet } from '../components/ApprovalSheet';
import { colors, spacing, radii, shadows, typography } from '../theme/shadcn-theme';

const EXAMPLE_INTENT = 'Swap 0.1 SOL to USDC';

// Shadcn-style Glass Card Component
function GlassCard({ children, style, gradient = false }: { children: React.ReactNode; style?: any; gradient?: boolean }) {
  if (gradient) {
    return (
      <LinearGradient
        colors={colors.gradientSurface}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.glassCard, style]}
      >
        {children}
      </LinearGradient>
    );
  }
  return (
    <BlurView intensity={20} tint="dark" style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  );
}

// Gradient Button
function GradientButton({
  onPress,
  children,
  icon,
  disabled = false,
  loading = false,
  variant = 'primary',
}: {
  onPress: () => void;
  children: React.ReactNode;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}) {
  const gradientColors = {
    primary: colors.gradientPrimary,
    secondary: ['transparent', 'transparent'] as const,
    success: colors.gradientSuccess,
    danger: colors.gradientError,
  };

  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.buttonSecondary,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <LinearGradient
        colors={gradientColors[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radii.lg, opacity: isSecondary ? 0 : 1 },
        ]}
      />
      {loading ? (
        <ActivityIndicator size="small" color={isSecondary ? colors.foreground : colors.foreground} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={18}
              color={isSecondary ? colors.foreground : colors.foreground}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text style={[styles.buttonText, isSecondary && styles.buttonTextSecondary]}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Status Indicator
function StatusIndicator({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return colors.secondary;
      case 'awaiting_approval':
        return colors.accent;
      case 'signing':
        return colors.primary;
      case 'confirmed':
        return colors.success;
      case 'error':
      case 'rejected':
        return colors.error;
      default:
        return colors.foregroundMuted;
    }
  };

  return (
    <View style={styles.statusIndicator}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      <Text style={styles.statusText}>{status.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
}

export function ChatScreen() {
  const { selectedAccount } = useAuthorization();
  const [intent, setIntent] = useState('');
  const [isApprovalSheetVisible, setIsApprovalSheetVisible] = useState(false);
  const {
    runState,
    steps,
    result,
    confirmedSig,
    error,
    executeIntent,
    approveTransaction,
    resetRun,
  } = useAgentRun();

  const pubkey = selectedAccount?.publicKey.toBase58();
  const shortPubkey = pubkey
    ? `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`
    : 'Not connected';

  async function handleSend() {
    const trimmed = intent.trim();
    if (!trimmed || runState === 'running') return;
    setIntent('');
    setIsApprovalSheetVisible(false);
    await executeIntent(trimmed);
  }

  function handleReset() {
    setIsApprovalSheetVisible(false);
    resetRun();
  }

  const isRunning = runState === 'running';
  const showApproval = runState === 'awaiting_approval';
  const isSigning = runState === 'signing';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      {/* Header with Glassmorphism */}
      <View style={styles.header}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons
                name="hexagon-multiple"
                size={28}
                color={colors.foreground}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={styles.headerTitle}>NEXUS</Text>
            </View>
            <View style={styles.walletChip}>
              <View style={[styles.statusDot, { backgroundColor: selectedAccount ? colors.success : colors.error }]} />
              <Text style={styles.walletChipText}>{shortPubkey}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Bar */}
        {runState !== 'idle' && (
          <View style={styles.statusBar}>
            <StatusIndicator status={runState} />
          </View>
        )}

        {/* Agent Steps */}
        {steps.length > 0 && (
          <GlassCard gradient style={styles.agentCard}>
            <View style={styles.agentCardHeader}>
              <MaterialCommunityIcons name="robot" size={20} color={colors.primaryLight} />
              <Text style={styles.agentLabel}>NEXUS AGENT</Text>
            </View>
            <View style={styles.stepsContainer}>
              {steps.map((step, i) => (
                <StepCard key={`${step.node}-${i}`} step={step} index={i} />
              ))}
            </View>
          </GlassCard>
        )}

        {/* Confirmed Transaction */}
        {confirmedSig && (
          <LinearGradient
            colors={colors.gradientSuccess}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.successCard}
          >
            <MaterialCommunityIcons name="check-circle" size={32} color={colors.foreground} />
            <Text style={styles.successTitle}>Transaction Confirmed</Text>
            <Text style={styles.sigText}>
              {confirmedSig.slice(0, 16)}...{confirmedSig.slice(-8)}
            </Text>
          </LinearGradient>
        )}

        {/* Error Message */}
        {error && runState !== 'awaiting_approval' && (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />
            <Text style={styles.errorTitle}>
              {runState === 'rejected' ? 'Policy Rejected' : 'Error'}
            </Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Approve Button */}
        {showApproval && (
          <View style={styles.approvalSection}>
            <GlassCard style={styles.approvalCard}>
              <MaterialCommunityIcons name="shield-key" size={40} color={colors.accent} />
              <Text style={styles.approvalTitle}>Action Requires Approval</Text>
              <Text style={styles.approvalSubtitle}>
                Review the transaction details before signing with your wallet
              </Text>
            </GlassCard>
            <GradientButton
              onPress={() => setIsApprovalSheetVisible(true)}
              icon="fingerprint"
              variant="success"
            >
              Approve with Seed Vault
            </GradientButton>
          </View>
        )}

        {/* Reset Button */}
        {(runState === 'confirmed' || runState === 'rejected' || runState === 'error') && (
          <GradientButton onPress={handleReset} variant="secondary">
            New Intent
          </GradientButton>
        )}

        {/* Empty State */}
        {steps.length === 0 && runState === 'idle' && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={colors.gradientSurface}
              style={styles.emptyStateIconContainer}
            >
              <MaterialCommunityIcons name="brain" size={48} color={colors.primaryLight} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Ready for your intent</Text>
            <Text style={styles.emptySubtitle}>
              Tell NEXUS what you want to do
            </Text>
            <Pressable onPress={() => setIntent(EXAMPLE_INTENT)} style={styles.exampleChip}>
              <Text style={styles.exampleChipText}>Try: "{EXAMPLE_INTENT}"</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
          <View style={styles.inputRow}>
            <TextInput
              mode="flat"
              placeholder="Type your intent..."
              placeholderTextColor={colors.foregroundSubtle}
              value={intent}
              onChangeText={setIntent}
              style={styles.input}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              disabled={isRunning || isSigning}
              onSubmitEditing={handleSend}
              theme={{
                colors: {
                  primary: colors.primary,
                  background: colors.backgroundTertiary,
                  surface: colors.backgroundTertiary,
                  placeholder: colors.foregroundSubtle,
                  text: colors.foreground,
                },
              }}
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
              <LinearGradient
                colors={isRunning || !intent.trim() ? ['#333', '#333'] : colors.gradientPrimary}
                style={StyleSheet.absoluteFill}
              />
              {isRunning ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color={colors.foreground} />
              )}
            </Pressable>
          </View>
        </BlurView>
      </View>

      {/* Approval Sheet */}
      <ApprovalSheet
        visible={showApproval && isApprovalSheetVisible}
        result={result}
        isLoading={isSigning}
        onApprove={() => {
          setIsApprovalSheetVisible(false);
          void approveTransaction();
        }}
        onCancel={handleReset}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.foreground,
    letterSpacing: 2,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  walletChipText: {
    color: colors.foreground,
    fontSize: typography.sizeSm,
    fontFamily: typography.fontMono,
    marginLeft: spacing.xs,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statusBar: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 1,
  },
  glassCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  agentCard: {
    padding: spacing.lg,
    backgroundColor: colors.glass,
  },
  agentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  agentLabel: {
    color: colors.primaryLight,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 2,
    marginLeft: spacing.sm,
  },
  stepsContainer: {
    gap: spacing.sm,
  },
  successCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.glowSuccess,
  },
  successTitle: {
    color: colors.foreground,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    marginTop: spacing.sm,
  },
  sigText: {
    color: colors.foreground,
    fontSize: typography.sizeSm,
    fontFamily: typography.fontMono,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  errorCard: {
    backgroundColor: colors.errorMuted,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorTitle: {
    color: colors.error,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeSm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  approvalSection: {
    gap: spacing.md,
  },
  approvalCard: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  approvalTitle: {
    color: colors.foreground,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    marginTop: spacing.md,
  },
  approvalSubtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeSm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  badge: {
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  badgeDefault: {
    backgroundColor: colors.backgroundTertiary,
  },
  badgeSuccess: {
    backgroundColor: colors.successMuted,
  },
  badgeError: {
    backgroundColor: colors.errorMuted,
  },
  badgeWarning: {
    backgroundColor: colors.warningMuted,
  },
  badgeText: {
    color: colors.foreground,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
  button: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.md,
  },
  buttonSecondary: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundTertiary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
  },
  buttonTextSecondary: {
    color: colors.foreground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
  },
  emptySubtitle: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeBase,
    marginTop: spacing.xs,
  },
  exampleChip: {
    marginTop: spacing.lg,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exampleChipText: {
    color: colors.primaryLight,
    fontSize: typography.sizeSm,
  },
  inputContainer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 30 : spacing.lg,
  },
  inputBlur: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.lg,
    height: 48,
    fontSize: typography.sizeBase,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
