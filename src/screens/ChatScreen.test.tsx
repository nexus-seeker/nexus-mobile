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

jest.mock('react-native-paper', () => {
  const React = require('react');
  const { Button, Text, TextInput, View } = require('react-native');

  const MockCard = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  MockCard.Content = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;

  return {
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
      <Button title={String(children ?? '')} onPress={onPress} />
    ),
    Card: MockCard,
    Chip: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    Text,
    TextInput: ({ value, onChangeText, onSubmitEditing }: { value?: string; onChangeText?: (text: string) => void; onSubmitEditing?: () => void }) => (
      <TextInput value={value} onChangeText={onChangeText} onSubmitEditing={onSubmitEditing} />
    ),
  };
});

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
      executeIntent: jest.fn(),
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
});
