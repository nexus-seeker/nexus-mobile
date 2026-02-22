import React, { useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Button, Text, Card } from '../components/ui';
import { useMobileWallet } from '../utils/useMobileWallet';
import { useAuthorization } from '../utils/useAuthorization';

interface WalletConnectScreenProps {
    onConnected: () => void;
}

export function WalletConnectScreen({ onConnected }: WalletConnectScreenProps) {
    const wallet = useMobileWallet();
    const { selectedAccount } = useAuthorization();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    // If already connected, skip
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
                            <Text style={styles.featureIcon}>🤖</Text>
                            <View style={styles.featureText}>
                                <Text variant="h4">Natural Language DeFi</Text>
                                <Text variant="muted" style={styles.featureDesc}>
                                    Just say what you want — NEXUS handles the rest
                                </Text>
                            </View>
                        </View>
                        <View style={styles.featureRow}>
                            <Text style={styles.featureIcon}>🔐</Text>
                            <View style={styles.featureText}>
                                <Text variant="h4">On-chain Policy Guard</Text>
                                <Text variant="muted" style={styles.featureDesc}>
                                    Set daily limits + protocol allowlists that enforce atomically
                                </Text>
                            </View>
                        </View>
                        <View style={styles.featureRow}>
                            <Text style={styles.featureIcon}>📱</Text>
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
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontWeight: '900',
        letterSpacing: 6,
        color: '#e2e8f0',
    },
    subtitle: {
        color: '#94a3b8',
        marginTop: 8,
    },
    featureCard: {
        width: '100%',
        borderRadius: 20,
        backgroundColor: '#1e293b',
        marginBottom: 32,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
    },
    featureIcon: {
        fontSize: 24,
        width: 32,
        textAlign: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureDesc: {
        color: '#94a3b8',
        marginTop: 2,
    },
    connectButton: {
        width: '100%',
        borderRadius: 14,
    },
    hint: {
        color: '#64748b',
        marginTop: 12,
        textAlign: 'center',
    },
    errorText: {
        color: '#ef4444',
        marginTop: 8,
        textAlign: 'center',
    },
});
