import React, { useCallback, useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text } from '../components/ui';
import { colors, spacing, radii, typography } from '../theme/shadcn-theme';
import { useAuthorization } from '../utils/useAuthorization';
import { onboardWallet, broadcastOnboardTx } from '../services/agent/agent-api';
import { VersionedTransaction } from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

interface OnboardingScreenProps {
    onComplete: () => void;
}

type OnboardingState =
    | 'checking'   // auto-checking onboard status on mount
    | 'needed'     // not onboarded, waiting for user to tap button
    | 'signing'    // waiting for Seed Vault signature
    | 'confirming' // submitted, waiting for on-chain confirm
    | 'done'       // confirmed — auto-navigate
    | 'error';     // check or sign failed — show retry button

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const { selectedAccount, authorizeSession } = useAuthorization();

    const [uiState, setUiState] = useState<OnboardingState>('checking');
    const [error, setError] = useState<string | null>(null);

    // ─── Check onboarding status on mount ────────────────────────────

    useEffect(() => {
        let cancelled = false;

        async function checkStatus() {
            if (!selectedAccount) {
                onComplete();
                return;
            }

            setUiState('checking');
            setError(null);

            try {
                const pubkey = selectedAccount.publicKey.toBase58();
                const result = await onboardWallet(pubkey);

                if (cancelled) return;

                if (result.alreadyOnboarded) {
                    onComplete(); // already set up → go straight to app
                    return;
                }

                setUiState('needed');
            } catch (err: any) {
                if (cancelled) return;
                setError(err?.message ?? 'Could not reach the server. Make sure the API is running.');
                setUiState('error');
            }
        }

        void checkStatus();
        return () => { cancelled = true; };
    }, [selectedAccount, onComplete]);

    // ─── Setup flow: fetch tx → sign → confirm ───────────────────────

    const handleSetup = useCallback(async () => {
        if (!selectedAccount) return;
        setError(null);

        try {
            // Always fetch a fresh onboardTx when the user taps — never use stale state
            setUiState('checking');
            const pubkey = selectedAccount.publicKey.toBase58();
            const result = await onboardWallet(pubkey);

            if (result.alreadyOnboarded) {
                setUiState('done');
                setTimeout(onComplete, 800);
                return;
            }

            if (!result.onboardTx) {
                throw new Error('Server returned no transaction. Try again.');
            }

            setUiState('signing');

            const txBytes = Buffer.from(result.onboardTx, 'base64');
            const tx = VersionedTransaction.deserialize(txBytes);

            // Sign via Seed Vault — do NOT broadcast from the device
            // (device may not have direct devnet RPC access)
            let signedTxBase64: string = '';
            await transact(async (wallet) => {
                await authorizeSession(wallet);
                const [signed] = await wallet.signTransactions({ transactions: [tx] });
                signedTxBase64 = Buffer.from(signed.serialize()).toString('base64');
            });

            // Relay broadcast through the API server (which has confirmed devnet connectivity)
            setUiState('confirming');
            await broadcastOnboardTx(signedTxBase64);

            setUiState('done');
            setTimeout(onComplete, 1200);
        } catch (err: any) {
            setError(err?.message ?? 'Setup failed. Please retry.');
            setUiState('needed');
        }
    }, [selectedAccount, authorizeSession, onComplete]);

    // ─── Render: full-screen loading ─────────────────────────────────

    if (uiState === 'checking') {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text variant="muted" style={styles.statusText}>Checking wallet status…</Text>
            </View>
        );
    }

    if (uiState === 'done') {
        return (
            <View style={styles.centered}>
                <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
                <Text variant="h4" style={styles.statusText}>Wallet ready!</Text>
            </View>
        );
    }

    // ─── Render: setup required (or confirmation in-progress) ────────

    const isBusy = uiState === 'signing' || uiState === 'confirming';
    const busyLabel =
        uiState === 'confirming' ? 'Confirming on-chain…' : 'Waiting for signature…';

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="shield-account" size={48} color={colors.primary} />
                </View>
                <Text variant="h3" style={styles.title}>One-Time Setup</Text>
                <Text variant="muted" style={styles.subtitle}>
                    Your wallet needs a quick on-chain setup before the NEXUS agent can run.
                    This creates your Agent Profile and Policy Vault — secured by Seed Vault.
                </Text>
            </View>

            {/* What this does */}
            <Card style={styles.infoCard}>
                <StepRow
                    icon="account-plus"
                    title="Agent Profile"
                    description="Registers your wallet with the NEXUS on-chain program"
                />
                <View style={styles.divider} />
                <StepRow
                    icon="shield-check"
                    title="Policy Vault"
                    description="Sets your spending limits (1 SOL/day · Jupiter + Transfers)"
                />
            </Card>

            {/* CTA */}
            <View style={styles.ctaContainer}>
                <Button
                    onPress={() => void handleSetup()}
                    loading={isBusy}
                    disabled={isBusy}
                    size="lg"
                >
                    {isBusy ? busyLabel : uiState === 'error' ? 'Retry Setup' : 'Set Up Wallet'}
                </Button>

                {error && (
                    <View style={styles.errorBox}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <Text variant="muted" style={styles.hint}>
                    Sign 1 transaction via Seed Vault. Rent fee ~0.002 SOL.
                </Text>
            </View>
        </View>
    );
}

// ─── Sub-component ────────────────────────────────────────────────

function StepRow({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <View style={styles.stepRow}>
            <View style={styles.stepIcon}>
                <MaterialCommunityIcons name={icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text variant="muted" style={styles.stepDescription}>{description}</Text>
            </View>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
        paddingTop: 80,
        gap: spacing.xl,
    },
    centered: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
    },
    header: {
        alignItems: 'center',
        gap: spacing.md,
    },
    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: radii['2xl'],
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    title: {
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: spacing.md,
    },
    infoCard: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    stepIcon: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: colors.backgroundTertiary,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    stepText: {
        flex: 1,
        gap: 2,
    },
    stepTitle: {
        color: colors.foreground,
        fontWeight: typography.weightSemibold,
        fontSize: typography.sizeBase,
    },
    stepDescription: {
        fontSize: typography.sizeSm,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    ctaContainer: {
        gap: spacing.md,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.errorMuted,
        padding: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.sizeSm,
        flex: 1,
    },
    hint: {
        textAlign: 'center',
        fontSize: typography.sizeXs,
        lineHeight: 16,
        paddingHorizontal: spacing.md,
    },
    statusText: {
        marginTop: spacing.md,
        textAlign: 'center',
    },
});
