/**
 * Tests for the interpreted-filters summary: the applied filters with their
 * field names, what it says when none were set (before and after a choice is
 * picked), courts added from court choices, what was not applied, unused
 * parts, notices as fixed copy, choices as radios with "None of these", AI
 * text rendered as text, focus moving to the heading for each new
 * interpretation but not when a choice is picked, the "Searched for"
 * summary shown above the results (picks listed as filters, no radios, and
 * what it says when filters were changed by hand), and when a pick is final:
 * a click or Space is, an arrow key is not until staff settle on the option
 * (Space or Enter on it, or focus leaving the choice), as each choice's hint
 * says.
 *
 * The changes come from the real mapper (mapInterpretationToForm), so the
 * choices are the ones the page will pass. All values are synthetic.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  INTERPRETED_FILTERS_HEADING,
  type InterpretationAnswersChange,
  InterpretedFiltersSummaryComponent,
  SEARCHED_FOR_HEADING,
  UNKNOWN_FILTER_FIELD_LABEL,
  interpretationChoiceHref,
} from '@components/applications/plain-english-search/interpreted-filters-summary.component';
import {
  type InterpretationFormChanges,
  NONE_OF_THESE_VALUE,
  applyInterpretationChoice,
  mapInterpretationToForm,
} from '@components/applications/util/interpretation-mapper';
import {
  INTERPRETATION_CHOICE_SEARCH_HINT,
  INTERPRETATION_NOTICE_TEXT,
  SEARCHED_FOR_CHANGED_BY_HAND_TEXT,
} from '@constants/applications/applications.constants';
import {
  CourtLocationGetSummaryDto,
  InterpretationChoiceDto,
  InterpretationSource,
  InterpretedFilterDto,
  SearchFilterField,
  SearchInterpretationDto,
  SearchInterpretationNotice,
} from '@openapi';

const ACTIVE_COURTS: CourtLocationGetSummaryDto[] = [
  { courtId: 1, locationCode: 'ZZ001', name: 'Synthetic Magistrates Court' },
];

const NO_FILTERS_TEXT = 'No filters were set from your question.';
const NO_FILTERS_APART_FROM_CHOICES_TEXT =
  'Apart from the choices below, no filters were set from your question.';

const APPLICANT_CHOICE: InterpretationChoiceDto = {
  field: SearchFilterField.APPLICANT_ORGANISATION,
  text: 'Which applicant did you mean?',
  options: [
    {
      field: SearchFilterField.APPLICANT_ORGANISATION,
      code: 'Synthetic Council',
      label: 'Synthetic Council',
    },
    {
      field: SearchFilterField.APPLICANT_ORGANISATION,
      code: 'Example Council',
      label: 'Example Council',
    },
  ],
};

function interpretation(
  overrides: Partial<SearchInterpretationDto> = {},
): SearchInterpretationDto {
  return {
    interpretationId: '00000000-0000-4000-8000-000000000001',
    filter: {},
    appliedFilters: [],
    choicesNeeded: [],
    unusedParts: [],
    notices: [],
    ...overrides,
  };
}

function row(field: SearchFilterField, label: string): InterpretedFilterDto {
  return { field, label, source: InterpretationSource.MODEL };
}

function changesFor(
  overrides: Partial<SearchInterpretationDto> = {},
): InterpretationFormChanges {
  return mapInterpretationToForm(interpretation(overrides), ACTIVE_COURTS);
}

// An interpretation with two applied filters, a filter with no control, an
// unused part, a notice and two choices
const FULL = changesFor({
  filter: {
    courtCode: 'ZZ001',
    dateFrom: '2026-03-01',
    applicationCodeCategory: 'SEARCH_WARRANTS' as never,
  },
  appliedFilters: [
    row(SearchFilterField.COURT_CODE, 'Synthetic Magistrates Court'),
    row(SearchFilterField.DATE_FROM, '1 March 2026'),
    row(SearchFilterField.APPLICATION_CODE_CATEGORY, 'Synthetic warrants'),
  ],
  unusedParts: ['the blue folder'],
  notices: [SearchInterpretationNotice.DATE_IN_FUTURE],
  choicesNeeded: [
    APPLICANT_CHOICE,
    {
      field: SearchFilterField.RESULT_CODES,
      text: 'Which result did you mean?',
      options: [
        {
          field: SearchFilterField.RESULT_CODES,
          code: 'RC9901',
          label: 'RC9901 - Synthetic result',
        },
      ],
    },
  ],
});

describe('InterpretedFiltersSummaryComponent', () => {
  let fixture: ComponentFixture<InterpretedFiltersSummaryComponent>;
  let emittedAnswers: InterpretationAnswersChange[];
  let commits: number;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const texts = (selector: string): string[] =>
    Array.from(element().querySelectorAll(selector)).map(
      (el) => el.textContent?.trim() ?? '',
    );
  const heading = (): HTMLElement =>
    element().querySelector<HTMLElement>('#interpreted-filters-heading')!;
  const fieldsets = (): HTMLFieldSetElement[] =>
    Array.from(element().querySelectorAll('fieldset'));
  const noFiltersText = (): string | undefined =>
    element().querySelector('#interpreted-filters-none')?.textContent?.trim();

  const render = async (
    changes: InterpretationFormChanges,
    inputs: Record<string, unknown> = {},
  ): Promise<void> => {
    fixture.componentRef.setInput('changes', changes);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    // ngModel writes radio values asynchronously
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterpretedFiltersSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InterpretedFiltersSummaryComponent);
    emittedAnswers = [];
    commits = 0;
    fixture.componentInstance.answersChange.subscribe((change) =>
      emittedAnswers.push(change),
    );
    fixture.componentInstance.commit.subscribe(() => (commits += 1));
    document.body.appendChild(element());
  });

  afterEach(() => {
    element().remove();
  });

  it('is headed Filters from your question by default', async () => {
    await render(FULL);

    expect(heading().textContent?.trim()).toBe(INTERPRETED_FILTERS_HEADING);
    expect(INTERPRETED_FILTERS_HEADING).toBe('Filters from your question');
    expect(element().querySelector('section')?.id).toBe('interpreted-filters');
    expect(element().querySelector('#searched-for-heading')).toBeNull();
  });

  it('shows each applied filter label with its field name', async () => {
    await render(FULL);

    expect(texts('#interpreted-filters-applied dt')).toEqual([
      'Court',
      'List date from',
    ]);
    expect(texts('#interpreted-filters-applied dd')).toEqual([
      'Synthetic Magistrates Court',
      '1 March 2026',
    ]);
    expect(element().querySelector('#interpreted-filters-none')).toBeNull();
  });

  it('names a field it does not know as a filter', async () => {
    await render({
      ...changesFor(),
      appliedFilters: [
        {
          field: 'somethingNew' as SearchFilterField,
          label: 'Synthetic value',
          source: InterpretationSource.MODEL,
        },
      ],
    });

    expect(texts('#interpreted-filters-applied dt')).toEqual([
      UNKNOWN_FILTER_FIELD_LABEL,
    ]);
    expect(texts('#interpreted-filters-applied dd')).toEqual([
      'Synthetic value',
    ]);
  });

  it('shows what was not applied and the unused parts of the question in the inset', async () => {
    await render(FULL);

    const inset = element().querySelector('.govuk-inset-text')!;

    expect(
      Array.from(
        inset.querySelectorAll('#interpreted-filters-not-applied li'),
      ).map((li) => li.textContent?.trim()),
    ).toEqual(['Synthetic warrants']);
    expect(
      Array.from(inset.querySelectorAll('#interpreted-filters-unused li')).map(
        (li) => li.textContent?.trim(),
      ),
    ).toEqual(['the blue folder']);
    expect(inset.querySelector('#interpreted-filters-applied')).not.toBeNull();
  });

  it('says when no filters were set and leaves out empty sections', async () => {
    await render(changesFor());

    expect(noFiltersText()).toBe(NO_FILTERS_TEXT);
    expect(element().querySelector('#interpreted-filters-applied')).toBeNull();
    expect(
      element().querySelector('#interpreted-filters-not-applied'),
    ).toBeNull();
    expect(element().querySelector('#interpreted-filters-unused')).toBeNull();
    expect(element().querySelector('#interpreted-filters-notices')).toBeNull();
    expect(fieldsets()).toEqual([]);
  });

  it('says no filters were set apart from the choices when the question only gave choices', async () => {
    await render(changesFor({ choicesNeeded: [APPLICANT_CHOICE] }));

    expect(noFiltersText()).toBe(NO_FILTERS_APART_FROM_CHOICES_TEXT);
    expect(element().querySelector('#interpreted-filters-applied')).toBeNull();
    expect(fieldsets()).toHaveLength(1);
  });

  // A pick is not added to appliedFilters, so the summary cannot list it
  it.each([
    ['an option', 'option-0', '#interpretation-choice-1-1'],
    ['None of these', NONE_OF_THESE_VALUE, '#interpretation-choice-1-3'],
  ])(
    'still says no filters were set apart from the choices after staff pick %s',
    async (_name, value, radioId) => {
      const changes = changesFor({ choicesNeeded: [APPLICANT_CHOICE] });
      const option = changes.choices[0].options.find(
        (opt) => opt.value === value,
      )!;
      const picked = applyInterpretationChoice(changes, option, ACTIVE_COURTS);

      await render(picked, { answers: [value] });

      expect(picked.appliedFilters).toEqual([]);
      expect(noFiltersText()).toBe(NO_FILTERS_APART_FROM_CHOICES_TEXT);
      expect(
        element().querySelector('#interpreted-filters-applied'),
      ).toBeNull();
      expect(element().querySelector<HTMLInputElement>(radioId)?.checked).toBe(
        true,
      );
    },
  );

  it('lists a CJA dropped for a picked court as not applied and still says no filters were set apart from the choices', async () => {
    const changes = changesFor({
      filter: { cjaCode: '99' },
      appliedFilters: [row(SearchFilterField.CJA_CODE, 'Synthetic Area')],
      choicesNeeded: [
        {
          field: SearchFilterField.COURT_CODE,
          text: 'Which court did you mean?',
          options: [
            {
              field: SearchFilterField.COURT_CODE,
              code: 'ZZ001',
              label: 'Synthetic Magistrates Court',
            },
          ],
        },
      ],
    });

    await render(changes);

    expect(texts('#interpreted-filters-applied dd')).toEqual([
      'Synthetic Area',
    ]);

    const picked = applyInterpretationChoice(
      changes,
      changes.choices[0].options[0],
      ACTIVE_COURTS,
    );
    await render(picked, { answers: ['option-0'] });

    expect(picked.formValue.court).toBe('ZZ001');
    expect(element().querySelector('#interpreted-filters-applied')).toBeNull();
    expect(texts('#interpreted-filters-not-applied li')).toEqual([
      'Synthetic Area',
    ]);
    expect(noFiltersText()).toBe(NO_FILTERS_APART_FROM_CHOICES_TEXT);
    expect(
      element().querySelector<HTMLInputElement>('#interpretation-choice-1-1')
        ?.checked,
    ).toBe(true);
  });

  it.each(Object.values(SearchInterpretationNotice))(
    'shows the %s notice as fixed copy',
    async (notice) => {
      await render(changesFor({ notices: [notice] }));

      expect(texts('#interpreted-filters-notices li')).toEqual([
        INTERPRETATION_NOTICE_TEXT[notice],
      ]);
      expect(element().textContent).not.toContain(notice);
    },
  );

  it('shows each notice once and skips a notice it has no copy for', async () => {
    await render(
      changesFor({
        notices: [
          SearchInterpretationNotice.NAME_TOO_SHORT,
          'SOMETHING_NEW' as SearchInterpretationNotice,
          SearchInterpretationNotice.NAME_TOO_SHORT,
        ],
      }),
    );

    expect(texts('#interpreted-filters-notices li')).toEqual([
      INTERPRETATION_NOTICE_TEXT[SearchInterpretationNotice.NAME_TOO_SHORT],
    ]);
    expect(element().textContent).not.toContain('SOMETHING_NEW');
  });

  it('shows each choice as radios with None of these', async () => {
    await render(FULL);

    const [first, second] = fieldsets();

    expect(fieldsets()).toHaveLength(2);
    expect(first.querySelector('legend')?.textContent?.trim()).toBe(
      'Which applicant did you mean?',
    );
    expect(
      Array.from(first.querySelectorAll('.govuk-radios__label')).map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(['Synthetic Council', 'Example Council', 'None of these']);
    expect(second.querySelector('legend')?.textContent?.trim()).toBe(
      'Which result did you mean?',
    );
    expect(
      Array.from(second.querySelectorAll('.govuk-radios__label')).map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(['RC9901 - Synthetic result', 'None of these']);
    expect(
      Array.from(first.querySelectorAll('input[type="radio"]')).map(
        (radio) => radio.id,
      ),
    ).toEqual([
      'interpretation-choice-1-1',
      'interpretation-choice-1-2',
      'interpretation-choice-1-3',
    ]);
    expect(element().querySelector(interpretationChoiceHref(1))).toBe(
      second.querySelector('input[type="radio"]'),
    );
  });

  it('emits every answer when staff pick an option', async () => {
    await render(FULL, { answers: [null, NONE_OF_THESE_VALUE] });

    element()
      .querySelector<HTMLInputElement>('#interpretation-choice-1-2')!
      .click();

    expect(emittedAnswers).toEqual([
      { answers: ['option-1', NONE_OF_THESE_VALUE], commit: true },
    ]);
  });

  it('shows the answers it is given', async () => {
    await render(FULL, { answers: [NONE_OF_THESE_VALUE] });

    const radios = Array.from(
      element().querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );

    expect(radios.filter((radio) => radio.checked).map((r) => r.id)).toEqual([
      'interpretation-choice-1-3',
    ]);
  });

  it('shows an error on each unanswered choice when asked', async () => {
    await render(FULL, {
      answers: [null, NONE_OF_THESE_VALUE],
      showChoiceErrors: true,
    });

    const [first, second] = fieldsets();

    expect(
      first
        .querySelector('#interpretation-choice-1-error')
        ?.textContent?.replace('Error:', '')
        .trim(),
    ).toBe('Select one of the options, or None of these');
    expect(first.getAttribute('aria-describedby')).toBe(
      'interpretation-choice-1-hint interpretation-choice-1-error',
    );
    expect(
      first
        .closest('.govuk-form-group')
        ?.classList.contains('govuk-form-group--error'),
    ).toBe(true);
    expect(second.querySelector('.govuk-error-message')).toBeNull();
    expect(
      second
        .closest('.govuk-form-group')
        ?.classList.contains('govuk-form-group--error'),
    ).toBe(false);
  });

  it('shows no choice errors unless asked', async () => {
    await render(FULL);

    expect(element().querySelector('.govuk-error-message')).toBeNull();
  });

  it('renders AI text as text, never as HTML', async () => {
    const markup = '<img src="x" onerror="alert(1)"><b>Synthetic</b>';
    await render(
      changesFor({
        appliedFilters: [row(SearchFilterField.APPLICANT_NAME, markup)],
        filter: { applicantName: 'Synthetic' },
        unusedParts: [markup],
        choicesNeeded: [
          {
            field: SearchFilterField.APPLICANT_SURNAME,
            text: markup,
            options: [
              {
                field: SearchFilterField.APPLICANT_SURNAME,
                code: 'Synthetic',
                label: markup,
              },
            ],
          },
        ],
      }),
    );

    expect(element().querySelector('img')).toBeNull();
    expect(element().querySelector('b')).toBeNull();
    expect(texts('#interpreted-filters-applied dd')).toEqual([markup]);
    expect(texts('#interpreted-filters-unused li')).toEqual([markup]);
    expect(element().querySelector('legend')?.textContent?.trim()).toBe(markup);
    expect(texts('.govuk-radios__label')[0]).toBe(markup);
  });

  it('moves focus to the heading when given a focus key', async () => {
    await render(FULL, { focusKey: 'interpretation-1' });

    expect(heading().tagName).toBe('H2');
    expect(heading().getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading());
    expect(
      element().querySelector('section')?.getAttribute('aria-labelledby'),
    ).toBe('interpreted-filters-heading');
  });

  it('does not move focus without a focus key', async () => {
    await render(FULL);

    expect(document.activeElement).not.toBe(heading());
  });

  it('moves focus again for a new interpretation but not when a choice is answered', async () => {
    await render(FULL, { focusKey: 'interpretation-1' });
    const radio = element().querySelector<HTMLInputElement>(
      '#interpretation-choice-1-1',
    )!;

    radio.focus();
    radio.click();
    // The page applies the pick, which always gives a new changes object
    const picked = applyInterpretationChoice(
      FULL,
      FULL.choices[0].options[0],
      ACTIVE_COURTS,
    );
    await render(picked, { answers: ['option-0'] });

    expect(picked).not.toBe(FULL);
    expect(element().querySelector('#interpretation-choice-1-1')).toBe(radio);
    expect(radio.checked).toBe(true);
    expect(document.activeElement).toBe(radio);

    await render(FULL, { focusKey: 'interpretation-2' });

    expect(document.activeElement).toBe(heading());
  });

  it('lists the courts added from court choices, as filters that were set', async () => {
    const courts = ['Synthetic Magistrates Court', 'Synthetic Closed Court'];
    await render(changesFor(), { matchedCourts: courts });

    expect(texts('#interpreted-filters-matched-courts li')).toEqual(courts);
    expect(element().textContent).toContain(
      'Your question matched more than one court, so all of them were added to the filters:',
    );
    expect(texts('.govuk-inset-text h3')).toContain('Filters set');
    expect(element().querySelector('#interpreted-filters-none')).toBeNull();
  });

  it('names the sections Not used from your question and Things to check', async () => {
    await render(FULL);

    expect(texts('.govuk-inset-text h3')).toEqual([
      'Filters set',
      'Not applied',
      'Not used from your question',
      'Things to check',
    ]);
  });

  it('says in each choice when the search runs, as a hint the fieldset is described by', async () => {
    await render(FULL);

    expect(INTERPRETATION_CHOICE_SEARCH_HINT).toBe(
      'The search runs once every choice is answered. If you use the arrow keys, it runs when you press Space or move on.',
    );
    for (const [index, fieldset] of fieldsets().entries()) {
      const hintId = `interpretation-choice-${index + 1}-hint`;
      expect(fieldset.getAttribute('aria-describedby')).toBe(hintId);
      expect(fieldset.querySelector(`#${hintId}`)?.textContent?.trim()).toBe(
        INTERPRETATION_CHOICE_SEARCH_HINT,
      );
    }
    expect(element().textContent).toContain(
      'Select None of these to search without that part of your question.',
    );
  });

  describe('when a pick is final', () => {
    const radio = (id: string): HTMLInputElement =>
      element().querySelector<HTMLInputElement>(`#${id}`)!;

    const keydown = (target: HTMLElement, key: string): void => {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      );
    };

    // What the browser does for an arrow key: focus and select the next option
    const arrowTo = (from: HTMLInputElement, to: HTMLInputElement): void => {
      keydown(from, 'ArrowDown');
      to.focus();
      to.checked = true;
      to.dispatchEvent(new Event('change', { bubbles: true }));
    };

    beforeEach(async () => {
      await render(FULL);
    });

    it('is final for a click, and for Space on an option that is not selected', () => {
      const first = radio('interpretation-choice-1-1');
      keydown(first, ' ');
      first.click();

      expect(emittedAnswers).toEqual([
        { answers: ['option-0', null], commit: true },
      ]);
      expect(commits).toBe(0);
    });

    it('is not final for an option reached with an arrow key, and a click after it is', () => {
      const first = radio('interpretation-choice-1-1');
      const second = radio('interpretation-choice-1-2');
      first.focus();

      arrowTo(first, second);
      radio('interpretation-choice-1-3').click();

      expect(emittedAnswers).toEqual([
        { answers: ['option-1', null], commit: false },
        { answers: [NONE_OF_THESE_VALUE, null], commit: true },
      ]);
      // Moving between the options of a choice confirms nothing
      expect(commits).toBe(0);
    });

    it.each([' ', 'Enter'])(
      'confirms the selected option when %j is pressed on it',
      (key) => {
        const first = radio('interpretation-choice-1-1');
        const second = radio('interpretation-choice-1-2');
        first.focus();
        arrowTo(first, second);

        keydown(second, key);

        expect(commits).toBe(1);
      },
    );

    it('does not confirm anything for Enter or an arrow key on an option that is not selected', () => {
      const first = radio('interpretation-choice-1-1');

      keydown(first, 'Enter');
      keydown(first, 'ArrowUp');

      expect(commits).toBe(0);
      expect(emittedAnswers).toEqual([]);
    });

    it('confirms the selected option when focus leaves the choice, and treats the next pick as final', () => {
      const first = radio('interpretation-choice-1-1');
      const second = radio('interpretation-choice-1-2');
      first.focus();
      arrowTo(first, second);

      // On to the next choice
      radio('interpretation-choice-2-1').focus();

      expect(commits).toBe(1);

      // The page holds the answers, so the first is still not answered here
      radio('interpretation-choice-2-1').click();
      expect(emittedAnswers.at(-1)).toEqual({
        answers: [null, 'option-0'],
        commit: true,
      });
    });
  });

  describe('Searched for', () => {
    const searchedHeading = (): HTMLElement =>
      element().querySelector<HTMLElement>('#searched-for-heading')!;

    it('is headed Searched for, with its own ids, and shows no radios', async () => {
      await render(FULL, { searched: true, answers: [null, null] });

      expect(SEARCHED_FOR_HEADING).toBe('Searched for');
      expect(searchedHeading().textContent?.trim()).toBe('Searched for');
      expect(searchedHeading().tagName).toBe('H2');
      expect(searchedHeading().getAttribute('tabindex')).toBe('-1');
      expect(
        element().querySelector('section')?.getAttribute('aria-labelledby'),
      ).toBe('searched-for-heading');
      expect(element().querySelector('section')?.id).toBe('searched-for');
      expect(
        element().querySelector('#interpreted-filters-heading'),
      ).toBeNull();
      expect(fieldsets()).toEqual([]);
      expect(element().textContent).not.toContain('Choose what you meant');
    });

    it('lists the filters, what was not applied, the unused parts and the notices', async () => {
      await render(FULL, { searched: true });

      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Magistrates Court',
        '1 March 2026',
      ]);
      expect(texts('#interpreted-filters-not-applied li')).toEqual([
        'Synthetic warrants',
      ]);
      expect(texts('#interpreted-filters-unused li')).toEqual([
        'the blue folder',
      ]);
      expect(texts('#interpreted-filters-notices li')).toEqual([
        INTERPRETATION_NOTICE_TEXT[SearchInterpretationNotice.DATE_IN_FUTURE],
      ]);
      // The heading names the list; no "Filters set" heading
      expect(texts('.govuk-inset-text h3')).toEqual([
        'Not applied',
        'Not used from your question',
        'Things to check',
      ]);
    });

    it('lists each picked option as a filter, and nothing for None of these', async () => {
      const picked = applyInterpretationChoice(
        FULL,
        FULL.choices[0].options[1],
        ACTIVE_COURTS,
      );

      await render(picked, {
        searched: true,
        answers: ['option-1', NONE_OF_THESE_VALUE],
      });

      expect(texts('#interpreted-filters-applied dt')).toEqual([
        'Court',
        'List date from',
        'Applicant organisation',
      ]);
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Magistrates Court',
        '1 March 2026',
        'Example Council',
      ]);
      expect(element().textContent).not.toContain('None of these');
    });

    it('does not list a picked option that was not applied', async () => {
      const changes = changesFor({
        filter: { courtCode: 'ZZ001' },
        choicesNeeded: [
          {
            field: SearchFilterField.CJA_CODE,
            text: 'Which area did you mean?',
            options: [
              {
                field: SearchFilterField.CJA_CODE,
                code: '99',
                label: 'Synthetic Area',
              },
            ],
          },
        ],
      });
      // A CJA pick while a court is set is not applied
      const picked = applyInterpretationChoice(
        changes,
        changes.choices[0].options[0],
        ACTIVE_COURTS,
      );

      await render(picked, { searched: true, answers: ['option-0'] });

      expect(picked.notApplied).toEqual(['Synthetic Area']);
      expect(texts('#interpreted-filters-applied dd')).toEqual([]);
      expect(texts('#interpreted-filters-not-applied li')).toEqual([
        'Synthetic Area',
      ]);
    });

    it('says the question matched more than one court and lists them all', async () => {
      const courts = ['Synthetic Magistrates Court', 'Synthetic Closed Court'];
      await render(changesFor(), { searched: true, matchedCourts: courts });

      expect(element().textContent).toContain(
        'Your question matched more than one court, so all of them were searched:',
      );
      expect(texts('#interpreted-filters-matched-courts li')).toEqual(courts);
      expect(element().querySelector('#interpreted-filters-none')).toBeNull();
    });

    it('says no filters were set, without mentioning choices, when nothing was set', async () => {
      await render(changesFor({ choicesNeeded: [APPLICANT_CHOICE] }), {
        searched: true,
        answers: [NONE_OF_THESE_VALUE],
      });

      expect(noFiltersText()).toBe(NO_FILTERS_TEXT);
    });

    it('renders AI text in the picks as text, never as HTML', async () => {
      const markup = '<img src="x" onerror="alert(1)"><b>Synthetic</b>';
      const changes = changesFor({
        choicesNeeded: [
          {
            field: SearchFilterField.APPLICANT_SURNAME,
            text: markup,
            options: [
              {
                field: SearchFilterField.APPLICANT_SURNAME,
                code: 'Synthetic',
                label: markup,
              },
            ],
          },
        ],
      });

      await render(
        applyInterpretationChoice(
          changes,
          changes.choices[0].options[0],
          ACTIVE_COURTS,
        ),
        { searched: true, answers: ['option-0'], matchedCourts: [markup] },
      );

      expect(element().querySelector('img')).toBeNull();
      expect(element().querySelector('b')).toBeNull();
      expect(texts('#interpreted-filters-applied dd')).toEqual([markup]);
      expect(texts('#interpreted-filters-matched-courts li')).toEqual([markup]);
    });

    it('moves focus to the Searched for heading when given a focus key', async () => {
      await render(FULL, { searched: true, focusKey: 1 });

      expect(document.activeElement).toBe(searchedHeading());
    });

    it('says filters were changed by hand, after the filters that are left', async () => {
      await render(FULL, { searched: true, changedByHand: true });

      expect(SEARCHED_FOR_CHANGED_BY_HAND_TEXT).toBe(
        'Some filters were changed by hand. The search form shows every filter that was searched.',
      );
      expect(texts('#interpreted-filters-applied dd')).toEqual([
        'Synthetic Magistrates Court',
        '1 March 2026',
      ]);
      expect(
        element()
          .querySelector('#interpreted-filters-applied')
          ?.compareDocumentPosition(
            element().querySelector('#interpreted-filters-changed-by-hand')!,
          ),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(texts('#interpreted-filters-changed-by-hand')).toEqual([
        SEARCHED_FOR_CHANGED_BY_HAND_TEXT,
      ]);
    });

    it('does not say no filters were set when every row was for a filter changed by hand', async () => {
      await render(changesFor({ unusedParts: ['the blue folder'] }), {
        searched: true,
        changedByHand: true,
      });

      expect(element().querySelector('#interpreted-filters-none')).toBeNull();
      expect(texts('#interpreted-filters-changed-by-hand')).toEqual([
        SEARCHED_FOR_CHANGED_BY_HAND_TEXT,
      ]);
      expect(texts('#interpreted-filters-unused li')).toEqual([
        'the blue folder',
      ]);
    });

    it('says nothing about filters changed by hand unless told', async () => {
      await render(FULL, { searched: true });

      expect(
        element().querySelector('#interpreted-filters-changed-by-hand'),
      ).toBeNull();
      expect(element().textContent).not.toContain('changed by hand');
    });
  });
});
