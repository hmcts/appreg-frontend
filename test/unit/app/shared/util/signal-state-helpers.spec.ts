import { signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';

describe('signal-state-helpers', () => {
  it('createSignalState patches values', () => {
    const { state, vm, patch } = createSignalState({ a: 1, b: 2 });

    expect(state()).toEqual({ a: 1, b: 2 });
    patch({ b: 3 });
    expect(state()).toEqual({ a: 1, b: 3 });
    expect(vm()).toEqual({ a: 1, b: 3 });
  });

  it('setupLoadEffect triggers onSuccess when request is set', fakeAsync(() => {
    TestBed.configureTestingModule({});

    const request = signal<number | null>(null);
    const load = jest.fn(() => of('ok'));
    const onSuccess = jest.fn();
    const onError = jest.fn();

    TestBed.runInInjectionContext(() => {
      setupLoadEffect({ request, load, onSuccess, onError });
    });

    request.set(123);
    tick();

    expect(load).toHaveBeenCalledWith(123);
    expect(onSuccess).toHaveBeenCalledWith('ok');
    expect(onError).not.toHaveBeenCalled();
  }));

  it('setupLoadEffect triggers onError when load fails', fakeAsync(() => {
    TestBed.configureTestingModule({});

    const request = signal<string | null>(null);
    const load = jest.fn(() => throwError(() => new Error('fail')));
    const onSuccess = jest.fn();
    const onError = jest.fn();

    TestBed.runInInjectionContext(() => {
      setupLoadEffect({ request, load, onSuccess, onError });
    });

    request.set('abc');
    tick();

    expect(load).toHaveBeenCalledWith('abc');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  }));
});
