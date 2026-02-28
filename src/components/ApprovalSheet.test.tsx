import React from 'react';
import { render } from '@testing-library/react-native';
import { ApprovalSheet } from './ApprovalSheet';
import type { AgentRunResult } from '../services/agent/agent-api';

describe('ApprovalSheet', () => {
  const onApprove = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recipient rows when payroll preview exists', () => {
    const result = {
      runId: 'run-1',
      steps: [{ type: 'step', label: 'Prepare payroll' }],
      tokenSymbol: 'USDC',
      recipients: [
        { display: 'alice.skr', address: 'A1', amountUi: '500' },
        { display: 'bob.skr', address: 'B1', amountUi: '300' },
      ],
      totalUi: '800',
    } as AgentRunResult;

    const { getByText } = render(
      <ApprovalSheet
        visible
        result={result}
        isLoading={false}
        onApprove={onApprove}
        onCancel={onCancel}
      />,
    );

    expect(getByText('Recipients')).toBeTruthy();
    expect(getByText('alice.skr')).toBeTruthy();
    expect(getByText('500 USDC')).toBeTruthy();
    expect(getByText('bob.skr')).toBeTruthy();
    expect(getByText('300 USDC')).toBeTruthy();
  });

  it('renders total and token symbol', () => {
    const result = {
      runId: 'run-2',
      steps: [{ type: 'step', label: 'Prepare payroll' }],
      tokenSymbol: 'USDC',
      recipients: [
        { display: 'alice.skr', address: 'A1', amountUi: '500' },
        { display: 'bob.skr', address: 'B1', amountUi: '300' },
      ],
      totalUi: '800',
    } as AgentRunResult;

    const { getByText } = render(
      <ApprovalSheet
        visible
        result={result}
        isLoading={false}
        onApprove={onApprove}
        onCancel={onCancel}
      />,
    );

    expect(getByText('Total')).toBeTruthy();
    expect(getByText('800 USDC')).toBeTruthy();
  });

  it('preserves fallback summary when payroll preview does not exist', () => {
    const result: AgentRunResult = {
      runId: 'run-3',
      steps: [{ type: 'step', label: 'Swap USDC to SOL' }],
    };

    const { getByText, queryByText } = render(
      <ApprovalSheet
        visible
        result={result}
        isLoading={false}
        onApprove={onApprove}
        onCancel={onCancel}
      />,
    );

    expect(getByText('Action')).toBeTruthy();
    expect(getByText('Swap USDC to SOL')).toBeTruthy();
    expect(queryByText('Recipients')).toBeNull();
  });
});
