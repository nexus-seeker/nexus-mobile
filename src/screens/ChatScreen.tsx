import React, { useEffect, useState } from 'react';
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
import { useConversationThreads } from '../hooks/useConversationThreads';
import { StepCard } from '../components/StepCard';
import { ApprovalSheet } from '../components/ApprovalSheet';
import { ProactiveCard } from '../components/ProactiveCard';
import { Button, Card, Input, Text } from '../components/ui';
import { createNewThreadId } from '../utils/thread-id';
import { colors, spacing, radii, shadows, typography } from '../theme/shadcn-theme';
import type {
  RecommendationActionType,
  RecommendationFeedbackOutcome,
  RejectionRecoveryActionDto,
} from '../services/agent/agent-api';

const SUGGESTIONS = [
  'Send 0.05 SOL each to addr1 and addr2',
  'Stake 0.5 SOL via Marinade',
  'Analyze my wallet activity',
  'Swap 0.1 SOL to USDC',
];

const SUPPORTED_RECOVERY_ACTION_TYPES = [
  'retry_intent',
  'open_policy',
  'open_onboarding',
] as const;

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

function formatThreadUpdatedAt(updatedAt: number): string {
  return new Date(updatedAt).toLocaleString();
}

export function ChatScreen() {
  const { selectedAccount } = useAuthorization();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const insets = useSafeAreaInsets();
  const [intent, setIntent] = useState('');
  const [isApprovalSheetVisible, setIsApprovalSheetVisible] = useState(false);
  const [isThreadsDrawerVisible, setIsThreadsDrawerVisible] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(route.params?.threadId);
  const {
    runState,
    currentIntent,
    steps,
    result,
    confirmedSig,
    agentMessage,
    error,
    activeRunId,
    executeIntent,
    approveTransaction,
    resetRun,
  } = useAgentRun();

  const pubkey = selectedAccount?.publicKey.toBase58();
  const incomingThreadId = route.params?.threadId;
  const recommendationIdFromRoute = route.params?.recommendationId;
  const {
    data: conversationThreads,
    isLoading: isConversationThreadsLoading,
    error: conversationThreadsError,
  } = useConversationThreads(pubkey);
  const { data: historyData, isLoading: isHistoryLoading } = useHistory(pubkey);
  const {
    data: proactiveFeed,
    isLoading: isProactiveFeedLoading,
    sendFeedback,
    isSendingFeedback,
  } = useProactiveFeed(pubkey, activeThreadId);

  useEffect(() => {
    if (!incomingThreadId) {
      return;
    }

    setActiveThreadId(incomingThreadId);
    setIntent('');
    setIsApprovalSheetVisible(false);
    resetRun();
  }, [incomingThreadId, resetRun]);

  useEffect(() => {
    if (!activeThreadId) {
      setActiveThreadId(createNewThreadId(pubkey));
    }
  }, [activeThreadId, pubkey]);

  const historyMessages = historyData?.messages ?? [];
  const threadScopedHistoryMessages = activeThreadId
    ? historyMessages.filter((message) => message.threadId === activeThreadId && message.runId !== activeRunId)
    : [];
  const shouldShowPersistedHistory = !isHistoryLoading; // Always show history if loaded
  const persistedHistoryPreview = [...threadScopedHistoryMessages]
    .sort((a, b) => a.timestamp - b.timestamp); // Chronological order (oldest first)

  // Derive the intent class from the classify_intent step (streamed from agent)
  const intentClass = steps
    .find((s) => s.node === 'classify_intent')
    ?.payload?.intentClass as IntentClass | undefined;
  const shortPubkey = pubkey
    ? `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`
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
    if (
      !trimmed ||
      runState === 'running' ||
      runState === 'awaiting_approval' ||
      runState === 'signing'
    ) {
      return;
    }
    setIntent('');
    setIsApprovalSheetVisible(false);
    await executeIntent(trimmed, activeThreadId);
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
  const recoveryActions = (result?.recovery?.suggestedActions ?? [])
    .filter((action): action is RejectionRecoveryActionDto => {
      if (!action?.type) {
        return false;
      }

      if (
        !SUPPORTED_RECOVERY_ACTION_TYPES.includes(
          action.type as (typeof SUPPORTED_RECOVERY_ACTION_TYPES)[number],
        )
      ) {
        return false;
      }

      if (action.type === 'retry_intent') {
        return !!action.intent;
      }

      return true;
    })
    .slice(0, 3);
  const hasStructuredRecoveryActions = recoveryActions.length > 0;
  const rejectedRecoveryMessage =
    typeof agentMessage === 'string' && agentMessage.trim().length > 0
      ? agentMessage
      : (result?.recovery?.summary ?? null);
  const showDemoSafeTransfer =
    runState === 'rejected' &&
    !hasStructuredRecoveryActions &&
    !!pubkey &&
    (rejectionField === 'jupiter' ||
      (rejectionField === 'tx_assembly' &&
        (error?.includes('InvalidProgramForExecution') ?? false)));
  const showOnboardingPrompt =
    runState === 'rejected' &&
    !hasStructuredRecoveryActions &&
    rejectionField === 'not_onboarded' &&
    !!pubkey;

  // Navigate back to the onboarding gate so the user can set up properly
  function handleGoToSetup() {
    resetRun();
    navigation.navigate('Onboarding' as never);
  }

  async function handleDemoSafeTransfer() {
    if (!pubkey) return;
    setIsApprovalSheetVisible(false);
    setIntent('');
    await executeIntent(`Transfer 0.001 SOL to ${pubkey}`, activeThreadId);
  }

  async function handleRecoveryAction(action: RejectionRecoveryActionDto) {
    if (!action.type) {
      return;
    }

    switch (action.type) {
      case 'retry_intent':
        if (!action.intent) {
          return;
        }
        setIsApprovalSheetVisible(false);
        setIntent('');
        await executeIntent(action.intent, activeThreadId);
        return;
      case 'open_policy':
        navigation.navigate('Policy');
        return;
      case 'open_onboarding':
        navigation.navigate('Onboarding');
        return;
      default:
        return;
    }
  }

  function handleOpenThreadsDrawer() {
    setIsThreadsDrawerVisible(true);
  }

  function handleCloseThreadsDrawer() {
    setIsThreadsDrawerVisible(false);
  }

  function handleStartNewThread() {
    setActiveThreadId(createNewThreadId(pubkey));
    setIntent('');
    setIsApprovalSheetVisible(false);
    resetRun();
    setIsThreadsDrawerVisible(false);
  }

  function handleSelectThread(threadId: string) {
    setActiveThreadId(threadId);
    setIntent('');
    setIsApprovalSheetVisible(false);
    resetRun();
    setIsThreadsDrawerVisible(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      {/* Header - solid background */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 0) + spacing.md }]}>
        <View style={styles.headerContent}>

          <View style={styles.headerTopRow}>
            <Pressable
              style={styles.headerIconButton}
              onPress={handleOpenThreadsDrawer}
              accessibilityLabel="Open conversations"
            >
              <MaterialCommunityIcons name="menu" size={18} color={colors.foreground} />
            </Pressable>

            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons
                name="hexagon-multiple"
                size={18}
                color={colors.primaryLight}
                style={{ marginRight: spacing.xs }}
              />
              <Text variant="h4" style={styles.headerTitleText}>Kawula</Text>
            </View>

            <Pressable
              style={styles.headerIconButton}
              onPress={() => navigation.navigate("Policy")}
              accessibilityLabel="Open policy"
            >
              <MaterialCommunityIcons name="shield-check" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          <Pressable
            style={styles.walletChip}
            onPress={() => navigation.navigate("Profile")}
            accessibilityLabel="Open profile"
          >
            <View style={styles.walletIdentity}>
              <View style={[styles.walletStatusDot, { backgroundColor: selectedAccount ? colors.success : colors.error }]} />
              <View>
                <Text style={styles.walletLabel}>Profile Wallet</Text>
                <Text style={styles.walletChipText}>{shortPubkey}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.foregroundMuted} />
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
          <View style={styles.historyMessagesContainer}>
            {persistedHistoryPreview.map((message) => {
              if (message.role === 'user') {
                return (
                  <View key={message.id} style={styles.userBubbleContainer}>
                    <View style={styles.userCardHeader}>
                      <Text style={styles.userLabel}>YOU</Text>
                      <MaterialCommunityIcons name="account" size={16} color={colors.foregroundMuted} />
                    </View>
                    <View style={styles.userBubble}>
                      <Text style={styles.userMessageText}>{message.content}</Text>
                    </View>
                  </View>
                );
              }

              return (
                <Card key={message.id} style={styles.agentCard}>
                  <View style={styles.agentCardHeader}>
                    <MaterialCommunityIcons name="brain" size={18} color={colors.primaryLight} />
                    <Text style={styles.agentLabel}>Kawula ANALYSIS</Text>
                  </View>
                  <Text style={styles.agentMessageText}>{message.content}</Text>
                </Card>
              );
            })}
          </View>
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



        {runState === 'rejected' && rejectedRecoveryMessage && (
          <Card variant="outline" style={styles.fallbackCard}>
            <MaterialCommunityIcons name="lifebuoy" size={28} color={colors.primary} />
            <Text style={styles.fallbackTitle}>Let&apos;s recover</Text>
            <Text style={styles.agentMessageText}>{rejectedRecoveryMessage}</Text>
            {recoveryActions.length > 0 && (
              <View style={styles.recoveryActionsContainer}>
                {recoveryActions.map((action, index) => (
                  <Button
                    key={action.id ?? `${action.type}-${index}`}
                    onPress={() => {
                      void handleRecoveryAction(action);
                    }}
                    style={styles.fallbackButton}
                  >
                    {action.label ?? 'Try suggested action'}
                  </Button>
                ))}
              </View>
            )}
          </Card>
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
            editable={!isRunning && !isSigning && !showApproval}
            onSubmitEditing={handleSend}
            leftIcon={<MaterialCommunityIcons name="microphone" size={20} color={colors.foregroundMuted} />}
          />
          <Pressable
            onPress={handleSend}
            disabled={isRunning || isSigning || showApproval || !intent.trim()}
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

      {isThreadsDrawerVisible && (
        <View style={styles.threadsDrawerOverlay}>
          <View style={[styles.threadsDrawerPanel, { paddingTop: insets.top + spacing.md }]}>
            <View style={styles.threadsDrawerHeader}>
              <Text variant="h4">Conversations</Text>
              <Pressable style={styles.threadsDrawerCloseButton} onPress={handleCloseThreadsDrawer}>
                <MaterialCommunityIcons name="close" size={18} color={colors.foreground} />
              </Pressable>
            </View>

            <Button onPress={handleStartNewThread} style={styles.threadsDrawerNewChatButton}>
              New Chat
            </Button>

            {isConversationThreadsLoading ? (
              <View style={styles.threadsDrawerEmptyState}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text variant="muted">Loading conversations...</Text>
              </View>
            ) : conversationThreadsError ? (
              <View style={styles.threadsDrawerEmptyState}>
                <Text style={styles.threadsDrawerErrorText}>Failed to load conversations</Text>
              </View>
            ) : (conversationThreads ?? []).length === 0 ? (
              <View style={styles.threadsDrawerEmptyState}>
                <Text variant="muted">No saved conversations yet.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.threadsDrawerListContent}>
                {(conversationThreads ?? []).map((thread) => {
                  const isActiveThread = thread.id === activeThreadId;

                  return (
                    <Pressable
                      key={thread.id}
                      onPress={() => handleSelectThread(thread.id)}
                      style={({ pressed }) => [
                        styles.threadsDrawerRow,
                        isActiveThread && styles.threadsDrawerRowActive,
                        pressed && styles.threadsDrawerRowPressed,
                      ]}
                    >
                      <Text style={styles.threadsDrawerTitle}>{thread.title}</Text>
                      <Text variant="muted" style={styles.threadsDrawerMeta}>
                        Updated {formatThreadUpdatedAt(thread.updatedAt)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
          <Pressable style={styles.threadsDrawerBackdrop} onPress={handleCloseThreadsDrawer} />
        </View>
      )}

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
    gap: spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    minHeight: 34,
  },
  headerTitleText: {
    letterSpacing: 1.5,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  walletIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  walletLabel: {
    color: colors.foregroundMuted,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  walletChipText: {
    color: colors.foreground,
    fontSize: typography.sizeXs,
    fontFamily: typography.fontMono,
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
  recoveryActionsContainer: {
    gap: spacing.xs,
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
  threadsDrawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  threadsDrawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  threadsDrawerPanel: {
    width: '84%',
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  threadsDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadsDrawerCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundTertiary,
  },
  threadsDrawerNewChatButton: {
    marginTop: spacing.xs,
  },
  threadsDrawerEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  threadsDrawerErrorText: {
    color: colors.error,
    fontSize: typography.sizeSm,
    textAlign: 'center',
  },
  threadsDrawerListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  threadsDrawerRow: {
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  threadsDrawerRowActive: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.primaryMuted,
  },
  threadsDrawerRowPressed: {
    opacity: 0.85,
  },
  threadsDrawerTitle: {
    color: colors.foreground,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  threadsDrawerMeta: {
    fontSize: typography.sizeXs,
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
