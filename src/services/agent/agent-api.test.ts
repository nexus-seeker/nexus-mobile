import { openAgentStream } from './agent-api';

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
});
