/**
 * Tests for the plain-English search panel: the question field, what is sent
 * (the question in the POST body only), the character limit, the fixed error
 * copy for each status, the live status and the emitted result, and the
 * page's clearError() and reset() (which also cancels a request in flight).
 *
 * All questions and values are synthetic.
 */

import {
  HttpErrorResponse,
  HttpHeaders,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import {
  PLAIN_ENGLISH_QUESTION_ID,
  PlainEnglishSearchComponent,
} from '@components/applications/plain-english-search/plain-english-search.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES,
  PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
} from '@constants/applications/error-messages';
import {
  BASE_PATH,
  SearchInterpretationDto,
  SearchInterpretationsApi,
} from '@openapi';

const QUESTION = 'open applications at synthetic court ZZ001 in March 2026';
const INTERPRETATIONS_PATH = '/application-list-entries/search-interpretations';
const UNAVAILABLE =
  'Plain-English search is unavailable. Use the filters below.';

const INTERPRETATION: SearchInterpretationDto = {
  interpretationId: '00000000-0000-4000-8000-000000000001',
  filter: { courtCode: 'ZZ001' },
  appliedFilters: [],
  choicesNeeded: [],
  unusedParts: [],
  notices: [],
};

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    url: INTERPRETATIONS_PATH,
    // Problem text the panel must never show
    error: { title: 'Synthetic problem title', detail: 'Synthetic detail' },
  });
}

