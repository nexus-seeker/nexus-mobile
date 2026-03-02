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
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type RootStackParamList } from '../navigators/AppNavigator';
import { useAgentRun } from '../hooks/useAgentRun';
import { useHistory } from '../hooks/useHistory';
import { useProactiveFeed } from '../hooks/useProactiveFeed';
import { StepCard } from '../components/StepCard';
import { ApprovalSheet } from '../components/ApprovalSheet';
import { ProactiveCard } from '../components/ProactiveCard';
import { Button, Card, Input, Text } from '../components/ui';
import { colors, spacing, radii, shadows, typography } from '../theme/shadcn-theme';
import type {
  RecommendationActionType,
  RecommendationFeedbackOutcome,
} from '../services/agent/agent-api';

const SUGGESTIONS = [
  'Send 0.05 SOL each to addr1 and addr2',
  'Stake 0.5 SOL via Marinade',
  'Analyze my wallet activity',
  'Swap 0.1 SOL to USDC',
];

type IntentClass = 'casual' | 'read' | 'action' | 'safety' | 'learn' | 'complex';

const INTENT_BADGE_CONFIG: Record<IntentClass, { icon: string; label: string; color: string }> = {
  casual: { icon: 'chat-outline', label: 'CASUAL', color: '#6B7280' },
  read: { icon: 'magnify', label: 'READ', color: '#60A5FA' },
  action: { icon: 'lightning-bolt', label: 'ACTION', color: '#A78BFA' },
  safety: { icon: 'shield-alert', label: 'SAFETY', color: '#F59E0B' },
  learn: { icon: 'school-outline', label: 'LEARN', color: '#34D399' },
  complex: { icon: 'layers-triple', label: 'COMPLEX', color: '#F472B6' },
};

