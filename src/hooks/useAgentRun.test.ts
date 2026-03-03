import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAgentRun } from './useAgentRun';
import {
  executeAgent,
  openAgentStream,
  type AgentRunResult,
  type StepEvent,
} from '../services/agent/agent-api';

jest.mock('../services/agent/agent-api', () => ({
  executeAgent: jest.fn(),
  openAgentStream: jest.fn(),
}));

jest.mock('../utils/useAuthorization', () => ({
  useAuthorization: () => ({
    selectedAccount: {
      publicKey: {
        toBase58: () => 'wallet-123',
      },
    },
    authorizeSession: jest.fn(),
  }),
}));

jest.mock('../utils/ConnectionProvider', () => ({
  useConnection: () => ({
    connection: {
      getLatestBlockhash: jest.fn(),
      sendRawTransaction: jest.fn(),
      confirmTransaction: jest.fn(),
    },
  }),
}));

jest.mock('@solana-mobile/mobile-wallet-adapter-protocol-web3js', () => ({
  transact: jest.fn(),
}));

jest.mock('@solana/web3.js', () => ({
  VersionedTransaction: {
    deserialize: jest.fn(),
  },
}));

describe('useAgentRun SSE lifecycle', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('streams steps and moves to awaiting approval on complete', async () => {
    const initialStep: StepEvent = {
      type: 'step',
      node: 'parse_intent',
      label: 'Parsing intent',
      status: 'running',
    };

    const streamedStep: StepEvent = {
      type: 'step',
      node: 'build_transaction',
      label: 'Building transaction',
      status: 'success',
    };

    const finalResult: AgentRunResult = {
      runId: 'run-1',
      steps: [initialStep, streamedStep],
      unsignedTx: 'dGVzdA==',
    };

    (executeAgent as jest.Mock).mockResolvedValue({
      runId: 'run-1',
      steps: [initialStep],
    });

    let handlers:
      | {
        onEvent: (event: StepEvent) => void;
        onError: (error: Error) => void;
      }
      | undefined;

    (openAgentStream as jest.Mock).mockImplementation(
      (_runId: string, callbacks: { onEvent: (event: StepEvent) => void; onError: (error: Error) => void }) => {
        handlers = callbacks;
        return () => undefined;
      },
    );

    const { result } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      await result.current.executeIntent('Swap 0.1 SOL to USDC');
    });

    expect(result.current.runState).toBe('running');
    expect(result.current.steps).toEqual([initialStep]);

    await act(async () => {
      handlers?.onEvent(streamedStep);
      handlers?.onEvent({ type: 'complete', result: finalResult });
    });

    expect(result.current.steps).toEqual([initialStep, streamedStep]);
    expect(result.current.result).toEqual(finalResult);
    expect(result.current.runState).toBe('awaiting_approval');
    expect(result.current.error).toBeNull();
  });

  it('shows still working then times out when heartbeat is missing', async () => {
    jest.useFakeTimers();

    (executeAgent as jest.Mock).mockResolvedValue({
      runId: 'run-2',
      steps: [],
    });
    (openAgentStream as jest.Mock).mockImplementation(() => () => undefined);

    const { result } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      await result.current.executeIntent('Do something');
    });

    await act(async () => {
      jest.advanceTimersByTime(9000);
    });

    expect(result.current.runState).toBe('running');
    expect(result.current.steps[result.current.steps.length - 1]?.label).toBe('Still working...');

    await act(async () => {
      jest.advanceTimersByTime(12000);
    });

    expect(result.current.runState).toBe('error');
    expect(result.current.error).toContain('timed out');
    expect(
      result.current.steps.some((step) => step.node === 'heartbeat_status'),
    ).toBe(false);
  });

  it('removes still-working step when stream transport error occurs', async () => {
    jest.useFakeTimers();

    (executeAgent as jest.Mock).mockResolvedValue({
      runId: 'run-stream-error',
      steps: [],
    });

    let handlers:
      | {
        onEvent: (event: StepEvent) => void;
        onError: (error: Error) => void;
      }
      | undefined;

    (openAgentStream as jest.Mock).mockImplementation(
      (_runId: string, callbacks: { onEvent: (event: StepEvent) => void; onError: (error: Error) => void }) => {
        handlers = callbacks;
        return () => undefined;
      },
    );

    const { result } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      await result.current.executeIntent('Do something');
    });

    await act(async () => {
      jest.advanceTimersByTime(9000);
    });

    expect(
      result.current.steps.some((step) => step.node === 'heartbeat_status'),
    ).toBe(true);

    await act(async () => {
      handlers?.onError(new Error('Agent stream disconnected'));
    });

    expect(result.current.runState).toBe('error');
    expect(
      result.current.steps.some((step) => step.node === 'heartbeat_status'),
    ).toBe(false);
  });

  it('fails fast when stream emits backend error event', async () => {
    (executeAgent as jest.Mock).mockResolvedValue({
      runId: 'run-missing',
      steps: [],
    });

    let handlers:
      | {
        onEvent: (event: StepEvent) => void;
        onError: (error: Error) => void;
      }
      | undefined;

    (openAgentStream as jest.Mock).mockImplementation(
      (_runId: string, callbacks: { onEvent: (event: StepEvent) => void; onError: (error: Error) => void }) => {
        handlers = callbacks;
        return () => undefined;
      },
    );

    const { result } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      await result.current.executeIntent('Swap 0.1 SOL to USDC');
    });

    await act(async () => {
      handlers?.onEvent({
        type: 'error',
        message: 'Run not found or expired',
      } as any);
    });

    expect(result.current.runState).toBe('error');
    expect(result.current.error).toContain('Run not found or expired');
  });

  it('ignores stale stream callbacks from an older executeIntent run', async () => {
    const deferred = () => {
      let resolve!: (value: any) => void;
      const promise = new Promise((res) => {
        resolve = res;
      });
      return { promise, resolve };
    };

    const first = deferred();
    const second = deferred();

    (executeAgent as jest.Mock)
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const handlersByRun = new Map<
      string,
      {
        onEvent: (event: StepEvent) => void;
        onError: (error: Error) => void;
      }
    >();

    (openAgentStream as jest.Mock).mockImplementation((runId: string, callbacks: { onEvent: (event: StepEvent) => void; onError: (error: Error) => void }) => {
      handlersByRun.set(runId, callbacks);
      return () => undefined;
    });

    const { result } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      const runOnePromise = result.current.executeIntent('first');
      const runTwoPromise = result.current.executeIntent('second');

      second.resolve({ runId: 'run-2', steps: [] });
      await Promise.resolve();
      first.resolve({ runId: 'run-1', steps: [] });

      await Promise.all([runOnePromise, runTwoPromise]);
    });

    const staleResult: AgentRunResult = {
      runId: 'run-1',
      steps: [],
      rejection: {
        reason: 'stale',
        policyField: 'none',
      },
    };

    await act(async () => {
      handlersByRun.get('run-1')?.onEvent({ type: 'complete', result: staleResult });
    });

    expect(result.current.result).toBeNull();
    expect(result.current.runState).toBe('running');
  });

  it('keeps rejected runState and exposes friendly rejection message on complete', async () => {
    (executeAgent as jest.Mock).mockResolvedValue({
      runId: 'run-rejected',
      steps: [],
    });

    let handlers:
      | {
        onEvent: (event: StepEvent) => void;
        onError: (error: Error) => void;
      }
      | undefined;

    (openAgentStream as jest.Mock).mockImplementation(
      (_runId: string, callbacks: { onEvent: (event: StepEvent) => void; onError: (error: Error) => void }) => {
        handlers = callbacks;
        return () => undefined;
      },
    );

    const { result } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      await result.current.executeIntent('tf to bene.skr 1 0.5 sol');
    });

    await act(async () => {
      handlers?.onEvent({
        type: 'complete',
        result: {
          runId: 'run-rejected',
          steps: [],
          rejection: { reason: 'Invalid amountLamports', policyField: 'amount_lamports' },
          agentMessage: 'I could not complete that transfer. I think you meant 0.5 SOL.',
          recovery: {
            summary: 'Amount parsed as 0 lamports.',
            suggestedActions: [
              { id: 'retry_fixed_amount', label: 'Retry 0.5 SOL', type: 'retry_intent', intent: 'tf to bene.skr 0.5 sol' },
            ],
          },
        } as AgentRunResult,
      });
    });

    expect(result.current.runState).toBe('rejected');
    expect(result.current.error).toBe('Invalid amountLamports');
    expect(result.current.agentMessage).toContain('meant 0.5 SOL');
  });

  it('uses recovery summary when rejection agentMessage is missing and clears stale message on reset/new run', async () => {
    let resolveFirstExecute!: (value: { runId: string; steps: StepEvent[] }) => void;
    const firstExecute = new Promise<{ runId: string; steps: StepEvent[] }>((resolve) => {
      resolveFirstExecute = resolve;
    });

    let resolveSecondExecute!: (value: { runId: string; steps: StepEvent[] }) => void;
    const secondExecute = new Promise<{ runId: string; steps: StepEvent[] }>((resolve) => {
      resolveSecondExecute = resolve;
    });

    (executeAgent as jest.Mock)
      .mockImplementationOnce(() => firstExecute)
      .mockImplementationOnce(() => secondExecute);

    const handlersByRun = new Map<
      string,
      {
        onEvent: (event: StepEvent) => void;
        onError: (error: Error) => void;
      }
    >();

    (openAgentStream as jest.Mock).mockImplementation((runId: string, callbacks: { onEvent: (event: StepEvent) => void; onError: (error: Error) => void }) => {
      handlersByRun.set(runId, callbacks);
      return () => undefined;
    });

    const { result } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      const runPromise = result.current.executeIntent('first run');
      resolveFirstExecute({ runId: 'run-1', steps: [] });
      await runPromise;
    });

    await act(async () => {
      handlersByRun.get('run-1')?.onEvent({
        type: 'complete',
        result: {
          runId: 'run-1',
          steps: [],
          rejection: { reason: 'Invalid amountLamports', policyField: 'amount_lamports' },
          recovery: {
            summary: 'Amount parsed as 0 lamports.',
            suggestedActions: [],
          },
        } as AgentRunResult,
      });
    });

    const rejectionAgentMessage = result.current.agentMessage;

    act(() => {
      result.current.resetRun();
    });
    const messageAfterReset = result.current.agentMessage;

    let secondRunPromise!: Promise<void>;
    act(() => {
      secondRunPromise = result.current.executeIntent('second run');
    });
    const messageAtSecondRunStart = result.current.agentMessage;

    await act(async () => {
      resolveSecondExecute({ runId: 'run-2', steps: [] });
      await secondRunPromise;
    });

    act(() => {
      result.current.resetRun();
    });

    expect(rejectionAgentMessage).toBe('Amount parsed as 0 lamports.');
    expect(messageAfterReset).toBeNull();
    expect(messageAtSecondRunStart).toBeNull();
  });

  it('resetRun and unmount clean up active stream subscriptions', async () => {
    const close = jest.fn();
    (executeAgent as jest.Mock).mockResolvedValue({
      runId: 'run-cleanup',
      steps: [],
    });
    (openAgentStream as jest.Mock).mockImplementation(() => close);

    const { result, unmount } = renderHook(() => useAgentRun(), { wrapper });

    await act(async () => {
      await result.current.executeIntent('cleanup');
    });

    act(() => {
      result.current.resetRun();
    });

    expect(close).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.executeIntent('cleanup-again');
    });

    unmount();
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('does not start stream when unmounted before executeAgent resolves', async () => {
    let resolveExecute!: (value: { runId: string; steps: StepEvent[] }) => void;
    const executePromise = new Promise<{ runId: string; steps: StepEvent[] }>((resolve) => {
      resolveExecute = resolve;
    });

    (executeAgent as jest.Mock).mockReturnValue(executePromise);
    const close = jest.fn();
    (openAgentStream as jest.Mock).mockImplementation(() => close);

    const { result, unmount } = renderHook(() => useAgentRun(), { wrapper });

    let runPromise!: Promise<void>;
    act(() => {
      runPromise = result.current.executeIntent('late execute response');
    });

    unmount();

    await act(async () => {
      resolveExecute({ runId: 'run-late', steps: [] });
      await runPromise;
    });

    expect(openAgentStream).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});
