import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  HelperText,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { usePolicy } from "../contexts/PolicyContext";
import { type PolicyProtocol } from "../features/policy/policy-engine";

export function PolicyScreen() {
  const {
    policy,
    isReady,
    isSaving,
    lastError,
    lastSyncSignature,
    savePolicy,
    clearPolicyError,
  } = usePolicy();

  const [dailyLimitSol, setDailyLimitSol] = useState(String(policy.dailyLimitSol));
  const [allowedJupiter, setAllowedJupiter] = useState(
    policy.allowedProtocols.includes("JUPITER")
  );
  const [allowedTransfers, setAllowedTransfers] = useState(
    policy.allowedProtocols.includes("SPL_TRANSFER")
  );
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDailyLimitSol(String(policy.dailyLimitSol));
    setAllowedJupiter(policy.allowedProtocols.includes("JUPITER"));
    setAllowedTransfers(policy.allowedProtocols.includes("SPL_TRANSFER"));
  }, [policy]);

  const parsedDailyLimit = useMemo(
    () => Number.parseFloat(dailyLimitSol),
    [dailyLimitSol]
  );

  const isLimitInvalid = !Number.isFinite(parsedDailyLimit) || parsedDailyLimit < 0;

  const onSavePolicy = async () => {
    clearPolicyError();
    setLastSuccess(null);

    if (isLimitInvalid) {
      return;
    }

    const allowedProtocols: PolicyProtocol[] = [];

    if (allowedJupiter) {
      allowedProtocols.push("JUPITER");
    }

    if (allowedTransfers) {
      allowedProtocols.push("SPL_TRANSFER");
    }

    const result = await savePolicy({
      dailyLimitSol: parsedDailyLimit,
      allowedProtocols,
    });

    if (result.ok) {
      setLastSuccess("Policy saved and synced to chain.");
      return;
    }

    if (!result.synced && !result.error) {
      setLastSuccess("Policy saved locally, chain sync is pending.");
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator animating />
        <Text>Loading policy...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Permission Vault</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Biometric confirmation is required for every policy change.
          </Text>

          <TextInput
            mode="outlined"
            label="Daily spend limit (SOL)"
            value={dailyLimitSol}
            onChangeText={setDailyLimitSol}
            keyboardType="decimal-pad"
          />
          <HelperText type="error" visible={isLimitInvalid}>
            Enter a valid non-negative SOL limit.
          </HelperText>

          <View style={styles.protocolRow}>
            <View>
              <Text variant="titleMedium">Allow Jupiter swaps</Text>
              <Text variant="bodySmall">Enable swap actions through Jupiter</Text>
            </View>
            <Switch value={allowedJupiter} onValueChange={setAllowedJupiter} />
          </View>

          <View style={styles.protocolRow}>
            <View>
              <Text variant="titleMedium">Allow SPL transfers</Text>
              <Text variant="bodySmall">Enable token transfer actions</Text>
            </View>
            <Switch value={allowedTransfers} onValueChange={setAllowedTransfers} />
          </View>

          <Button
            mode="contained"
            onPress={onSavePolicy}
            loading={isSaving}
            disabled={isSaving || isLimitInvalid}
            style={styles.saveButton}
          >
            Save policy
          </Button>

          <HelperText type="error" visible={Boolean(lastError)}>
            {lastError}
          </HelperText>
          <HelperText type="info" visible={Boolean(lastSuccess)}>
            {lastSuccess}
          </HelperText>
          <HelperText type="info" visible={Boolean(lastSyncSignature)}>
            Last sync signature: {lastSyncSignature}
          </HelperText>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  card: {
    borderRadius: 16,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
  },
  protocolRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  saveButton: {
    marginTop: 16,
  },
});
