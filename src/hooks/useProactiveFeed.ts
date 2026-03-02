import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProactiveFeed,
  sendRecommendationFeedback,
  type RecommendationFeedbackOutcome,
} from '../services/agent/agent-api';

interface FeedbackInput {
  recommendationId: string;
  outcome: RecommendationFeedbackOutcome;
  reason?: string;
}

export function useProactiveFeed(pubkey: string | undefined, threadId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['proactiveFeed', pubkey, threadId];

  const feedQuery = useQuery({
    queryKey,
    queryFn: () =>
      pubkey ? fetchProactiveFeed(pubkey, threadId) : Promise.resolve([]),
    enabled: !!pubkey,
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ recommendationId, outcome, reason }: FeedbackInput) =>
      sendRecommendationFeedback(recommendationId, outcome, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...feedQuery,
    sendFeedback: feedbackMutation.mutateAsync,
    isSendingFeedback: feedbackMutation.isPending,
  };
}
