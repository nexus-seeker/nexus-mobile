import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../services/agent/agent-api';

const DEFAULT_LIMIT = 50;

export function useHistory(
  pubkey: string | undefined,
  limit = DEFAULT_LIMIT,
  beforeTs?: number,
  beforeId?: string,
) {
  const hasInvalidCursor = beforeId !== undefined && beforeTs === undefined;

  return useQuery({
    queryKey: ['history', pubkey, limit, beforeTs, beforeId],
    queryFn: () => (pubkey ? fetchHistory(pubkey, limit, beforeTs, beforeId) : Promise.resolve({ messages: [] })),
    enabled: !!pubkey && !hasInvalidCursor,
  });
}
