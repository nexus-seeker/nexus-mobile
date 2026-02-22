import React, { useMemo, useState } from "react";
import { StyleSheet, View, Pressable, ScrollView, Clipboard } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { ellipsify } from "../utils/ellipsify";
import { colors, spacing, radii, shadows, typography } from "../theme/shadcn-theme";

// Gradient Button Component
function GradientButton({
  onPress,
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
}: {
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const gradientColors = {
    primary: colors.gradientPrimary,
    secondary: [colors.backgroundTertiary, colors.backgroundTertiary] as const,
    danger: colors.gradientError,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#444', '#444'] : gradientColors[variant]}
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

// Info Card Component
function InfoCard({
  icon,
  label,
  value,
  copyable = false,
}: {
  icon: string;
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    if (copyable) {
      Clipboard.setString(value);
    }
  };

  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={20} color={colors.primaryLight} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Pressable onPress={copyable ? handleCopy : undefined} style={styles.valueContainer}>
          <Text style={styles.infoValue}>{value}</Text>
          {copyable && (
            <MaterialCommunityIcons name="content-copy" size={14} color={colors.foregroundMuted} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

// Status Badge
function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <View style={[styles.statusBadge, connected ? styles.statusConnected : styles.statusDisconnected]}>
      <View style={[styles.statusDot, { backgroundColor: connected ? colors.success : colors.error }]} />
      <Text style={[styles.statusText, { color: connected ? colors.success : colors.error }]}>
        {connected ? 'Connected' : 'Disconnected'}
      </Text>
    </View>
  );
}

export function ProfileScreen() {
  const { selectedAccount } = useAuthorization();
  const wallet = useMobileWallet();
  const [isBusy, setIsBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const seekerId = useMemo(
    () => (selectedAccount ? `${ellipsify(selectedAccount.publicKey.toBase58(), 6)}.skr` : "Not connected"),
    [selectedAccount]
  );

  const publicKey = useMemo(
    () => selectedAccount?.publicKey.toBase58() || "",
    [selectedAccount]
  );

  const onConnect = async () => {
    setIsBusy(true);
    setStatusText(null);

    try {
      await wallet.connect();
      setStatusText("Wallet connected via MWA.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Connect failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const onDisconnect = async () => {
    setIsBusy(true);
    setStatusText(null);

    try {
      await wallet.disconnect();
      setStatusText("Wallet disconnected.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Disconnect failed.");
    } finally {
      setIsBusy(false);
    }
  };

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
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={colors.gradientSurface}
              style={styles.avatarGradient}
            >
              <MaterialCommunityIcons
                name={selectedAccount ? "account-circle" : "account-circle-outline"}
                size={48}
                color={colors.foreground}
              />
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>Agent Profile</Text>
          <ConnectionStatus connected={!!selectedAccount} />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Wallet Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Information</Text>

          {selectedAccount ? (
            <>
              <InfoCard
                icon="wallet"
                label="Public Key"
                value={ellipsify(publicKey, 12)}
                copyable
              />
              <InfoCard
                icon="identifier"
                label="Seeker ID"
                value={seekerId}
                copyable
              />
            </>
          ) : (
            <View style={styles.connectPrompt}>
              <LinearGradient
                colors={colors.gradientSurface}
                style={styles.connectIconBg}
              >
                <MaterialCommunityIcons name="wallet-outline" size={32} color={colors.primaryLight} />
              </LinearGradient>
              <Text style={styles.connectTitle}>Connect Your Wallet</Text>
              <Text style={styles.connectSubtitle}>
                Connect your Solana wallet to access all NEXUS features
              </Text>
            </View>
          )}
        </View>

        {/* Genesis Perks Section */}
        {selectedAccount && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genesis Perks</Text>
            <View style={styles.perksCard}>
              <View style={styles.perkItem}>
                <View style={styles.perkIconContainer}>
                  <MaterialCommunityIcons name="crown" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={styles.perkName}>Genesis Member</Text>
                  <Text style={styles.perkStatus}>Pending on-chain verification</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!selectedAccount ? (
            <GradientButton
              onPress={onConnect}
              loading={isBusy}
              disabled={isBusy}
              variant="primary"
            >
              Connect Wallet
            </GradientButton>
          ) : (
            <GradientButton
              onPress={onDisconnect}
              loading={isBusy}
              disabled={isBusy}
              variant="danger"
            >
              Disconnect Wallet
            </GradientButton>
          )}
        </View>

        {/* Status Message */}
        {statusText && (
          <View style={styles.statusContainer}>
            <MaterialCommunityIcons
              name={statusText.includes("failed") ? "alert-circle" : "information"}
              size={16}
              color={statusText.includes("failed") ? colors.error : colors.primaryLight}
            />
            <Text style={[
              styles.messageStatusText,
              statusText.includes("failed") && styles.messageStatusTextError
            ]}>
              {statusText}
            </Text>
          </View>
        )}

        {/* Info Footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.foregroundMuted} />
          <Text style={styles.footerText}>
            Your wallet connection is secured by Mobile Wallet Adapter
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii['2xl'],
    borderBottomRightRadius: radii['2xl'],
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  headerTitle: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.foreground,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    marginTop: spacing.sm,
  },
  statusConnected: {
    backgroundColor: colors.successMuted,
  },
  statusDisconnected: {
    backgroundColor: colors.errorMuted,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primaryLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
    marginBottom: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoValue: {
    fontSize: typography.sizeSm,
    color: colors.foreground,
    fontFamily: typography.fontMono,
    fontWeight: typography.weightMedium,
  },
  connectPrompt: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  connectIconBg: {
    width: 64,
    height: 64,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  connectTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.foreground,
  },
  connectSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  perksCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  perkName: {
    fontSize: typography.sizeBase,
    fontWeight: typography.weightMedium,
    color: colors.foreground,
  },
  perkStatus: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
    marginTop: 2,
  },
  actionSection: {
    marginTop: spacing.md,
  },
  button: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    overflow: 'hidden',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  messageStatusText: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
    flex: 1,
  },
  messageStatusTextError: {
    color: colors.error,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
    textAlign: 'center',
  },
});
