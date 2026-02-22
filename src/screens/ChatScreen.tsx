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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthorization } from '../utils/useAuthorization';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type RootStackParamList } from '../navigators/AppNavigator';
import { useAgentRun } from '../hooks/useAgentRun';
import { StepCard } from '../components/StepCard';
import { ApprovalSheet } from '../components/ApprovalSheet';
import { Button, Card, Input, Text } from '../components/ui';
import { colors, spacing, radii, shadows, typography } from '../theme/shadcn-theme';

const SUGGESTIONS = [
  'Swap 0.1 SOL to USDC',
  'Send 0.05 SOL to alice.skr',
  'Stake 2 SOL on Marginfi',
];

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
  const { selectedAccount, authorizeSession } = useAuthorization();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
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
    ? `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}.skr`
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
  const rejectionField = result?.rejection?.policyField;
  const showDemoSafeTransfer =
    runState === 'rejected' &&
    !!pubkey &&
    (rejectionField === 'jupiter' ||
      (rejectionField === 'tx_assembly' &&
        (error?.includes('InvalidProgramForExecution') ?? false)));
  const showOnboardingPrompt = runState === 'rejected' && rejectionField === 'not_onboarded' && !!pubkey;

  // Navigate back to the onboarding gate so the user can set up properly
  function handleGoToSetup() {
    resetRun();
    navigation.navigate('Onboarding' as never);
  }

  async function handleDemoSafeTransfer() {
    if (!pubkey) return;
    setIsApprovalSheetVisible(false);
    setIntent('');
    await executeIntent(`Transfer 0.001 SOL to ${pubkey}`);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      {/* Header - solid background */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 0) + spacing.md }]}>
        <View style={styles.headerContent}>

          {/* Left: Avatar/Profile */}
          <Pressable
            style={styles.walletChip}
            onPress={() => navigation.navigate("Profile")}
          >
            <View style={[styles.statusDot, { backgroundColor: selectedAccount ? colors.success : colors.error }]} />
            <Text style={styles.walletChipText}>{shortPubkey}</Text>
          </Pressable>

          {/* Center: NEXUS Brand */}
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons
              name="hexagon-multiple"
              size={20}
              color={colors.primaryLight}
              style={{ marginRight: spacing.sm }}
            />
            <Text variant="h4" style={{ letterSpacing: 2 }}>NEXUS</Text>
          </View>

          {/* Right: Policy Shield */}
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.navigate("Policy")}
          >
            <MaterialCommunityIcons name="shield-check" size={24} color={colors.foreground} />
          </Pressable>

        </View>
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

        {/* Confirmed Transaction */}
        {confirmedSig && (
          <View style={styles.successCard}>
            <MaterialCommunityIcons name="check-circle" size={32} color={colors.foreground} />
            <Text variant="h4" style={{ marginTop: spacing.sm }}>Transaction Confirmed</Text>
            <Text style={styles.sigText}>
              {confirmedSig.slice(0, 16)}...{confirmedSig.slice(-8)}
            </Text>
          </View>
        )}

        {/* Error Message */}
        {error && runState !== 'awaiting_approval' && (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />
            <Text variant="h4" style={{ color: colors.error, marginTop: spacing.sm }}>
              {runState === 'rejected' ? 'Policy Rejected' : 'Error'}
            </Text>
            <Text variant="muted" style={{ textAlign: 'center', marginTop: spacing.xs }}>{error}</Text>
          </View>
        )}

        {showOnboardingPrompt && (
          <Card variant="outline" style={styles.fallbackCard}>
            <MaterialCommunityIcons name="shield-account" size={28} color={colors.primary} />
            <Text style={styles.fallbackTitle}>Wallet not set up yet</Text>
            <Text variant="muted" style={styles.fallbackText}>
              Your wallet needs a one-time on-chain setup before the agent can run.
            </Text>
            <Button
              onPress={handleGoToSetup}
              style={styles.fallbackButton}
            >
              Go to Setup
            </Button>
          </Card>
        )}

        {showDemoSafeTransfer && (
          <Card variant="outline" style={styles.fallbackCard}>
            <Text style={styles.fallbackTitle}>Swap unavailable on current devnet route</Text>
            <Text variant="muted" style={styles.fallbackText}>
              Continue the no-mock demo with a policy-guarded SPL transfer.
            </Text>
            <Button onPress={() => void handleDemoSafeTransfer()} style={styles.fallbackButton}>
              Try Demo-Safe Transfer
            </Button>
          </Card>
        )}

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

        {/* Empty State */}
        {steps.length === 0 && runState === 'idle' && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateOrb}>
              <MaterialCommunityIcons name="brain" size={40} color={colors.primaryLight} />
            </View>
            <Text variant="h3" style={{ textAlign: 'center', marginTop: spacing.lg }}>NEXUS is ready.</Text>
            <Text variant="muted" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
              Speak your intent clearly and we'll execute it on-chain.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Receive Pill */}
      {pubkey && (
        <Pressable
          style={[styles.floatingPill, { bottom: (Platform.OS === 'ios' ? 140 : 120) + insets.bottom }]}
          onPress={() => navigation.navigate("History")}
        >
          <MaterialCommunityIcons name="history" size={16} color={colors.foreground} />
          <Text style={styles.floatingPillText}>Receipts</Text>
        </Pressable>
      )}

      {/* Suggestion Chips */}
      {steps.length === 0 && runState === 'idle' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsWrapper}
          contentContainerStyle={styles.suggestionsContainer}
        >
          {SUGGESTIONS.map((item, idx) => (
            <Pressable key={idx} onPress={() => setIntent(item)} style={styles.suggestionChip}>
              <Text style={styles.suggestionText}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: (Platform.OS === 'ios' ? 10 : spacing.lg) + insets.bottom }]}>
        <View style={styles.inputRow}>
          <Input
            placeholder="Type your intent..."
            value={intent}
            onChangeText={setIntent}
            containerStyle={styles.input}
            editable={!isRunning && !isSigning}
            onSubmitEditing={handleSend}
            leftIcon={<MaterialCommunityIcons name="microphone" size={20} color={colors.foregroundMuted} />}
          />
          <Pressable
            onPress={handleSend}
            disabled={isRunning || isSigning || !intent.trim()}
            style={({ pressed }) => [
              styles.sendButtonWrapper,
              pressed && styles.sendButtonPressed,
              (isRunning || isSigning || !intent.trim()) && styles.sendButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              {isRunning ? (
                <ActivityIndicator size="small" color={colors.foregroundInverse} />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color={colors.foregroundInverse} style={styles.sendIcon} />
              )}
            </LinearGradient>
          </Pressable>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  iconButton: {
    padding: spacing.xs,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletChipText: {
    color: colors.foreground,
    fontSize: typography.sizeXs,
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
  agentCard: {
    padding: spacing.lg,
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
    backgroundColor: colors.success,
    ...shadows.glowSuccess,
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
  fallbackCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  fallbackTitle: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
  },
  fallbackText: {
    marginBottom: spacing.xs,
  },
  fallbackButton: {
    marginTop: spacing.xs,
  },
  approvalSection: {
    gap: spacing.md,
  },
  approvalCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyStateOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  suggestionsWrapper: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  suggestionText: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeSm,
  },
  inputContainer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
  sendButtonWrapper: {
    marginLeft: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: radii.full,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sendIcon: {
    marginLeft: 3,
    marginBottom: 2,
    transform: [{ rotate: '-45deg' }],
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  floatingPill: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingPillText: {
    color: colors.foreground,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
});
