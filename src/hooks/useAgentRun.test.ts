import { act, renderHook } from '@testing-library/react-native';
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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

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

    const { result } = renderHook(() => useAgentRun());

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

    const { result } = renderHook(() => useAgentRun());

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

    const { result } = renderHook(() => useAgentRun());

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

  it('resetRun and unmount clean up active stream subscriptions', async () => {
    const close = jest.fn();
    (executeAgent as jest.Mock).mockResolvedValue({
      runId: 'run-cleanup',
      steps: [],
    });
    (openAgentStream as jest.Mock).mockImplementation(() => close);

    const { result, unmount } = renderHook(() => useAgentRun());

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

    const { result, unmount } = renderHook(() => useAgentRun());

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