describe('PlainEnglishSearchComponent', () => {
  let fixture: ComponentFixture<PlainEnglishSearchComponent>;
  let component: PlainEnglishSearchComponent;
  // An empty response body reaches the panel as null
  let interpretEntrySearch: jest.Mock<
    Observable<SearchInterpretationDto | null>
  >;
  let interpreted: SearchInterpretationDto[];
  let emittedErrors: ErrorItem[][];

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const textarea = (): HTMLTextAreaElement =>
    element().querySelector<HTMLTextAreaElement>(
      `#${PLAIN_ENGLISH_QUESTION_ID}`,
    )!;
  const button = (): HTMLButtonElement =>
    element().querySelector<HTMLButtonElement>('button')!;
  const statusRegion = (): HTMLElement =>
    element().querySelector<HTMLElement>('#plain-english-search-status')!;
  // The panel's own form group, round the label, AI hint and textarea (the
  // textarea has an inner form group of its own)
  const questionGroup = (): Element =>
    element()
      .querySelector(`#${PLAIN_ENGLISH_QUESTION_ID}-ai-hint`)!
      .closest('.govuk-form-group')!;
  const errorMessage = (): string | undefined =>
    element()
      .querySelector('.govuk-error-message')
      ?.textContent?.replace('Error:', '')
      .trim();

  const type = (value: string): void => {
    const field = textarea();
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const press = (): void => {
    button().click();
    fixture.detectChanges();
  };

  const createComponent = (): void => {
    fixture = TestBed.createComponent(PlainEnglishSearchComponent);
    component = fixture.componentInstance;
    interpreted = [];
    emittedErrors = [];
    component.interpreted.subscribe((value) => interpreted.push(value));
    component.errorsChange.subscribe((items) => emittedErrors.push(items));
    fixture.detectChanges();
  };

  describe('with a stubbed API', () => {
    beforeEach(async () => {
      interpretEntrySearch = jest.fn().mockReturnValue(of(INTERPRETATION));

      await TestBed.configureTestingModule({
        imports: [PlainEnglishSearchComponent],
        providers: [
          {
            provide: SearchInterpretationsApi,
            useValue: { interpretEntrySearch },
          },
        ],
      }).compileComponents();

      createComponent();
    });

    it('shows a labelled question field with the AI hint and a 300-character count', () => {
      const label = element().querySelector('label');
      const hint = element().querySelector(
        `#${PLAIN_ENGLISH_QUESTION_ID}-ai-hint`,
      );
      const count = element().querySelector(
        `#${PLAIN_ENGLISH_QUESTION_ID}-hint`,
      );

      expect(label?.getAttribute('for')).toBe(PLAIN_ENGLISH_QUESTION_ID);
      expect(label?.textContent?.trim()).toBe('Search in plain English');
      expect(hint?.textContent?.trim()).toBe(
        'AI-assisted. Check the filters before you search.',
      );
      expect(count?.textContent?.trim()).toBe(
        'You have 300 characters remaining',
      );
      expect(textarea().tagName).toBe('TEXTAREA');
      expect(textarea().getAttribute('aria-describedby')).toBe(
        `${PLAIN_ENGLISH_QUESTION_ID}-ai-hint ${PLAIN_ENGLISH_QUESTION_ID}-hint`,
      );
    });

    it('counts down the characters left as staff type', () => {
      type('a'.repeat(299));

      expect(
        element()
          .querySelector(`#${PLAIN_ENGLISH_QUESTION_ID}-hint`)
          ?.textContent?.trim(),
      ).toBe('You have 1 character remaining');
    });

    it('stops typing at 300 characters', () => {
      expect(textarea().getAttribute('maxlength')).toBe('300');
    });

    it('works by keyboard with a native textarea and button', () => {
      expect(textarea().tabIndex).toBe(0);
      expect(button().tagName).toBe('BUTTON');
      expect(button().type).toBe('button');
      expect(button().textContent?.trim()).toBe('Work out filters');
    });

    it('sends the trimmed question in the POST body with transferCache off', () => {
      type(`  ${QUESTION}\n`);
      press();

      expect(interpretEntrySearch).toHaveBeenCalledTimes(1);
      expect(interpretEntrySearch).toHaveBeenCalledWith(
        { searchInterpretationRequestDto: { question: QUESTION } },
        'body',
        false,
        { transferCache: false },
      );
    });

    it('emits the interpretation without applying it', () => {
      type(QUESTION);
      press();

      expect(interpreted).toEqual([INTERPRETATION]);
      expect(emittedErrors).toEqual([[]]);
      expect(errorMessage()).toBeUndefined();
    });

    it.each([
      ['empty', ''],
      ['only spaces', '   '],
      ['only line breaks and tabs', '\n\t\n'],
    ])('blocks a question that is %s with an error', (_name, value) => {
      type(value);
      press();

      expect(interpretEntrySearch).not.toHaveBeenCalled();
      expect(interpreted).toEqual([]);
      expect(errorMessage()).toBe('Enter a question');
      expect(emittedErrors).toEqual([
        [
          {
            id: PLAIN_ENGLISH_QUESTION_ID,
            href: `#${PLAIN_ENGLISH_QUESTION_ID}`,
            text: 'Enter a question',
          },
        ],
      ]);
      expect(textarea().getAttribute('aria-invalid')).toBe('true');
      expect(textarea().getAttribute('aria-describedby')).toContain(
        `${PLAIN_ENGLISH_QUESTION_ID}-error`,
      );
      expect(questionGroup().classList).toContain('govuk-form-group--error');
    });

    it('does not send a question over 300 characters', () => {
      // The textarea stops typing at 300, so set the control directly
      component.question.setValue('a'.repeat(301));
      press();

      expect(interpretEntrySearch).not.toHaveBeenCalled();
      expect(errorMessage()).toBe('Question must be 300 characters or fewer');
      expect(emittedErrors).toEqual([
        [
          {
            id: PLAIN_ENGLISH_QUESTION_ID,
            href: `#${PLAIN_ENGLISH_QUESTION_ID}`,
            text: 'Question must be 300 characters or fewer',
          },
        ],
      ]);
    });

    it('sends a question of exactly 300 characters', () => {
      const question = 'a'.repeat(300);
      component.question.setValue(` ${question} `);
      press();

      expect(interpretEntrySearch).toHaveBeenCalledWith(
        { searchInterpretationRequestDto: { question } },
        'body',
        false,
        { transferCache: false },
      );
    });

    it('says it is working out filters in a polite live region, then that it has finished', () => {
      const response = new Subject<SearchInterpretationDto>();
      interpretEntrySearch.mockReturnValue(response);

      expect(statusRegion().getAttribute('aria-live')).toBe('polite');
      expect(statusRegion().textContent?.trim()).toBe('');

      type(QUESTION);
      press();

      expect(statusRegion().textContent?.trim()).toBe('Working out filters…');

      response.next(INTERPRETATION);
      response.complete();
      fixture.detectChanges();

      expect(statusRegion().textContent?.trim()).toBe(
        'Finished working out filters. Check them before you search.',
      );
    });

    it('ignores presses while a request is running', () => {
      interpretEntrySearch.mockReturnValue(new Subject());
      type(QUESTION);

      press();
      press();

      expect(interpretEntrySearch).toHaveBeenCalledTimes(1);
      expect(emittedErrors).toEqual([[]]);
    });

    it.each([
      [0, UNAVAILABLE],
      [400, UNAVAILABLE],
      [403, UNAVAILABLE],
      [404, UNAVAILABLE],
      [422, 'We could not work out any filters from your question.'],
      [429, 'You have made too many requests. Try again in a minute.'],
      [500, UNAVAILABLE],
      [502, UNAVAILABLE],
      [503, UNAVAILABLE],
      [504, UNAVAILABLE],
    ])('shows fixed copy for a %s error', (status, text) => {
      interpretEntrySearch.mockReturnValue(throwError(() => httpError(status)));
      type(QUESTION);
      press();

      expect(errorMessage()).toBe(text);
      expect(emittedErrors).toEqual([
        [],
        [
          {
            id: PLAIN_ENGLISH_QUESTION_ID,
            href: `#${PLAIN_ENGLISH_QUESTION_ID}`,
            text,
          },
        ],
      ]);
      expect(interpreted).toEqual([]);
      expect(statusRegion().textContent?.trim()).toBe('');
      expect(questionGroup().classList).toContain('govuk-form-group--error');
      expect(element().textContent).not.toContain('Synthetic problem title');
      expect(element().textContent).not.toContain('Synthetic detail');
    });

    it('has copy for every status that stays on the page', () => {
      expect(
        Object.keys(PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES).map(Number),
      ).toEqual([0, 400, 403, 404, 422, 429, 500, 502, 503, 504]);
      expect(PLAIN_ENGLISH_SEARCH_UNAVAILABLE).toBe(UNAVAILABLE);
    });

    it.each([
      ['another status', httpError(406)],
      ['an error that is not an HTTP error', new Error('Synthetic failure')],
    ])('shows the unavailable copy for %s', (_name, error) => {
      interpretEntrySearch.mockReturnValue(throwError(() => error));
      type(QUESTION);
      press();

      expect(errorMessage()).toBe(UNAVAILABLE);
    });

    it('shows the unavailable copy for an empty response', () => {
      interpretEntrySearch.mockReturnValue(of(null));
      type(QUESTION);
      press();

      expect(interpreted).toEqual([]);
      expect(errorMessage()).toBe(UNAVAILABLE);
      expect(statusRegion().textContent?.trim()).toBe('');
    });

    it('clears the error when a later question is sent', () => {
      press();
      expect(errorMessage()).toBe('Enter a question');
      expect(questionGroup().classList).toContain('govuk-form-group--error');

      type(QUESTION);
      press();

      expect(errorMessage()).toBeUndefined();
      expect(textarea().getAttribute('aria-invalid')).toBeNull();
      // Neither the panel's form group nor the textarea's keeps the error
      expect(element().querySelector('.govuk-form-group--error')).toBeNull();
      expect(emittedErrors.at(-1)).toEqual([]);
      expect(interpreted).toEqual([INTERPRETATION]);
    });

    it('keeps the question out of the console and error messages', () => {
      const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
      const spies = methods.map((method) =>
        jest.spyOn(console, method).mockImplementation(() => undefined),
      );

      try {
        type(QUESTION);
        press();
        interpretEntrySearch.mockReturnValue(throwError(() => httpError(503)));
        press();

        const consoleArgs = JSON.stringify(
          spies.flatMap((spy) => spy.mock.calls),
        );
        expect(consoleArgs).not.toContain(QUESTION);
        expect(JSON.stringify(emittedErrors)).not.toContain(QUESTION);
        expect(errorMessage()).not.toContain(QUESTION);
      } finally {
        spies.forEach((spy) => spy.mockRestore());
      }
    });

    it('cancels the request when it is destroyed', () => {
      const response = new Subject<SearchInterpretationDto>();
      interpretEntrySearch.mockReturnValue(response);
      type(QUESTION);
      press();

      expect(response.observed).toBe(true);

      fixture.destroy();

      expect(response.observed).toBe(false);
    });

    it('hides the error without emitting when clearError is called', () => {
      interpretEntrySearch.mockReturnValue(throwError(() => httpError(503)));
      type(QUESTION);
      press();
      expect(errorMessage()).toBe(UNAVAILABLE);
      const emitted = emittedErrors.length;

      component.clearError();
      fixture.detectChanges();

      expect(errorMessage()).toBeUndefined();
      expect(element().querySelector('.govuk-form-group--error')).toBeNull();
      expect(textarea().value).toBe(QUESTION);
      expect(emittedErrors).toHaveLength(emitted);
    });

    it('empties the question and hides its error and status without emitting when reset is called', () => {
      press();
      expect(errorMessage()).toBe('Enter a question');
      type(QUESTION);
      press();
      expect(statusRegion().textContent?.trim()).not.toBe('');
      interpretEntrySearch.mockReturnValue(throwError(() => httpError(429)));
      press();
      const emitted = emittedErrors.length;

      component.reset();
      fixture.detectChanges();

      expect(textarea().value).toBe('');
      expect(component.question.value).toBe('');
      expect(errorMessage()).toBeUndefined();
      expect(statusRegion().textContent?.trim()).toBe('');
      expect(element().textContent).toContain(
        'You have 300 characters remaining',
      );
      expect(emittedErrors).toHaveLength(emitted);
    });

    it('cancels a request in flight when reset is called, and sends the next question', () => {
      const response = new Subject<SearchInterpretationDto>();
      interpretEntrySearch.mockReturnValue(response);
      type(QUESTION);
      press();
      expect(statusRegion().textContent?.trim()).toBe('Working out filters…');

      component.reset();
      fixture.detectChanges();

      expect(response.observed).toBe(false);
      expect(statusRegion().textContent?.trim()).toBe('');

      // Not working any more, so the next press is sent
      interpretEntrySearch.mockReturnValue(of(INTERPRETATION));
      type('synthetic court two');
      press();

      expect(interpretEntrySearch).toHaveBeenCalledTimes(2);
      expect(interpreted).toEqual([INTERPRETATION]);
    });
  });

  describe('with the generated client', () => {
    let httpMock: HttpTestingController;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PlainEnglishSearchComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: BASE_PATH, useValue: '' },
        ],
      }).compileComponents();

      httpMock = TestBed.inject(HttpTestingController);
      createComponent();
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('sends the question in the POST body only, never in the URL or headers', () => {
      type(QUESTION);
      press();

      const req = httpMock.expectOne(INTERPRETATIONS_PATH);
      req.flush(INTERPRETATION);
      fixture.detectChanges();

      const headers: HttpHeaders = req.request.headers;
      const headerValues = headers
        .keys()
        .flatMap((name) => headers.getAll(name) ?? []);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ question: QUESTION });
      expect(req.request.urlWithParams).toBe(INTERPRETATIONS_PATH);
      expect(req.request.params.keys()).toEqual([]);
      expect(headerValues.join(' ')).not.toContain(QUESTION);
      expect(interpreted).toEqual([INTERPRETATION]);
    });
  });
});
