import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Button, Text } from './ui';
import {
  type ProactiveRecommendationDto,
  type RecommendationActionType,
} from '../services/agent/agent-api';
import { colors, radii, spacing, typography } from '../theme/shadcn-theme';

interface ProactiveCardProps {
  recommendation: ProactiveRecommendationDto;
  onAction: (recommendationId: string, actionType: RecommendationActionType) => void;
  disabled?: boolean;
}

export function ProactiveCard({ recommendation, onAction, disabled = false }: ProactiveCardProps) {
  const confidencePct = Math.round(Math.max(0, Math.min(1, recommendation.confidence)) * 100);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>PROACTIVE SIGNAL</Text>
        <Text style={styles.confidence}>Confidence {confidencePct}%</Text>
      </View>
      <Text style={styles.title}>{recommendation.title}</Text>
      <Text variant="muted" style={styles.summary}>
        {recommendation.summary}
      </Text>
      <View style={styles.actionsRow}>
        {recommendation.actions.map((action) => {
          const variant = action.type === 'reject' ? 'destructive' : 'secondary';
          return (
            <Button
              key={action.id}
              size="sm"
              variant={variant}
              style={styles.actionButton}
              disabled={disabled}
              onPress={() => onAction(recommendation.id, action.type)}
            >
              {action.label}
            </Button>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundTertiary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kicker: {
    color: colors.primaryLight,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    letterSpacing: 1,
  },
  confidence: {
    color: colors.foregroundMuted,
    fontSize: typography.sizeXs,
    fontFamily: typography.fontMono,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.sizeBase,
    fontWeight: typography.weightSemibold,
  },
  summary: {
    lineHeight: 20,
  },
  actionsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 96,
  },
});
