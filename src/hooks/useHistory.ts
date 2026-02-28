import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../services/agent/agent-api';

const DEFAULT_LIMIT = 50;

export function useHistory(pubkey: string | undefined, limit = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: ['history', pubkey, limit],
    queryFn: () => fetchHistory(pubkey!, limit, undefined, undefined),
    enabled: !!pubkey,
  });
}
