import React from 'react';
import { render } from '@testing-library/react-native';
import { StepCard } from './StepCard';
import type { StepEvent } from '../services/agent/agent-api';

describe('StepCard', () => {
  it('renders node labels for dynamic tool-calling steps', () => {
    const cases: Array<{ node: string; symbol: string }> = [
      { node: 'parse_intent', symbol: '①' },
      { node: 'plan_actions', symbol: '②' },
      { node: 'resolve_recipients', symbol: '③' },
      { node: 'policy_precheck', symbol: '④' },
      { node: 'multi_send_usdc', symbol: '⑤' },
      { node: 'simulate_tx', symbol: '⑥' },
      { node: 'assemble_tx', symbol: '⑦' },
    ];

    cases.forEach(({ node, symbol }, index) => {
      const step: StepEvent = {
        type: 'step',
        node,
        label: `Step ${index + 1}`,
        status: 'running',
      };

      const { getByText, unmount } = render(<StepCard step={step} index={index} />);

      expect(getByText(symbol)).toBeTruthy();

      unmount();
    });
  });

  it('falls back to bullet for unknown node names', () => {
    const step: StepEvent = {
      type: 'step',
      node: 'unknown_node_name',
      label: 'Unknown step',
      status: 'success',
    };

    const { getByText } = render(<StepCard step={step} index={0} />);

    expect(getByText('•')).toBeTruthy();
  });

  it('uses payload.order for unknown nodes when provided', () => {
    const step: StepEvent = {
      type: 'step',
      node: 'dynamic_backend_node',
      label: 'Dynamic ordered step',
      status: 'running',
      payload: {
        order: 4,
      },
    };

    const { getByText } = render(<StepCard step={step} index={0} />);

    expect(getByText('④')).toBeTruthy();
  });

  it('uses payload.stepIndex for unknown nodes when provided', () => {
    const step: StepEvent = {
      type: 'step',
      node: 'another_dynamic_node',
      label: 'Dynamic indexed step',
      status: 'running',
      payload: {
        stepIndex: 5,
      },
    };

    const { getByText } = render(<StepCard step={step} index={0} />);

    expect(getByText('⑥')).toBeTruthy();
  });

  it('keeps bullet fallback for unknown nodes without ordering metadata', () => {
    const step: StepEvent = {
      type: 'step',
      node: 'unknown_without_order',
      label: 'Unknown without metadata',
      status: 'success',
      payload: {
        note: 'no order metadata',
      },
    };

    const { getByText } = render(<StepCard step={step} index={0} />);

    expect(getByText('•')).toBeTruthy();
  });
});
