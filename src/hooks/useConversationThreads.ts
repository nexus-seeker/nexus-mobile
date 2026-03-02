import { useQuery } from '@tanstack/react-query';
import { fetchConversationThreads } from '../services/agent/agent-api';

export function useConversationThreads(pubkey: string | undefined) {
  return useQuery({
    queryKey: ['conversationThreads', pubkey],
    queryFn: () => (pubkey ? fetchConversationThreads(pubkey) : Promise.resolve([])),
    enabled: !!pubkey,
  });
}
