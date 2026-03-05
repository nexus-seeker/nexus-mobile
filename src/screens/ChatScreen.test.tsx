import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

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
const { useConversationThreads } = require('../hooks/useConversationThreads');

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

    (useConversationThreads as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
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

  it('renders compact header actions for chats, profile, and policy', () => {
    const { getByLabelText, getByText } = render(<ChatScreen />);

    expect(getByLabelText('Open conversations')).toBeTruthy();
    expect(getByLabelText('Open profile')).toBeTruthy();
    expect(getByLabelText('Open policy')).toBeTruthy();
    expect(getByText('Kawula')).toBeTruthy();
  });

  it('does not submit a new intent while awaiting approval', () => {
    const { getByPlaceholderText } = render(<ChatScreen />);

    const input = getByPlaceholderText('Type your intent...');
    fireEvent.changeText(input, 'Swap 1 SOL to USDC');
    fireEvent(input, 'submitEditing');

    expect(executeIntent).not.toHaveBeenCalled();
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

  it('renders recovery card actions and wires retry/policy/onboarding handlers', () => {
    mockRoute.params = { threadId: 'thread-recovery' };

    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'rejected',
      steps: [],
      result: {
        runId: 'run-recovery',
        steps: [],
        rejection: {
          reason: 'Invalid amountLamports',
          policyField: 'amount_lamports',
        },
        recovery: {
          summary: 'Amount parsed as 0 lamports.',
          suggestedActions: [
            {
              id: 'retry-fixed',
              label: 'Retry with 0.5 SOL',
              type: 'retry_intent',
              intent: 'tf to bene.skr 0.5 sol',
            },
            {
              id: 'open-policy',
              label: 'Review policy',
              type: 'open_policy',
            },
            {
              id: 'open-onboarding',
              label: 'Complete onboarding',
              type: 'open_onboarding',
            },
            {
              id: 'extra',
              label: 'Should not render',
              type: 'open_policy',
            },
          ],
        },
      },
      confirmedSig: null,
      agentMessage: 'I could not complete that transfer. I think you meant 0.5 SOL.',
      error: 'Invalid amountLamports',
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('I could not complete that transfer. I think you meant 0.5 SOL.')).toBeTruthy();
    expect(queryByText('Should not render')).toBeNull();

    fireEvent.press(getByText('Retry with 0.5 SOL'));
    expect(executeIntent).toHaveBeenCalledWith('tf to bene.skr 0.5 sol', 'thread-recovery');

    fireEvent.press(getByText('Review policy'));
    expect(mockNavigate).toHaveBeenCalledWith('Policy');

    fireEvent.press(getByText('Complete onboarding'));
    expect(mockNavigate).toHaveBeenCalledWith('Onboarding');
  });

  it('does not render unsupported recovery action types', () => {
    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'rejected',
      steps: [],
      result: {
        runId: 'run-unsupported-recovery',
        steps: [],
        rejection: {
          reason: 'Unknown recovery action',
          policyField: 'amount_lamports',
        },
        recovery: {
          summary: 'Try one of the supported actions.',
          suggestedActions: [
            {
              id: 'unsupported',
              label: 'Unsupported action',
              type: 'open_dashboard',
            } as any,
          ],
        },
      },
      confirmedSig: null,
      agentMessage: null,
      error: 'Unknown recovery action',
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('Try one of the supported actions.')).toBeTruthy();
    expect(queryByText('Unsupported action')).toBeNull();
  });

  it('falls back to recovery summary when agentMessage is empty and suppresses onboarding fallback card', () => {
    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'rejected',
      steps: [],
      result: {
        runId: 'run-onboarding-recovery',
        steps: [],
        rejection: {
          reason: 'Wallet not onboarded',
          policyField: 'not_onboarded',
        },
        recovery: {
          summary: 'You need to finish onboarding first.',
          suggestedActions: [
            {
              id: 'open-onboarding',
              label: 'Open onboarding',
              type: 'open_onboarding',
            },
          ],
        },
      },
      confirmedSig: null,
      agentMessage: '',
      error: 'Wallet not onboarded',
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('You need to finish onboarding first.')).toBeTruthy();
    expect(queryByText('Wallet not set up yet')).toBeNull();
  });

  it('suppresses demo-safe transfer fallback when structured recovery actions exist', () => {
    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'rejected',
      steps: [],
      result: {
        runId: 'run-jupiter-recovery',
        steps: [],
        rejection: {
          reason: 'Jupiter route unavailable',
          policyField: 'jupiter',
        },
        recovery: {
          summary: 'Retry this swap with a smaller amount.',
          suggestedActions: [
            {
              id: 'retry-swap',
              label: 'Retry swap intent',
              type: 'retry_intent',
              intent: 'swap 0.01 sol to usdc',
            },
          ],
        },
      },
      confirmedSig: null,
      agentMessage: null,
      error: 'Jupiter route unavailable',
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { queryByText } = render(<ChatScreen />);

    expect(queryByText('Try Demo-Safe Transfer')).toBeNull();
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
      expect.any(String),
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

  it('opens Chats drawer and switches to selected conversation thread', async () => {
    mockRoute.params = { threadId: 'thread-1' };

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
            content: 'Thread two message',
            runId: 'run-2',
            threadId: 'thread-2',
            timestamp: 1700000001000,
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    (useConversationThreads as jest.Mock).mockReturnValue({
      data: [
        { id: 'thread-1', title: 'Thread One', updatedAt: 1700000000000 },
        { id: 'thread-2', title: 'Thread Two', updatedAt: 1700000001000 },
      ],
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('Thread one message')).toBeTruthy();

    fireEvent.press(getByLabelText('Open conversations'));
    fireEvent.press(getByText('Thread Two'));

    await waitFor(() => {
      expect(getByText('Thread two message')).toBeTruthy();
      expect(queryByText('Thread one message')).toBeNull();
    });
  });

  it('creates a new chat from drawer and hides previous thread history', async () => {
    mockRoute.params = { threadId: 'thread-1' };

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
        ],
      },
      isLoading: false,
      error: null,
    });

    (useConversationThreads as jest.Mock).mockReturnValue({
      data: [{ id: 'thread-1', title: 'Thread One', updatedAt: 1700000000000 }],
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('Thread one message')).toBeTruthy();

    fireEvent.press(getByLabelText('Open conversations'));
    fireEvent.press(getByText('New Chat'));

    await waitFor(() => {
      expect(queryByText('Thread one message')).toBeNull();
      expect(getByText('Kawula is ready.')).toBeTruthy();
    });
  });
});
