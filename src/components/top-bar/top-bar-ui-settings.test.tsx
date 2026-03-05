import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TopBarSettingsButton } from './top-bar-ui';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../utils/useAuthorization', () => ({
  useAuthorization: () => ({
    selectedAccount: {
      publicKey: {
        toBase58: () => 'wallet-1234',
      },
    },
  }),
}));

jest.mock('../../utils/useMobileWallet', () => ({
  useMobileWallet: () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

jest.mock('../cluster/cluster-data-access', () => ({
  useCluster: () => ({
    getExplorerUrl: jest.fn(),
  }),
}));

describe('TopBarSettingsButton navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to Chat with a threadId', () => {
    const { getByText } = render(<TopBarSettingsButton />);

    fireEvent.press(getByText('Settings'));

    expect(mockNavigate).toHaveBeenCalledWith('Chat', {
      threadId: expect.stringContaining('thread:wallet-1234'),
    });
  });
});
