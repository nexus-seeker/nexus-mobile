import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Modal, Portal, Text } from 'react-native-paper';
import type { AgentRunResult } from '../services/agent/agent-api';

interface ApprovalSheetProps {
    visible: boolean;
    result: AgentRunResult | null;
    isLoading: boolean;
    onApprove: () => void;
    onCancel: () => void;
}

export function ApprovalSheet({
    visible,
    result,
    isLoading,
    onApprove,
    onCancel,
}: ApprovalSheetProps) {
    if (!result) return null;

    const simulation = result.simulation;
    const lastStep = result.steps[result.steps.length - 1];

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onCancel}
                contentContainerStyle={styles.modal}
            >
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="headlineSmall" style={styles.title}>
                            Approve Transaction
                        </Text>

                        <Divider style={styles.divider} />

                        {/* Summary */}
                        <View style={styles.summaryRow}>
                            <Text variant="bodyMedium" style={styles.summaryLabel}>
                                Action
                            </Text>
                            <Text variant="bodyLarge" style={styles.summaryValue}>
                                {lastStep?.label || 'Transaction ready'}
                            </Text>
                        </View>

                        {/* Simulation Results */}
                        {simulation && (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                                        Estimated output
                                    </Text>
                                    <Text variant="bodyLarge" style={styles.summaryValue}>
                                        {(simulation.outAmount / 1e6).toFixed(2)} USDC
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                                        Price impact
                                    </Text>
                                    <Text variant="bodyLarge" style={styles.summaryValue}>
                                        {simulation.priceImpact}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                                        Network fee
                                    </Text>
                                    <Text variant="bodyLarge" style={styles.summaryValue}>
                                        {(simulation.fee / 1e9).toFixed(6)} SOL
                                    </Text>
                                </View>
                            </>
                        )}

                        <Divider style={styles.divider} />

                        <Text variant="bodySmall" style={styles.hint}>
                            Seed Vault will ask for fingerprint confirmation
                        </Text>

                        <View style={styles.buttonRow}>
                            <Button
                                mode="outlined"
                                onPress={onCancel}
                                style={styles.button}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={onApprove}
                                style={styles.button}
                                loading={isLoading}
                                disabled={isLoading}
                                icon="fingerprint"
                            >
                                Approve with Seed Vault
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    card: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingBottom: 16,
    },
    title: {
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    divider: {
        marginVertical: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    summaryLabel: {
        color: '#64748b',
    },
    summaryValue: {
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    hint: {
        textAlign: 'center',
        color: '#94a3b8',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    button: {
        flex: 1,
        borderRadius: 12,
    },
});
