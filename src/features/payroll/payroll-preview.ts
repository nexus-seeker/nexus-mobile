import type { AgentRunResult, StepEvent } from '../../services/agent/agent-api';

export type PayrollRecipientPreview = {
  display: string;
  address: string;
  amountUi: string;
};

export type PayrollPreview = {
  tokenSymbol: string;
  recipients: PayrollRecipientPreview[];
  totalUi: string;
  policyStatus?: 'within_limit' | 'blocked';
};

export function extractPayrollPreview(result: AgentRunResult | null | undefined): PayrollPreview | null {
  if (!isRecord(result)) {
    return null;
  }

  try {
    const fromResult = readPreviewCandidates(result);
    for (const candidate of fromResult) {
      const parsed = parsePayrollPreview(candidate);
      if (parsed) {
        return parsed;
      }
    }

    if (!Array.isArray(result.steps)) {
      return null;
    }

    for (let i = result.steps.length - 1; i >= 0; i -= 1) {
      const step = result.steps[i];
      if (!isMultiSendStep(step)) {
        continue;
      }

      const fromStep = readPreviewCandidates(step);
      for (const candidate of fromStep) {
        const parsed = parsePayrollPreview(candidate);
        if (parsed) {
          return parsed;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMultiSendStep(step: StepEvent | undefined): step is StepEvent & { node: 'multi_send_usdc' } {
  return !!step && step.type === 'step' && step.node === 'multi_send_usdc';
}

function readPreviewCandidates(value: unknown): unknown[] {
  if (!isRecord(value)) {
    return [];
  }

  return [
    value,
    value.payrollPreview,
    value.payroll_preview,
    value.preview,
    value.payload,
  ];
}

function parsePayrollPreview(value: unknown): PayrollPreview | null {
  if (!isRecord(value)) {
    return null;
  }

  const tokenSymbol = toNonEmptyString(value.tokenSymbol);
  const recipients = parseRecipients(value.recipients);
  const totalUi = toUiAmount(value.totalUi);

  if (!tokenSymbol || !recipients || !totalUi) {
    return null;
  }

  const policyStatus = parsePolicyStatus(value.policyStatus);

  return {
    tokenSymbol,
    recipients,
    totalUi,
    ...(policyStatus ? { policyStatus } : {}),
  };
}

function parseRecipients(value: unknown): PayrollRecipientPreview[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const recipients: PayrollRecipientPreview[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }

    const display = toNonEmptyString(item.display);
    const address = toNonEmptyString(item.address);
    const amountUi = toUiAmount(item.amountUi);

    if (!display || !address || !amountUi) {
      return null;
    }

    recipients.push({
      display,
      address,
      amountUi,
    });
  }

  return recipients;
}

function parsePolicyStatus(value: unknown): PayrollPreview['policyStatus'] | undefined {
  if (value === 'within_limit' || value === 'blocked') {
    return value;
  }

  return undefined;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toUiAmount(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}
