import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Switch, ActivityIndicator, Pressable, Platform, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePolicy } from "../contexts/PolicyContext";
import { type PolicyProtocol } from "../features/policy/policy-engine";
import { Button, Card, Input, Text } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme/shadcn-theme";

// Toggle Row Component
function ToggleRow({
  icon,
  imageUrl,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: {
  icon?: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.toggleRow,
        value && styles.toggleRowActive,
        disabled && { opacity: 0.5 }
      ]}
      onPress={() => !disabled && onValueChange(!value)}
    >
      <View style={styles.toggleRowLeft}>
        <View style={[styles.toggleIcon, value && styles.toggleIconActive]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.protocolLogo}
            />
          ) : (
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={value ? colors.foreground : colors.foregroundMuted}
            />
          )}
        </View>
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleSubtitle} numberOfLines={2}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.backgroundTertiary, true: colors.primary }}
        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (value ? '#FFFFFF' : colors.foregroundMuted)}
      />
    </Pressable>
  );
}

export function PolicyScreen() {
  const {
    policy,
    isReady,
    isSaving,
    lastError,
    lastSyncSignature,
    savePolicy,
    clearPolicyError,
  } = usePolicy();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [dailyLimitSol, setDailyLimitSol] = useState(String(policy.dailyLimitSol));
  const [allowedJupiter, setAllowedJupiter] = useState(
    policy.allowedProtocols.includes("JUPITER")
  );
  const [allowedTransfers, setAllowedTransfers] = useState(
    policy.allowedProtocols.includes("SPL_TRANSFER")
  );
  const [allowedMultiSend, setAllowedMultiSend] = useState(
    policy.allowedProtocols.includes("MULTI_SEND")
  );
  const [allowedMarinade, setAllowedMarinade] = useState(
    policy.allowedProtocols.includes("MARINADE")
  );
  const [isActive, setIsActive] = useState(policy.isActive ?? true);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  // Sync draft form state when policy context changes.
  useEffect(() => {
    setDailyLimitSol(String(policy.dailyLimitSol));
    setAllowedJupiter(policy.allowedProtocols.includes("JUPITER"));
    setAllowedTransfers(policy.allowedProtocols.includes("SPL_TRANSFER"));
    setAllowedMultiSend(policy.allowedProtocols.includes("MULTI_SEND"));
    setAllowedMarinade(policy.allowedProtocols.includes("MARINADE"));
    setIsActive(policy.isActive ?? true);
  }, [policy]);

  const parsedDailyLimit = useMemo(
    () => Number.parseFloat(dailyLimitSol),
    [dailyLimitSol]
  );

  const isLimitInvalid = !Number.isFinite(parsedDailyLimit) || parsedDailyLimit < 0;

  const draftProtocols = useMemo(() => {
    const protocols: PolicyProtocol[] = [];

    if (allowedJupiter) {
      protocols.push("JUPITER");
    }

    if (allowedTransfers) {
      protocols.push("SPL_TRANSFER");
    }

    if (allowedMultiSend) {
      protocols.push("MULTI_SEND");
    }

    if (allowedMarinade) {
      protocols.push("MARINADE");
    }

    return protocols;
  }, [allowedJupiter, allowedTransfers, allowedMultiSend, allowedMarinade]);

  const usagePercent = useMemo(() => {
    if (policy.dailyLimitSol <= 0) {
      return 0;
    }

    const ratio = (policy.dailySpentSol / policy.dailyLimitSol) * 100;
    return Math.max(0, Math.min(ratio, 100));
  }, [policy.dailyLimitSol, policy.dailySpentSol]);

  const usageLabel = policy.dailyLimitSol <= 0 ? "No cap set" : `${usagePercent.toFixed(1)}% used`;

  const hasChanges = useMemo(() => {
    if (isLimitInvalid) {
      return false;
    }

    const sameLimit = Math.abs(parsedDailyLimit - policy.dailyLimitSol) < 0.0001;
    const currentIsActive = policy.isActive ?? true;
    const draftKey = [...draftProtocols].sort().join("|");
    const currentKey = [...policy.allowedProtocols].sort().join("|");

    return !sameLimit || currentIsActive !== isActive || draftKey !== currentKey;
  }, [draftProtocols, isActive, isLimitInvalid, parsedDailyLimit, policy.allowedProtocols, policy.dailyLimitSol, policy.isActive]);

  const onSavePolicy = async () => {
    clearPolicyError();
    setLastSuccess(null);

    if (isLimitInvalid || !hasChanges) {
      return;
    }

    const result = await savePolicy({
      dailyLimitSol: parsedDailyLimit,
      allowedProtocols: draftProtocols,
      isActive,
    });

    if (result.ok) {
      setLastSuccess("Policy saved and synced to chain.");
      return;
    }

    if (!result.synced && !result.error) {
      setLastSuccess("Policy saved locally, chain sync is pending.");
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text variant="muted" style={styles.loadingText}>Loading policy...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 0) + spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.foreground} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text variant="h3">Policy Controls</Text>
          <Text variant="muted" style={styles.headerSubtitle}>
            Set safe spending boundaries for your agent.
          </Text>
        </View>
        <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgePaused]}>
          <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotPaused]} />
          <Text style={styles.statusBadgeText}>{isActive ? "Active" : "Paused"}</Text>
        </View>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryTitle}>Usage today</Text>
          <Text style={styles.summaryUsage}>{usageLabel}</Text>
        </View>
        <Text style={styles.summaryAmount}>
          {policy.dailySpentSol.toFixed(4)} / {Math.max(policy.dailyLimitSol, 0).toFixed(4)} SOL
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: usagePercent <= 0 ? "0%" : `${Math.max(usagePercent, 6)}%`,
              },
            ]}
          />
        </View>

        <View style={styles.summaryMetaRow}>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="shape-outline" size={14} color={colors.foregroundMuted} />
            <Text style={styles.metaChipText}>{draftProtocols.length} protocols enabled</Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="wallet-outline" size={14} color={colors.foregroundMuted} />
            <Text style={styles.metaChipText}>Daily cap {Math.max(policy.dailyLimitSol, 0).toFixed(2)} SOL</Text>
          </View>
        </View>
      </Card>

      <Card variant="outline" style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Daily spend limit</Text>
        <Text style={styles.sectionSubtitle}>
          Maximum SOL the agent can spend in a 24-hour window.
        </Text>
        <View style={styles.inputGroup}>
          <Input
            value={dailyLimitSol}
            onChangeText={setDailyLimitSol}
            keyboardType="decimal-pad"
            placeholder="0.00"
            icon={<MaterialCommunityIcons name="currency-usd" size={20} color={colors.foregroundMuted} />}
          />
          {isLimitInvalid ? (
            <Text style={styles.errorHelper}>Enter a valid non-negative SOL limit</Text>
          ) : (
            <Text style={styles.helperText}>Set to 0 only if you want a read-only safety mode.</Text>
          )}
        </View>
      </Card>

      <Card variant="outline" style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Allowed protocols</Text>
          <Text style={styles.sectionCounter}>{draftProtocols.length}/4</Text>
        </View>

        <ToggleRow
          icon="swap-horizontal"
          imageUrl="https://static.jup.ag/jup/icon.png"
          title="Jupiter Swaps"
          subtitle="Enable token swaps through Jupiter DEX"
          value={allowedJupiter}
          onValueChange={setAllowedJupiter}
        />

        <ToggleRow
          icon="send"
          imageUrl="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
          title="SPL Transfers"
          subtitle="Enable token transfers to other wallets"
          value={allowedTransfers}
          onValueChange={setAllowedTransfers}
        />

        <ToggleRow
          icon="account-group"
          title="Multi-Send"
          subtitle="Fan-out SOL to multiple recipients at once"
          value={allowedMultiSend}
          onValueChange={setAllowedMultiSend}
        />

        <ToggleRow
          icon="wave"
          imageUrl="https://docs.marinade.finance/~gitbook/image?url=https%3A%2F%2F2385969780-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FHvhBFBu5z7MIlkYpgMXs%252Fuploads%252FnClg7nXeO1Bwpi2IymQY%252FMNDE.png%3Falt%3Dmedia%26token%3D7ac16f64-668c-4b84-85a3-dd801552e031&width=768&dpr=3&quality=100&sign=ecb74eb5&sv=2"
          title="Marinade Staking"
          subtitle="Liquid stake SOL → mSOL via Marinade Finance"
          value={allowedMarinade}
          onValueChange={setAllowedMarinade}
        />
      </Card>

      <Card variant="outline" style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Emergency controls</Text>
        <Text style={styles.sectionSubtitle}>
          Pause all transaction execution instantly when needed.
        </Text>

        <View style={styles.killSwitchContainer}>
          <View style={styles.toggleRowLeft}>
            <View style={[styles.toggleIcon, !isActive && styles.toggleIconDanger]}>
              <MaterialCommunityIcons
                name={isActive ? "shield-check" : "shield-off"}
                size={20}
                color={isActive ? colors.success : colors.error}
              />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Policy active</Text>
              <Text style={styles.toggleSubtitle}>
                {isActive ? "Agent can execute allowed actions" : "All transaction execution blocked"}
              </Text>
            </View>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: colors.errorMuted, true: colors.successMuted }}
            thumbColor={colors.foreground}
          />
        </View>
      </Card>

      <Card variant="outline" style={styles.actionsCard}>
        <View style={styles.changeHintRow}>
          <MaterialCommunityIcons
            name={hasChanges ? "circle-edit-outline" : "check-decagram-outline"}
            size={16}
            color={hasChanges ? colors.warning : colors.success}
          />
          <Text style={[styles.changeHintText, { color: hasChanges ? colors.warning : colors.success }]}>
            {hasChanges ? "Unsaved changes" : "No changes yet"}
          </Text>
        </View>

        {lastError && (
          <View style={styles.messageError}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.messageErrorText}>{lastError}</Text>
          </View>
        )}

        {lastSuccess && (
          <View style={styles.messageSuccess}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.messageSuccessText}>{lastSuccess}</Text>
          </View>
        )}

        {lastSyncSignature && (
          <View style={styles.syncInfo}>
            <Text variant="muted" style={styles.syncLabel}>Last sync:</Text>
            <Text style={styles.syncSignature}>
              {lastSyncSignature.slice(0, 8)}...{lastSyncSignature.slice(-8)}
            </Text>
          </View>
        )}

        <Button
          testID="policy-save-button"
          onPress={onSavePolicy}
          loading={isSaving}
          disabled={isSaving || isLimitInvalid || !hasChanges}
          style={styles.saveButton}
        >
          {hasChanges ? "Save policy changes" : "No changes to save"}
        </Button>
      </Card>

      <Card style={styles.infoCard}>
        <MaterialCommunityIcons name="information-outline" size={20} color={colors.primaryLight} />
        <Text variant="muted" style={styles.infoText}>
          Policy changes require biometric authentication. Your policy is stored both
          locally and synced on-chain for transparency.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    borderRadius: radii['2xl'],
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backLabel: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
  },
  headerTitleBlock: {
    gap: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizeSm,
    lineHeight: 18,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  statusBadgePaused: {
    backgroundColor: colors.errorMuted,
    borderColor: colors.error,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  statusDotActive: {
    backgroundColor: colors.success,
  },
  statusDotPaused: {
    backgroundColor: colors.error,
  },
  statusBadgeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  summaryCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
  },
  summaryUsage: {
    fontSize: typography.sizeSm,
    color: colors.primaryLight,
    fontWeight: typography.weightSemibold,
  },
  summaryAmount: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    fontFamily: typography.fontMono,
    color: colors.foreground,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: colors.backgroundTertiary,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metaChipText: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
  },
  sectionCard: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: 'transparent',
  },
  sectionHeading: {
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
    color: colors.foreground,
  },
  sectionSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionCounter: {
    fontSize: typography.sizeXs,
    color: colors.primaryLight,
    fontWeight: typography.weightSemibold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  errorHelper: {
    color: colors.error,
    fontSize: typography.sizeSm,
  },
  helperText: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeSm,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  toggleRowActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  toggleRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleIconActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  toggleIconDanger: {
    backgroundColor: colors.errorMuted,
  },
  protocolLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
    color: colors.foreground,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
    lineHeight: 18,
  },
  killSwitchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsCard: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: 'transparent',
  },
  changeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  changeHintText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
  saveButton: {
    marginTop: spacing.xs,
  },
  messageError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.errorMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  messageErrorText: {
    color: colors.error,
    fontSize: typography.sizeSm,
    flex: 1,
  },
  messageSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.success,
  },
  messageSuccessText: {
    color: colors.success,
    fontSize: typography.sizeSm,
    flex: 1,
  },
  syncInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing.sm,
  },
  syncLabel: {
    fontSize: typography.sizeXs,
  },
  syncSignature: {
    fontSize: typography.sizeXs,
    color: colors.primaryLight,
    fontFamily: typography.fontMono,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.sizeBase,
  },
});
