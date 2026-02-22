import React, { useMemo, useState } from "react";
import { StyleSheet, View, Pressable, ScrollView, Clipboard, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { ellipsify } from "../utils/ellipsify";
import { Button, Card, Text, Badge } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme/shadcn-theme";

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
    <Card style={styles.infoCard}>
      <View style={styles.infoIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={20} color={colors.primaryLight} />
      </View>
      <View style={styles.infoContent}>
        <Text variant="small" style={styles.infoLabel}>{label}</Text>
        <Pressable onPress={copyable ? handleCopy : undefined} style={styles.valueContainer}>
          <Text variant="small" style={styles.infoValue}>{value}</Text>
          {copyable && (
            <MaterialCommunityIcons name="content-copy" size={14} color={colors.foregroundMuted} />
          )}
        </Pressable>
      </View>
    </Card>
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
      {/* Header - solid with border */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
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

      {/* Main Content */}
      <View style={styles.content}>
        {/* Wallet Info Section */}
        <View style={styles.section}>
          <Text variant="small" style={styles.sectionTitle}>Wallet Information</Text>

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
            <Card variant="outline" style={styles.connectPrompt}>
              <View style={styles.connectIconBg}>
                <MaterialCommunityIcons name="wallet-outline" size={32} color={colors.primaryLight} />
              </View>
              <Text variant="h4" style={styles.connectTitle}>Connect Your Wallet</Text>
              <Text variant="muted" style={styles.connectSubtitle}>
                Connect your Solana wallet to access all NEXUS features
              </Text>
            </Card>
          )}
        </View>

        {/* Genesis Perks Section */}
        {selectedAccount && (
          <View style={styles.section}>
            <Text variant="small" style={styles.sectionTitle}>Genesis Perks</Text>
            <Card>
              <Card.Content>
                <View style={styles.perkItem}>
                  <View style={styles.perkIconContainer}>
                    <MaterialCommunityIcons name="crown" size={20} color={colors.accent} />
                  </View>
                  <View>
                    <Text variant="p" style={styles.perkName}>Genesis Member</Text>
                    <Text variant="small" style={styles.perkStatus}>Pending on-chain verification</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!selectedAccount ? (
            <Button
              onPress={onConnect}
              loading={isBusy}
              disabled={isBusy}
              size="lg"
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              onPress={onDisconnect}
              loading={isBusy}
              disabled={isBusy}
              variant="destructive"
              size="lg"
            >
              Disconnect Wallet
            </Button>
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
            <Text
              variant="small"
              style={[
                styles.messageStatusText,
                statusText.includes("failed") && styles.messageStatusTextError
              ]}
            >
              {statusText}
            </Text>
          </View>
        )}

        {/* Info Footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.foregroundMuted} />
          <Text variant="small" style={styles.footerText}>
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
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.primaryLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: typography.weightSemibold,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
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
    color: colors.foregroundMuted,
    marginBottom: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoValue: {
    color: colors.foreground,
    fontFamily: typography.fontMono,
    fontWeight: typography.weightMedium,
  },
  connectPrompt: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderStyle: 'dashed',
  },
  connectIconBg: {
    width: 64,
    height: 64,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundTertiary,
  },
  connectTitle: {
    color: colors.foreground,
  },
  connectSubtitle: {
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
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
    color: colors.foreground,
    fontWeight: typography.weightMedium,
  },
  perkStatus: {
    color: colors.foregroundMuted,
    marginTop: 2,
  },
  actionSection: {
    marginTop: spacing.md,
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
    color: colors.foregroundMuted,
    textAlign: 'center',
  },
});
