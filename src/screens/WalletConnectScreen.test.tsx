import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { WalletConnectScreen } from './WalletConnectScreen';

jest.mock('../utils/useMobileWallet', () => ({
  useMobileWallet: () => ({
    connect: jest.fn(),
  }),
}));

jest.mock('../utils/useAuthorization', () => ({
  useAuthorization: jest.fn(),
}));

const { useAuthorization } = require('../utils/useAuthorization');

describe('WalletConnectScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates immediately when selected account already exists', async () => {
    (useAuthorization as jest.Mock).mockReturnValue({
      selectedAccount: {
        publicKey: {
          toBase58: () => 'EP4C7RTzhTPqTZZ8fUzfSu443QawGfDUDYjKgWFPfBfZ',
        },
      },
    });

    const onConnected = jest.fn();
    render(<WalletConnectScreen onConnected={onConnected} />);

    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledTimes(1);
    });
  });
});
