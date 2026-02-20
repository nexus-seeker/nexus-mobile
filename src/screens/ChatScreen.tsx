import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text, TextInput } from "react-native-paper";
import { parseSwapIntent } from "../features/agent/intent-parser";
import { usePolicy } from "../contexts/PolicyContext";

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
};

const EXAMPLE_INTENT = "Swap 0.1 SOL to USDC";

export function ChatScreen() {
  const [intent, setIntent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { evaluateAction, policy } = usePolicy();

  const remainingSol = useMemo(
    () => Math.max(policy.dailyLimitSol - policy.dailySpentSol, 0),
    [policy.dailyLimitSol, policy.dailySpentSol]
  );

  function submitIntent() {
    const trimmedIntent = intent.trim();

    if (!trimmedIntent) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: trimmedIntent,
    };

    const parsed = parseSwapIntent(trimmedIntent);
    let agentText =
      "I could not parse that intent yet. Try: 'Swap 0.1 SOL to USDC'.";

    if (parsed) {
      const evaluation = evaluateAction({
        amountSol: parsed.amountSol,
        protocol: parsed.protocol,
      });

      if (evaluation.allowed) {
        agentText = `Policy check passed. Ready to route ${parsed.amountSol} SOL -> ${parsed.toToken} via ${parsed.protocol}.`;
      } else {
        agentText = `Policy blocked this action: ${evaluation.reason ?? "Unknown policy reason."}`;
      }
    }

    const agentMessage: ChatMessage = {
      id: `${Date.now()}-agent`,
      role: "agent",
      text: agentText,
    };

    setMessages((current) => [agentMessage, userMessage, ...current]);
    setIntent("");
  }

  return (
    <View style={styles.screen}>
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text variant="titleMedium">Agent Chat</Text>
          <View style={styles.statusChips}>
            <Chip compact icon="shield-check">
              Daily remaining: {remainingSol.toFixed(3)} SOL
            </Chip>
            <Chip compact icon="lightning-bolt">
              Parser: swap intents
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          label="Intent"
          value={intent}
          onChangeText={setIntent}
          placeholder={EXAMPLE_INTENT}
          style={styles.input}
        />
        <Button mode="contained" onPress={submitIntent} style={styles.sendButton}>
          Send
        </Button>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={item.role === "user" ? styles.userBubble : styles.agentBubble}>
            <Card.Content>
              <Text variant="labelSmall">{item.role === "user" ? "You" : "Nexus"}</Text>
              <Text>{item.text}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyState}>
            <Card.Content>
              <Text variant="titleSmall">No intents yet</Text>
              <Text variant="bodyMedium">
                Submit a swap intent to test policy evaluation in-app.
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
    gap: 12,
  },
  statusCard: {
    borderRadius: 16,
  },
  statusChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
  },
  sendButton: {
    borderRadius: 10,
  },
  userBubble: {
    marginBottom: 8,
    backgroundColor: "#dbeafe",
  },
  agentBubble: {
    marginBottom: 8,
    backgroundColor: "#ecfeff",
  },
  emptyState: {
    marginTop: 24,
    backgroundColor: "#f8fafc",
  },
});
