import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Dialog,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { usePolicy } from "../contexts/PolicyContext";
import {
  requestAgentPlan,
  type AgentSwapAction,
} from "../services/agent/agent-api";

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
};

const EXAMPLE_INTENT = "Swap 0.1 SOL to USDC";

type PendingApproval = {
  action: AgentSwapAction;
  reason: string;
};

export function ChatScreen() {
  const [intent, setIntent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(
    null
  );
  const { evaluateAction, policy } = usePolicy();

  const remainingSol = useMemo(
    () => Math.max(policy.dailyLimitSol - policy.dailySpentSol, 0),
    [policy.dailyLimitSol, policy.dailySpentSol]
  );

  function pushMessage(role: ChatMessage["role"], text: string) {
    setMessages((current) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        text,
      },
      ...current,
    ]);
  }

  async function submitIntent() {
    const trimmedIntent = intent.trim();

    if (!trimmedIntent || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setIntent("");

    pushMessage("user", trimmedIntent);

    const plan = await requestAgentPlan({ intent: trimmedIntent });
    pushMessage("agent", plan.reasoning);

    if (!plan.action) {
      setIsSubmitting(false);
      return;
    }

    const evaluation = evaluateAction({
      amountSol: plan.action.amountSol,
      protocol: plan.action.protocol,
    });

    if (evaluation.allowed) {
      pushMessage(
        "agent",
        `Policy check passed. Ready to route ${plan.action.amountSol} SOL -> ${plan.action.toToken} via ${plan.action.protocol}.`
      );
      setIsSubmitting(false);
      return;
    }

    const reason =
      evaluation.reason ?? "Action is outside your current policy constraints.";

    pushMessage("agent", `Approval required: ${reason}`);
    setPendingApproval({
      action: plan.action,
      reason,
    });
    setIsSubmitting(false);
  }

  function cancelApproval() {
    if (!pendingApproval) {
      return;
    }

    pushMessage("agent", "Approval cancelled. No transaction submitted.");
    setPendingApproval(null);
  }

  function approveOnce() {
    if (!pendingApproval) {
      return;
    }

    pushMessage(
      "agent",
      `Approval accepted once. Execution path unlocked for ${pendingApproval.action.amountSol} SOL -> ${pendingApproval.action.toToken}.`
    );
    pushMessage(
      "agent",
      "Execution submission is wired next in M2 with signed on-chain receipt flow."
    );
    setPendingApproval(null);
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
        <Button
          mode="contained"
          onPress={submitIntent}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.sendButton}
        >
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

      <Portal>
        <Dialog visible={Boolean(pendingApproval)} onDismiss={cancelApproval}>
          <Dialog.Title>Approval Required</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{pendingApproval?.reason}</Text>
            {pendingApproval ? (
              <Text variant="bodySmall" style={styles.modalDetails}>
                Proposed action: {pendingApproval.action.amountSol} SOL {"->"}{" "}
                {pendingApproval.action.toToken}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelApproval}>Cancel</Button>
            <Button mode="contained" onPress={approveOnce}>
              Approve once
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  modalDetails: {
    marginTop: 8,
    color: "#475569",
  },
});
