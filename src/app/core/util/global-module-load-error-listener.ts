type ModuleLoadErrorEventName = 'error' | 'unhandledrejection';

type ModuleLoadErrorListenerTarget = {
  addEventListener: (
    type: ModuleLoadErrorEventName,
    listener: (event: Event) => void,
  ) => void;
  location: Pick<Location, 'reload'>;
  sessionStorage?: Storage;
};

export type ModuleLoadRecoveryEvent = {
  attemptsInWindow: number;
  errorType: string;
  maxAttempts: number;
  reloadAttempted: boolean;
  windowMs: number;
};

type GlobalModuleLoadErrorListenerOptions = {
  logRecovery?: (event: ModuleLoadRecoveryEvent) => void;
  now?: () => number;
  target?: ModuleLoadErrorListenerTarget;
};

type StoredReloadAttempts = {
  attempts: number[];
  storageAvailable: boolean;
};

const RELOAD_ATTEMPT_STORAGE_KEY = 'appreg.moduleLoadErrorReloadAttempts';
const RELOAD_ATTEMPT_WINDOW_MS = 60_000;
const MAX_RELOAD_ATTEMPTS = 2;

const MODULE_LOAD_ERROR_PATTERNS: readonly {
  errorType: string;
  pattern: RegExp;
}[] = [
  { errorType: 'ChunkLoadError', pattern: /ChunkLoadError/i },
  {
    errorType: 'Loading chunk failed',
    pattern: /Loading chunk [\w-]+ failed/i,
  },
  {
    errorType: 'Dynamic import load error',
    pattern: /error loading dynamically imported module/i,
  },
  {
    errorType: 'Dynamic import fetch failed',
    pattern: /Failed to fetch dynamically imported module/i,
  },
  {
    errorType: 'Module script load failed',
    pattern: /Failed to load module script/i,
  },
  {
    errorType: 'Network module load failure',
    pattern: /net::ERR_(ABORTED|CONNECTION|NETWORK|FAILED|HTTP2.*)/i,
  },
];

let installed = false;
let inMemoryReloadAttempts: number[] = [];

export function installGlobalModuleLoadErrorListener(
  options: GlobalModuleLoadErrorListenerOptions = {},
): boolean {
  const target = options.target ?? getDefaultTarget();

  if (!target || installed) {
    return false;
  }

  installed = true;

  target.addEventListener('error', (event) => {
    handleModuleLoadError(event, target, options);
  });
  target.addEventListener('unhandledrejection', (event) => {
    handleModuleLoadError(event, target, options);
  });

  return true;
}

export function resetGlobalModuleLoadErrorListenerForTesting(): void {
  installed = false;
  inMemoryReloadAttempts = [];
}

function handleModuleLoadError(
  event: Event,
  target: ModuleLoadErrorListenerTarget,
  options: GlobalModuleLoadErrorListenerOptions,
): void {
  const errorText = toErrorText(event);
  const errorType = getModuleLoadErrorType(errorText);

  if (!errorType) {
    return;
  }

  const now = options.now?.() ?? Date.now();
  const reloadDecision = getReloadDecision(target, now);

  logRecovery(options.logRecovery, {
    attemptsInWindow: reloadDecision.attemptsInWindow,
    errorType,
    maxAttempts: MAX_RELOAD_ATTEMPTS,
    reloadAttempted: reloadDecision.reloadAllowed,
    windowMs: RELOAD_ATTEMPT_WINDOW_MS,
  });

  if (!reloadDecision.reloadAllowed) {
    return;
  }

  target.location.reload();
}

function getModuleLoadErrorType(errorText: string): string | undefined {
  const match = MODULE_LOAD_ERROR_PATTERNS.find(({ pattern }) =>
    pattern.test(errorText),
  );

  return match?.errorType;
}

function getReloadDecision(
  target: ModuleLoadErrorListenerTarget,
  now: number,
): {
  attemptsInWindow: number;
  reloadAllowed: boolean;
} {
  const storage = getSessionStorage(target);
  const storedAttempts = getReloadAttempts(storage);
  const persistableStorage = storedAttempts.storageAvailable
    ? storage
    : undefined;
  const attempts = storedAttempts.attempts.filter(
    (timestamp) => now - timestamp < RELOAD_ATTEMPT_WINDOW_MS,
  );

  if (attempts.length >= MAX_RELOAD_ATTEMPTS) {
    storeReloadAttempts(persistableStorage, attempts);

    return {
      attemptsInWindow: attempts.length,
      reloadAllowed: false,
    };
  }

  attempts.push(now);
  const attemptsPersisted = storeReloadAttempts(persistableStorage, attempts);

  return {
    attemptsInWindow: attempts.length,
    reloadAllowed: attemptsPersisted,
  };
}

function getReloadAttempts(storage: Storage | undefined): StoredReloadAttempts {
  const storedAttempts = readStoredReloadAttempts(storage);

  if (storedAttempts.attempts.length > 0) {
    return storedAttempts;
  }

  return {
    attempts: [...inMemoryReloadAttempts],
    storageAvailable: storedAttempts.storageAvailable,
  };
}

function readStoredReloadAttempts(
  storage: Storage | undefined,
): StoredReloadAttempts {
  if (!storage) {
    return {
      attempts: [],
      storageAvailable: false,
    };
  }

  let value: string | null;

  try {
    value = storage.getItem(RELOAD_ATTEMPT_STORAGE_KEY);
  } catch {
    return {
      attempts: [],
      storageAvailable: false,
    };
  }

  if (!value) {
    return {
      attempts: [],
      storageAvailable: true,
    };
  }

  try {
    const parsed = parseJson(value);

    if (isUnknownArray(parsed)) {
      return {
        attempts: parsed.filter(
          (timestamp): timestamp is number =>
            typeof timestamp === 'number' && Number.isFinite(timestamp),
        ),
        storageAvailable: true,
      };
    }
  } catch {
    return {
      attempts: [],
      storageAvailable: true,
    };
  }

  return {
    attempts: [],
    storageAvailable: true,
  };
}

function storeReloadAttempts(
  storage: Storage | undefined,
  attempts: number[],
): boolean {
  inMemoryReloadAttempts = attempts;

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(RELOAD_ATTEMPT_STORAGE_KEY, JSON.stringify(attempts));
    return true;
  } catch {
    // Avoid reloads unless the cap can survive the reload.
    return false;
  }
}

function getSessionStorage(
  target: ModuleLoadErrorListenerTarget,
): Storage | undefined {
  try {
    return target.sessionStorage;
  } catch {
    return undefined;
  }
}

function logRecovery(
  logRecoveryCallback: ((event: ModuleLoadRecoveryEvent) => void) | undefined,
  event: ModuleLoadRecoveryEvent,
): void {
  try {
    logRecoveryCallback?.(event);
  } catch {
    // Telemetry failures must not block recovery from a stale frontend bundle.
  }
}

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function toErrorText(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return [value.name, value.message, value.stack].filter(Boolean).join(' ');
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value.toString();
  }

  if (typeof value === 'symbol') {
    return value.description ?? '';
  }

  if (typeof value === 'function') {
    return value.name;
  }

  if (seen.has(value)) {
    return '';
  }

  seen.add(value);

  const errorLike = value as Record<string, unknown>;

  return ['name', 'message', 'filename', 'error', 'reason', 'stack']
    .map((key) => toErrorText(errorLike[key], seen))
    .filter(Boolean)
    .join(' ');
}

function getDefaultTarget(): ModuleLoadErrorListenerTarget | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window;
}
