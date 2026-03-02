import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Text } from '../components/ui';
import { type RootStackParamList } from '../navigators/AppNavigator';
import { useConversationThreads } from '../hooks/useConversationThreads';
import { useAuthorization } from '../utils/useAuthorization';
import { colors, radii, spacing, typography } from '../theme/shadcn-theme';

function formatUpdatedAt(updatedAt: number) {
  return new Date(updatedAt).toLocaleString();
}

export function ConversationListScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { selectedAccount } = useAuthorization();
  const pubkey = selectedAccount?.publicKey.toBase58();
  const { data: threads, isLoading, error } = useConversationThreads(pubkey);

  function openConversation(threadId: string) {
    navigation.navigate('Chat', { threadId });
  }

  function startNewConversation() {
    navigation.navigate('Chat');
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}> 
        <Text variant="h3">Conversations</Text>
        <Text variant="muted" style={styles.subtitle}>
          Choose a thread to continue or start a new copilot session.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text variant="muted">Loading conversations...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {error ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Failed to load conversations</Text>
              <Text variant="muted">Please try again in a moment.</Text>
            </Card>
          ) : null}

          {!error && (threads ?? []).map((thread) => (
            <Pressable
              key={thread.id}
              onPress={() => openConversation(thread.id)}
              style={({ pressed }) => [styles.threadPressable, pressed && styles.threadPressablePressed]}
            >
              <Card style={styles.threadCard}>
                <Text style={styles.threadTitle}>{thread.title}</Text>
                <Text variant="muted" style={styles.threadMeta}>
                  Updated {formatUpdatedAt(thread.updatedAt)}
                </Text>
              </Card>
            </Pressable>
          ))}

          {!error && (threads ?? []).length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text variant="muted">Start a new chat and Kawula will create your first thread.</Text>
            </Card>
          ) : null}
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}> 
        <Button onPress={startNewConversation}>New Conversation</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  subtitle: {
    lineHeight: 20,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  threadPressable: {
    borderRadius: radii.xl,
  },
  threadPressablePressed: {
    opacity: 0.85,
  },
  threadCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundTertiary,
    gap: spacing.xs,
  },
  threadTitle: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
  },
  threadMeta: {
    fontSize: typography.sizeXs,
  },
  emptyCard: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
