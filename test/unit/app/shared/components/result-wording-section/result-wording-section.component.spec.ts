import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicantContext } from '@components/applications-list/util/routing-state-util';

import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import {
  ResultCodeGetSummaryDto,
  ResultGetDto,
  TemplateDetail,
} from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { ResultRow } from '@util/result-code-helpers';

function makeResultCode(
  overrides: Partial<ResultCodeGetSummaryDto>,
): ResultCodeGetSummaryDto {
  const base = { resultCode: '', title: '' };
  return { ...base, ...overrides } as unknown as ResultCodeGetSummaryDto;
}

function makeExistingResult(overrides: Partial<ResultGetDto>): ResultGetDto {
  const base = { id: '', resultCode: '' };
  return { ...base, ...overrides } as unknown as ResultGetDto;
}

describe('ResultWordingSectionComponent', () => {
  let component: ResultWordingSectionComponent;
  let fixture: ComponentFixture<ResultWordingSectionComponent>;

  const codes: ResultCodeGetSummaryDto[] = [
    makeResultCode({ resultCode: 'RC1', title: 'First' }),
    makeResultCode({ resultCode: 'RC2', title: 'Second Match' }),
    makeResultCode({ resultCode: 'AB9', title: 'Other' }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultWordingSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultWordingSectionComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'resultApplicantContext',
      [] as ApplicantContext[],
    );
    fixture.componentRef.setInput('resultCodesList', codes);
    fixture.componentRef.setInput('existingResults', [] as ResultGetDto[]);
    fixture.componentRef.setInput(
      'wordingByCode',
      {} as Record<string, string>,
    );
    fixture.componentRef.setInput('resultCodeTemplateByCode', {
      RC1: { template: "Result 'RC1' applied." },
      RC2: { template: "Result 'RC2' applied." },
      AB9: { template: "Result 'AB9' applied." },
    } as Record<string, TemplateDetail>);
    fixture.componentRef.setInput('clearPendingToken', 0);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filteredResultCodes returns [] when search is empty', () => {
    component.resultCodeSearch = '';
    expect(component.filteredResultCodes).toEqual([]);
  });

  it('filteredResultCodes returns matches when search has text and no pending', () => {
    component.resultCodeSearch = 'second';
    const res = component.filteredResultCodes;

    expect(res).toHaveLength(1);
    expect(res[0].resultCode).toBe('RC2');
  });

  it('filteredResultCodes returns [] when there is a pending row', () => {
    component.selectResultCode(codes[0]);
    component.resultCodeSearch = 'rc';

    expect(component.filteredResultCodes).toEqual([]);
  });

  it('selectResultCode creates one pending row, emits pendingChange, clears search', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    component.resultCodeSearch = 'rc1';
    component.selectResultCode(codes[0]);

    expect(component.canSubmitResults()).toBe(true);
    expect(component.resultCodeSearch).toBe('');

    expect(pendingEmitSpy).toHaveBeenCalledTimes(1);

    const emitted = pendingEmitSpy.mock.calls[0][0];
    expect(emitted).toHaveLength(1);
    expect(emitted[0].kind).toBe('pending');
    expect(emitted[0].resultCode).toBe('RC1');
    expect(emitted[0].display).toBe('RC1 - First');
    expect(typeof emitted[0].tempId).toBe('string');
  });

  it('selectResultCode does nothing if code is blank after trim', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    component.selectResultCode(
      makeResultCode({ resultCode: '   ', title: 'X' }),
    );

    expect(component.canSubmitResults()).toBe(false);
    expect(pendingEmitSpy).not.toHaveBeenCalled();
  });

  it('selectResultCode prevents duplicates vs existingResults', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    fixture.componentRef.setInput('existingResults', [
      makeExistingResult({ id: 'E1', resultCode: 'RC2' }),
    ]);
    fixture.detectChanges();

    component.resultCodeSearch = 'rc2';
    component.selectResultCode(codes[1]);

    expect(component.canSubmitResults()).toBe(false);
    expect(component.resultCodeSearch).toBe(''); // clears search on duplicate
    expect(pendingEmitSpy).not.toHaveBeenCalled();
  });

  it('canSubmitResults is true when pending is added even before template is loaded', () => {
    fixture.componentRef.setInput('resultCodeTemplateByCode', {});
    fixture.detectChanges();

    component.selectResultCode(codes[0]);

    expect(component.canSubmitResults()).toBe(true);
  });

  it('canSubmitResults is false for existing templated rows until edited', () => {
    fixture.componentRef.setInput('existingResults', [
      makeExistingResult({
        id: 'E1',
        resultCode: 'RC2',
        wording: {
          template: "Result '{{ Date }}' applied.",
          'substitution-key-constraints': [
            { key: 'Date', value: '2025-10-25', constraint: { length: 10 } },
          ],
        } as unknown as TemplateDetail,
      }),
    ]);
    fixture.detectChanges();

    expect(component.canSubmitResults()).toBe(false);

    component.onCardWordingFieldsDTO(
      {
        id: 'E1',
        status: 'existing',
        title: 'RC2 - Second Match',
        content: [],
      },
      {
        wordingFields: [{ key: 'Date', value: '2026-03-04' }],
      },
    );

    expect(component.canSubmitResults()).toBe(true);
  });

  it('getWordingValuesForCard returns saved substitution values for existing results', () => {
    fixture.componentRef.setInput('existingResults', [
      makeExistingResult({
        id: 'E1',
        resultCode: 'RC2',
        wording: {
          template: "Result '{{ Date }}' applied.",
          'substitution-key-constraints': [
            { key: 'Date', value: '2025-10-25', constraint: { length: 10 } },
          ],
        } as unknown as TemplateDetail,
      }),
    ]);
    fixture.detectChanges();

    const card = component.existingResultSummaryLists()[0];

    expect(component.getWordingValuesForCard(card)).toEqual({
      template: "Result '{{ Date }}' applied.",
      'substitution-key-constraints': [
        { key: 'Date', value: '2025-10-25', constraint: { length: 10 } },
      ],
    });
  });

  it('getWordingValuesForCard returns draft substitution values for pending results', () => {
    fixture.componentRef.setInput('resultCodeTemplateByCode', {
      RC1: {
        template: "Result '{{ Date }}' applied.",
        'substitution-key-constraints': [
          { key: 'Date', constraint: { length: 10 } },
        ],
      },
    } as Record<string, TemplateDetail>);
    fixture.detectChanges();

    component.selectResultCode(codes[0]);

    const card = component.existingResultSummaryLists()[0];
    component.onCardWordingFieldsDTO(card, {
      wordingFields: [{ key: 'Date', value: '2026-03-02' }],
    });

    expect(component.getWordingValuesForCard(card)).toEqual({
      template: "Result '{{ Date }}' applied.",
      'substitution-key-constraints': [
        { key: 'Date', value: '2026-03-02', constraint: { length: 10 } },
      ],
    });
  });

  it('onSaveResult emits submitResults with pending row', () => {
    const submitSpy = jest.spyOn(component.submitResults, 'emit');

    component.selectResultCode(codes[0]);
    component.onSaveResult();

    expect(submitSpy).toHaveBeenCalledTimes(1);
    const payload = submitSpy.mock.calls[0][0];
    expect(payload.pendingToCreate).toHaveLength(1);
    expect(payload.pendingToCreate[0].kind).toBe('pending');
    expect(payload.pendingToCreate[0].resultCode).toBe('RC1');
    expect(payload.existingToUpdate).toEqual([]);
  });

  it('canSubmitResults is true for placeholder templates, but apply is blocked until wording fields are saved', () => {
    fixture.componentRef.setInput('resultCodeTemplateByCode', {
      RC1: {
        template: "Result '{{ Date }}' applied.",
        'substitution-key-constraints': [],
      },
    } as Record<string, TemplateDetail>);
    fixture.detectChanges();

    const submitSpy = jest.spyOn(component.submitResults, 'emit');
    component.selectResultCode(codes[0]);
    expect(component.canSubmitResults()).toBe(true);

    component.onSaveResult();
    expect(submitSpy).not.toHaveBeenCalled();

    component.onCardWordingFieldsDTO(
      {
        id: component.existingResultSummaryLists()[0].id,
        status: 'pending',
        title: component.existingResultSummaryLists()[0].title,
        content: component.existingResultSummaryLists()[0].content,
      },
      {
        wordingFields: [{ key: 'Date', value: '2026-03-02' }],
      },
    );

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy.mock.calls[0][0].pendingToCreate[0].wordingFields).toEqual(
      [{ key: 'Date', value: '2026-03-02' }],
    );
  });

  it('onSaveResult increments wordingSubmitAttempt for placeholder templates', () => {
    fixture.componentRef.setInput('resultCodeTemplateByCode', {
      RC1: {
        template: "Result '{{ Date }}' applied.",
        'substitution-key-constraints': [],
      },
    } as Record<string, TemplateDetail>);
    fixture.detectChanges();

    component.selectResultCode(codes[0]);
    expect(component.wordingSubmitAttempt()).toBe(0);

    component.onSaveResult();

    expect(component.wordingSubmitAttempt()).toBe(1);
  });

  it('onSaveResult does nothing if there is no pending row', () => {
    const submitSpy = jest.spyOn(component.submitResults, 'emit');

    component.onSaveResult();

    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('tableRows maps wordingByCode by normalized code (uppercase) for pending and existing', () => {
    fixture.componentRef.setInput('existingResults', [
      makeExistingResult({ id: 'E1', resultCode: 'ab9' }),
    ]);
    fixture.componentRef.setInput('wordingByCode', { AB9: 'Mapped wording' });
    fixture.detectChanges();

    component.selectResultCode(codes[0]); // RC1 pending

    fixture.componentRef.setInput('wordingByCode', {
      AB9: 'Mapped wording',
      RC1: 'Pending wording',
    });
    fixture.detectChanges();

    const rows: ResultRow[] = component.tableRows();

    expect(rows[0].resultCode).toBe('RC1');
    expect(rows[0].wording).toBe('Pending wording');

    const existingRow = rows.find(
      (r): r is Extract<ResultRow, { kind: 'existing' }> =>
        r.kind === 'existing',
    );
    expect(existingRow).toBeDefined();
    expect(existingRow?.resultCode.toUpperCase()).toBe('AB9');
    expect(existingRow?.wording).toBe('Mapped wording');
  });

  it('onRemoveClicked removes pending by tempId and emits pendingChange', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    component.selectResultCode(codes[0]);

    const pendingRow = component
      .tableRows()
      .find(
        (r): r is Extract<ResultRow, { kind: 'pending' }> =>
          r.kind === 'pending',
      );
    expect(pendingRow).toBeDefined();

    component.onRemoveClicked({ kind: 'pending', tempId: pendingRow!.tempId });

    expect(component.canSubmitResults()).toBe(false);

    const lastArg = pendingEmitSpy.mock.calls.at(-1)![0];
    expect(lastArg).toEqual([] as PendingResultRow[]);
  });

  it('onRemoveClicked emits removeExisting for existing rows', () => {
    const removeSpy = jest.spyOn(component.removeExisting, 'emit');

    component.onRemoveClicked({ kind: 'existing', id: 'E123' });

    expect(removeSpy).toHaveBeenCalledWith('E123');
  });

  it('onSaveResult emits existingToUpdate when existing wording changes', () => {
    const submitSpy = jest.spyOn(component.submitResults, 'emit');

    fixture.componentRef.setInput('existingResults', [
      makeExistingResult({
        id: 'E1',
        resultCode: 'RC2',
        wording: {
          template: "Result '{{ Date }}' applied.",
          'substitution-key-constraints': [
            { key: 'Date', value: '2025-10-25', constraint: { length: 10 } },
          ],
        } as unknown as TemplateDetail,
      }),
    ]);
    fixture.detectChanges();

    component.onSaveResult();

    component.onCardWordingFieldsDTO(
      {
        id: 'E1',
        status: 'existing',
        title: 'RC2 - Second Match',
        content: [],
      },
      {
        wordingFields: [{ key: 'Date', value: '2026-03-04' }],
      },
    );

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy.mock.calls[0][0].existingToUpdate).toEqual([
      {
        resultId: 'E1',
        resultCode: 'RC2',
        wordingFields: [{ key: 'Date', value: '2026-03-04' }],
      },
    ]);
  });

  it('onSummaryActionClick blocks existing remove when wording errors exist', () => {
    const removeSpy = jest.spyOn(component.removeExisting, 'emit');
    const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');

    fixture.componentRef.setInput('existingResults', [
      makeExistingResult({
        id: 'E1',
        resultCode: 'RC2',
        wording: {
          template: "Result '{{ Date }}' applied.",
          'substitution-key-constraints': [
            { key: 'Date', value: '2025-10-25', constraint: { length: 10 } },
          ],
        } as unknown as TemplateDetail,
      }),
    ]);
    fixture.detectChanges();

    component.onSaveResult();
    component.onCardWordingFieldErrors(
      {
        id: 'E1',
        status: 'existing',
        title: 'RC2 - Second Match',
        content: [],
      },
      [{ text: 'Enter a Date in the result wording section', href: '#Date' }],
    );

    component.onSummaryActionClick({
      id: 'E1',
      status: 'existing',
      title: 'RC2 - Second Match',
      content: [],
    });

    expect(removeSpy).not.toHaveBeenCalled();
    const emitted = errorsSpy.mock.calls.at(-1)?.[0] ?? [];
    expect(
      emitted.some((e: { text: string }) =>
        e.text.includes(
          'Resolve result wording errors before removing an existing result',
        ),
      ),
    ).toBe(true);
  });

  it('onSummaryActionClick allows pending remove when wording errors exist', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    fixture.componentRef.setInput('existingResults', [
      makeExistingResult({
        id: 'E1',
        resultCode: 'RC2',
        wording: {
          template: "Result '{{ Date }}' applied.",
          'substitution-key-constraints': [
            { key: 'Date', value: '2025-10-25', constraint: { length: 10 } },
          ],
        } as unknown as TemplateDetail,
      }),
    ]);
    fixture.detectChanges();

    component.onSaveResult();
    component.onCardWordingFieldErrors(
      {
        id: 'E1',
        status: 'existing',
        title: 'RC2 - Second Match',
        content: [],
      },
      [{ text: 'Enter a Date in the result wording section', href: '#Date' }],
    );

    component.selectResultCode(codes[0]);
    const pendingCard = component
      .existingResultSummaryLists()
      .find((c) => c.status === 'pending');
    expect(pendingCard).toBeDefined();

    component.onSummaryActionClick(pendingCard!);

    expect(
      pendingEmitSpy.mock.calls.some(
        ([arg]) => Array.isArray(arg) && arg.length === 0,
      ),
    ).toBe(true);
  });

  it('clearPendingToken effect resets search when pendingVersion === appliedVersion', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    // First complete one apply cycle so pendingVersion === appliedVersion.
    component.selectResultCode(codes[0]);
    component.onSaveResult();
    expect(component.canSubmitResults()).toBe(false);

    component.resultCodeSearch = 'something';

    fixture.componentRef.setInput('clearPendingToken', 1);
    fixture.detectChanges();

    expect(component.canSubmitResults()).toBe(false);
    expect(component.resultCodeSearch).toBe('');

    expect(
      pendingEmitSpy.mock.calls.some(
        ([arg]) => Array.isArray(arg) && arg.length === 0,
      ),
    ).toBe(true);
  });

  it('clearPendingToken does nothing when pendingVersion !== appliedVersion', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    component.selectResultCode(codes[0]);
    expect(component.canSubmitResults()).toBe(true);

    component.resultCodeSearch = 'something';

    fixture.componentRef.setInput('clearPendingToken', 1);
    fixture.detectChanges();

    expect(component.canSubmitResults()).toBe(true);
    expect(component.resultCodeSearch).toBe('something');

    expect(
      pendingEmitSpy.mock.calls.some(
        ([arg]) => Array.isArray(arg) && arg.length === 0,
      ),
    ).toBe(false);
  });
});
