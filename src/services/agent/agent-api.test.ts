import {
  API_BASE_URL,
  executeAgent,
  fetchPolicy,
  fetchReceipts,
  getSSEUrl,
  openAgentStream,
  updatePolicy,
} from './agent-api';

describe('agent-api contract', () => {
  beforeEach(() => {
    (globalThis as any).fetch = jest.fn();
  });

  afterEach(() => {
    delete (globalThis as any).fetch;
    jest.clearAllMocks();
  });

  it('executeAgent posts intent and pubkey and returns execute response', async () => {
    const response = { runId: 'run-1', steps: [{ type: 'step', node: 'n1' }] };
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(response),
    });

    await expect(executeAgent('swap usdc to sol', 'wallet-1')).resolves.toEqual(response);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/agent/execute`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ intent: 'swap usdc to sol', pubkey: 'wallet-1' }),
      }),
    );
  });

  it('executeAgent throws with status when request fails', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

    await expect(executeAgent('swap', 'wallet-1')).rejects.toThrow(
      'Agent execute failed: 503',
    );
  });

  it('fetchPolicy requests encoded pubkey and returns policy payload', async () => {
    const policy = {
      exists: true,
      owner: 'owner-1',
      dailyMaxLamports: 1,
      currentSpend: 0,
      lastResetTs: 123,
      allowedProtocols: ['jupiter'],
      nextReceiptId: 2,
      isActive: true,
    };

    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ policy }),
    });

    await expect(fetchPolicy('wallet/with space')).resolves.toEqual(policy);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/policy?pubkey=wallet%2Fwith%20space`,
      expect.any(Object),
    );
  });

  it('fetchPolicy throws with status when request fails', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });

    await expect(fetchPolicy('wallet-1')).rejects.toThrow('Policy fetch failed: 401');
  });

  it('updatePolicy posts update payload and returns unsigned transaction', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ unsignedTx: 'base64-tx' }),
    });

    await expect(updatePolicy('wallet-1', 999, ['jupiter'], true)).resolves.toBe(
      'base64-tx',
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/policy/update`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          pubkey: 'wallet-1',
          dailyMaxLamports: 999,
          allowedProtocols: ['jupiter'],
          isActive: true,
        }),
      }),
    );
  });

  it('updatePolicy throws with status when request fails', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    await expect(updatePolicy('wallet-1', 999, ['jupiter'], true)).rejects.toThrow(
      'Policy update failed: 500',
    );
  });

  it('fetchReceipts requests encoded pubkey and returns receipts array', async () => {
    const receipts = [{ address: 'addr-1' }, { address: 'addr-2' }];
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ receipts }),
    });

    await expect(fetchReceipts('wallet/with space')).resolves.toEqual(receipts);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/receipts?pubkey=wallet%2Fwith%20space`,
      expect.any(Object),
    );
  });

  it('fetchReceipts throws with status when request fails', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429 });

    await expect(fetchReceipts('wallet-1')).rejects.toThrow('Receipts fetch failed: 429');
  });

  it('getSSEUrl builds stream url from api base', () => {
    expect(getSSEUrl('run-42')).toBe(`${API_BASE_URL}/agent/run-42/stream`);
  });
});

describe('openAgentStream', () => {
  afterEach(() => {
    delete (globalThis as any).EventSource;
    delete (globalThis as any).XMLHttpRequest;
    jest.clearAllMocks();
  });

  it('forwards stream errors while active', () => {
    const source = {
      onmessage: null as ((event: { data?: string }) => void) | null,
      onerror: null as (() => void) | null,
      close: jest.fn(),
    };

    (globalThis as any).EventSource = jest.fn(() => source);

    const onError = jest.fn();
    openAgentStream('run-err', {
      onEvent: jest.fn(),
      onError,
    });

    source.onerror?.();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('close is idempotent and ignores late errors after complete/close', () => {
    const source = {
      onmessage: null as ((event: { data?: string }) => void) | null,
      onerror: null as (() => void) | null,
      close: jest.fn(),
    };

    (globalThis as any).EventSource = jest.fn(() => source);

    const onEvent = jest.fn();
    const onError = jest.fn();

    const close = openAgentStream('run-1', { onEvent, onError });

    source.onmessage?.({
      data: JSON.stringify({ type: 'complete', result: { runId: 'run-1', steps: [] } }),
    });

    expect(onEvent).toHaveBeenCalledTimes(1);

    close();
    close();

    source.onerror?.();

    expect(source.close).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('uses XMLHttpRequest fallback when EventSource is unavailable', () => {
    class MockXHR {
      readyState = 3;
      status = 200;
      responseText = '';
      onreadystatechange: (() => void) | null = null;
      onprogress: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = jest.fn();
      abort = jest.fn();
    }

    const xhr = new MockXHR();
    (globalThis as any).XMLHttpRequest = jest.fn(() => xhr);

    const onEvent = jest.fn();
    const onError = jest.fn();

    const close = openAgentStream('run-fallback', { onEvent, onError });

    xhr.responseText = 'data: {"type":"step","node":"n1","label":"L","status":"running"}\n\n';
    xhr.onprogress?.();

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'step', node: 'n1' }),
    );

    close();
    xhr.onerror?.();

    expect(xhr.abort).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('parses CRLF-framed events in XMLHttpRequest fallback', () => {
    class MockXHR {
      readyState = 3;
      status = 200;
      responseText = '';
      onreadystatechange: (() => void) | null = null;
      onprogress: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = jest.fn();
      abort = jest.fn();
    }

    const xhr = new MockXHR();
    (globalThis as any).XMLHttpRequest = jest.fn(() => xhr);

    const onEvent = jest.fn();

    openAgentStream('run-crlf', { onEvent, onError: jest.fn() });

    xhr.responseText = 'data: {"type":"step","node":"crlf","label":"L","status":"running"}\r\n\r\n';
    xhr.onprogress?.();

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'step', node: 'crlf' }),
    );
  });
});
