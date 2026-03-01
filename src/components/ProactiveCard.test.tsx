import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ProactiveCard } from './ProactiveCard';

const mockRecommendation = {
  id: 'rec-1',
  pubkey: 'wallet-1',
  threadId: 'thread-1',
  title: 'SOL exposure changed',
  summary: 'Your SOL position moved 8% in the last hour.',
  confidence: 0.82,
  status: 'pending' as const,
  actions: [
    { id: 'open', label: 'Review Action', type: 'open' as const },
    { id: 'reject', label: 'Reject', type: 'reject' as const },
  ],
  createdAt: 1700000000000,
};

describe('ProactiveCard', () => {
  it('renders recommendation confidence and action buttons', () => {
    const { getByText } = render(
      <ProactiveCard recommendation={mockRecommendation} onAction={jest.fn()} />,
    );

    expect(getByText(/Confidence/i)).toBeTruthy();
    expect(getByText('Review Action')).toBeTruthy();
    expect(getByText('Reject')).toBeTruthy();
  });

  it('calls onAction with recommendation and action type', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ProactiveCard recommendation={mockRecommendation} onAction={onAction} />,
    );

    fireEvent.press(getByText('Review Action'));

    expect(onAction).toHaveBeenCalledWith('rec-1', 'open');
  });
});
