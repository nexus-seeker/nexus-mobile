import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../hooks/useAgentRun', () => ({
  useAgentRun: jest.fn(),
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

describe('ChatScreen approval flow', () => {
  const approveTransaction = jest.fn();
  const executeIntent = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();

    (useAgentRun as jest.Mock).mockReturnValue({
      runState: 'awaiting_approval',
      steps: [],
      result: {
        runId: 'run-1',
        steps: [],
        unsignedTx: 'dGVzdA==',
      },
      confirmedSig: null,
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
      error: 'Jupiter API error: InvalidProgramForExecution',
      executeIntent,
      approveTransaction,
      resetRun: jest.fn(),
    });

    const { getByText } = render(<ChatScreen />);

    fireEvent.press(getByText('Try Demo-Safe Transfer'));

    expect(executeIntent).toHaveBeenCalledWith(
      'Transfer 0.001 SOL to wallet-12345678',
    );
  });
});
