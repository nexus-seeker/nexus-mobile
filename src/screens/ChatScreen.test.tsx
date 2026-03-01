import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../hooks/useAgentRun', () => ({
  useAgentRun: jest.fn(),
}));

jest.mock('../hooks/useHistory', () => ({
  useHistory: jest.fn(),
}));

jest.mock('../hooks/useProactiveFeed', () => ({
  useProactiveFeed: jest.fn(),
}));

jest.mock('../utils/useAuthorization', () => ({
  useAuthorization: () => ({
    selectedAccount: {
      publicKey: {
        toBase58: () => 'wallet-12345678',
      },
    },
  }),
}));

jest.mock('../components/StepCard', () => ({
  StepCard: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = jest.fn();
const mockRoute = { params: {} as Record<string, unknown> };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => mockRoute,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/ApprovalSheet', () => ({
  ApprovalSheet: ({ visible, onApprove }: { visible: boolean; onApprove: () => void }) => {
    const { Button, Text } = require('react-native');

    return (
      <>
        <Text>{visible ? 'ApprovalSheet visible' : 'ApprovalSheet hidden'}</Text>
        {visible ? <Button title="ApprovalSheet approve action" onPress={onApprove} /> : null}
      </>
    );
  },
}));

const { ChatScreen } = require('./ChatScreen');
const { useAgentRun } = require('../hooks/useAgentRun');
const { useHistory } = require('../hooks/useHistory');
const { useProactiveFeed } = require('../hooks/useProactiveFeed');

describe('ChatScreen approval flow', () => {
  const approveTransaction = jest.fn();
  const executeIntent = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.params = {};

    (useHistory as jest.Mock).mockReturnValue({
      data: { messages: [] },
      isLoading: false,
      error: null,
    });

    (useProactiveFeed as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      sendFeedback: jest.fn(),
      isSendingFeedback: false,
    });

    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'awaiting_approval',
      steps: [],
      result: {
        runId: 'run-1',
        steps: [],
        unsignedTx: 'dGVzdA==',
      },
      confirmedSig: null,
      agentMessage: null,
      error: null,
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });
  });

  it('opens ApprovalSheet when pressing "Approve with Seed Vault"', () => {
    const { getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('ApprovalSheet hidden')).toBeTruthy();
    expect(queryByText('ApprovalSheet visible')).toBeNull();

    fireEvent.press(getByText('Approve with Seed Vault'));

    expect(getByText('ApprovalSheet visible')).toBeTruthy();
  });

  it('invokes approveTransaction once when pressing ApprovalSheet approve action', () => {
    const { getByText } = render(<ChatScreen />);

    fireEvent.press(getByText('Approve with Seed Vault'));
    fireEvent.press(getByText('ApprovalSheet approve action'));

    expect(approveTransaction).toHaveBeenCalledTimes(1);
  });

  it('shows suggestion chips while idle', () => {
    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'idle',
      steps: [],
      result: null,
      confirmedSig: null,
      agentMessage: null,
      error: null,
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText } = render(<ChatScreen />);

    expect(getByText('Analyze my wallet activity')).toBeTruthy();
    expect(getByText('Stake 0.5 SOL via Marinade')).toBeTruthy();
  });

  it('shows rejected status when run is rejected by policy limits', () => {
    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'rejected',
      steps: [],
      result: {
        runId: 'run-3',
        steps: [],
        rejection: {
          reason: 'Per-recipient amount exceeds policy limit',
          policyField: 'per_recipient_limit',
        },
      },
      confirmedSig: null,
      agentMessage: null,
      error: 'Per-recipient amount exceeds policy limit',
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText } = render(<ChatScreen />);

    expect(getByText('REJECTED')).toBeTruthy();
  });

  it('shows demo-safe transfer action for Jupiter rejection and executes transfer intent', () => {
    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'rejected',
      steps: [],
      result: {
        runId: 'run-2',
        steps: [],
        rejection: {
          reason: 'Jupiter API error: InvalidProgramForExecution',
          policyField: 'jupiter',
        },
      },
      confirmedSig: null,
      agentMessage: null,
      error: 'Jupiter API error: InvalidProgramForExecution',
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText } = render(<ChatScreen />);

    fireEvent.press(getByText('Try Demo-Safe Transfer'));

    expect(executeIntent).toHaveBeenCalledWith(
      'Transfer 0.001 SOL to wallet-12345678',
      undefined,
    );
  });

  it('shows thread-scoped persisted history only for selected thread', () => {
    mockRoute.params = { threadId: 'thread-1' };
    (useHistory as jest.Mock).mockReturnValue({
      data: {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Thread one message',
            runId: 'run-1',
            threadId: 'thread-1',
            timestamp: 1700000000000,
          },
          {
            id: 'msg-2',
            role: 'user',
            content: 'Other thread message',
            runId: 'run-2',
            threadId: 'thread-2',
            timestamp: 1700000001000,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'idle',
      currentIntent: null,
      steps: [],
      result: null,
      confirmedSig: null,
      agentMessage: null,
      error: null,
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('Thread one message')).toBeTruthy();
    expect(queryByText('Other thread message')).toBeNull();
  });
});
