import { renderHook } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../services/agent/agent-api';
import { useHistory } from './useHistory';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../services/agent/agent-api', () => ({
  fetchHistory: jest.fn(),
}));

describe('useHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it('configures query with pubkey and default limit', () => {
    renderHook(() => useHistory('wallet-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['history', 'wallet-1', 50],
        enabled: true,
      }),
    );
  });

  it('disables query when pubkey is missing', () => {
    renderHook(() => useHistory(undefined));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['history', undefined, 50],
        enabled: false,
      }),
    );
  });

  it('queryFn calls fetchHistory with pubkey and limit', async () => {
    const payload = {
      messages: [{ id: 'm-1', role: 'user', content: 'hi', runId: 'run-1', timestamp: 1 }],
      nextCursor: 1,
      nextCursorId: 'm-1',
    };
    (fetchHistory as jest.Mock).mockResolvedValue(payload);

    renderHook(() => useHistory('wallet/with space', 25));

    const queryOptions = (useQuery as jest.Mock).mock.calls[0][0];
    await expect(queryOptions.queryFn()).resolves.toEqual(payload);
    expect(fetchHistory).toHaveBeenCalledWith('wallet/with space', 25, undefined, undefined);
  });
});
