/**
 * Tests for the plain-English search interpretation mapper: the control map,
 * mapInterpretationToForm (replace not merge, courts, CJA, dates, status,
 * not-applied fields and choices) and applyInterpretationChoice.
 *
 * All codes, names and labels are synthetic.
 */

import {
  INTERPRETED_FILTER_CONTROLS,
  type InterpretationChoiceOption,
  type InterpretationFormChanges,
  NONE_OF_THESE_LABEL,
  NONE_OF_THESE_VALUE,
  applyInterpretationChoice,
  mapInterpretationToForm,
} from '@components/applications/util/interpretation-mapper';
import {
  ApplicationCodeCategory,
  ApplicationListStatus,
  CourtLocationGetSummaryDto,
  EntryGetFilterDto,
  InterpretationChoiceDto,
  InterpretationSource,
  InterpretedFilterDto,
  SearchFilterField,
  SearchInterpretationDto,
  SearchInterpretationNotice,
} from '@openapi';
import { DEFAULT_APPLICATIONS_SEARCH_FORM } from '@services/applications/applications-search-form.service';
import { ApplicationsSearchFormValue } from '@shared-types/applications/applications.type';

const ACTIVE_COURT = 'ZZ001';
const OTHER_ACTIVE_COURT = 'ZZ002';
const ENDED_COURT = 'ZZ900';
const OTHER_ENDED_COURT = 'ZZ901';

const ACTIVE_COURTS: CourtLocationGetSummaryDto[] = [
  {
    courtId: 1,
    locationCode: ACTIVE_COURT,
    name: 'Synthetic Magistrates Court',
  },
  {
    courtId: 2,
    locationCode: OTHER_ACTIVE_COURT,
    name: 'Synthetic County Court',
  },
];

// Every control's value on a cleared Applications search form
const EMPTY_FORM: ApplicationsSearchFormValue = {
  date: null,
  dateFrom: null,
  dateTo: null,
  applicantOrg: '',
  respondentOrg: '',
  applicantSurname: '',
  respondentSurname: '',
  applicantName: '',
  respondentName: '',
  applicationTitle: '',
  location: '',
  standardApplicantCode: '',
  respondentPostcode: '',
  accountReference: '',
  applicationCodes: [],
  resultCodes: [],
  court: '',
  courtCodes: [],
  cja: '',
  status: null,
};

function formWith(
  values: Partial<ApplicationsSearchFormValue>,
): ApplicationsSearchFormValue {
  return { ...EMPTY_FORM, ...values };
}

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

function row(
  field: SearchFilterField,
  label: string,
  source: InterpretationSource = InterpretationSource.MODEL,
): InterpretedFilterDto {
  return { field, label, source };
}

function map(
  filter: EntryGetFilterDto,
  appliedFilters: InterpretedFilterDto[] = [],
): InterpretationFormChanges {
  return mapInterpretationToForm(
    interpretation({ filter, appliedFilters }),
    ACTIVE_COURTS,
  );
}

function choice(
  field: SearchFilterField,
  options: { code: string; label: string }[],
): InterpretationChoiceDto {
  return {
    field,
    text: 'Which one did you mean?',
    options: options.map((option) => ({ field, ...option })),
  };
}

// The changes for an interpretation with one choice, and that choice's options
function withChoice(
  filter: EntryGetFilterDto,
  appliedFilters: InterpretedFilterDto[],
  choiceDto: InterpretationChoiceDto,
): {
  changes: InterpretationFormChanges;
  options: InterpretationChoiceOption[];
} {
  const changes = mapInterpretationToForm(
    interpretation({ filter, appliedFilters, choicesNeeded: [choiceDto] }),
    ACTIVE_COURTS,
  );
  return { changes, options: changes.choices[0].options };
}

function pick(
  changes: InterpretationFormChanges,
  option: InterpretationChoiceOption,
): InterpretationFormChanges {
  return applyInterpretationChoice(changes, option, ACTIVE_COURTS);
}

// The one courtCodes row the API sends: the court names joined with ", "
function courtCodesRow(...names: string[]): InterpretedFilterDto {
  return row(
    SearchFilterField.COURT_CODES,
    names.join(', '),
    InterpretationSource.SYNONYM,
  );
}

// A label cut to the API's 200 characters, ending with an ellipsis
function cutLabel(text: string): string {
  return text.length <= 200 ? text : `${text.slice(0, 199)}…`;
}

// Synthetic end-dated court codes: ZZ500, ZZ501 and so on
function endedCourts(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `ZZ${index + 500}`);
}

describe('INTERPRETED_FILTER_CONTROLS', () => {
  it('has an entry for every SearchFilterField value', () => {
    for (const field of Object.values(SearchFilterField)) {
      expect(Object.hasOwn(INTERPRETED_FILTER_CONTROLS, field)).toBe(true);
    }
  });

  it('maps the held fields to no control', () => {
    expect(INTERPRETED_FILTER_CONTROLS.applicationCodeCategory).toBeNull();
    expect(INTERPRETED_FILTER_CONTROLS.standardApplicantCodes).toBeNull();
  });

  it('maps every other field to a control on the search form', () => {
    const controls = Object.entries(INTERPRETED_FILTER_CONTROLS).filter(
      ([field]) =>
        field !== 'applicationCodeCategory' &&
        field !== 'standardApplicantCodes',
    );

    for (const [, control] of controls) {
      expect(Object.keys(EMPTY_FORM)).toContain(control);
    }
  });

  it('gives every search form control a field', () => {
    expect(
      new Set(Object.values(INTERPRETED_FILTER_CONTROLS).filter(Boolean)),
    ).toEqual(new Set(Object.keys(EMPTY_FORM)));
  });
});

