import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Switch, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePolicy } from "../contexts/PolicyContext";
import { type PolicyProtocol } from "../features/policy/policy-engine";
import { Button, Card, Input, Text } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme/shadcn-theme";

// Toggle Row Component
function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleRowLeft}>
        <View style={[styles.toggleIcon, value && styles.toggleIconActive]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={value ? colors.foreground : colors.foregroundMuted}
          />
        </View>
        <View>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.toggleSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.backgroundTertiary, true: colors.primary }}
        thumbColor={value ? colors.foreground : colors.foregroundMuted}
      />
    </View>
  );
}

// Stat Card
function StatCard({
  icon,
  label,
  value,
  color = colors.primary,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card style={[styles.statCard, { borderColor: color + '40' }]}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
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

  const [dailyLimitSol, setDailyLimitSol] = useState(String(policy.dailyLimitSol));
  const [allowedJupiter, setAllowedJupiter] = useState(
    policy.allowedProtocols.includes("JUPITER")
  );
  const [allowedTransfers, setAllowedTransfers] = useState(
    policy.allowedProtocols.includes("SPL_TRANSFER")
  );
  const [isActive, setIsActive] = useState(policy.isActive ?? true);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  // Sync state when policy changes - deferred to avoid cascading render warning
  useEffect(() => {
    // Defer state updates to next tick to avoid synchronous setState during render
    const timeoutId = setTimeout(() => {
      setDailyLimitSol(String(policy.dailyLimitSol));
      setAllowedJupiter(policy.allowedProtocols.includes("JUPITER"));
      setAllowedTransfers(policy.allowedProtocols.includes("SPL_TRANSFER"));
      setIsActive(policy.isActive ?? true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [policy]);

  const parsedDailyLimit = useMemo(
    () => Number.parseFloat(dailyLimitSol),
    [dailyLimitSol]
  );

  const isLimitInvalid = !Number.isFinite(parsedDailyLimit) || parsedDailyLimit < 0;

  const onSavePolicy = async () => {
    clearPolicyError();
    setLastSuccess(null);

    if (isLimitInvalid) {
      return;
    }

    const allowedProtocols: PolicyProtocol[] = [];

    if (allowedJupiter) {
      allowedProtocols.push("JUPITER");
    }

    if (allowedTransfers) {
      allowedProtocols.push("SPL_TRANSFER");
    }

    const result = await savePolicy({
      dailyLimitSol: parsedDailyLimit,
      allowedProtocols,
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
    <ScrollView contentContainerStyle={styles.screen}>
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

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="wallet"
          label="Daily Limit"
          value={`${policy.dailyLimitSol} SOL`}
          color={colors.primary}
        />
        <StatCard
          icon="cash-minus"
          label="Spent Today"
          value={`${policy.dailySpentSol.toFixed(4)} SOL`}
          color={colors.secondary}
        />
        <StatCard
          icon="shield-check"
          label="Status"
          value={isActive ? "Active" : "Paused"}
          color={isActive ? colors.success : colors.error}
        />
      </View>

      {/* Main Policy Card */}
      <Card variant="outline" style={styles.policyCard}>
        {/* Daily Limit Input */}
        <View style={styles.inputGroup}>
          <Text variant="muted" style={styles.inputLabel}>Daily Spend Limit (SOL)</Text>
          <Input
            value={dailyLimitSol}
            onChangeText={setDailyLimitSol}
            keyboardType="decimal-pad"
            placeholder="0.00"
            icon={<MaterialCommunityIcons name="currency-usd" size={20} color={colors.foregroundMuted} />}
          />
          {isLimitInvalid && (
            <Text style={styles.errorHelper}>Enter a valid non-negative SOL limit</Text>
          )}
        </View>

        {/* Protocol Toggles */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Allowed Protocols</Text>
        </View>

        <ToggleRow
          icon="swap-horizontal"
          title="Jupiter Swaps"
          subtitle="Enable token swaps through Jupiter DEX"
          value={allowedJupiter}
          onValueChange={setAllowedJupiter}
        />

        <ToggleRow
          icon="send"
          title="SPL Transfers"
          subtitle="Enable token transfers to other wallets"
          value={allowedTransfers}
          onValueChange={setAllowedTransfers}
        />

        {/* Kill Switch */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Emergency Controls</Text>
        </View>

        <View style={styles.killSwitchContainer}>
          <View style={styles.toggleRowLeft}>
            <View style={[styles.toggleIcon, !isActive && styles.toggleIconDanger]}>
              <MaterialCommunityIcons
                name={isActive ? "shield-check" : "shield-off"}
                size={20}
                color={isActive ? colors.success : colors.error}
              />
            </View>
            <View>
              <Text style={styles.toggleTitle}>Policy Active</Text>
              <Text style={styles.toggleSubtitle}>
                {isActive ? "Agent can execute transactions" : "All transactions blocked"}
              </Text>
            </View>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: colors.error, true: colors.success }}
            thumbColor={colors.foreground}
          />
        </View>

        {/* Save Button */}
        <Button
          onPress={onSavePolicy}
          loading={isSaving}
          disabled={isSaving || isLimitInvalid}
          style={styles.saveButton}
        >
          Save Policy
        </Button>

        {/* Messages */}
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
            <Text variant="muted" style={styles.syncLabel}>Last Sync:</Text>
            <Text style={styles.syncSignature}>
              {lastSyncSignature.slice(0, 8)}...{lastSyncSignature.slice(-8)}
            </Text>
          </View>
        )}
      </Card>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <MaterialCommunityIcons name="information" size={20} color={colors.primaryLight} />
        <Text variant="muted" style={styles.infoText}>
          Policy changes require biometric authentication. Your policy is stored both
          locally and synced to the blockchain for transparency.
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
    borderRadius: radii.xl,
    padding: spacing.xl,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerContent: {
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    marginTop: spacing.xs,
    fontFamily: typography.fontMono,
  },
  statLabel: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
    marginTop: spacing.xs,
  },
  policyCard: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
  errorHelper: {
    color: colors.error,
    fontSize: typography.sizeSm,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primaryLight,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  toggleRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  toggleIconActive: {
    backgroundColor: colors.primary,
  },
  toggleIconDanger: {
    backgroundColor: colors.errorMuted,
  },
  toggleTitle: {
    fontSize: typography.sizeBase,
    fontWeight: typography.weightMedium,
    color: colors.foreground,
  },
  toggleSubtitle: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
    marginTop: 2,
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
  saveButton: {
    marginTop: spacing.md,
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
    justifyContent: "center",
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
    padding: spacing.lg,
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
