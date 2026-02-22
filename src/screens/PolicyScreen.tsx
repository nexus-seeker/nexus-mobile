import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Pressable, Switch } from "react-native";
import { Text, TextInput, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePolicy } from "../contexts/PolicyContext";
import { type PolicyProtocol } from "../features/policy/policy-engine";
import { colors, spacing, radii, shadows, typography } from "../theme/shadcn-theme";

// Glass Card Component
function GlassCard({ children, style, accent }: { children: React.ReactNode; style?: any; accent?: boolean }) {
  return (
    <View style={[styles.glassCard, accent && styles.glassCardAccent, style]}>
      {children}
    </View>
  );
}

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

// Gradient Button
function GradientButton({
  onPress,
  children,
  loading = false,
  disabled = false,
}: {
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#444', '#444'] : colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : (
        <Text style={styles.buttonText}>{children}</Text>
      )}
    </Pressable>
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
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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

  useEffect(() => {
    setDailyLimitSol(String(policy.dailyLimitSol));
    setAllowedJupiter(policy.allowedProtocols.includes("JUPITER"));
    setAllowedTransfers(policy.allowedProtocols.includes("SPL_TRANSFER"));
    setIsActive(policy.isActive ?? true);
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
        <ActivityIndicator animating color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading policy...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="shield" size={32} color={colors.foreground} />
          <Text style={styles.headerTitle}>Permission Vault</Text>
          <Text style={styles.headerSubtitle}>
            Control your agent's permissions and limits
          </Text>
        </View>
      </LinearGradient>

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
      <GlassCard accent style={styles.policyCard}>
        {/* Daily Limit Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Daily Spend Limit (SOL)</Text>
          <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
            <TextInput
              mode="flat"
              value={dailyLimitSol}
              onChangeText={setDailyLimitSol}
              keyboardType="decimal-pad"
              style={styles.input}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              left={<TextInput.Icon icon="currency-usd" color={colors.foregroundMuted} />}
              theme={{
                colors: {
                  text: colors.foreground,
                  placeholder: colors.foregroundSubtle,
                },
              }}
            />
          </BlurView>
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
        <GradientButton
          onPress={onSavePolicy}
          loading={isSaving}
          disabled={isSaving || isLimitInvalid}
        >
          Save Policy
        </GradientButton>

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
            <Text style={styles.syncLabel}>Last Sync:</Text>
            <Text style={styles.syncSignature}>
              {lastSyncSignature.slice(0, 8)}...{lastSyncSignature.slice(-8)}
            </Text>
          </View>
        )}
      </GlassCard>

      {/* Info Card */}
      <GlassCard style={styles.infoCard}>
        <MaterialCommunityIcons name="information" size={20} color={colors.primaryLight} />
        <Text style={styles.infoText}>
          Policy changes require biometric authentication. Your policy is stored both
          locally and synced to the blockchain for transparency.
        </Text>
      </GlassCard>
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
    ...shadows.lg,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.foreground,
    marginTop: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.foreground,
    opacity: 0.8,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  statValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.foreground,
    marginTop: spacing.xs,
    fontFamily: typography.fontMono,
  },
  statLabel: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
    marginTop: spacing.xs,
  },
  glassCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  glassCardAccent: {
    borderColor: colors.primary,
    borderWidth: 1,
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
    color: colors.foregroundMuted,
  },
  inputBlur: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  input: {
    backgroundColor: colors.backgroundTertiary,
    height: 56,
    fontSize: typography.sizeLg,
    color: colors.foreground,
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
  button: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
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
    color: colors.foregroundMuted,
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
    backgroundColor: colors.glass,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
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
    color: colors.foregroundMuted,
    fontSize: typography.sizeBase,
  },
});
