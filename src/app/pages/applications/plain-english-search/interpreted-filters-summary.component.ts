/**
 * Summary of a plain-English search (`app-interpreted-filters-summary`) for
 * /applications. The page shows it in one of two places:
 * - "Filters from your question", above the search form, while the question
 *   still needs staff (its choices are not all answered, or its search was
 *   blocked or failed), with the choices to answer. It is also shown, with no
 *   choices, for a question that set no filter, when the question still asked
 *   for something the page could not use (not applied, unused parts or
 *   notices): the page's error summary says why no search ran;
 * - "Searched for" (`searched`), directly above the results of a search that
 *   ran from the question, so staff can check what was searched. When staff
 *   changed filters by hand before it ran, the page leaves out what the
 *   question set for them and sets `changedByHand`: the summary then says so
 *   (SEARCHED_FOR_CHANGED_BY_HAND_TEXT) rather than list filters that were
 *   not searched, and does not say that no filters were set.
 *
 * It takes the form changes from interpretation-mapper.ts
 * (mapInterpretationToForm, with any choices applied) and shows:
 * - in a GOV.UK inset: the filters that were set (each appliedFilters label,
 *   with the field's name from INTERPRETED_FILTER_FIELD_LABELS), the courts
 *   added from court choices that were all applied at once
 *   (`matchedCourts`, from applyCourtChoices), what was asked for but not
 *   applied (notApplied), the parts of the question that were not used
 *   (unusedParts), and the notices, each as fixed copy from
 *   INTERPRETATION_NOTICE_TEXT. A notice with no copy is not shown.
 * - "Searched for" also lists each picked choice option as a filter, unless
 *   the pick was not applied (the mapper then lists its label in notApplied).
 *   It shows no radios.
 * - "Filters from your question" shows each choice (choicesNeeded) as an
 *   app-radio-group of its options and "None of these", as the mapper builds
 *   them. When no filter row is left, it says no filters were set, or, when
 *   there are choices, none apart from the choices: the mapper does not add a
 *   pick to appliedFilters (a scalar pick removes its field's rows).
 *
 * Labels, unused parts and choice text come from the AI and are untrusted:
 * they are rendered as text only, never as HTML.
 *
 * Choices are controlled by the page. `answers` holds the picked radio value
 * for each choice, by index (null or missing when it is not answered), and
 * `answersChange` emits the whole new list when staff pick one; the page
 * applies the picks with applyInterpretationChoice(). `showChoiceErrors`
 * shows an error on each choice that is not answered, for when the page
 * blocks Search until they are; interpretationChoiceHref() gives the error
 * summary link for a choice.
 *
 * The page runs the search when every choice is answered, so a pick says
 * whether it is final (`commit` in answersChange). An arrow key in a radio
 * group moves to the next option and selects it, so a keyboard or screen
 * reader user passes over options on the way to the one they want: a pick
 * made with an arrow key is not final. `commit` is emitted when they confirm
 * it: Space or Enter on the selected option, or focus leaving the choice. A
 * click, or Space on an option that is not selected, is final. Each choice's
 * hint (INTERPRETATION_CHOICE_SEARCH_HINT, in the fieldset's
 * aria-describedby) says when the search runs.
 *
 * Focus: when `focusKey` changes to a value, focus moves to the heading
 * (tabindex="-1") after it renders, so keyboard and screen reader users land
 * on the result. Pass a new key for each result to focus. Picking a choice
 * does not move focus.
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

/** The name shown for an applied filter whose field has no name. */
export const UNKNOWN_FILTER_FIELD_LABEL = 'Filter';

/** An applied filter as the summary shows it. */
export interface InterpretedFilterRow {
  field: string;
  label: string;
}

/** The answers after staff pick an option. */
export interface InterpretationAnswersChange {
  /** The picked radio value for every choice, by index. */
  answers: (string | null)[];
  /**
   * False when the option was reached with an arrow key, which staff may only
   * be passing over: `commit` follows when they settle on it.
   */
  commit: boolean;
}

// The keys that move through, and select, the options of a radio group
const ARROW_KEYS: ReadonlySet<string> = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

/** The heading of the summary shown above the results of a search. */
export const SEARCHED_FOR_HEADING = 'Searched for';
/** The heading of the summary shown above the form. */
export const INTERPRETED_FILTERS_HEADING = 'Filters from your question';

/** The id prefix of a choice's radio group (its radios are `<prefix>-1`…). */
export function interpretationChoiceIdPrefix(index: number): string {
  return `interpretation-choice-${index + 1}`;
}

/** The error summary link for a choice: its first radio. */
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
  /** The form changes for the interpretation, with any picks applied. */
  readonly changes = input.required<InterpretationFormChanges>();
  /** The picked radio value for each choice, by index. */
  readonly answers = input<readonly (string | null)[]>([]);
  /** Shows an error on each choice that is not answered. */
  readonly showChoiceErrors = input(false);
  /** Focus moves to the heading each time this changes to a value. */
  readonly focusKey = input<string | number | undefined>(undefined);
  /** True above the results of a search that ran from the question. */
  readonly searched = input(false);
  /** The labels of courts added from court choices applied all at once. */
  readonly matchedCourts = input<readonly string[]>([]);
  /** Staff changed filters by hand before the search ran ("Searched for"). */
  readonly changedByHand = input(false);

  /** The picked radio value for every choice, after staff pick one. */
  readonly answersChange = output<InterpretationAnswersChange>();
  /** Staff settled on an option they reached with the arrow keys. */
  readonly commit = output<void>();

  readonly choiceErrorText = INTERPRETATION_CHOICE_ERROR_MESSAGE;
  readonly choiceHint = INTERPRETATION_CHOICE_SEARCH_HINT;
  readonly changedByHandText = SEARCHED_FOR_CHANGED_BY_HAND_TEXT;
  readonly choiceIdPrefix = interpretationChoiceIdPrefix;

  // The last key pressed in a choice was an arrow key, so the pick it makes
  // is not final
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

  // The API's rows, then (once searched) each picked option that was applied
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

  // Fixed copy for each notice, once each, skipping notices with no copy
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

  // Notes an arrow key for the pick it makes, and confirms the selected
  // option on Space or Enter (Space on an option that is not selected picks
  // it, which is final)
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

  // Focus leaving a choice confirms the option staff left selected. Moving
  // between its own options does not.
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
