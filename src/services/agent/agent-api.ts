// Shared contract types matching nexus-api/src/agent/state.ts

const API_BASE_URL =
  process.env.EXPO_PUBLIC_AGENT_API_URL || 'http://localhost:3001';
const API_KEY =
  process.env.EXPO_PUBLIC_API_KEY || 'nexus-hackathon-key';

export interface StepEvent {
  type: 'step' | 'heartbeat' | 'complete' | 'error';
  node?: string;
  label?: string;
  status?: 'running' | 'success' | 'rejected';
  payload?: any;
  result?: AgentRunResult;
  message?: string;
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

function normalizeStreamEvent(rawEvent: unknown): StepEvent {
  const event = rawEvent as StepEvent & { step?: Partial<StepEvent> };

  if (event?.type !== 'step' || !event.step) {
    return event;
  }

  const normalized = {
    ...event,
    ...event.step,
    type: 'step' as const,
  };

  delete (normalized as { step?: Partial<StepEvent> }).step;
  return normalized;
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
  const XHRCtor = (globalThis as any).XMLHttpRequest;
  let closed = false;

  const reportError = (error: Error) => {
    if (closed) {
      return;
    }
    callbacks.onError(error);
  };

  const handleMessage = (rawData?: string) => {
    if (!rawData) {
      return;
    }
    try {
      const event = normalizeStreamEvent(JSON.parse(rawData));
      callbacks.onEvent(event);
    } catch {
      reportError(new Error('Invalid SSE payload'));
    }
  };

  if (EventSourceCtor) {
    const source = new EventSourceCtor(getSSEUrl(runId), {
      headers: {
        'x-api-key': API_KEY,
      },
    });

    source.onmessage = (raw: { data?: string }) => {
      handleMessage(raw?.data);
    };
    source.onerror = () => {
      reportError(new Error('Agent stream disconnected'));
    };

    return () => {
      if (closed) {
        return;
      }
      closed = true;
      source.close();
    };
  }

  if (!XHRCtor) {
    throw new Error('SSE is not supported in this environment');
  }

  const xhr = new XHRCtor();
  let cursor = 0;

  const parseChunk = () => {
    const chunk = xhr.responseText?.slice(cursor) ?? '';
    if (!chunk) {
      return;
    }

    const frames = chunk.split(/\r?\n\r?\n/);
    cursor += chunk.length;

    const tail = frames.pop() ?? '';
    cursor -= tail.length;

    for (const frame of frames) {
      const data = frame
        .split(/\r?\n/)
        .filter((line: string) => line.startsWith('data:'))
        .map((line: string) => line.slice(5).trimStart())
        .join('\n');

      handleMessage(data);
    }
  };

  xhr.onreadystatechange = () => {
    if (closed) {
      return;
    }

    if (xhr.readyState === 3 || xhr.readyState === 4) {
      parseChunk();
    }

    if (xhr.readyState === 4 && xhr.status >= 400) {
      reportError(new Error(`Agent stream failed: ${xhr.status}`));
    }
  };

  xhr.onprogress = () => {
    if (closed) {
      return;
    }
    parseChunk();
  };

  xhr.onerror = () => {
    reportError(new Error('Agent stream disconnected'));
  };

  xhr.open('GET', getSSEUrl(runId), true);
  xhr.setRequestHeader('x-api-key', API_KEY);
  xhr.send();

  return () => {
    if (closed) {
      return;
    }
    closed = true;
    xhr.abort();
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

/**
 * Calls POST /policy/onboard to retrieve the two unsigned setup transactions
 * for an uninitialized wallet.
 *
 * Returns { alreadyOnboarded: true } if the wallet is already set up.
 * Returns { alreadyOnboarded: false, createProfileTx, updatePolicyTx } otherwise.
 */
export async function onboardWallet(pubkey: string): Promise<{
  alreadyOnboarded: boolean;
  /** Single atomic unsigned base64 VersionedTransaction containing create_profile (+ update_policy if needed) */
  onboardTx: string | null;
}> {
  const response = await fetch(`${API_BASE_URL}/policy/onboard`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pubkey }),
  });

  if (!response.ok) {
    throw new Error(`Onboard request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Sends a signed base64 VersionedTransaction to the API for broadcast.
 * The API relays it to Solana devnet — use this instead of calling
 * connection.sendRawTransaction() from the device, which may not have
 * direct devnet access.
 */
export async function broadcastOnboardTx(signedTxBase64: string): Promise<{ signature: string }> {
  const response = await fetch(`${API_BASE_URL}/policy/onboard/broadcast`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ signedTx: signedTxBase64 }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as any)?.message ?? `Broadcast failed: ${response.status}`);
  }

  return response.json();
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
