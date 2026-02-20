import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { ellipsify } from "../utils/ellipsify";

export function ProfileScreen() {
  const { selectedAccount } = useAuthorization();
  const wallet = useMobileWallet();
  const [isBusy, setIsBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const seekerId = useMemo(
    () => (selectedAccount ? `${ellipsify(selectedAccount.publicKey.toBase58(), 6)}.skr` : "Not connected"),
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
      setStatusText(
        error instanceof Error ? error.message : "Disconnect failed."
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Agent Profile</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Wallet session, Seeker identity signal, and perk flags.
          </Text>

          <Chip icon={selectedAccount ? "shield-account" : "shield-off"}>
            {selectedAccount ? "Connected" : "Disconnected"}
          </Chip>

          <View style={styles.metaRow}>
            <Text variant="titleSmall">Seeker ID</Text>
            <Text>{seekerId}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text variant="titleSmall">Genesis perks</Text>
            <Text>Pending on-chain check</Text>
          </View>

          {!selectedAccount ? (
            <Button
              mode="contained"
              onPress={onConnect}
              disabled={isBusy}
              loading={isBusy}
              style={styles.actionButton}
            >
              Connect wallet
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={onDisconnect}
              disabled={isBusy}
              loading={isBusy}
              style={styles.actionButton}
            >
              Disconnect wallet
            </Button>
          )}

          {statusText ? (
            <Text style={styles.statusText} variant="bodySmall">
              {statusText}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
  },
  metaRow: {
    marginTop: 12,
  },
  actionButton: {
    marginTop: 16,
  },
  statusText: {
    marginTop: 10,
    color: "#475569",
  },
});
