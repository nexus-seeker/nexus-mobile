import React from 'react';
import { StyleSheet, View, Modal as RNModal } from 'react-native';
import { Button, Text, Card, Separator } from './ui';
import type { AgentRunResult } from '../services/agent/agent-api';
import { colors, spacing } from '../theme/shadcn-theme';

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
        <RNModal
            visible={visible}
            onRequestClose={onCancel}
            transparent
            animationType="slide"
        >
            <View style={styles.overlay}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="h3" style={styles.title}>
                            Approve Transaction
                        </Text>

                        <Separator style={styles.divider} />

                        {/* Summary */}
                        <View style={styles.summaryRow}>
                            <Text variant="muted" style={styles.summaryLabel}>
                                Action
                            </Text>
                            <Text variant="p" style={styles.summaryValue}>
                                {lastStep?.label || 'Transaction ready'}
                            </Text>
                        </View>

                        {/* Simulation Results */}
                        {simulation && (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text variant="muted" style={styles.summaryLabel}>
                                        Estimated output
                                    </Text>
                                    <Text variant="p" style={styles.summaryValue}>
                                        {(simulation.outAmount / 1e6).toFixed(2)} USDC
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text variant="muted" style={styles.summaryLabel}>
                                        Price impact
                                    </Text>
                                    <Text variant="p" style={styles.summaryValue}>
                                        {simulation.priceImpact}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text variant="muted" style={styles.summaryLabel}>
                                        Network fee
                                    </Text>
                                    <Text variant="p" style={styles.summaryValue}>
                                        {(simulation.fee / 1e9).toFixed(6)} SOL
                                    </Text>
                                </View>
                            </>
                        )}

                        <Separator style={styles.divider} />

                        <Text variant="small" style={styles.hint}>
                            Seed Vault will ask for fingerprint confirmation
                        </Text>

                        <View style={styles.buttonRow}>
                            <Button
                                variant="outline"
                                onPress={onCancel}
                                style={styles.button}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onPress={onApprove}
                                style={styles.button}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                Approve with Seed Vault
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            </View>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    card: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingBottom: 16,
        backgroundColor: colors.backgroundSecondary,
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