describe('mapInterpretationToForm', () => {
  it('returns a cleared form and empty lists for an empty interpretation', () => {
    expect(map({})).toEqual({
      formValue: EMPTY_FORM,
      courthouseSearch: '',
      cjaSearch: '',
      courtChipLabels: {},
      appliedFilters: [],
      notApplied: [],
      choices: [],
      unusedParts: [],
      notices: [],
    });
  });

  it('treats a missing filter and missing lists as empty', () => {
    const dto = {
      interpretationId: '00000000-0000-4000-8000-000000000002',
    } as SearchInterpretationDto;

    expect(mapInterpretationToForm(dto, ACTIVE_COURTS)).toEqual(map({}));
  });

  it('starts from the page defaults', () => {
    expect({
      ...map({}).formValue,
      isAdvancedSearch: DEFAULT_APPLICATIONS_SEARCH_FORM.isAdvancedSearch,
    }).toEqual(DEFAULT_APPLICATIONS_SEARCH_FORM);
  });

  it('maps every field to its control', () => {
    const appliedFilters = [
      row(SearchFilterField.DATE_FROM, '1 October 2026'),
      row(SearchFilterField.COURT_CODE, 'Synthetic Magistrates Court'),
      row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant'),
    ];
    const result = map(
      {
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
        courtCode: ACTIVE_COURT,
        courtCodes: [OTHER_ACTIVE_COURT, ENDED_COURT],
        applicationCodes: ['AP99001', 'AP99002'],
        resultCodes: ['RC991'],
        applicantName: 'Synthetic Applicant',
        applicantOrganisation: 'Synthetic Applicant Org',
        applicantSurname: 'Applicantson',
        respondentName: 'Synthetic Respondent',
        respondentOrganisation: 'Synthetic Respondent Org',
        respondentSurname: 'Respondentson',
        respondentPostcode: 'ZZ1 1ZZ',
        accountReference: 'ACC00001',
        status: ApplicationListStatus.OPEN,
      },
      appliedFilters,
    );

    expect(result.formValue).toEqual(
      formWith({
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
        court: ACTIVE_COURT,
        courtCodes: [OTHER_ACTIVE_COURT, ENDED_COURT],
        applicationCodes: ['AP99001', 'AP99002'],
        resultCodes: ['RC991'],
        applicantName: 'Synthetic Applicant',
        applicantOrg: 'Synthetic Applicant Org',
        applicantSurname: 'Applicantson',
        respondentName: 'Synthetic Respondent',
        respondentOrg: 'Synthetic Respondent Org',
        respondentSurname: 'Respondentson',
        respondentPostcode: 'ZZ1 1ZZ',
        accountReference: 'ACC00001',
        status: 'open',
      }),
    );
    expect(result.courthouseSearch).toBe('Synthetic Magistrates Court');
    expect(result.appliedFilters).toEqual(appliedFilters);
    expect(result.notApplied).toEqual([]);
  });

  it('maps a single list date', () => {
    expect(map({ date: '2026-02-28' }).formValue).toEqual(
      formWith({ date: '2026-02-28' }),
    );
  });

  it('maps the filter fields an interpretation does not normally set', () => {
    expect(
      map({
        otherLocationDescription: 'Synthetic other location',
        applicationTitle: 'Synthetic application title',
        standardApplicantCode: 'SA99001',
      }).formValue,
    ).toEqual(
      formWith({
        location: 'Synthetic other location',
        applicationTitle: 'Synthetic application title',
        standardApplicantCode: 'SA99001',
      }),
    );
  });

  it('trims text values', () => {
    expect(map({ applicantName: '  Synthetic Applicant  ' }).formValue).toEqual(
      formWith({ applicantName: 'Synthetic Applicant' }),
    );
  });

  it('replaces every control rather than merging with earlier values', () => {
    const first = map({
      courtCode: ACTIVE_COURT,
      applicantName: 'Synthetic Applicant',
      applicationCodes: ['AP99001'],
    });
    const second = map({ respondentName: 'Synthetic Respondent' });

    expect(first.formValue.court).toBe(ACTIVE_COURT);
    expect(second.formValue).toEqual(
      formWith({ respondentName: 'Synthetic Respondent' }),
    );
    expect(second.courthouseSearch).toBe('');
  });

  it('returns lists that share no array with the input or the defaults', () => {
    const filter: EntryGetFilterDto = {
      applicationCodes: ['AP99001'],
      resultCodes: ['RC991'],
      courtCodes: [ENDED_COURT],
    };
    const result = map(filter);

    filter.applicationCodes?.push('AP99002');
    filter.resultCodes?.push('RC992');
    filter.courtCodes?.push(OTHER_ENDED_COURT);
    result.formValue.applicationCodes.push('AP99003');

    expect(result.formValue.resultCodes).toEqual(['RC991']);
    expect(result.formValue.courtCodes).toEqual([ENDED_COURT]);
    expect(filter.applicationCodes).toEqual(['AP99001', 'AP99002']);
    expect(DEFAULT_APPLICATIONS_SEARCH_FORM.applicationCodes).toEqual([]);
    expect(map({}).formValue.applicationCodes).toEqual([]);
  });

  it('removes blank and repeated codes from lists', () => {
    expect(
      map({ applicationCodes: ['AP99001', ' ', 'ap99001', ' AP99002 '] })
        .formValue.applicationCodes,
    ).toEqual(['AP99001', 'AP99002']);
  });

  it('copies the rows, unused parts and notices', () => {
    const appliedFilters = [
      row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant'),
    ];
    const dto = interpretation({
      filter: { applicantName: 'Synthetic Applicant' },
      appliedFilters,
      unusedParts: ['with a blue folder'],
      notices: [SearchInterpretationNotice.UNKNOWN_CODE_DROPPED],
    });
    const result = mapInterpretationToForm(dto, ACTIVE_COURTS);

    dto.unusedParts.push('another part');
    dto.notices.push(SearchInterpretationNotice.DATE_IN_FUTURE);
    appliedFilters[0].label = 'Changed';

    expect(result.unusedParts).toEqual(['with a blue folder']);
    expect(result.notices).toEqual([
      SearchInterpretationNotice.UNKNOWN_CODE_DROPPED,
    ]);
    expect(result.appliedFilters).toEqual([
      row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant'),
    ]);
  });

  describe('fields without a control', () => {
    it('lists held fields as not applied, using their labels', () => {
      const result = map(
        {
          applicationCodeCategory: ApplicationCodeCategory.SEARCH_WARRANTS,
          standardApplicantCodes: ['SA99001'],
          applicantName: 'Synthetic Applicant',
        },
        [
          row(
            SearchFilterField.APPLICATION_CODE_CATEGORY,
            'Search warrants',
            InterpretationSource.CATEGORY_RULE,
          ),
          row(
            SearchFilterField.STANDARD_APPLICANT_CODES,
            'Synthetic Standard Applicant',
          ),
          row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant'),
        ],
      );

      expect(result.notApplied).toEqual([
        'Search warrants',
        'Synthetic Standard Applicant',
      ]);
      expect(result.appliedFilters).toEqual([
        row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant'),
      ]);
      expect(result.formValue).toEqual(
        formWith({ applicantName: 'Synthetic Applicant' }),
      );
    });

    it('lists the value when a field without a control has no label', () => {
      expect(
        map({
          applicationCodeCategory: ApplicationCodeCategory.SEARCH_WARRANTS,
          standardApplicantCodes: ['SA99001', 'SA99002'],
        }).notApplied,
      ).toEqual(['SEARCH_WARRANTS', 'SA99001, SA99002']);
    });

    it('lists an unknown field as not applied without throwing', () => {
      const filter = {
        futureFilter: 'Synthetic value',
        futureFlag: true,
      } as unknown as EntryGetFilterDto;

      const result = map(filter);

      expect(result.notApplied).toEqual(['Synthetic value', 'futureFlag']);
      expect(result.formValue).toEqual(EMPTY_FORM);
    });

    it('lists rows for fields that are not in the filter as not applied', () => {
      const result = map({}, [
        row(SearchFilterField.RESPONDENT_POSTCODE, 'ZZ1 1ZZ'),
      ]);

      expect(result.notApplied).toEqual(['ZZ1 1ZZ']);
      expect(result.appliedFilters).toEqual([]);
    });

    it('ignores empty values', () => {
      const result = map({
        applicantName: '   ',
        respondentName: null as unknown as string,
        applicationCodes: [],
        standardApplicantCodes: [],
      });

      expect(result.formValue).toEqual(EMPTY_FORM);
      expect(result.notApplied).toEqual([]);
    });

    it('lists a value of the wrong type for its control as not applied', () => {
      const result = map({
        applicantName: 42,
        applicationCodes: 'AP99001',
      } as unknown as EntryGetFilterDto);

      expect(result.formValue).toEqual(EMPTY_FORM);
      expect(result.notApplied).toEqual(['applicantName', 'AP99001']);
    });

    it('does not list the same text twice', () => {
      expect(
        map({ standardApplicantCodes: ['SA99001'] }, [
          row(SearchFilterField.STANDARD_APPLICANT_CODES, 'Synthetic SA'),
          row(SearchFilterField.STANDARD_APPLICANT_CODES, 'Synthetic SA'),
        ]).notApplied,
      ).toEqual(['Synthetic SA']);
    });
  });

  describe('dates', () => {
    it.each([
      '2026-02-30',
      '2026-13-01',
      '02/11/2026',
      '2026-1-2',
      '0099-01-01',
    ])('lists the date %s as not applied', (date) => {
      const result = map({ dateFrom: date }, [
        row(
          SearchFilterField.DATE_FROM,
          'Synthetic date',
          InterpretationSource.DATE_RULE,
        ),
      ]);

      expect(result.formValue.dateFrom).toBeNull();
      expect(result.notApplied).toEqual(['Synthetic date']);
      expect(result.appliedFilters).toEqual([]);
    });

    it('accepts 29 February in a leap year', () => {
      expect(map({ date: '2028-02-29' }).formValue.date).toBe('2028-02-29');
    });
  });

  describe('status', () => {
    it.each([
      [ApplicationListStatus.OPEN, 'open'],
      [ApplicationListStatus.CLOSED, 'closed'],
    ])('maps %s to the Status option %s', (status, value) => {
      expect(map({ status }).formValue.status).toBe(value);
    });

    it('lists a status with no Status option as not applied', () => {
      const result = map(
        { status: 'PENDING' as unknown as ApplicationListStatus },
        [row(SearchFilterField.STATUS, 'Pending')],
      );

      expect(result.formValue.status).toBeNull();
      expect(result.notApplied).toEqual(['Pending']);
    });
  });

  describe('courts', () => {
    it('puts an active courtCode in Court with its label as display text', () => {
      const result = map({ courtCode: ACTIVE_COURT }, [
        row(
          SearchFilterField.COURT_CODE,
          'Synthetic Magistrates Court',
          InterpretationSource.EXACT_NAME,
        ),
      ]);

      expect(result.formValue.court).toBe(ACTIVE_COURT);
      expect(result.formValue.courtCodes).toEqual([]);
      expect(result.courthouseSearch).toBe('Synthetic Magistrates Court');
      expect(result.courtChipLabels).toEqual({});
    });

    it('uses the typeahead label when an active courtCode has no label', () => {
      expect(map({ courtCode: ACTIVE_COURT }).courthouseSearch).toBe(
        'ZZ001 - Synthetic Magistrates Court',
      );
    });

    it('matches an active court case-insensitively and keeps its code', () => {
      expect(map({ courtCode: 'zz001' }).formValue.court).toBe(ACTIVE_COURT);
    });

    it('puts an end-dated courtCode in Other courts with its label', () => {
      const result = map({ courtCode: ENDED_COURT }, [
        row(SearchFilterField.COURT_CODE, 'Synthetic Closed Court'),
      ]);

      expect(result.formValue.court).toBe('');
      expect(result.formValue.courtCodes).toEqual([ENDED_COURT]);
      expect(result.courthouseSearch).toBe('');
      expect(result.courtChipLabels).toEqual({
        [ENDED_COURT]: 'Synthetic Closed Court',
      });
    });

    it('puts every courtCodes code in Other courts', () => {
      const result = map({ courtCodes: [ACTIVE_COURT, ENDED_COURT] });

      expect(result.formValue.court).toBe('');
      expect(result.formValue.courtCodes).toEqual([ACTIVE_COURT, ENDED_COURT]);
      expect(result.courtChipLabels).toEqual({
        [ACTIVE_COURT]: ACTIVE_COURT,
        [ENDED_COURT]: ENDED_COURT,
      });
    });

    it('removes blank and repeated court codes', () => {
      expect(
        map({ courtCodes: [ENDED_COURT, ' ', 'zz900', OTHER_ENDED_COURT] })
          .formValue.courtCodes,
      ).toEqual([ENDED_COURT, OTHER_ENDED_COURT]);
    });

    describe('courtCodes labels (one joined row for the field)', () => {
      it('uses the row label for a list of one court', () => {
        const result = map({ courtCodes: [ENDED_COURT] }, [
          courtCodesRow('Synthetic Closed Court'),
        ]);

        expect(result.courtChipLabels).toEqual({
          [ENDED_COURT]: 'Synthetic Closed Court',
        });
      });

      it('pairs the joined names with the codes in order', () => {
        const rows = [
          courtCodesRow('Synthetic Closed Court', 'Synthetic Old Court'),
        ];

        const result = map(
          { courtCodes: [ENDED_COURT, OTHER_ENDED_COURT] },
          rows,
        );

        expect(result.formValue.courtCodes).toEqual([
          ENDED_COURT,
          OTHER_ENDED_COURT,
        ]);
        expect(result.courtChipLabels).toEqual({
          [ENDED_COURT]: 'Synthetic Closed Court',
          [OTHER_ENDED_COURT]: 'Synthetic Old Court',
        });
        expect(result.appliedFilters).toEqual(rows);
        expect(result.notApplied).toEqual([]);
      });

      it('labels a court with no name by its code, the part the API sends', () => {
        const result = map(
          { courtCodes: [ENDED_COURT, 'ZZ902', OTHER_ENDED_COURT] },
          [
            courtCodesRow(
              'Synthetic Closed Court',
              'ZZ902',
              'Synthetic Old Court',
            ),
          ],
        );

        expect(result.courtChipLabels).toEqual({
          [ENDED_COURT]: 'Synthetic Closed Court',
          ZZ902: 'ZZ902',
          [OTHER_ENDED_COURT]: 'Synthetic Old Court',
        });
      });

      it('labels an active and an end-dated court by position', () => {
        // The Other courts chip still shows the options label for the active
        // court: app-multi-suggestions prefers it to courtChipLabels
        const result = map({ courtCodes: [ACTIVE_COURT, ENDED_COURT] }, [
          courtCodesRow(
            'Synthetic Magistrates Court',
            'Synthetic Closed Court',
          ),
        ]);

        expect(result.formValue.court).toBe('');
        expect(result.formValue.courtCodes).toEqual([
          ACTIVE_COURT,
          ENDED_COURT,
        ]);
        expect(result.courtChipLabels).toEqual({
          [ACTIVE_COURT]: 'Synthetic Magistrates Court',
          [ENDED_COURT]: 'Synthetic Closed Court',
        });
      });

      it('pairs by position in the list as sent, before repeats are removed', () => {
        const result = map(
          { courtCodes: [ENDED_COURT, 'zz900', OTHER_ENDED_COURT] },
          [
            courtCodesRow(
              'Synthetic Closed Court',
              'Synthetic Closed Court',
              'Synthetic Old Court',
            ),
          ],
        );

        expect(result.formValue.courtCodes).toEqual([
          ENDED_COURT,
          OTHER_ENDED_COURT,
        ]);
        expect(result.courtChipLabels).toEqual({
          [ENDED_COURT]: 'Synthetic Closed Court',
          [OTHER_ENDED_COURT]: 'Synthetic Old Court',
        });
      });

      it('falls back to the codes when a name holds a comma and a space', () => {
        const result = map({ courtCodes: [ENDED_COURT, OTHER_ENDED_COURT] }, [
          courtCodesRow(
            'Synthetic Closed Court, North Wing',
            'Synthetic Old Court',
          ),
        ]);

        expect(result.courtChipLabels).toEqual({
          [ENDED_COURT]: ENDED_COURT,
          [OTHER_ENDED_COURT]: OTHER_ENDED_COURT,
        });
        expect(result.notApplied).toEqual([]);
      });

      it('falls back to the codes when the label was cut, even if the parts count up', () => {
        // A name with ", " makes up for the name lost to the cut, so there is
        // one part for each code, but the parts no longer line up with them
        const codes = [ENDED_COURT, OTHER_ENDED_COURT, 'ZZ902', 'ZZ903'];
        const label = cutLabel(
          [
            'Synthetic Closed Court, North Wing',
            'Synthetic Old Court',
            `Synthetic Long Court ${'of Many Words '.repeat(12)}`,
            'Synthetic Lost Court',
          ].join(', '),
        );

        const result = map({ courtCodes: codes }, [
          row(
            SearchFilterField.COURT_CODES,
            label,
            InterpretationSource.SYNONYM,
          ),
        ]);

        expect(label).toHaveLength(200);
        expect(label.endsWith('…')).toBe(true);
        expect(label.split(', ')).toHaveLength(codes.length);
        expect(result.formValue.courtCodes).toEqual(codes);
        expect(result.courtChipLabels).toEqual(
          Object.fromEntries(codes.map((code) => [code, code])),
        );
      });

      it('never gives the joined label to the court whose code is in it', () => {
        // ZZ901 has no name, so its part is its code
        const rows = [
          courtCodesRow(
            'Synthetic Closed Court, North Wing',
            OTHER_ENDED_COURT,
            'Synthetic Far Court',
          ),
        ];

        const result = map(
          { courtCodes: [ENDED_COURT, OTHER_ENDED_COURT, 'ZZ902'] },
          rows,
        );

        expect(Object.values(result.courtChipLabels)).not.toContain(
          rows[0].label,
        );
        expect(result.courtChipLabels).toEqual({
          [ENDED_COURT]: ENDED_COURT,
          [OTHER_ENDED_COURT]: OTHER_ENDED_COURT,
          ZZ902: 'ZZ902',
        });
      });

      it('falls back to the codes when the field has more than one row', () => {
        const result = map({ courtCodes: [ENDED_COURT, OTHER_ENDED_COURT] }, [
          courtCodesRow('Synthetic Closed Court'),
          courtCodesRow('Synthetic Old Court'),
        ]);

        expect(result.courtChipLabels).toEqual({
          [ENDED_COURT]: ENDED_COURT,
          [OTHER_ENDED_COURT]: OTHER_ENDED_COURT,
        });
      });
    });

    describe('court limits (20 in all, 19 in Other courts)', () => {
      it('keeps 19 in Other courts and puts a 20th active court in Court', () => {
        const ended = endedCourts(19);

        const result = map({ courtCodes: [...ended, ACTIVE_COURT] });

        expect(result.formValue.court).toBe(ACTIVE_COURT);
        expect(result.courthouseSearch).toBe(
          'ZZ001 - Synthetic Magistrates Court',
        );
        expect(result.formValue.courtCodes).toEqual(ended);
        expect(result.notApplied).toEqual([]);
      });

      it('moves an active court from a full Other courts into Court to make room', () => {
        const ended = endedCourts(19);

        const result = map({ courtCodes: [ACTIVE_COURT, ...ended] }, [
          courtCodesRow('Synthetic Magistrates Court', ...ended),
        ]);

        expect(result.formValue.court).toBe(ACTIVE_COURT);
        expect(result.courthouseSearch).toBe('Synthetic Magistrates Court');
        expect(result.formValue.courtCodes).toEqual(ended);
        expect(result.courtChipLabels).toEqual(
          Object.fromEntries(ended.map((code) => [code, code])),
        );
        expect(result.notApplied).toEqual([]);
      });

      it('uses the typeahead label for a moved court with no label', () => {
        const result = map({
          courtCodes: [ACTIVE_COURT, ...endedCourts(19)],
        });

        expect(result.formValue.court).toBe(ACTIVE_COURT);
        expect(result.courthouseSearch).toBe(
          'ZZ001 - Synthetic Magistrates Court',
        );
        expect(result.courtChipLabels).not.toHaveProperty(ACTIVE_COURT);
      });

      it('lists the 20th court as not applied when none is active', () => {
        const ended = endedCourts(20);

        const result = map({ courtCodes: ended });

        expect(result.formValue.court).toBe('');
        expect(result.courthouseSearch).toBe('');
        expect(result.formValue.courtCodes).toEqual(ended.slice(0, 19));
        expect(result.notApplied).toEqual(['ZZ519']);
      });

      it('lists the 20th court by its label when none is active', () => {
        const ended = endedCourts(20);
        const names = ended.map((_, index) => `Old ${index}`);

        const result = map({ courtCodes: ended }, [courtCodesRow(...names)]);

        expect(result.formValue.courtCodes).toHaveLength(19);
        expect(result.notApplied).toEqual(['Old 19']);
      });

      it('lists courts over the API limit of 20 as not applied', () => {
        const ended = endedCourts(20);

        const result = map({ courtCodes: [ACTIVE_COURT, ...ended] });

        expect(result.formValue.court).toBe(ACTIVE_COURT);
        expect(result.formValue.courtCodes).toEqual(ended.slice(0, 19));
        expect(result.notApplied).toEqual(['ZZ519']);
      });

      it('keeps a courtCode in Court alongside 19 Other courts', () => {
        const ended = endedCourts(20);

        const result = map({ courtCode: ACTIVE_COURT, courtCodes: ended });

        expect(result.formValue.court).toBe(ACTIVE_COURT);
        expect(result.formValue.courtCodes).toEqual(ended.slice(0, 19));
        expect(result.notApplied).toEqual(['ZZ519']);
      });
    });

    it('lists application codes over the API limit of 50 as not applied', () => {
      const codes = Array.from(
        { length: 51 },
        (_, index) => `AP${index + 99000}`,
      );

      const result = map({ applicationCodes: codes });

      expect(result.formValue.applicationCodes).toEqual(codes.slice(0, 50));
      expect(result.notApplied).toEqual(['AP99050']);
    });

    it('lists result codes over the API limit of 20 as not applied', () => {
      const codes = Array.from(
        { length: 21 },
        (_, index) => `RC${index + 900}`,
      );

      const result = map({ resultCodes: codes });

      expect(result.formValue.resultCodes).toEqual(codes.slice(0, 20));
      expect(result.notApplied).toEqual(['RC920']);
    });
  });

  describe('criminal justice area', () => {
    it('sets CJA with its label as display text', () => {
      const result = map({ cjaCode: '99' }, [
        row(SearchFilterField.CJA_CODE, 'Synthetic Area'),
      ]);

      expect(result.formValue.cja).toBe('99');
      expect(result.cjaSearch).toBe('Synthetic Area');
      expect(result.notApplied).toEqual([]);
    });

    it('uses the code as display text when the CJA has no label', () => {
      expect(map({ cjaCode: '99' }).cjaSearch).toBe('99');
    });

    it('keeps Court and lists the CJA as not applied', () => {
      const result = map({ courtCode: ACTIVE_COURT, cjaCode: '99' }, [
        row(SearchFilterField.COURT_CODE, 'Synthetic Magistrates Court'),
        row(SearchFilterField.CJA_CODE, 'Synthetic Area'),
      ]);

      expect(result.formValue.court).toBe(ACTIVE_COURT);
      expect(result.formValue.cja).toBe('');
      expect(result.cjaSearch).toBe('');
      expect(result.notApplied).toEqual(['Synthetic Area']);
      expect(result.appliedFilters).toEqual([
        row(SearchFilterField.COURT_CODE, 'Synthetic Magistrates Court'),
      ]);
    });

    it('keeps Other courts and lists the CJA as not applied', () => {
      const result = map({ courtCodes: [ENDED_COURT], cjaCode: '99' });

      expect(result.formValue.courtCodes).toEqual([ENDED_COURT]);
      expect(result.formValue.cja).toBe('');
      expect(result.notApplied).toEqual(['99']);
    });

    it('keeps a court and lists Other location as not applied', () => {
      const result = map({
        courtCode: ACTIVE_COURT,
        otherLocationDescription: 'Synthetic other location',
      });

      expect(result.formValue.location).toBe('');
      expect(result.notApplied).toEqual(['Synthetic other location']);
    });

    it('keeps CJA and Other location together without a court', () => {
      expect(
        map({ cjaCode: '99', otherLocationDescription: 'Synthetic place' })
          .formValue,
      ).toEqual(formWith({ cja: '99', location: 'Synthetic place' }));
    });
  });

  describe('choices', () => {
    it('builds radio options from each choice plus None of these', () => {
      const result = mapInterpretationToForm(
        interpretation({
          choicesNeeded: [
            {
              field: SearchFilterField.COURT_CODE,
              text: 'Which court did you mean?',
              options: [
                {
                  field: SearchFilterField.COURT_CODE,
                  code: ACTIVE_COURT,
                  label: 'Synthetic Magistrates Court',
                },
                {
                  field: SearchFilterField.CJA_CODE,
                  code: '99',
                  label: 'Synthetic Area',
                },
              ],
            },
            choice(SearchFilterField.APPLICATION_CODES, [
              { code: 'AP99001', label: 'Synthetic application' },
            ]),
          ],
        }),
        ACTIVE_COURTS,
      );

      expect(result.choices).toEqual([
        {
          field: SearchFilterField.COURT_CODE,
          text: 'Which court did you mean?',
          options: [
            {
              label: 'Synthetic Magistrates Court',
              value: 'option-0',
              pick: {
                field: SearchFilterField.COURT_CODE,
                code: ACTIVE_COURT,
                label: 'Synthetic Magistrates Court',
              },
            },
            {
              label: 'Synthetic Area',
              value: 'option-1',
              pick: {
                field: SearchFilterField.CJA_CODE,
                code: '99',
                label: 'Synthetic Area',
              },
            },
            {
              label: NONE_OF_THESE_LABEL,
              value: NONE_OF_THESE_VALUE,
              pick: null,
            },
          ],
        },
        {
          field: SearchFilterField.APPLICATION_CODES,
          text: 'Which one did you mean?',
          options: [
            {
              label: 'Synthetic application',
              value: 'option-0',
              pick: {
                field: SearchFilterField.APPLICATION_CODES,
                code: 'AP99001',
                label: 'Synthetic application',
              },
            },
            {
              label: NONE_OF_THESE_LABEL,
              value: NONE_OF_THESE_VALUE,
              pick: null,
            },
          ],
        },
      ]);
      expect(NONE_OF_THESE_LABEL).toBe('None of these');
    });

    it('offers only None of these for a choice without options', () => {
      const result = mapInterpretationToForm(
        interpretation({
          choicesNeeded: [choice(SearchFilterField.COURT_CODE, [])],
        }),
        ACTIVE_COURTS,
      );

      expect(result.choices[0].options).toEqual([
        { label: NONE_OF_THESE_LABEL, value: NONE_OF_THESE_VALUE, pick: null },
      ]);
    });

    it('does not apply a choice by itself', () => {
      const { changes } = withChoice(
        {},
        [],
        choice(SearchFilterField.APPLICATION_CODES, [
          { code: 'AP99001', label: 'Synthetic application' },
        ]),
      );

      expect(changes.formValue).toEqual(EMPTY_FORM);
    });
  });
});

