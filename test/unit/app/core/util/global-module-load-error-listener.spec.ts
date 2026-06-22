import {
  ModuleLoadRecoveryEvent,
  installGlobalModuleLoadErrorListener,
  resetGlobalModuleLoadErrorListenerForTesting,
} from '@util/global-module-load-error-listener';

type ListenerType = 'error' | 'unhandledrejection';
type TestListener = (event: Event) => void;

const windowErrorCases: Array<[string, Record<string, unknown>, string]> = [
  [
    'ChunkLoadError',
    {
      error: createNamedError(
        'ChunkLoadError',
        'Loading chunk applications-list failed.',
      ),
    },
    'ChunkLoadError',
  ],
  [
    'Loading chunk ... failed',
    { message: 'Loading chunk 123-a failed.' },
    'Loading chunk failed',
  ],
  [
    'Failed to fetch dynamically imported module',
    {
      message:
        'TypeError: Failed to fetch dynamically imported module: /chunk.js',
    },
    'Dynamic import fetch failed',
  ],
  [
    'Failed to load module script',
    {
      message:
        'Failed to load module script: Expected a JavaScript module script ' +
        'but the server responded with a MIME type of "text/html".',
    },
    'Module script load failed',
  ],
  [
    'error loading dynamically imported module',
    { message: 'TypeError: error loading dynamically imported module' },
    'Dynamic import load error',
  ],
  [
    'network module load failure',
    { message: 'GET /chunk.js net::ERR_NETWORK_CHANGED' },
    'Network module load failure',
  ],
];

describe('installGlobalModuleLoadErrorListener', () => {
  let currentTime: number;
  let listeners: Record<ListenerType, TestListener[]>;
  let logRecovery: jest.Mock<void, [ModuleLoadRecoveryEvent]>;
  let reload: jest.Mock;
  let target: {
    addEventListener: jest.Mock;
    location: { reload: jest.Mock };
    sessionStorage: Storage;
  };

  beforeEach(() => {
    currentTime = 1_000;
    listeners = {
      error: [],
      unhandledrejection: [],
    };
    logRecovery = jest.fn();
    reload = jest.fn();
    target = {
      addEventListener: jest.fn(
        (type: ListenerType, listener: TestListener) => {
          listeners[type].push(listener);
        },
      ),
      location: { reload },
      sessionStorage: createStorage(),
    };
  });

  afterEach(() => {
    resetGlobalModuleLoadErrorListenerForTesting();
  });

  it('installs window error and unhandled rejection listeners once', () => {
    expect(installListener()).toBe(true);
    expect(installListener()).toBe(false);

    expect(target.addEventListener).toHaveBeenCalledTimes(2);
    expect(target.addEventListener).toHaveBeenNthCalledWith(
      1,
      'error',
      expect.any(Function),
    );
    expect(target.addEventListener).toHaveBeenNthCalledWith(
      2,
      'unhandledrejection',
      expect.any(Function),
    );
  });

  it.each(windowErrorCases)(
    'reloads for %s from window error',
    (_name, event, errorType) => {
      installListener();

      emit('error', event);

      expect(reload).toHaveBeenCalledTimes(1);
      expect(logRecovery).toHaveBeenCalledWith({
        attemptsInWindow: 1,
        errorType,
        maxAttempts: 2,
        reloadAttempted: true,
        windowMs: 60_000,
      });
    },
  );

  it('reloads for a matching unhandled promise rejection', () => {
    installListener();

    emit('unhandledrejection', {
      reason: new Error(
        'Failed to fetch dynamically imported module: /chunk.js',
      ),
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(logRecovery).toHaveBeenCalledWith(
      expect.objectContaining({
        errorType: 'Dynamic import fetch failed',
        reloadAttempted: true,
      }),
    );
  });

  it('does not reload for non-matching errors', () => {
    installListener();

    emit('error', { message: 'ResizeObserver loop completed with errors' });
    emit('unhandledrejection', { reason: new Error('Validation failed') });

    expect(reload).not.toHaveBeenCalled();
    expect(logRecovery).not.toHaveBeenCalled();
  });

  it('stops reloading after two attempts within sixty seconds', () => {
    installListener();

    emit('error', { message: 'ChunkLoadError: first stale chunk' });
    currentTime += 1_000;
    emit('error', { message: 'ChunkLoadError: second stale chunk' });
    currentTime += 1_000;
    emit('error', { message: 'ChunkLoadError: third stale chunk' });

    expect(reload).toHaveBeenCalledTimes(2);
    expect(logRecovery).toHaveBeenLastCalledWith({
      attemptsInWindow: 2,
      errorType: 'ChunkLoadError',
      maxAttempts: 2,
      reloadAttempted: false,
      windowMs: 60_000,
    });

    currentTime += 61_000;
    emit('error', { message: 'ChunkLoadError: later stale chunk' });

    expect(reload).toHaveBeenCalledTimes(3);
    expect(logRecovery).toHaveBeenLastCalledWith({
      attemptsInWindow: 1,
      errorType: 'ChunkLoadError',
      maxAttempts: 2,
      reloadAttempted: true,
      windowMs: 60_000,
    });
  });

  function installListener(): boolean {
    return installGlobalModuleLoadErrorListener({
      logRecovery,
      now: () => currentTime,
      target,
    });
  }

  function emit(type: ListenerType, event: Record<string, unknown>): void {
    listeners[type].forEach((listener) => {
      listener(event as unknown as Event);
    });
  }
});

function createNamedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;

  return error;
}

function createStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length(): number {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}