function IntentBadge({ intentClass }: { intentClass: IntentClass }) {
  const cfg = INTENT_BADGE_CONFIG[intentClass];
  return (
    <View style={[intentBadgeStyles.badge, { borderColor: cfg.color + '55' }]}>
      <MaterialCommunityIcons name={cfg.icon as any} size={11} color={cfg.color} />
      <Text style={[intentBadgeStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const intentBadgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 'auto',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

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
      case 'answered':
        return colors.primaryLight;
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

function getHistoryRoleLabel(role: string): string {
  if (role === 'user') {
    return 'YOU';
  }

  if (role === 'agent' || role === 'assistant') {
    return 'AGENT';
  }

  return role.toUpperCase();
}

export function ChatScreen() {
  const { selectedAccount } = useAuthorization();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const insets = useSafeAreaInsets();
  const [intent, setIntent] = useState('');
  const [isApprovalSheetVisible, setIsApprovalSheetVisible] = useState(false);
  const {
    runState,
    currentIntent,
    steps,
    result,
    confirmedSig,
    agentMessage,
    error,
    executeIntent,
    approveTransaction,
    resetRun,
  } = useAgentRun();

  const pubkey = selectedAccount?.publicKey.toBase58();
  const threadId = route.params?.threadId;
  const recommendationIdFromRoute = route.params?.recommendationId;
  const { data: historyData, isLoading: isHistoryLoading } = useHistory(pubkey);
  const {
    data: proactiveFeed,
    isLoading: isProactiveFeedLoading,
    sendFeedback,
    isSendingFeedback,
  } = useProactiveFeed(pubkey, threadId);
  const historyMessages = historyData?.messages ?? [];
  const threadScopedHistoryMessages = threadId
    ? historyMessages.filter((message) => message.threadId === threadId)
    : historyMessages;
  const shouldShowPersistedHistory = !isHistoryLoading && runState === 'idle' && steps.length === 0;
  const persistedHistoryPreview = [...threadScopedHistoryMessages]
    .sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp;
      }
      return b.id.localeCompare(a.id);
    })
    .slice(0, 8)
    .reverse();

  // Derive the intent class from the classify_intent step (streamed from agent)
  const intentClass = steps
    .find((s) => s.node === 'classify_intent')
    ?.payload?.intentClass as IntentClass | undefined;
  const shortPubkey = pubkey
    ? `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}.skr`
    : 'Not connected';
  const proactiveRecommendations = recommendationIdFromRoute
    ? [...(proactiveFeed ?? [])].sort((a, b) => {
      if (a.id === recommendationIdFromRoute) return -1;
      if (b.id === recommendationIdFromRoute) return 1;
      return b.createdAt - a.createdAt;
    })
    : proactiveFeed ?? [];

  async function handleProactiveAction(
    recommendationId: string,
    actionType: RecommendationActionType,
  ) {
    const outcomeByAction: Partial<Record<RecommendationActionType, RecommendationFeedbackOutcome>> = {
      approve: 'approved',
      reject: 'rejected',
      ignore: 'ignored',
      open: 'ignored',
    };
    const reasonByAction: Partial<Record<RecommendationActionType, string>> = {
      open: 'user_opened',
    };

    const outcome = outcomeByAction[actionType];
    if (!outcome) {
      return;
    }

    try {
      await sendFeedback({
        recommendationId,
        outcome,
        reason: reasonByAction[actionType],
      });
    } catch (feedbackError) {
      console.warn('[ChatScreen] Failed to send proactive feedback', feedbackError);
    }
  }

  async function handleSend() {
    const trimmed = intent.trim();
    if (!trimmed || runState === 'running') return;
    setIntent('');
    setIsApprovalSheetVisible(false);
    await executeIntent(trimmed, threadId);
  }

  function handleReset() {
    setIsApprovalSheetVisible(false);
    resetRun();
  }

  const isRunning = runState === 'running';
  const showApproval = runState === 'awaiting_approval';
  const isSigning = runState === 'signing';
  const isAnswered = runState === 'answered';
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
    await executeIntent(`Transfer 0.001 SOL to ${pubkey}`, threadId);
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

          {/* Center: Kawula Brand */}
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons
              name="hexagon-multiple"
              size={20}
              color={colors.primaryLight}
              style={{ marginRight: spacing.sm }}
            />
            <Text variant="h4" style={{ letterSpacing: 2 }}>Kawula</Text>
          </View>

          {/* Right: Policy Shield */}
          <Pressable
            style={styles.policyChip}
            onPress={() => navigation.navigate("Policy")}
          >
            <MaterialCommunityIcons name="shield-check" size={14} color={colors.foreground} />
            <Text style={styles.policyChipText}>Policy</Text>
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

        {proactiveRecommendations.length > 0 && (
          <View style={styles.proactiveFeedSection}>
            <View style={styles.agentCardHeader}>
              <MaterialCommunityIcons name="flash" size={18} color={colors.primaryLight} />
              <Text style={styles.agentLabel}>PROACTIVE RECOMMENDATIONS</Text>
            </View>
            <View style={styles.proactiveFeedCards}>
              {proactiveRecommendations.map((recommendation) => (
                <ProactiveCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onAction={handleProactiveAction}
                  disabled={isSendingFeedback}
                />
              ))}
            </View>
          </View>
        )}

        {isProactiveFeedLoading && proactiveRecommendations.length === 0 && (
          <View style={styles.proactiveFeedLoadingRow}>
            <ActivityIndicator size="small" color={colors.primaryLight} />
            <Text variant="muted">Loading proactive recommendations...</Text>
          </View>
        )}

        {shouldShowPersistedHistory && persistedHistoryPreview.length > 0 && (
          <Card style={styles.historyCard}>
            <View style={styles.agentCardHeader}>
              <MaterialCommunityIcons name="history" size={18} color={colors.primaryLight} />
              <Text style={styles.agentLabel}>PERSISTED HISTORY</Text>
            </View>
            <View style={styles.historyMessagesContainer}>
              {persistedHistoryPreview.map((message) => (
                <View key={message.id} style={styles.historyMessageRow}>
                  <Text style={styles.historyRoleLabel}>{getHistoryRoleLabel(message.role)}</Text>
                  <Text>{message.content}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* User Message Bubble */}
        {currentIntent && runState !== 'idle' && (
          <View style={styles.userBubbleContainer}>
            <View style={styles.userCardHeader}>
              <Text style={styles.userLabel}>YOU</Text>
              <MaterialCommunityIcons name="account" size={16} color={colors.foregroundMuted} />
            </View>
            <View style={styles.userBubble}>
              <Text style={styles.userMessageText}>{currentIntent}</Text>
            </View>
          </View>
        )}

        {/* Agent Steps */}
        {steps.length > 0 && (
          <Card style={[
            styles.agentCard,
            intentClass === 'safety' && { borderColor: '#F59E0B55', borderWidth: 1.5 },
          ]}>
            <View style={styles.agentCardHeader}>
              <MaterialCommunityIcons name="robot" size={18} color={colors.primaryLight} />
              <Text style={styles.agentLabel}>Kawula AGENT</Text>
              {intentClass && <IntentBadge intentClass={intentClass} />}
            </View>
            <View style={styles.stepsContainer}>
              {steps.map((step, i) => (
                <StepCard key={`${step.node}-${i}`} step={step} index={i} />
              ))}
            </View>
          </Card>
        )}

        {/* Agent Message (analysis answer / conversational) */}
        {isAnswered && agentMessage && (
          <Card style={[
            styles.agentCard,
            intentClass === 'safety' && { borderColor: '#F59E0B55', borderWidth: 1.5 },
          ]}>
            <View style={styles.agentCardHeader}>
              <MaterialCommunityIcons name="brain" size={18} color={colors.primaryLight} />
              <Text style={styles.agentLabel}>Kawula ANALYSIS</Text>
              {intentClass && <IntentBadge intentClass={intentClass} />}
            </View>
            <Text style={styles.agentMessageText}>{agentMessage}</Text>
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



        {/* Empty State */}
        {steps.length === 0 && runState === 'idle' && !isHistoryLoading && threadScopedHistoryMessages.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateOrb}>
              <MaterialCommunityIcons name="brain" size={40} color={colors.primaryLight} />
            </View>
            <Text variant="h3" style={{ textAlign: 'center', marginTop: spacing.lg }}>Kawula is ready.</Text>
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
  policyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  policyChipText: {
    color: colors.foreground,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    marginLeft: spacing.xs,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  statusBar: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  proactiveFeedSection: {
    gap: spacing.md,
  },
  proactiveFeedCards: {
    gap: spacing.md,
  },
  proactiveFeedLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    borderRadius: radii.xl,
    borderTopLeftRadius: radii.sm,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: spacing.md,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  userLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 1,
    marginRight: spacing.xs,
  },
  userBubble: {
    backgroundColor: colors.backgroundElevated,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderTopRightRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  userMessageText: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    lineHeight: 22,
  },
  historyCard: {
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
  historyMessagesContainer: {
    gap: spacing.md,
  },
  historyMessageRow: {
    gap: spacing.xs,
  },
  historyRoleLabel: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 1,
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
  agentMessageText: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
