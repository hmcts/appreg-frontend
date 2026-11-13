/**
 * Plain-English search panel (`app-plain-english-search`) for /applications.
 *
 * Staff type a question and press "Work out filters". The panel sends it to
 * POST /application-list-entries/search-interpretations
 * (SearchInterpretationsApi.interpretEntrySearch) and emits the
 * SearchInterpretationDto through `interpreted`. It never applies filters or
 * runs a search: the page maps the result (interpretation-mapper.ts) and
 * staff check the filters before they search.
 *
 * - The question is user free text that may hold personal data. It is sent
 *   only in the POST body: never in a URL, a log, the console, telemetry, an
 *   error message or saved page state. It is held in this component's own
 *   control, not in the page's search form.
 * - The question is trimmed. One that is empty, only whitespace or longer
 *   than PLAIN_ENGLISH_QUESTION_MAX_LENGTH (300) characters is not sent and
 *   shows an error. The textarea also stops typing at 300 characters and
 *   says how many are left.
 * - An API error shows fixed copy for its status
 *   (PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES), never the API's problem text. An
 *   empty response counts as unavailable.
 * - Errors show on the question and are emitted through `errorsChange` as
 *   ErrorItems that link to it, for the page's error summary. Each press
 *   emits: the error, or [] when the question is sent.
 * - While a request runs, a polite live region says "Working out filters…"
 *   and further presses are ignored. When a result arrives the live region
 *   says so, and the summary component takes focus.
 * - The request is cancelled when the component is destroyed.
 * - The page can call clearError() when it clears its error summary (on
 *   Search), and reset() on Clear search: that also empties the question and
 *   cancels a request in flight, so no result arrives afterwards. Neither
 *   emits.
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { PLAIN_ENGLISH_QUESTION_MAX_LENGTH } from '@constants/applications/applications.constants';
import {
  PLAIN_ENGLISH_QUESTION_ERROR_MESSAGES,
  PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES,
  PLAIN_ENGLISH_SEARCH_UNAVAILABLE,
  type PlainEnglishSearchErrorStatus,
} from '@constants/applications/error-messages';
import { SearchInterpretationDto, SearchInterpretationsApi } from '@openapi';
import { getHttpStatus } from '@util/http-error-to-text';
import { trimToString } from '@util/string-helpers';

/** The id of the question textarea, which error summary links point to. */
export const PLAIN_ENGLISH_QUESTION_ID = 'plain-english-question';

type Phase = 'idle' | 'working' | 'done';

const STATUS_TEXT: Readonly<Record<Phase, string>> = {
  idle: '',
  working: 'Working out filters…',
  done: 'Finished working out filters. Check them before you search.',
};

@Component({
  selector: 'app-plain-english-search',
  standalone: true,
  imports: [GovukTextareaComponent],
  templateUrl: './plain-english-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlainEnglishSearchComponent {
  /** The interpretation of the question, for the page to check and apply. */
  readonly interpreted = output<SearchInterpretationDto>();
  /** The panel's errors after each press, or [] when there are none. */
  readonly errorsChange = output<ErrorItem[]>();

  private readonly searchInterpretationsApi = inject(SearchInterpretationsApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly questionId = PLAIN_ENGLISH_QUESTION_ID;
  readonly hintId = `${PLAIN_ENGLISH_QUESTION_ID}-ai-hint`;
  // app-govuk-textarea gives its character count the id `<id>-hint`
  readonly describedBy = `${this.hintId} ${PLAIN_ENGLISH_QUESTION_ID}-hint`;
  readonly maxLength = PLAIN_ENGLISH_QUESTION_MAX_LENGTH;

  readonly question = new FormControl<string | null>('');

  private readonly phase = signal<Phase>('idle');
  readonly working = computed(() => this.phase() === 'working');
  readonly statusText = computed(() => STATUS_TEXT[this.phase()]);
  readonly errorText = signal<string | null>(null);

  private request?: Subscription;

  interpret(): void {
    if (this.working()) {
      return;
    }

    const question = trimToString(this.question.value);
    const invalid = questionError(question);

    if (invalid) {
      this.phase.set('idle');
      this.showError(invalid);
      return;
    }

    this.showError(null);
    this.phase.set('working');

    this.request = this.searchInterpretationsApi
      .interpretEntrySearch(
        { searchInterpretationRequestDto: { question } },
        'body',
        false,
        { transferCache: false },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (interpretation) => {
          if (!interpretation || typeof interpretation !== 'object') {
            this.fail(PLAIN_ENGLISH_SEARCH_UNAVAILABLE);
            return;
          }

          this.phase.set('done');
          this.interpreted.emit(interpretation);
        },
        error: (err: unknown) => this.fail(errorTextFor(err)),
      });
  }

  /** Hides the question's error. Emits nothing. */
  clearError(): void {
    this.errorText.set(null);
  }

  /**
   * Empties the question, hides its error and status, and cancels a request
   * in flight. Emits nothing.
   */
  reset(): void {
    this.request?.unsubscribe();
    this.request = undefined;
    this.question.reset('');
    this.errorText.set(null);
    this.phase.set('idle');
  }

  private fail(text: string): void {
    this.phase.set('idle');
    this.showError(text);
  }

  private showError(text: string | null): void {
    this.errorText.set(text);
    this.errorsChange.emit(
      text ? [{ id: this.questionId, href: `#${this.questionId}`, text }] : [],
    );
  }
}

function questionError(question: string): string | null {
  if (!question) {
    return PLAIN_ENGLISH_QUESTION_ERROR_MESSAGES.required;
  }
  if (question.length > PLAIN_ENGLISH_QUESTION_MAX_LENGTH) {
    return PLAIN_ENGLISH_QUESTION_ERROR_MESSAGES.maxlength;
  }
  return null;
}

// Fixed copy for the error's status, or the unavailable copy
function errorTextFor(err: unknown): string {
  const status = getHttpStatus(err);

  return Object.hasOwn(PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES, status)
    ? PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES[
        status as PlainEnglishSearchErrorStatus
      ]
    : PLAIN_ENGLISH_SEARCH_UNAVAILABLE;
}