describe('applyInterpretationChoice', () => {
  it('changes nothing for None of these', () => {
    const { changes, options } = withChoice(
      { applicantName: 'Synthetic Applicant' },
      [row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant')],
      choice(SearchFilterField.COURT_CODE, [
        { code: ACTIVE_COURT, label: 'Synthetic Magistrates Court' },
      ]),
    );

    const result = pick(changes, options[1]);

    expect(options[1].value).toBe(NONE_OF_THESE_VALUE);
    expect(result).toEqual(changes);
    expect(result).not.toBe(changes);
    expect(result.formValue.courtCodes).not.toBe(changes.formValue.courtCodes);
  });

  it('adds an array option to the codes already in the list', () => {
    const { changes, options } = withChoice(
      { applicationCodes: ['AP99001'] },
      [],
      choice(SearchFilterField.APPLICATION_CODES, [
        { code: 'AP99002', label: 'Synthetic application' },
      ]),
    );

    expect(pick(changes, options[0]).formValue.applicationCodes).toEqual([
      'AP99001',
      'AP99002',
    ]);
  });

  it('does not add a code that is already in the list', () => {
    const { changes, options } = withChoice(
      { resultCodes: ['RC991'] },
      [],
      choice(SearchFilterField.RESULT_CODES, [
        { code: 'rc991', label: 'Synthetic result' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.resultCodes).toEqual(['RC991']);
    expect(result.notApplied).toEqual([]);
  });

  it('does not add a court that is already searched', () => {
    const { changes, options } = withChoice(
      { courtCode: ACTIVE_COURT },
      [],
      choice(SearchFilterField.COURT_CODES, [
        { code: 'zz001', label: 'Synthetic Magistrates Court' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.court).toBe(ACTIVE_COURT);
    expect(result.formValue.courtCodes).toEqual([]);
    expect(result.notApplied).toEqual([]);
  });

  it('lists an option with a blank code as not applied', () => {
    const { changes, options } = withChoice(
      {},
      [],
      choice(SearchFilterField.APPLICANT_NAME, [
        { code: '  ', label: 'Synthetic blank' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue).toEqual(EMPTY_FORM);
    expect(result.notApplied).toEqual(['Synthetic blank']);
  });

  it('lists the option as not applied when its list is full', () => {
    const codes = Array.from({ length: 20 }, (_, index) => `RC${index + 900}`);
    const { changes, options } = withChoice(
      { resultCodes: codes },
      [],
      choice(SearchFilterField.RESULT_CODES, [
        { code: 'RC999', label: 'Synthetic result' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.resultCodes).toEqual(codes);
    expect(result.notApplied).toEqual(['Synthetic result']);
  });

  it('adds a courtCodes option to Other courts with its label', () => {
    const { changes, options } = withChoice(
      { courtCodes: [ENDED_COURT] },
      [],
      choice(SearchFilterField.COURT_CODES, [
        { code: ACTIVE_COURT, label: 'Synthetic Magistrates Court' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.court).toBe('');
    expect(result.formValue.courtCodes).toEqual([ENDED_COURT, ACTIVE_COURT]);
    expect(result.courtChipLabels[ACTIVE_COURT]).toBe(
      'Synthetic Magistrates Court',
    );
  });

  it('puts an active courtCode option in an empty Court', () => {
    const { changes, options } = withChoice(
      {},
      [],
      choice(SearchFilterField.COURT_CODE, [
        { code: ACTIVE_COURT, label: 'Synthetic Magistrates Court' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.court).toBe(ACTIVE_COURT);
    expect(result.courthouseSearch).toBe('Synthetic Magistrates Court');
  });

  it('adds a courtCode option to Other courts when Court holds a court', () => {
    const { changes, options } = withChoice(
      { courtCode: ACTIVE_COURT },
      [row(SearchFilterField.COURT_CODE, 'Synthetic Magistrates Court')],
      choice(SearchFilterField.COURT_CODE, [
        { code: OTHER_ACTIVE_COURT, label: 'Synthetic County Court' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.court).toBe(ACTIVE_COURT);
    expect(result.courthouseSearch).toBe('Synthetic Magistrates Court');
    expect(result.formValue.courtCodes).toEqual([OTHER_ACTIVE_COURT]);
    expect(result.appliedFilters).toEqual(changes.appliedFilters);
  });

  it('keeps the rows of courts already searched when a court is added', () => {
    const { changes, options } = withChoice(
      { courtCode: ENDED_COURT },
      [row(SearchFilterField.COURT_CODE, 'Synthetic Closed Court')],
      choice(SearchFilterField.COURT_CODE, [
        { code: ACTIVE_COURT, label: 'Synthetic Magistrates Court' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.court).toBe(ACTIVE_COURT);
    expect(result.formValue.courtCodes).toEqual([ENDED_COURT]);
    expect(result.appliedFilters).toEqual([
      row(SearchFilterField.COURT_CODE, 'Synthetic Closed Court'),
    ]);
  });

  it('adds an end-dated courtCode option to Other courts with its label', () => {
    const { changes, options } = withChoice(
      {},
      [],
      choice(SearchFilterField.COURT_CODE, [
        { code: ENDED_COURT, label: 'Synthetic Closed Court' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.court).toBe('');
    expect(result.formValue.courtCodes).toEqual([ENDED_COURT]);
    expect(result.courtChipLabels).toEqual({
      [ENDED_COURT]: 'Synthetic Closed Court',
    });
  });

  describe('when Other courts holds 19', () => {
    const ended = endedCourts(19);

    it('puts an active courtCodes option in an empty Court', () => {
      const { changes, options } = withChoice(
        { courtCodes: ended },
        [],
        choice(SearchFilterField.COURT_CODES, [
          { code: ACTIVE_COURT, label: 'Synthetic Magistrates Court' },
        ]),
      );

      const result = pick(changes, options[0]);

      expect(result.formValue.court).toBe(ACTIVE_COURT);
      expect(result.courthouseSearch).toBe('Synthetic Magistrates Court');
      expect(result.formValue.courtCodes).toEqual(ended);
      expect(result.notApplied).toEqual([]);
    });

    it('lists an end-dated option as not applied when no court is active', () => {
      const { changes, options } = withChoice(
        { courtCodes: ended },
        [],
        choice(SearchFilterField.COURT_CODES, [
          { code: ENDED_COURT, label: 'Synthetic Closed Court' },
        ]),
      );

      const result = pick(changes, options[0]);

      expect(result.formValue.court).toBe('');
      expect(result.formValue.courtCodes).toEqual(ended);
      expect(result.courtChipLabels).not.toHaveProperty(ENDED_COURT);
      expect(result.notApplied).toEqual(['Synthetic Closed Court']);
    });

    it('moves an active court into Court to make room for an end-dated option', () => {
      const others = endedCourts(18);
      const { changes, options } = withChoice(
        { courtCodes: [ACTIVE_COURT, ...others] },
        [courtCodesRow('Synthetic Magistrates Court', ...others)],
        choice(SearchFilterField.COURT_CODES, [
          { code: ENDED_COURT, label: 'Synthetic Closed Court' },
        ]),
      );

      const result = pick(changes, options[0]);

      expect(changes.formValue.courtCodes).toHaveLength(19);
      expect(result.formValue.court).toBe(ACTIVE_COURT);
      expect(result.courthouseSearch).toBe('Synthetic Magistrates Court');
      expect(result.formValue.courtCodes).toEqual([...others, ENDED_COURT]);
      expect(result.courtChipLabels).not.toHaveProperty(ACTIVE_COURT);
      expect(result.courtChipLabels[ENDED_COURT]).toBe(
        'Synthetic Closed Court',
      );
      expect(result.notApplied).toEqual([]);
    });

    it('lists a courtCode option as not applied when Court is set', () => {
      const { changes, options } = withChoice(
        { courtCode: ACTIVE_COURT, courtCodes: ended },
        [],
        choice(SearchFilterField.COURT_CODE, [
          { code: OTHER_ACTIVE_COURT, label: 'Synthetic County Court' },
        ]),
      );

      const result = pick(changes, options[0]);

      expect(result.formValue.court).toBe(ACTIVE_COURT);
      expect(result.formValue.courtCodes).toEqual(ended);
      expect(result.notApplied).toEqual(['Synthetic County Court']);
    });
  });

  it('sets a scalar option, replacing the value and rows it had', () => {
    const { changes, options } = withChoice(
      { cjaCode: '98' },
      [row(SearchFilterField.CJA_CODE, 'Synthetic First Area')],
      choice(SearchFilterField.CJA_CODE, [
        { code: '99', label: 'Synthetic Second Area' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.cja).toBe('99');
    expect(result.cjaSearch).toBe('Synthetic Second Area');
    expect(result.appliedFilters).toEqual([]);
    expect(result.notApplied).toEqual([]);
  });

  it('keeps the rows when a scalar option sets the same value', () => {
    const { changes, options } = withChoice(
      { applicantName: 'Synthetic Applicant' },
      [row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant')],
      choice(SearchFilterField.APPLICANT_NAME, [
        { code: 'Synthetic Applicant', label: 'Synthetic Applicant' },
      ]),
    );

    expect(pick(changes, options[0]).appliedFilters).toEqual([
      row(SearchFilterField.APPLICANT_NAME, 'Synthetic Applicant'),
    ]);
  });

  it.each([
    [SearchFilterField.STATUS, 'CLOSED', 'status', 'closed'],
    [SearchFilterField.DATE, '2026-11-02', 'date', '2026-11-02'],
    [
      SearchFilterField.RESPONDENT_POSTCODE,
      'ZZ9 9ZZ',
      'respondentPostcode',
      'ZZ9 9ZZ',
    ],
  ] as const)(
    'sets a %s option on its control',
    (field, code, control, value) => {
      const { changes, options } = withChoice(
        {},
        [],
        choice(field, [{ code, label: 'Synthetic label' }]),
      );

      expect(pick(changes, options[0]).formValue[control]).toBe(value);
    },
  );

  it.each([
    [SearchFilterField.STATUS, 'PENDING'],
    [SearchFilterField.DATE_TO, '2026-02-31'],
    [SearchFilterField.STANDARD_APPLICANT_CODES, 'SA99001'],
    [SearchFilterField.APPLICATION_CODE_CATEGORY, 'SEARCH_WARRANTS'],
    ['futureFilter' as unknown as SearchFilterField, 'ZZ1'],
  ])('lists a %s option the form cannot hold as not applied', (field, code) => {
    const { changes, options } = withChoice(
      {},
      [],
      choice(field, [{ code, label: 'Synthetic label' }]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue).toEqual(EMPTY_FORM);
    expect(result.notApplied).toEqual(['Synthetic label']);
  });

  it('lists a CJA option as not applied while a court is set', () => {
    const { changes, options } = withChoice(
      { courtCodes: [ENDED_COURT] },
      [],
      choice(SearchFilterField.CJA_CODE, [
        { code: '99', label: 'Synthetic Area' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.cja).toBe('');
    expect(result.cjaSearch).toBe('');
    expect(result.formValue.courtCodes).toEqual([ENDED_COURT]);
    expect(result.notApplied).toEqual(['Synthetic Area']);
  });

  it('removes the CJA when a court option is picked', () => {
    const { changes, options } = withChoice(
      { cjaCode: '99' },
      [row(SearchFilterField.CJA_CODE, 'Synthetic Area')],
      choice(SearchFilterField.COURT_CODE, [
        { code: ACTIVE_COURT, label: 'Synthetic Magistrates Court' },
      ]),
    );

    const result = pick(changes, options[0]);

    expect(result.formValue.court).toBe(ACTIVE_COURT);
    expect(result.formValue.cja).toBe('');
    expect(result.cjaSearch).toBe('');
    expect(result.appliedFilters).toEqual([]);
    expect(result.notApplied).toEqual(['Synthetic Area']);
  });

  it('does not change the changes it is given', () => {
    const { changes, options } = withChoice(
      { cjaCode: '99', applicationCodes: ['AP99001'] },
      [row(SearchFilterField.CJA_CODE, 'Synthetic Area')],
      choice(SearchFilterField.COURT_CODES, [
        { code: ENDED_COURT, label: 'Synthetic Closed Court' },
      ]),
    );
    const before = JSON.parse(JSON.stringify(changes)) as unknown;

    pick(changes, options[0]);

    expect(changes).toEqual(before);
  });

  it('applies one answer per choice when each is applied in turn', () => {
    const changes = mapInterpretationToForm(
      interpretation({
        choicesNeeded: [
          choice(SearchFilterField.COURT_CODE, [
            { code: ACTIVE_COURT, label: 'Synthetic Magistrates Court' },
          ]),
          choice(SearchFilterField.APPLICATION_CODES, [
            { code: 'AP99001', label: 'Synthetic application' },
          ]),
          choice(SearchFilterField.RESULT_CODES, [
            { code: 'RC991', label: 'Synthetic result' },
          ]),
        ],
      }),
      ACTIVE_COURTS,
    );
    const answers = [
      changes.choices[0].options[0],
      changes.choices[1].options[0],
      changes.choices[2].options[1],
    ];

    const result = answers.reduce(pick, changes);

    expect(result.formValue).toEqual(
      formWith({ court: ACTIVE_COURT, applicationCodes: ['AP99001'] }),
    );
  });
});
