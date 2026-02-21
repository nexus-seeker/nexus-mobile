import React from 'react';
import { FlatList, Linking, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Chip, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuthorization } from '../utils/useAuthorization';
import { fetchReceipts, type ReceiptDto } from '../services/agent/agent-api';

function ReceiptCard({ receipt }: { receipt: ReceiptDto }) {
  const isSuccess = receipt.status === 'Completed';
  const amountSol = (receipt.amountLamports / 1e9).toFixed(4);
  const date = new Date(receipt.timestamp * 1000);
  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

  return (
    <Card style={[styles.card, !isSuccess && styles.rejectedCard]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium">
            {receipt.protocol === 'jupiter' ? 'Swap' : 'Transfer'}{' '}
            {amountSol} SOL
          </Text>
          <Text style={{ fontSize: 20 }}>{isSuccess ? '✅' : '❌'}</Text>
        </View>

        <View style={styles.chipRow}>
          <Chip compact icon="cube-outline">
            {receipt.protocol}
          </Chip>
          {receipt.seekerId ? (
            <Chip compact icon="account">
              {receipt.seekerId}
            </Chip>
          ) : null}
        </View>

        <Text variant="bodySmall" style={styles.dateText}>
          {dateStr} · {timeStr}
        </Text>

        {shortSig && (
          <Text
            variant="bodySmall"
            style={styles.solscanLink}
            onPress={openSolscan}
          >
            ↗ {shortSig} (Solscan)
          </Text>
        )}

        {!isSuccess && receipt.status === 'Rejected' && (
          <Text variant="bodySmall" style={styles.rejectedText}>
            Policy enforcement rejected this transaction
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

export function HistoryScreen() {
  const { selectedAccount } = useAuthorization();
  const pubkey = selectedAccount?.publicKey.toBase58();

  const {
    data: receipts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['receipts', pubkey],
    queryFn: () => fetchReceipts(pubkey!),
    enabled: !!pubkey,
    refetchInterval: 10_000, // Poll every 10 seconds per spec
  });

  if (!pubkey) {
    return (
      <View style={styles.centered}>
        <Text variant="titleMedium">Connect your wallet first</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating />
        <Text>Loading receipts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text variant="titleLarge" style={styles.title}>
        Receipts
      </Text>
      <FlatList
        data={receipts || []}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => <ReceiptCard receipt={item} />}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium">No receipts yet</Text>
              <Text variant="bodyMedium" style={styles.mutedText}>
                On-chain ExecutionReceipt PDAs will appear here after agent
                actions are executed.
              </Text>
            </Card.Content>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    marginBottom: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
  },
  rejectedCard: {
    backgroundColor: '#fef2f2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dateText: {
    marginTop: 8,
    color: '#64748b',
  },
  solscanLink: {
    marginTop: 4,
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  rejectedText: {
    marginTop: 4,
    color: '#dc2626',
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    marginTop: 24,
  },
  mutedText: {
    marginTop: 6,
    color: '#475569',
  },
});
