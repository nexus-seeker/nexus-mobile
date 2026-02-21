// Shared contract types matching nexus-api/src/agent/state.ts

const API_BASE_URL =
  process.env.EXPO_PUBLIC_AGENT_API_URL || 'http://10.161.161.77:3000/api';
const API_KEY =
  process.env.EXPO_PUBLIC_API_KEY || 'nexus-hackathon-key';

export interface StepEvent {
  type: 'step' | 'heartbeat' | 'complete';
  node?: string;
  label?: string;
  status?: 'running' | 'success' | 'rejected';
  payload?: any;
  result?: AgentRunResult;
}

export interface AgentRunResult {
  runId: string;
  steps: StepEvent[];
  unsignedTx?: string;
  rejection?: {
    reason: string;
    policyField: string;
  };
  simulation?: {
    fee: number;
    outAmount: number;
    priceImpact: string;
  };
}

export interface AgentExecuteResponse {
  runId: string;
  steps?: StepEvent[];
}

export interface PolicyDto {
  exists: boolean;
  owner: string;
  dailyMaxLamports: number;
  currentSpend: number;
  lastResetTs: number;
  allowedProtocols: string[];
  nextReceiptId: number;
  isActive: boolean;
}

export interface ReceiptDto {
  address: string;
  agentProfile: string;
  seekerId: string;
  protocol: string;
  amountLamports: number;
  txSignature: string;
  status: string;
  timestamp: number;
}

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export async function executeAgent(
  intent: string,
  pubkey: string,
): Promise<AgentExecuteResponse> {
  const response = await fetch(`${API_BASE_URL}/agent/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ intent, pubkey }),
  });

  if (!response.ok) {
    throw new Error(`Agent execute failed: ${response.status}`);
  }

  return response.json();
}

export function openAgentStream(
  runId: string,
  callbacks: {
    onEvent: (event: StepEvent) => void;
    onError: (error: Error) => void;
  },
): () => void {
  const EventSourceCtor = (globalThis as any).EventSource;
  if (!EventSourceCtor) {
    throw new Error('SSE is not supported in this environment');
  }

  const source = new EventSourceCtor(getSSEUrl(runId), {
    headers: {
      'x-api-key': API_KEY,
    },
  });

  const handleMessage = (raw: { data?: string }) => {
    if (!raw?.data) {
      return;
    }
    try {
      const event = JSON.parse(raw.data) as StepEvent;
      callbacks.onEvent(event);
    } catch {
      callbacks.onError(new Error('Invalid SSE payload'));
    }
  };

  source.onmessage = handleMessage;
  source.onerror = () => {
    callbacks.onError(new Error('Agent stream disconnected'));
  };

  return () => {
    source.close();
  };
}

export async function fetchPolicy(pubkey: string): Promise<PolicyDto> {
  const response = await fetch(
    `${API_BASE_URL}/policy?pubkey=${encodeURIComponent(pubkey)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Policy fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.policy;
}

export async function updatePolicy(
  pubkey: string,
  dailyMaxLamports: number,
  allowedProtocols: string[],
  isActive: boolean,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/policy/update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pubkey, dailyMaxLamports, allowedProtocols, isActive }),
  });

  if (!response.ok) {
    throw new Error(`Policy update failed: ${response.status}`);
  }

  const data = await response.json();
  return data.unsignedTx;
}

export async function fetchReceipts(pubkey: string): Promise<ReceiptDto[]> {
  const response = await fetch(
    `${API_BASE_URL}/receipts?pubkey=${encodeURIComponent(pubkey)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Receipts fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.receipts;
}

export function getSSEUrl(runId: string): string {
  return `${API_BASE_URL}/agent/${runId}/stream`;
}

export { API_BASE_URL, API_KEY };
