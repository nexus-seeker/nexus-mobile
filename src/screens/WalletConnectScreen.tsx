import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Button, Text, Card } from '../components/ui';
import { useMobileWallet } from '../utils/useMobileWallet';
import { useAuthorization } from '../utils/useAuthorization';
import { colors, spacing, radii, typography } from '../theme/shadcn-theme';

interface WalletConnectScreenProps {
    onConnected: () => void;
}

export function WalletConnectScreen({ onConnected }: WalletConnectScreenProps) {
    const wallet = useMobileWallet();
    const { selectedAccount } = useAuthorization();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If already connected (e.g. app relaunch), proceed immediately
    useEffect(() => {
        if (selectedAccount) {
            onConnected();
        }
    }, [selectedAccount, onConnected]);

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            await wallet.connect();
            onConnected();
        } catch (err: any) {
            setError(err.message || 'Connection failed');
        } finally {
            setIsConnecting(false);
        }
    };

    if (selectedAccount) {
        return null;
    }

    return (
        <View style={styles.screen}>
            <View style={styles.content}>
                {/* Logo / Title */}
                <View style={styles.header}>
                    <Text variant="h2" style={styles.title}>
                        NEXUS
                    </Text>
                    <Text variant="lead" style={styles.subtitle}>
                        AI Agent OS for Solana Mobile
                    </Text>
                </View>

                {/* Feature highlights */}
                <Card style={styles.featureCard}>
                    <Card.Content>
                        <View style={styles.featureRow}>
                            <Image
                                source={require('../../assets/images/feature_robot.png')}
                                style={styles.featureImage}
                            />
                            <View style={styles.featureText}>
                                <Text variant="h4">Natural Language DeFi</Text>
                                <Text variant="muted" style={styles.featureDesc}>
                                    Just say what you want — NEXUS handles the rest
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.featureRow}>
                            <Image
                                source={require('../../assets/images/feature_shield.png')}
                                style={styles.featureImage}
                            />
                            <View style={styles.featureText}>
                                <Text variant="h4">On-chain Policy Guard</Text>
                                <Text variant="muted" style={styles.featureDesc}>
                                    Set daily limits + protocol allowlists that enforce atomically
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.featureRow}>
                            <Image
                                source={require('../../assets/images/feature_fingerprint.png')}
                                style={styles.featureImage}
                            />
                            <View style={styles.featureText}>
                                <Text variant="h4">Seed Vault Security</Text>
                                <Text variant="muted" style={styles.featureDesc}>
                                    Every transaction confirmed with your fingerprint
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Connect button */}
                <Button
                    onPress={handleConnect}
                    loading={isConnecting}
                    disabled={isConnecting}
                    style={styles.connectButton}
                    size="lg"
                >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>

                <Text variant="small" style={styles.hint}>
                    Requires a Solana mobile wallet (Seed Vault recommended)
                </Text>

                {error && (
                    <Text variant="small" style={styles.errorText}>
                        {error}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing['2xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing['3xl'],
    },
    title: {
        fontWeight: typography.weightBold,
        letterSpacing: 6,
        color: colors.foreground,
    },
    subtitle: {
        color: colors.foregroundMuted,
        marginTop: spacing.sm,
    },
    featureCard: {
        width: '100%',
        borderRadius: radii['2xl'],
        backgroundColor: 'rgba(24, 24, 27, 0.4)',
        borderColor: colors.border,
        borderWidth: 1,
        marginBottom: spacing['3xl'],
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        paddingVertical: spacing.md,
    },
    featureImage: {
        width: 56,
        height: 56,
        borderRadius: radii.md,
        backgroundColor: colors.backgroundTertiary,
        borderWidth: 1,
        borderColor: colors.borderStrong,
    },
    featureText: {
        flex: 1,
    },
    featureDesc: {
        color: colors.foregroundMuted,
        marginTop: 2,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    connectButton: {
        width: '100%',
        borderRadius: radii.xl,
    },
    hint: {
        color: colors.foregroundMuted,
        marginTop: spacing.lg,
        textAlign: 'center',
    },
    errorText: {
        color: colors.error,
        marginTop: spacing.md,
        textAlign: 'center',
    },
});
