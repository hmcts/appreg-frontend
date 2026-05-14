import { Route } from '@angular/router';
import { of } from 'rxjs';

import { SelectivePreloadingStrategy } from '../../../../../../src/app/core/routing/selective-preloading.strategy';

describe('SelectivePreloadingStrategy', () => {
  let strategy: SelectivePreloadingStrategy;

  beforeEach(() => {
    strategy = new SelectivePreloadingStrategy();
  });

  it('preloads routes explicitly marked for preload', (done) => {
    const load = jest.fn(() => of('loaded'));
    const route: Route = { data: { preload: true } };

    strategy.preload(route, load).subscribe((value) => {
      expect(load).toHaveBeenCalledTimes(1);
      expect(value).toBe('loaded');
      done();
    });
  });

  it('skips routes without the preload flag', (done) => {
    const load = jest.fn(() => of('loaded'));
    const route: Route = {};

    strategy.preload(route, load).subscribe((value) => {
      expect(load).not.toHaveBeenCalled();
      expect(value).toBeNull();
      done();
    });
  });
});
