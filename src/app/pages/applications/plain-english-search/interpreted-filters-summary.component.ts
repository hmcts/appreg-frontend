/**
 * Summary of a plain-English search (`app-interpreted-filters-summary`) for
 * /applications, so staff can check the filters before they search.
 *
 * It takes the form changes from interpretation-mapper.ts
 * (mapInterpretationToForm, with any choices applied) and shows:
 * - in a GOV.UK inset: the filters that were set (each appliedFilters label,
 *   with the field's name from INTERPRETED_FILTER_FIELD_LABELS), what was
 *   asked for but not applied (notApplied), the parts of the question that
 *   were not used (unusedParts), and the notices, each as fixed copy from
 *   INTERPRETATION_NOTICE_TEXT. A notice with no copy is not shown.
 *   When no appliedFilters row is left, it says no filters were set, or,
 *   when there are choices, none apart from the choices: the mapper does not
 *   add a pick to appliedFilters (a scalar pick removes its field's rows), and
 *   the summary cannot tell a pick that was applied from one that was not.
 * - each choice (choicesNeeded) as an app-radio-group of its options and
 *   "None of these", as the mapper builds them.
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
 * Focus: when `focusKey` changes to a value, focus moves to the heading
 * (tabindex="-1") after it renders, so keyboard and screen reader users land
 * on the result. Pass a new key for each interpretation, such as its
 * interpretationId. Picking a choice does not move focus.
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
  INTERPRETATION_NOTICE_TEXT,
  INTERPRETED_FILTER_FIELD_LABELS,
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

  /** The picked radio value for every choice, after staff pick one. */
  readonly answersChange = output<(string | null)[]>();

  readonly choiceErrorText = INTERPRETATION_CHOICE_ERROR_MESSAGE;
  readonly choiceIdPrefix = interpretationChoiceIdPrefix;

  private readonly heading =
    viewChild.required<ElementRef<HTMLElement>>('heading');

  readonly appliedRows = computed<InterpretedFilterRow[]>(() =>
    this.changes().appliedFilters.map((row) => ({
      field: fieldLabel(row.field),
      label: row.label,
    })),
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
    this.answersChange.emit(
      this.changes().choices.map((_, i) =>
        i === index ? value : this.answerFor(i),
      ),
    );
  }
}

function fieldLabel(field: SearchFilterField): string {
  return Object.hasOwn(INTERPRETED_FILTER_FIELD_LABELS, field)
    ? INTERPRETED_FILTER_FIELD_LABELS[field]
    : UNKNOWN_FILTER_FIELD_LABEL;
}
