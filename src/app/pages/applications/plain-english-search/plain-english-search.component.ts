/**
 * Plain-English search panel (`app-plain-english-search`) for /applications.
 *
 * Staff type a question and press "Find applications". The panel sends it to
 * POST /application-list-entries/search-interpretations
 * (SearchInterpretationsApi.interpretEntrySearch) and emits the
 * SearchInterpretationDto through `interpreted`. The page applies it to the
 * form (interpretation-mapper.ts) and runs the search straight away, or asks
 * staff to choose what they meant first, then tells the panel the outcome.
 *
 * - The question is user free text that may hold personal data. It is sent
 *   only in the POST body: never in a URL, a log, the console, telemetry, an
 *   error message or saved page state. It is held in this component's own
 *   control, not in the page's search form.
 * - The question is trimmed. One that is empty, only whitespace or longer
 *   than PLAIN_ENGLISH_QUESTION_MAX_LENGTH (300) characters is not sent and
 *   shows an error. The textarea also stops typing at 300 characters and
 *   says how many are left.
 * - `asked` is emitted when a question is sent, so the page can drop what it
 *   shows about an earlier question.
 * - An API error shows fixed copy for its status
 *   (PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES), never the API's problem text. An
 *   empty response counts as unavailable. The page shows its own errors on
 *   the question the same way through fail(), such as when an interpretation
 *   sets no filter at all.
 * - Errors show on the question and are emitted through `errorsChange` as
 *   ErrorItems that link to it, for the page's error summary. Each press
 *   emits: the error, or [] when the question is sent.
 * - Working: from the press until the page reports the outcome, and again
 *   while the page runs a search after a choice is answered
 *   (showSearching()), a polite live region says "Finding applications…" and
 *   further presses are ignored. The page then calls showResults() (the live
 *   region says how many were found), showChoices() (it says to choose what
 *   they meant) or stop() (nothing is said, as the page's error summary takes
 *   focus), or fail() with an error. Each outcome is said once.
 * - The request is cancelled when the component is destroyed.
 * - The page can call clearError() when it clears its error summary (on
 *   Search), clearStatus() when staff run their own search (the outcome of
 *   the question's search no longer describes the page; nothing changes while
 *   the panel is working), and reset() on Clear search: that also empties the
 *   question and cancels a request in flight, so no result arrives
 *   afterwards. None of them emits.
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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

/** What the live region says while the panel is working. */
export const PLAIN_ENGLISH_SEARCH_WORKING_STATUS = 'Finding applications…';

/** What the live region says when staff must choose what they meant. */
export const PLAIN_ENGLISH_SEARCH_CHOICES_STATUS =
  'Choose what you meant below. The search runs when every choice is answered.';

/** What the live region says when the search has run. */
export function plainEnglishSearchResultsStatus(total: number): string {
  if (total <= 0) {
    return 'No applications found.';
  }
  return total === 1 ? '1 application found.' : `${total} applications found.`;
}

@Component({
  selector: 'app-plain-english-search',
  standalone: true,
  imports: [GovukTextareaComponent],
  templateUrl: './plain-english-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlainEnglishSearchComponent {
  /** A question was sent. */
  readonly asked = output<void>();
  /** The interpretation of the question, for the page to apply and search. */
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

  private readonly busy = signal(false);
  private readonly status = signal('');
  /** True from a press until the page reports the outcome. */
  readonly working = this.busy.asReadonly();
  /** What the live region says. */
  readonly statusText = this.status.asReadonly();
  readonly errorText = signal<string | null>(null);

  private request?: Subscription;

  interpret(): void {
    if (this.working()) {
      return;
    }

    const question = trimToString(this.question.value);
    const invalid = questionError(question);

    if (invalid) {
      this.stop();
      this.showError(invalid);
      return;
    }

    this.showError(null);
    this.asked.emit();
    this.showSearching();

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

          // Still working: the page reports the outcome
          this.interpreted.emit(interpretation);
        },
        error: (err: unknown) => this.fail(errorTextFor(err)),
      });
  }

  /** Working again, while the page runs a search. Emits nothing. */
  showSearching(): void {
    this.busy.set(true);
    this.status.set(PLAIN_ENGLISH_SEARCH_WORKING_STATUS);
  }

  /** The search ran and found `total` entries. Emits nothing. */
  showResults(total: number): void {
    this.busy.set(false);
    this.status.set(plainEnglishSearchResultsStatus(total));
  }

  /** Staff must choose what they meant before the search runs. Emits nothing. */
  showChoices(): void {
    this.busy.set(false);
    this.status.set(PLAIN_ENGLISH_SEARCH_CHOICES_STATUS);
  }

  /**
   * Stops working and says nothing, for when the page's error summary shows
   * why the search did not run. Emits nothing.
   */
  stop(): void {
    this.busy.set(false);
    this.status.set('');
  }

  /**
   * Stops working and shows an error on the question, emitted through
   * `errorsChange` for the page's error summary.
   */
  fail(text: string): void {
    this.stop();
    this.showError(text);
  }

  /** Hides the question's error. Emits nothing. */
  clearError(): void {
    this.errorText.set(null);
  }

  /**
   * Empties the status once the panel has finished, for when staff run their
   * own search. While it is working, the status, the question and its error
   * are left as they are. Emits nothing.
   */
  clearStatus(): void {
    if (!this.busy()) {
      this.status.set('');
    }
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
    this.stop();
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
