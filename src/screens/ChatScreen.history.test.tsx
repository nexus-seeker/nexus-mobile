import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatScreen } from './ChatScreen';
import { useAgentRun } from '../hooks/useAgentRun';
import { useHistory } from '../hooks/useHistory';

jest.mock('../hooks/useAgentRun', () => ({
  useAgentRun: jest.fn(),
}));

jest.mock('../hooks/useHistory', () => ({
  useHistory: jest.fn(),
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
  });

  it('renders persisted user and agent messages when history query returns data', async () => {
    (useHistory as jest.Mock).mockReturnValue({
      data: {
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Bridge 0.2 SOL into wrapped stake account',
            runId: 'run-1',
            timestamp: 1,
          },
          {
            id: 'm2',
            role: 'assistant',
            content: 'Routing through Jupiter and preparing the transaction.',
            runId: 'run-1',
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
    expect(await findByText('AGENT')).toBeTruthy();
  });

  it('suppresses persisted history while a live run is active so live steps stay prioritized', async () => {
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
            timestamp: 1,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    const { findByText, queryByText } = render(<ChatScreen />);

    expect(await findByText('LIVE STEP 1: planner (running)')).toBeTruthy();
    expect(queryByText('PERSISTED HISTORY')).toBeNull();
    expect(queryByText('Old persisted prompt')).toBeNull();
    expect(queryByText('YOU')).toBeNull();
  });

  it('does not show idle empty state while persisted history is still loading', () => {
    (useHistory as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { queryByText } = render(<ChatScreen />);

    expect(queryByText('NEXUS is ready.')).toBeNull();
  });
});
