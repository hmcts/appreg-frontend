/**
 * Plain-English search panel for /applications. It sends the question to
 * interpretEntrySearch and emits the result through `interpreted`. The page
 * applies it, runs the search and reports the outcome through the status
 * methods, which emit nothing (except fail()). The panel is busy until then.
 *
 * The question is user free text that may hold personal data. It is sent only
 * in the POST body: never in a URL, a log, the console, telemetry, an error
 * message or saved page state. It is held in this component's own control,
 * not in the page's search form.
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

export const PLAIN_ENGLISH_QUESTION_ID = 'plain-english-question';

export const PLAIN_ENGLISH_SEARCH_WORKING_STATUS = 'Finding applications…';

export const PLAIN_ENGLISH_SEARCH_CHOICES_STATUS =
  'Choose what you meant below. The search runs when every choice is answered.';

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
  readonly asked = output<void>();
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
  readonly working = this.busy.asReadonly();
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

  /** Busy again while the page runs a search from a pick. */
  showSearching(): void {
    this.busy.set(true);
    this.status.set(PLAIN_ENGLISH_SEARCH_WORKING_STATUS);
  }

  showResults(total: number): void {
    this.busy.set(false);
    this.status.set(plainEnglishSearchResultsStatus(total));
  }

  showChoices(): void {
    this.busy.set(false);
    this.status.set(PLAIN_ENGLISH_SEARCH_CHOICES_STATUS);
  }

  /** Says nothing, as the page's error summary shows why no search ran. */
  stop(): void {
    this.busy.set(false);
    this.status.set('');
  }

  /** Shows an error on the question and emits it for the error summary. */
  fail(text: string): void {
    this.stop();
    this.showError(text);
  }

  clearError(): void {
    this.errorText.set(null);
  }

  /** For a search staff run themselves. Does nothing while busy. */
  clearStatus(): void {
    if (!this.busy()) {
      this.status.set('');
    }
  }

  /** Also cancels a request in flight, so no result arrives afterwards. */
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

function errorTextFor(err: unknown): string {
  const status = getHttpStatus(err);

  return Object.hasOwn(PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES, status)
    ? PLAIN_ENGLISH_SEARCH_ERROR_MESSAGES[
        status as PlainEnglishSearchErrorStatus
      ]
    : PLAIN_ENGLISH_SEARCH_UNAVAILABLE;
}
