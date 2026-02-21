import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Text,
  TextInput,
} from 'react-native-paper';
import { useAuthorization } from '../utils/useAuthorization';
import { useAgentRun } from '../hooks/useAgentRun';
import { StepCard } from '../components/StepCard';
import { ApprovalSheet } from '../components/ApprovalSheet';

const EXAMPLE_INTENT = 'Swap 0.1 SOL to USDC';

export function ChatScreen() {
  const { selectedAccount } = useAuthorization();
  const [intent, setIntent] = useState('');
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
    ? `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`
    : 'Not connected';

  async function handleSend() {
    const trimmed = intent.trim();
    if (!trimmed || runState === 'running') return;
    setIntent('');
    await executeIntent(trimmed);
  }

  const isRunning = runState === 'running';
  const showApproval = runState === 'awaiting_approval';
  const isSigning = runState === 'signing';

  return (
    <View style={styles.screen}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              NEXUS
            </Text>
            <Chip
              compact
              icon={selectedAccount ? 'check-circle' : 'alert-circle'}
              style={selectedAccount ? styles.connectedChip : styles.disconnectedChip}
            >
              {shortPubkey}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Chat Area */}
      <View style={styles.chatArea}>
        {/* Steps */}
        {steps.length > 0 && (
          <Card style={styles.agentCard}>
            <Card.Content>
              <Text variant="labelMedium" style={styles.agentLabel}>
                NEXUS Agent
              </Text>
              {steps.map((step, i) => (
                <StepCard key={`${step.node}-${i}`} step={step} index={i} />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Confirmed Signature */}
        {confirmedSig && (
          <Card style={styles.successCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.successTitle}>
                ✅ Transaction Confirmed
              </Text>
              <Text variant="bodySmall" style={styles.sigText}>
                {confirmedSig.slice(0, 20)}...{confirmedSig.slice(-8)}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Error */}
        {error && runState !== 'awaiting_approval' && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.errorTitle}>
                {runState === 'rejected' ? '❌ Policy Rejected' : '⚠️ Error'}
              </Text>
              <Text variant="bodyMedium">{error}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Approve Button */}
        {showApproval && (
          <Button
            mode="contained"
            icon="fingerprint"
            onPress={() => { }}
            style={styles.approveButton}
            contentStyle={styles.approveButtonContent}
          >
            Approve with Seed Vault ✋
          </Button>
        )}

        {/* Completed — retry */}
        {(runState === 'confirmed' || runState === 'rejected' || runState === 'error') && (
          <Button
            mode="text"
            onPress={resetRun}
            style={{ marginTop: 8 }}
          >
            New intent
          </Button>
        )}

        {/* Empty state */}
        {steps.length === 0 && runState === 'idle' && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleSmall">Ready for your intent</Text>
              <Text variant="bodyMedium" style={{ color: '#64748b' }}>
                Tell NEXUS what you want to do. Try &quot;{EXAMPLE_INTENT}&quot;
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          label="Type your intent..."
          value={intent}
          onChangeText={setIntent}
          placeholder={EXAMPLE_INTENT}
          style={styles.input}
          disabled={isRunning || isSigning}
          onSubmitEditing={handleSend}
        />
        <Button
          mode="contained"
          onPress={handleSend}
          loading={isRunning}
          disabled={isRunning || isSigning || !intent.trim()}
          style={styles.sendButton}
          icon="send"
        >
          {''}
        </Button>
      </View>

      {/* Approval Sheet */}
      <ApprovalSheet
        visible={showApproval}
        result={result}
        isLoading={isSigning}
        onApprove={approveTransaction}
        onCancel={resetRun}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: 2,
  },
  connectedChip: {
    backgroundColor: '#dcfce7',
  },
  disconnectedChip: {
    backgroundColor: '#fef3c7',
  },
  chatArea: {
    flex: 1,
    gap: 12,
  },
  agentCard: {
    borderRadius: 16,
  },
  agentLabel: {
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  successCard: {
    borderRadius: 16,
    backgroundColor: '#dcfce7',
  },
  successTitle: {
    color: '#166534',
    marginBottom: 4,
  },
  sigText: {
    color: '#15803d',
    fontFamily: 'monospace',
  },
  errorCard: {
    borderRadius: 16,
    backgroundColor: '#fef2f2',
  },
  errorTitle: {
    color: '#991b1b',
    marginBottom: 4,
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    marginTop: 24,
  },
  approveButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  approveButtonContent: {
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    borderRadius: 12,
    minWidth: 48,
  },
});
