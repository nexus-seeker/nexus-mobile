import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ConversationListScreen } from './ConversationListScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../utils/useAuthorization', () => ({
  useAuthorization: () => ({
    selectedAccount: {
      publicKey: {
        toBase58: () => 'wallet-1234',
      },
    },
  }),
}));

jest.mock('../hooks/useConversationThreads', () => ({
  useConversationThreads: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

const { useConversationThreads } = require('../hooks/useConversationThreads');

describe('ConversationListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders thread list and opens selected thread', () => {
    (useConversationThreads as jest.Mock).mockReturnValue({
      data: [{ id: 'thread-1', title: 'Main Copilot', updatedAt: Date.now() }],
      isLoading: false,
    });

    const { getByText } = render(<ConversationListScreen />);

    expect(getByText('Main Copilot')).toBeTruthy();

    fireEvent.press(getByText('Main Copilot'));

    expect(mockNavigate).toHaveBeenCalledWith('Chat', { threadId: 'thread-1' });
  });

  it('renders error state when threads query fails', () => {
    (useConversationThreads as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network failed'),
    });

    const { getByText, queryByText } = render(<ConversationListScreen />);

    expect(getByText('Failed to load conversations')).toBeTruthy();
    expect(queryByText('No conversations yet')).toBeNull();
  });
});
