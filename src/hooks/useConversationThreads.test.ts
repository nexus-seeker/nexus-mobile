import { renderHook } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchConversationThreads } from '../services/agent/agent-api';
import { useConversationThreads } from './useConversationThreads';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../services/agent/agent-api', () => ({
  fetchConversationThreads: jest.fn(),
}));

describe('useConversationThreads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it('configures query with wallet pubkey', () => {
    renderHook(() => useConversationThreads('wallet-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['conversationThreads', 'wallet-1'],
        enabled: true,
      }),
    );
  });

  it('disables query when pubkey is missing', () => {
    renderHook(() => useConversationThreads(undefined));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['conversationThreads', undefined],
        enabled: false,
      }),
    );
  });

  it('queryFn calls fetchConversationThreads', async () => {
    const payload = [{ id: 'thread-1', title: 'Main', updatedAt: 1 }];
    (fetchConversationThreads as jest.Mock).mockResolvedValue(payload);

    renderHook(() => useConversationThreads('wallet-2'));

    const queryOptions = (useQuery as jest.Mock).mock.calls[0][0];
    await expect(queryOptions.queryFn()).resolves.toEqual(payload);
    expect(fetchConversationThreads).toHaveBeenCalledWith('wallet-2');
  });
});
