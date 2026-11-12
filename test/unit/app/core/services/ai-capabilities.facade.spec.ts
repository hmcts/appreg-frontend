import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { AiApi, AiCapabilitiesDto } from '@openapi';
import { AiCapabilitiesFacade } from '@services/ai-capabilities.facade';

describe('AiCapabilitiesFacade', () => {
  let getAiCapabilities: jest.Mock;

  const bothOn: AiCapabilitiesDto = {
    searchInterpretation: true,
    codeSuggestions: true,
  };

  const setup = (platformId: 'browser' | 'server' = 'browser') => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: AiApi, useValue: { getAiCapabilities } },
      ],
    });

    return TestBed.inject(AiCapabilitiesFacade);
  };

  const enabled = (facade: AiCapabilitiesFacade) => ({
    searchInterpretation: facade.searchInterpretationEnabled(),
    codeSuggestions: facade.codeSuggestionsEnabled(),
  });

  beforeEach(() => {
    getAiCapabilities = jest.fn().mockReturnValue(of(bothOn));
  });

  it('does not request capabilities before refresh is called', fakeAsync(() => {
    const facade = setup();
    tick();

    expect(getAiCapabilities).not.toHaveBeenCalled();
    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: false,
    });
  }));

  it('loads both features after refresh', fakeAsync(() => {
    const facade = setup();

    facade.refresh();
    tick();

    expect(getAiCapabilities).toHaveBeenCalledTimes(1);
    expect(getAiCapabilities).toHaveBeenCalledWith('body', false, {
      transferCache: false,
    });
    expect(enabled(facade)).toEqual({
      searchInterpretation: true,
      codeSuggestions: true,
    });
  }));

  it('turns on only the feature the server enables', fakeAsync(() => {
    getAiCapabilities.mockReturnValue(
      of({ searchInterpretation: false, codeSuggestions: true }),
    );
    const facade = setup();

    facade.refresh();
    tick();

    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: true,
    });
  }));

  it('requests again on every refresh so the kill switch applies on the next visit', fakeAsync(() => {
    const facade = setup();
    facade.refresh();
    tick();
    expect(enabled(facade)).toEqual({
      searchInterpretation: true,
      codeSuggestions: true,
    });

    getAiCapabilities.mockReturnValue(
      of({ searchInterpretation: false, codeSuggestions: false }),
    );
    facade.refresh();
    tick();

    expect(getAiCapabilities).toHaveBeenCalledTimes(2);
    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: false,
    });
  }));

  it('keeps both features off while a refresh is in flight', fakeAsync(() => {
    const facade = setup();
    facade.refresh();
    tick();
    expect(enabled(facade)).toEqual({
      searchInterpretation: true,
      codeSuggestions: true,
    });

    const pending = new Subject<AiCapabilitiesDto>();
    getAiCapabilities.mockReturnValue(pending);
    facade.refresh();

    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: false,
    });

    tick();
    expect(getAiCapabilities).toHaveBeenCalledTimes(2);
    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: false,
    });

    pending.next(bothOn);
    pending.complete();

    expect(enabled(facade)).toEqual({
      searchInterpretation: true,
      codeSuggestions: true,
    });
  }));

  it('cancels the earlier request when refreshed again before it answers', fakeAsync(() => {
    const older = new Subject<AiCapabilitiesDto>();
    const newer = new Subject<AiCapabilitiesDto>();
    getAiCapabilities.mockReturnValueOnce(older).mockReturnValueOnce(newer);
    const facade = setup();

    facade.refresh();
    tick();
    expect(older.observed).toBe(true);

    facade.refresh();
    tick();

    expect(getAiCapabilities).toHaveBeenCalledTimes(2);
    expect(older.observed).toBe(false);

    newer.next({ searchInterpretation: false, codeSuggestions: true });

    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: true,
    });
  }));

  it('ignores a response to an older refresh that arrives before the newer request starts', fakeAsync(() => {
    const older = new Subject<AiCapabilitiesDto>();
    const newer = new Subject<AiCapabilitiesDto>();
    getAiCapabilities.mockReturnValueOnce(older).mockReturnValueOnce(newer);
    const facade = setup();

    facade.refresh();
    tick();
    facade.refresh();
    older.next(bothOn);

    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: false,
    });

    tick();
    newer.next({ searchInterpretation: true, codeSuggestions: false });

    expect(enabled(facade)).toEqual({
      searchInterpretation: true,
      codeSuggestions: false,
    });
  }));

  it.each([0, 401, 403, 404, 500, 503, 504])(
    'turns both features off when the request fails with status %i',
    fakeAsync((status: number) => {
      const facade = setup();
      facade.refresh();
      tick();
      expect(enabled(facade)).toEqual({
        searchInterpretation: true,
        codeSuggestions: true,
      });

      getAiCapabilities.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status,
              url: 'https://local/ai/capabilities',
            }),
        ),
      );
      facade.refresh();
      tick();

      expect(enabled(facade)).toEqual({
        searchInterpretation: false,
        codeSuggestions: false,
      });
    }),
  );

  it.each<[string, unknown]>([
    ['an empty body', null],
    ['missing flags', {}],
    ['null flags', { searchInterpretation: null, codeSuggestions: null }],
    ['non-boolean flags', { searchInterpretation: 'true', codeSuggestions: 1 }],
  ])(
    'counts a flag as off when the response has %s',
    fakeAsync((_label: string, body: unknown) => {
      getAiCapabilities.mockReturnValue(of(body));
      const facade = setup();

      facade.refresh();
      tick();

      expect(getAiCapabilities).toHaveBeenCalledTimes(1);
      expect(enabled(facade)).toEqual({
        searchInterpretation: false,
        codeSuggestions: false,
      });
    }),
  );

  it('counts only the missing flag as off when the other flag is on', fakeAsync(() => {
    getAiCapabilities.mockReturnValue(of({ searchInterpretation: true }));
    const facade = setup();

    facade.refresh();
    tick();

    expect(enabled(facade)).toEqual({
      searchInterpretation: true,
      codeSuggestions: false,
    });
  }));

  it('does not request capabilities during server-side rendering', fakeAsync(() => {
    const facade = setup('server');

    facade.refresh();
    tick();

    expect(getAiCapabilities).not.toHaveBeenCalled();
    expect(enabled(facade)).toEqual({
      searchInterpretation: false,
      codeSuggestions: false,
    });
  }));
});
