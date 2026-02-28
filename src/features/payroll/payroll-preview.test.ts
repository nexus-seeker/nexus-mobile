import type { AgentRunResult } from '../../services/agent/agent-api';
import { extractPayrollPreview } from './payroll-preview';

describe('extractPayrollPreview', () => {
  it('extracts recipients and total from complete result payload', () => {
    const result = {
      runId: 'run-complete',
      steps: [],
      payrollPreview: {
        tokenSymbol: 'USDC',
        recipients: [
          { display: 'alice.skr', address: 'A1...', amountUi: '500' },
          { display: 'bob.skr', address: 'B1...', amountUi: '300' },
        ],
        totalUi: '800',
      },
    } as AgentRunResult & {
      payrollPreview: unknown;
    };

    expect(extractPayrollPreview(result)).toEqual({
      tokenSymbol: 'USDC',
      recipients: [
        { display: 'alice.skr', address: 'A1...', amountUi: '500' },
        { display: 'bob.skr', address: 'B1...', amountUi: '300' },
      ],
      totalUi: '800',
    });
  });

  it('extracts from multi_send_usdc step payload when complete payload is absent', () => {
    const result: AgentRunResult = {
      runId: 'run-step-fallback',
      steps: [
        {
          type: 'step',
          node: 'multi_send_usdc',
          status: 'success',
          payload: {
            tokenSymbol: 'USDC',
            recipients: [
              { display: 'alice.skr', address: 'A1...', amountUi: 500 },
              { display: 'bob.skr', address: 'B1...', amountUi: 300 },
            ],
            totalUi: 800,
          },
        },
      ],
    };

    expect(extractPayrollPreview(result)).toEqual({
      tokenSymbol: 'USDC',
      recipients: [
        { display: 'alice.skr', address: 'A1...', amountUi: '500' },
        { display: 'bob.skr', address: 'B1...', amountUi: '300' },
      ],
      totalUi: '800',
    });
  });

  it('returns null for unknown payload shape', () => {
    const result: AgentRunResult = {
      runId: 'run-unknown',
      steps: [
        {
          type: 'step',
          node: 'multi_send_usdc',
          status: 'success',
          payload: { foo: 'bar' },
        },
      ],
    };

    expect(extractPayrollPreview(result)).toBeNull();
  });
});
