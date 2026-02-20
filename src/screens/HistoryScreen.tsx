import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";

type ReceiptItem = {
  id: string;
  status: "success" | "rejected";
  title: string;
  subtitle: string;
};

const EMPTY_RECEIPTS: ReceiptItem[] = [];

export function HistoryScreen() {
  return (
    <View style={styles.screen}>
      <Text variant="titleLarge" style={styles.title}>
        Execution History
      </Text>
      <FlatList
        data={EMPTY_RECEIPTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Chip icon={item.status === "success" ? "check" : "alert"}>
                {item.status}
              </Chip>
              <Text variant="titleMedium" style={styles.itemTitle}>
                {item.title}
              </Text>
              <Text variant="bodySmall">{item.subtitle}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">No receipts yet</Text>
              <Text variant="bodyMedium" style={styles.mutedText}>
                On-chain ExecutionReceipt cards will appear here after actions are
                submitted.
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
  },
  title: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
  },
  itemTitle: {
    marginTop: 8,
  },
  mutedText: {
    marginTop: 6,
    color: "#475569",
  },
});
