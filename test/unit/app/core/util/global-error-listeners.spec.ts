import {
  type ModuleLoadErrorListenerTarget,
  installGlobalModuleLoadErrorListeners,
  isModuleLoadError,
  resetGlobalModuleLoadErrorListenersForTesting,
} from '@util/global-error-listeners';

type ListenerMap = {
  error: Array<(event: Event) => void>;
  unhandledrejection: Array<(event: Event) => void>;
};

describe('global module load error listeners', () => {
  beforeEach(() => {
    resetGlobalModuleLoadErrorListenersForTesting();
  });

  afterEach(() => {
    resetGlobalModuleLoadErrorListenersForTesting();
  });

  it('installs the browser listeners only once', () => {
    const fixture = createFixture();

    expect(installGlobalModuleLoadErrorListeners(fixture.options())).toBe(true);
    expect(installGlobalModuleLoadErrorListeners(fixture.options())).toBe(
      false,
    );

    expect(fixture.addEventListener).toHaveBeenCalledTimes(2);
    expect(fixture.listeners.error).toHaveLength(1);
    expect(fixture.listeners.unhandledrejection).toHaveLength(1);
  });

  it('reloads for ChunkLoadError errors', () => {
    const fixture = createFixture();
    const error = new Error('ChunkLoadError: Loading chunk 123 failed.');
    error.name = 'ChunkLoadError';

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError(error.message, error);

    expect(fixture.reload).toHaveBeenCalledTimes(1);
  });

  it('reloads when loading a chunk fails', () => {
    const fixture = createFixture();

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError('Loading chunk reports failed.');

    expect(fixture.reload).toHaveBeenCalledTimes(1);
  });

  it('reloads when a dynamically imported module cannot be fetched', () => {
    const fixture = createFixture();

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError(
      'Failed to fetch dynamically imported module: /assets/reports.js',
    );

    expect(fixture.reload).toHaveBeenCalledTimes(1);
  });

  it('reloads when a module script cannot be loaded', () => {
    const fixture = createFixture();

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError(
      'Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".',
    );

    expect(fixture.reload).toHaveBeenCalledTimes(1);
  });

  it('reloads for unhandled promise rejections caused by dynamic import failures', () => {
    const fixture = createFixture();

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitUnhandledRejection(
      new Error('error loading dynamically imported module: /assets/main.js'),
    );

    expect(fixture.reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload for non-matching errors', () => {
    const fixture = createFixture();

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError('Cannot read properties of undefined');
    fixture.emitUnhandledRejection(new Error('Request failed with status 500'));

    expect(fixture.reload).not.toHaveBeenCalled();
  });

  it('stops reloading after the guard threshold is reached', () => {
    const fixture = createFixture();

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError('ChunkLoadError');
    fixture.advanceTimeBy(1_000);
    fixture.emitError('ChunkLoadError');
    fixture.advanceTimeBy(1_000);
    fixture.emitError('ChunkLoadError');

    expect(fixture.reload).toHaveBeenCalledTimes(2);
    expect(fixture.storage.getItem(fixture.storageKey)).toBe(
      JSON.stringify([1_000, 2_000]),
    );
  });

  it('uses stored attempts to guard reload loops across page reloads', () => {
    const fixture = createFixture({
      storedAttempts: [1_000, 2_000],
      now: 3_000,
    });

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError('Loading chunk reports failed.');

    expect(fixture.reload).not.toHaveBeenCalled();
  });

  it('allows reloading again after the guard window expires', () => {
    const fixture = createFixture({
      storedAttempts: [1_000, 2_000],
      now: 62_001,
    });

    installGlobalModuleLoadErrorListeners(fixture.options());
    fixture.emitError('Loading chunk reports failed.');

    expect(fixture.reload).toHaveBeenCalledTimes(1);
    expect(fixture.storage.getItem(fixture.storageKey)).toBe(
      JSON.stringify([62_001]),
    );
  });

  it('matches the expected module load failure message variants', () => {
    expect(isModuleLoadError('net::ERR_HTTP2_PROTOCOL_ERROR')).toBe(true);
    expect(isModuleLoadError('net::ERR_CONNECTION_RESET')).toBe(true);
    expect(isModuleLoadError('Validation failed')).toBe(false);
  });
});

function createFixture(
  options: {
    storedAttempts?: number[];
    now?: number;
  } = {},
): {
  addEventListener: jest.Mock;
  advanceTimeBy: (milliseconds: number) => void;
  emitError: (message: string, error?: unknown) => void;
  emitUnhandledRejection: (reason: unknown) => void;
  listeners: ListenerMap;
  options: () => Parameters<typeof installGlobalModuleLoadErrorListeners>[0];
  reload: jest.Mock;
  storage: StorageLike;
  storageKey: string;
} {
  const listeners: ListenerMap = {
    error: [],
    unhandledrejection: [],
  };
  const storageKey = 'module-load-test-reloads';
  const storage = createStorage();
  const reload = jest.fn();
  let now = options.now ?? 1_000;

  if (options.storedAttempts) {
    storage.setItem(storageKey, JSON.stringify(options.storedAttempts));
  }

  const addEventListener = jest.fn(
    (
      type: keyof ListenerMap,
      listener: Parameters<
        ModuleLoadErrorListenerTarget['addEventListener']
      >[1],
    ) => {
      listeners[type].push(listener);
    },
  );

  return {
    addEventListener,
    advanceTimeBy: (milliseconds) => {
      now += milliseconds;
    },
    emitError: (message, error = message) => {
      listeners.error.forEach((listener) =>
        listener({ error, message } as ErrorEvent),
      );
    },
    emitUnhandledRejection: (reason) => {
      listeners.unhandledrejection.forEach((listener) =>
        listener({ reason } as PromiseRejectionEvent),
      );
    },
    listeners,
    options: () => ({
      maxReloadAttempts: 2,
      now: () => now,
      reload,
      reloadWindowMs: 60_000,
      storageKey,
      target: {
        addEventListener,
        location: {
          reload,
        },
        sessionStorage: storage,
      },
    }),
    reload,
    storage,
    storageKey,
  };
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function createStorage(): StorageLike {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
