/**
 * Summary of a plain-English search for /applications: "Filters from your
 * question" above the form while the question still needs staff, and
 * "Searched for" (`searched`) above the results of a search from it.
 *
 * Labels, unused parts and choice text come from the AI and are untrusted:
 * they are rendered as text only, never as HTML.
 *
 * The page searches once every choice is answered, so a pick says whether it
 * is final (`commit` in answersChange). An arrow key in a radio group selects
 * the next option, so keyboard and screen reader users pass over options on
 * the way to the one they want: such a pick is final only on Space or Enter,
 * or when focus leaves the choice.
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { type InterpretationFormChanges } from '../util/interpretation-mapper';

import { RadioButtonComponent } from '@components/radio-button/radio-button.component';
import {
  INTERPRETATION_CHOICE_SEARCH_HINT,
  INTERPRETATION_NOTICE_TEXT,
  INTERPRETED_FILTER_FIELD_LABELS,
  SEARCHED_FOR_CHANGED_BY_HAND_TEXT,
} from '@constants/applications/applications.constants';
import { INTERPRETATION_CHOICE_ERROR_MESSAGE } from '@constants/applications/error-messages';
import { SearchFilterField } from '@openapi';

export const UNKNOWN_FILTER_FIELD_LABEL = 'Filter';

export interface InterpretedFilterRow {
  field: string;
  label: string;
}

export interface InterpretationAnswersChange {
  answers: (string | null)[];
  /** False for an option reached with an arrow key. */
  commit: boolean;
}

const ARROW_KEYS: ReadonlySet<string> = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

export const SEARCHED_FOR_HEADING = 'Searched for';
export const INTERPRETED_FILTERS_HEADING = 'Filters from your question';

/** The id prefix of a choice's radio group (its radios are `<prefix>-1`…). */
export function interpretationChoiceIdPrefix(index: number): string {
  return `interpretation-choice-${index + 1}`;
}

export function interpretationChoiceHref(index: number): string {
  return `#${interpretationChoiceIdPrefix(index)}-1`;
}

@Component({
  selector: 'app-interpreted-filters-summary',
  standalone: true,
  imports: [FormsModule, RadioButtonComponent],
  templateUrl: './interpreted-filters-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterpretedFiltersSummaryComponent {
  readonly changes = input.required<InterpretationFormChanges>();
  readonly answers = input<readonly (string | null)[]>([]);
  readonly showChoiceErrors = input(false);
  /** Focus moves to the heading each time this changes to a value. */
  readonly focusKey = input<string | number | undefined>(undefined);
  readonly searched = input(false);
  readonly matchedCourts = input<readonly string[]>([]);
  readonly changedByHand = input(false);

  readonly answersChange = output<InterpretationAnswersChange>();
  readonly commit = output<void>();

  readonly choiceErrorText = INTERPRETATION_CHOICE_ERROR_MESSAGE;
  readonly choiceHint = INTERPRETATION_CHOICE_SEARCH_HINT;
  readonly changedByHandText = SEARCHED_FOR_CHANGED_BY_HAND_TEXT;
  readonly choiceIdPrefix = interpretationChoiceIdPrefix;

  private arrowKeyPressed = false;

  private readonly heading =
    viewChild.required<ElementRef<HTMLElement>>('heading');

  readonly sectionId = computed(() =>
    this.searched() ? 'searched-for' : 'interpreted-filters',
  );
  readonly headingId = computed(() => `${this.sectionId()}-heading`);
  readonly headingText = computed(() =>
    this.searched() ? SEARCHED_FOR_HEADING : INTERPRETED_FILTERS_HEADING,
  );

  // Radios show the picks until the search runs; then they are filters
  private readonly pickedRows = computed<InterpretedFilterRow[]>(() => {
    const { choices, notApplied } = this.changes();

    return choices.flatMap((choice, index) => {
      const option = choice.options.find(
        (item) => item.value === this.answerFor(index),
      );

      // None of these sets nothing; a pick that was not applied is listed
      // in notApplied by its label
      return option?.pick && !notApplied.includes(option.label.trim())
        ? [{ field: fieldLabel(option.pick.field), label: option.label }]
        : [];
    });
  });

  readonly appliedRows = computed<InterpretedFilterRow[]>(() => [
    ...this.changes().appliedFilters.map((row) => ({
      field: fieldLabel(row.field),
      label: row.label,
    })),
    ...(this.searched() ? this.pickedRows() : []),
  ]);

  readonly hasFilters = computed(
    () => this.appliedRows().length > 0 || this.matchedCourts().length > 0,
  );
  readonly showChoices = computed(
    () => !this.searched() && this.changes().choices.length > 0,
  );

  // A notice with no copy is skipped, never shown raw
  readonly noticeTexts = computed<string[]>(() => [
    ...new Set(
      this.changes()
        .notices.filter((notice) =>
          Object.hasOwn(INTERPRETATION_NOTICE_TEXT, notice),
        )
        .map((notice) => INTERPRETATION_NOTICE_TEXT[notice]),
    ),
  ]);

  constructor() {
    afterRenderEffect(() => {
      if (this.focusKey() !== undefined) {
        this.heading().nativeElement.focus();
      }
    });
  }

  answerFor(index: number): string | null {
    return this.answers()[index] ?? null;
  }

  choiceHasError(index: number): boolean {
    return this.showChoiceErrors() && !this.answerFor(index);
  }

  // Choice option values are always strings (the mapper's option-<n> or none)
  onAnswer(index: number, value: string): void {
    const commit = !this.arrowKeyPressed;
    this.arrowKeyPressed = false;
    this.answersChange.emit({
      answers: this.changes().choices.map((_, i) =>
        i === index ? value : this.answerFor(i),
      ),
      commit,
    });
  }

  // Space or Enter on the selected option confirms it. Space on one that is
  // not selected picks it, which is final.
  onChoiceKeydown(event: KeyboardEvent): void {
    this.arrowKeyPressed = ARROW_KEYS.has(event.key);

    const { target } = event;
    if (
      (event.key === ' ' || event.key === 'Enter') &&
      target instanceof HTMLInputElement &&
      target.type === 'radio' &&
      target.checked
    ) {
      this.commit.emit();
    }
  }

  // Moving between the choice's own options does not confirm it
  onChoiceFocusOut(event: FocusEvent): void {
    const choice = event.currentTarget;
    const next = event.relatedTarget;
    if (
      choice instanceof HTMLElement &&
      next instanceof Node &&
      choice.contains(next)
    ) {
      return;
    }

    this.arrowKeyPressed = false;
    this.commit.emit();
  }
}

function fieldLabel(field: SearchFilterField): string {
  return Object.hasOwn(INTERPRETED_FILTER_FIELD_LABELS, field)
    ? INTERPRETED_FILTER_FIELD_LABELS[field]
    : UNKNOWN_FILTER_FIELD_LABEL;
}
