import { renderHook } from '@testing-library/react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProactiveFeed,
  sendRecommendationFeedback,
} from '../services/agent/agent-api';
import { useProactiveFeed } from './useProactiveFeed';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../services/agent/agent-api', () => ({
  fetchProactiveFeed: jest.fn(),
  sendRecommendationFeedback: jest.fn(),
}));

describe('useProactiveFeed', () => {
  const invalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries });
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('configures proactive feed query for wallet + thread', () => {
    renderHook(() => useProactiveFeed('wallet-1', 'thread-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['proactiveFeed', 'wallet-1', 'thread-1'],
        enabled: true,
      }),
    );
  });

  it('queryFn calls fetchProactiveFeed', async () => {
    const payload = [{ id: 'rec-1' }];
    (fetchProactiveFeed as jest.Mock).mockResolvedValue(payload);

    renderHook(() => useProactiveFeed('wallet-2', 'thread-2'));

    const queryOptions = (useQuery as jest.Mock).mock.calls[0][0];
    await expect(queryOptions.queryFn()).resolves.toEqual(payload);
    expect(fetchProactiveFeed).toHaveBeenCalledWith('wallet-2', 'thread-2');
  });

  it('wires feedback mutation to API and invalidates proactive feed query', async () => {
    let mutationOptions: any;
    (useMutation as jest.Mock).mockImplementation((options) => {
      mutationOptions = options;
      return {
        mutateAsync: jest.fn((variables) => options.mutationFn(variables)),
        isPending: false,
      };
    });

    const { result } = renderHook(() => useProactiveFeed('wallet-3', 'thread-3'));

    await result.current.sendFeedback({
      recommendationId: 'rec-9',
      outcome: 'approved',
      reason: 'matches policy',
    });
    await mutationOptions.onSuccess();

    expect(sendRecommendationFeedback).toHaveBeenCalledWith(
      'rec-9',
      'approved',
      'matches policy',
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['proactiveFeed', 'wallet-3', 'thread-3'],
    });
  });
});
