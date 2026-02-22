import React from 'react';
import { FlatList, Linking, StyleSheet, View, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Text } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthorization } from '../utils/useAuthorization';
import { fetchReceipts, type ReceiptDto } from '../services/agent/agent-api';
import { colors, spacing, radii, shadows, typography } from '../theme/shadcn-theme';

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'Completed';
  return (
    <View style={[styles.statusBadge, isSuccess ? styles.statusSuccess : styles.statusError]}>
      <MaterialCommunityIcons
        name={isSuccess ? 'check-circle' : 'close-circle'}
        size={12}
        color={isSuccess ? colors.success : colors.error}
      />
      <Text style={[styles.statusText, { color: isSuccess ? colors.success : colors.error }]}>
        {isSuccess ? 'Success' : 'Failed'}
      </Text>
    </View>
  );
}

// Receipt Card Component
function ReceiptCard({ receipt }: { receipt: ReceiptDto }) {
  const isSuccess = receipt.status === 'Completed';
  const amountSol = (receipt.amountLamports / 1e9).toFixed(4);
  const date = new Date(receipt.timestamp * 1000);
  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const shortSig = receipt.txSignature
    ? `${receipt.txSignature.slice(0, 6)}...${receipt.txSignature.slice(-4)}`
    : null;

  const openSolscan = () => {
    if (receipt.txSignature) {
      Linking.openURL(
        `https://solscan.io/tx/${receipt.txSignature}?cluster=devnet`,
      );
    }
  };

  const getProtocolIcon = () => {
    switch (receipt.protocol.toLowerCase()) {
      case 'jupiter':
        return 'swap-horizontal';
      case 'spl_transfer':
        return 'send';
      default:
        return 'cube-outline';
    }
  };

  const getProtocolColor = () => {
    switch (receipt.protocol.toLowerCase()) {
      case 'jupiter':
        return colors.primary;
      case 'spl_transfer':
        return colors.secondary;
      default:
        return colors.foregroundMuted;
    }
  };

  return (
    <View style={[
      styles.receiptCard,
      { borderColor: isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)' }
    ]}>

      <View style={styles.receiptContent}>
        {/* Header */}
        <View style={styles.receiptHeader}>
          <View style={styles.receiptHeaderLeft}>
            <View style={[styles.protocolIcon, { backgroundColor: getProtocolColor() + '20' }]}>
              <MaterialCommunityIcons
                name={getProtocolIcon() as any}
                size={20}
                color={getProtocolColor()}
              />
            </View>
            <View>
              <Text style={styles.protocolText}>
                {receipt.protocol === 'jupiter' ? 'Swap' : 'Transfer'}
              </Text>
              <Text style={styles.timestampText}>
                {dateStr} · {timeStr}
              </Text>
            </View>
          </View>
          <StatusBadge status={receipt.status} />
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{amountSol}</Text>
          <Text style={styles.amountLabel}>SOL</Text>
        </View>

        {/* Footer */}
        <View style={styles.receiptFooter}>
          {receipt.seekerId && (
            <View style={styles.seekerChip}>
              <MaterialCommunityIcons name="account" size={12} color={colors.foregroundMuted} />
              <Text style={styles.seekerText}>{receipt.seekerId}</Text>
            </View>
          )}

          {shortSig && (
            <Pressable onPress={openSolscan} style={styles.solscanLink}>
              <MaterialCommunityIcons name="open-in-new" size={12} color={colors.primaryLight} />
              <Text style={styles.solscanText}>{shortSig}</Text>
            </Pressable>
          )}
        </View>

        {!isSuccess && receipt.status === 'Rejected' && (
          <View style={styles.rejectedBanner}>
            <MaterialCommunityIcons name="shield-off" size={14} color={colors.error} />
            <Text style={styles.rejectedText}>Policy enforcement rejected this transaction</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyOrb}>
        <MaterialCommunityIcons name="receipt" size={36} color={colors.primaryLight} />
      </View>
      <Text style={styles.emptyTitle}>No transactions yet.</Text>
      <Text style={styles.emptySubtitle}>
        Your first intent is waiting to be executed.
      </Text>
    </View>
  );
}

export function HistoryScreen() {
  const { selectedAccount } = useAuthorization();
  const pubkey = selectedAccount?.publicKey.toBase58();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {
    data: receipts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['receipts', pubkey],
    queryFn: () => fetchReceipts(pubkey!),
    enabled: !!pubkey,
    refetchInterval: 10_000,
  });

  if (!pubkey) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={colors.gradientSurface}
          style={styles.connectIconContainer}
        >
          <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.primaryLight} />
        </LinearGradient>
        <Text style={styles.connectTitle}>Connect your wallet</Text>
        <Text style={styles.connectSubtitle}>
          Connect a wallet to view your transaction history
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading receipts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIconContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
        </View>
        <Text style={styles.errorTitle}>Failed to load receipts</Text>
        <Text style={styles.errorSubtitle}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primaryMuted, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 0) + spacing.md }]}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="history" size={32} color={colors.foreground} />
          <Text style={styles.headerTitle}>Transaction History</Text>
          <Text style={styles.headerSubtitle}>
            {receipts?.length || 0} transactions
          </Text>
        </View>
      </LinearGradient>

      {/* Receipt List */}
      <FlatList
        data={receipts || []}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => <ReceiptCard receipt={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerContent: {
    alignItems: 'center',
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
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  receiptCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(24, 24, 27, 0.4)',
    borderWidth: 1,
  },
  receiptContent: {
    padding: spacing.lg,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protocolIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  protocolText: {
    fontSize: typography.sizeBase,
    fontWeight: typography.weightMedium,
    color: colors.foreground,
  },
  timestampText: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  statusSuccess: {
    backgroundColor: colors.successMuted,
  },
  statusError: {
    backgroundColor: colors.errorMuted,
  },
  statusText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  amountText: {
    fontSize: typography.size3xl,
    fontWeight: typography.weightBold,
    color: colors.foreground,
    fontFamily: typography.fontMono,
    includeFontPadding: false,
    lineHeight: 34,
  },
  amountLabel: {
    fontSize: typography.sizeLg,
    color: colors.foregroundMuted,
    marginLeft: spacing.xs,
    includeFontPadding: false,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  seekerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundTertiary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  seekerText: {
    fontSize: typography.sizeXs,
    color: colors.foregroundMuted,
  },
  solscanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  solscanText: {
    fontSize: typography.sizeXs,
    color: colors.primaryLight,
    fontFamily: typography.fontMono,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  rejectedText: {
    fontSize: typography.sizeXs,
    color: colors.error,
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  connectIconContainer: {
    width: 80,
    height: 80,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  connectTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.foreground,
    marginTop: spacing.md,
  },
  connectSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
    textAlign: 'center',
  },
  loadingText: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeBase,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorMuted,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.error,
  },
  errorSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyOrb: {
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
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.foreground,
  },
  emptySubtitle: {
    fontSize: typography.sizeSm,
    color: colors.foregroundMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
