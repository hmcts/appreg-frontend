import { type WritableSignal, computed, effect, signal } from '@angular/core';
import { Observable } from 'rxjs';

// Small helper for consistent signal-backed view models.
export const createSignalState = <T extends object>(
  initial: T,
): {
  state: WritableSignal<T>;
  vm: () => T;
  patch: (patch: Partial<T>) => void;
} => {
  const state = signal<T>(initial);
  const vm = computed(() => state());
  const patch = (p: Partial<T>): void => {
    state.update((current) => ({ ...current, ...p }));
  };

  return { state, vm, patch };
};

interface LoadEffectOptions<TParams, TResponse> {
  // Signal getter used to trigger the effect when params change
  request: () => TParams | null;
  load: (params: TParams) => Observable<TResponse>;
  onSuccess: (response: TResponse) => void | Promise<void>;
  onError: (err: unknown) => void | Promise<void>;
}

// Signal driven request helper
export const setupLoadEffect = <TParams, TResponse>(
  options: LoadEffectOptions<TParams, TResponse>,
): void => {
  effect((onCleanup) => {
    const params = options.request();
    if (!params) {
      return;
    }

    const sub = options.load(params).subscribe({
      next: (response) => {
        const result = options.onSuccess(response);
        if (result && typeof result.then === 'function') {
          result.catch(() => undefined);
        }
      },
      error: (err) => {
        const result = options.onError(err);
        if (result && typeof result.then === 'function') {
          result.catch(() => undefined);
        }
      },
    });

    onCleanup(() => sub.unsubscribe());
  });
};
