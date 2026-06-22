type GlobalErrorEventName = 'error' | 'unhandledrejection';
type GlobalErrorEventListener = (event: Event) => void;
type LocationLike = Pick<Location, 'reload'>;
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type ModuleLoadErrorSource = GlobalErrorEventName;

export type ModuleLoadErrorRecoveryEvent = {
  source: ModuleLoadErrorSource;
  message: string;
  reloadAttempted: boolean;
  reloadAttemptsInWindow: number;
  maxReloadAttempts: number;
  reloadWindowMs: number;
};

export type ModuleLoadErrorListenerTarget = {
  addEventListener: (
    type: GlobalErrorEventName,
    listener: GlobalErrorEventListener,
  ) => void;
  location?: LocationLike;
  sessionStorage?: StorageLike;
};

export type ModuleLoadErrorListenerOptions = {
  target?: ModuleLoadErrorListenerTarget;
  reload?: () => void;
  now?: () => number;
  storageKey?: string;
  maxReloadAttempts?: number;
  reloadWindowMs?: number;
  onRecover?: (event: ModuleLoadErrorRecoveryEvent) => void;
};

const DEFAULT_STORAGE_KEY = 'appreg:module-load-error-reloads';
const DEFAULT_MAX_RELOAD_ATTEMPTS = 2;
const DEFAULT_RELOAD_WINDOW_MS = 60_000;

const MODULE_LOAD_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /error loading dynamically imported module/i,
  /Failed to fetch dynamically imported module/i,
  /Failed to load module script/i,
  /net::ERR_(ABORTED|CONNECTION|NETWORK|FAILED|HTTP2.*)/i,
];

let listenersInstalled = false;
let storageUnavailable = false;
let inMemoryReloadAttempts: number[] = [];

export function installGlobalModuleLoadErrorListeners(
  options: ModuleLoadErrorListenerOptions = {},
): boolean {
  if (listenersInstalled) {
    return false;
  }

  const target = options.target ?? getBrowserTarget();
  if (!target) {
    return false;
  }

  target.addEventListener('error', (event) => {
    const errorEvent = event as ErrorEvent;
    handleModuleLoadError(
      'error',
      [errorEvent.error, errorEvent.message, errorEvent.filename],
      {
        target,
        options,
      },
    );
  });

  target.addEventListener('unhandledrejection', (event) => {
    const promiseEvent = event as PromiseRejectionEvent;
    handleModuleLoadError('unhandledrejection', promiseEvent.reason, {
      target,
      options,
    });
  });

  listenersInstalled = true;
  return true;
}

export function isModuleLoadError(value: unknown): boolean {
  const message = collectErrorText(value);

  return MODULE_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function resetGlobalModuleLoadErrorListenersForTesting(): void {
  listenersInstalled = false;
  storageUnavailable = false;
  inMemoryReloadAttempts = [];
}

function getBrowserTarget(): ModuleLoadErrorListenerTarget | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return {
    addEventListener: (type, listener) =>
      window.addEventListener(type, listener),
    get location() {
      return window.location;
    },
    get sessionStorage() {
      return window.sessionStorage;
    },
  };
}

function handleModuleLoadError(
  source: ModuleLoadErrorSource,
  value: unknown,
  context: {
    target: ModuleLoadErrorListenerTarget;
    options: ModuleLoadErrorListenerOptions;
  },
): void {
  const message = collectErrorText(value);
  if (!isModuleLoadError(message)) {
    return;
  }

  const guard = reserveReloadAttempt(context.target, context.options);

  context.options.onRecover?.({
    source,
    message,
    reloadAttempted: guard.allowed,
    reloadAttemptsInWindow: guard.reloadAttemptsInWindow,
    maxReloadAttempts:
      context.options.maxReloadAttempts ?? DEFAULT_MAX_RELOAD_ATTEMPTS,
    reloadWindowMs: context.options.reloadWindowMs ?? DEFAULT_RELOAD_WINDOW_MS,
  });

  if (!guard.allowed) {
    return;
  }

  const reload =
    context.options.reload ?? (() => context.target.location?.reload());
  reload();
}

function reserveReloadAttempt(
  target: ModuleLoadErrorListenerTarget,
  options: ModuleLoadErrorListenerOptions,
): {
  allowed: boolean;
  reloadAttemptsInWindow: number;
} {
  const now = options.now?.() ?? Date.now();
  const reloadWindowMs = options.reloadWindowMs ?? DEFAULT_RELOAD_WINDOW_MS;
  const maxReloadAttempts =
    options.maxReloadAttempts ?? DEFAULT_MAX_RELOAD_ATTEMPTS;
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const recentAttempts = readReloadAttempts(target, storageKey).filter(
    (timestamp) => now - timestamp < reloadWindowMs,
  );

  if (recentAttempts.length >= maxReloadAttempts) {
    writeReloadAttempts(target, storageKey, recentAttempts);

    return {
      allowed: false,
      reloadAttemptsInWindow: recentAttempts.length,
    };
  }

  const nextAttempts = [...recentAttempts, now];
  writeReloadAttempts(target, storageKey, nextAttempts);

  return {
    allowed: true,
    reloadAttemptsInWindow: nextAttempts.length,
  };
}

function readReloadAttempts(
  target: ModuleLoadErrorListenerTarget,
  storageKey: string,
): number[] {
  const storage = getSessionStorage(target);
  if (!storage) {
    return inMemoryReloadAttempts;
  }

  let storedAttempts: string | null;
  try {
    storedAttempts = storage.getItem(storageKey);
  } catch {
    storageUnavailable = true;
    return inMemoryReloadAttempts;
  }

  if (!storedAttempts) {
    return [];
  }

  try {
    return sanitiseReloadAttempts(JSON.parse(storedAttempts));
  } catch {
    try {
      storage.removeItem(storageKey);
    } catch {
      storageUnavailable = true;
    }

    return [];
  }
}

function writeReloadAttempts(
  target: ModuleLoadErrorListenerTarget,
  storageKey: string,
  attempts: number[],
): void {
  const storage = getSessionStorage(target);
  inMemoryReloadAttempts = attempts;

  if (!storage) {
    return;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(attempts));
  } catch {
    storageUnavailable = true;
  }
}

function getSessionStorage(
  target: ModuleLoadErrorListenerTarget,
): StorageLike | undefined {
  if (storageUnavailable) {
    return undefined;
  }

  try {
    return target.sessionStorage;
  } catch {
    storageUnavailable = true;
    return undefined;
  }
}

function sanitiseReloadAttempts(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (timestamp): timestamp is number =>
      typeof timestamp === 'number' && Number.isFinite(timestamp),
  );
}

function collectErrorText(value: unknown): string {
  const parts = new Set<string>();
  appendErrorText(value, parts);

  return Array.from(parts).join(' ');
}

function appendErrorText(value: unknown, parts: Set<string>): void {
  if (!value) {
    return;
  }

  if (typeof value === 'string') {
    parts.add(value);
    return;
  }

  if (value instanceof Error) {
    parts.add(value.name);
    parts.add(value.message);

    if (value.stack) {
      parts.add(value.stack);
    }

    if (value.cause) {
      appendErrorText(value.cause, parts);
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendErrorText(item, parts));
    return;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    appendErrorText(record['name'], parts);
    appendErrorText(record['message'], parts);
    appendErrorText(record['reason'], parts);
    appendErrorText(record['error'], parts);
    appendErrorText(record['stack'], parts);
  }
}
