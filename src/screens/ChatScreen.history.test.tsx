import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatScreen } from './ChatScreen';
import { useAgentRun } from '../hooks/useAgentRun';
import { useHistory } from '../hooks/useHistory';
import { useProactiveFeed } from '../hooks/useProactiveFeed';
import { useConversationThreads } from '../hooks/useConversationThreads';

let mockRouteParams: Record<string, unknown> = {};

jest.mock('../hooks/useAgentRun', () => ({
  useAgentRun: jest.fn(),
}));

jest.mock('../hooks/useHistory', () => ({
  useHistory: jest.fn(),
}));

jest.mock('../hooks/useProactiveFeed', () => ({
  useProactiveFeed: jest.fn(),
}));

jest.mock('../hooks/useConversationThreads', () => ({
  useConversationThreads: jest.fn(),
}));

jest.mock('../utils/useAuthorization', () => ({
  useAuthorization: () => ({
    selectedAccount: {
      publicKey: {
        toBase58: () => 'wallet-12345678',
      },
    },
    authorizeSession: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock('../components/StepCard', () => ({
  StepCard: ({ step, index }: { step: { node: string; status: string }; index: number }) => {
    const { Text } = require('react-native');
    return <Text>{`LIVE STEP ${index + 1}: ${step.node} (${step.status})`}</Text>;
  },
}));

jest.mock('../components/ApprovalSheet', () => ({
  ApprovalSheet: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ChatScreen history hydration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'idle',
      steps: [],
      result: null,
      confirmedSig: null,
      error: null,
      executeIntent: jest.fn(),
      approveTransaction: jest.fn(),
      resetRun: jest.fn(),
    });

    (useProactiveFeed as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      sendFeedback: jest.fn(),
      isSendingFeedback: false,
    });

    (useConversationThreads as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders persisted user and agent messages when history query returns data', async () => {
    mockRouteParams = { threadId: 'thread-existing' };

    (useHistory as jest.Mock).mockReturnValue({
      data: {
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Bridge 0.2 SOL into wrapped stake account',
            runId: 'run-1',
            threadId: 'thread-existing',
            timestamp: 1,
          },
          {
            id: 'm2',
            role: 'assistant',
            content: 'Routing through Jupiter and preparing the transaction.',
            runId: 'run-1',
            threadId: 'thread-existing',
            timestamp: 2,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    const { findByText } = render(<ChatScreen />);

    expect(await findByText('Bridge 0.2 SOL into wrapped stake account')).toBeTruthy();
    expect(await findByText('Routing through Jupiter and preparing the transaction.')).toBeTruthy();
    expect(await findByText('YOU')).toBeTruthy();
    expect(await findByText('Kawula ANALYSIS')).toBeTruthy();
  });

  it('keeps persisted history visible while a live run is active', async () => {
    mockRouteParams = { threadId: 'thread-existing' };

    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'running',
      steps: [{ node: 'planner', status: 'running' }],
      result: null,
      confirmedSig: null,
      error: null,
      executeIntent: jest.fn(),
      approveTransaction: jest.fn(),
      resetRun: jest.fn(),
    });

    (useHistory as jest.Mock).mockReturnValue({
      data: {
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Old persisted prompt',
            runId: 'run-0',
            threadId: 'thread-existing',
            timestamp: 1,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    const { findByText } = render(<ChatScreen />);

    expect(await findByText('LIVE STEP 1: planner (running)')).toBeTruthy();
    expect(await findByText('Old persisted prompt')).toBeTruthy();
    expect(await findByText('YOU')).toBeTruthy();
  });

  it('shows persisted friendly rejection message from history thread', async () => {
    mockRouteParams = { threadId: 'thread-existing' };

    (useHistory as jest.Mock).mockReturnValue({
      data: {
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            content:
              "I couldn't complete that transfer. It looks like the amount was parsed as 0 lamports. Try 0.5 SOL.",
            runId: 'run-rejected',
            threadId: 'thread-existing',
            timestamp: 1,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    const { findByText, queryByText } = render(<ChatScreen />);

    expect(
      await findByText(
        "I couldn't complete that transfer. It looks like the amount was parsed as 0 lamports. Try 0.5 SOL.",
      ),
    ).toBeTruthy();
    expect(queryByText('Invalid amountLamports: must be a finite positive integer.')).toBeNull();
  });

  it('does not show idle empty state while persisted history is still loading', () => {
    (useHistory as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { queryByText } = render(<ChatScreen />);

    expect(queryByText('Kawula is ready.')).toBeNull();
  });

  it('does not render persisted history when route has no threadId', () => {
    (useHistory as jest.Mock).mockReturnValue({
      data: {
        messages: [
          {
            id: 'm-threaded',
            role: 'user',
            content: 'Message from existing thread',
            runId: 'run-threaded',
            threadId: 'thread-existing',
            timestamp: 1,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    const { queryByText, getByText } = render(<ChatScreen />);

    expect(queryByText('Message from existing thread')).toBeNull();
    expect(getByText('Kawula is ready.')).toBeTruthy();
  });
});
