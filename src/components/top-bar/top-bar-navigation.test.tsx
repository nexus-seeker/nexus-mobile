import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TopBar } from './top-bar-feature';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('@react-navigation/core', () => ({
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

jest.mock('./top-bar-ui', () => ({
  TopBarWalletMenu: () => null,
}));

describe('TopBar Chat navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TopBar settings button navigates to Chat with a threadId', () => {
    const { getByText } = render(<TopBar />);

    fireEvent.press(getByText('Settings'));

    expect(mockNavigate).toHaveBeenCalledWith('Chat', {
      threadId: expect.stringContaining('thread:wallet-1234'),
    });
  });
});
