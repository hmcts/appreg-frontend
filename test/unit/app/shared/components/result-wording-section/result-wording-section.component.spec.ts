import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicantContext } from '@components/applications-list/util/routing-state-util';

import { ResultWordingSectionComponent } from '@components/result-wording-section/result-wording-section.component';
import { ResultCodeGetSummaryDto, ResultGetDto } from '@openapi';
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

    expect(component.canApply).toBe(true);
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

    expect(component.canApply).toBe(false);
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

    expect(component.canApply).toBe(false);
    expect(component.resultCodeSearch).toBe(''); // clears search on duplicate
    expect(pendingEmitSpy).not.toHaveBeenCalled();
  });

  it('onSaveResult emits applyPending for the first pending row', () => {
    const applySpy = jest.spyOn(component.applyPending, 'emit');

    component.selectResultCode(codes[0]);
    component.onSaveResult();

    expect(applySpy).toHaveBeenCalledTimes(1);
    const row = applySpy.mock.calls[0][0];
    expect(row.kind).toBe('pending');
    expect(row.resultCode).toBe('RC1');
  });

  it('onSaveResult does nothing if there is no pending row', () => {
    const applySpy = jest.spyOn(component.applyPending, 'emit');

    component.onSaveResult();

    expect(applySpy).not.toHaveBeenCalled();
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

    const rows: ResultRow[] = component.tableRows;

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

    const pendingRow = component.tableRows.find(
      (r): r is Extract<ResultRow, { kind: 'pending' }> => r.kind === 'pending',
    );
    expect(pendingRow).toBeDefined();

    component.onRemoveClicked({ kind: 'pending', tempId: pendingRow!.tempId });

    expect(component.canApply).toBe(false);

    const lastArg = pendingEmitSpy.mock.calls.at(-1)![0];
    expect(lastArg).toEqual([] as PendingResultRow[]);
  });

  it('onRemoveClicked emits removeExisting for existing rows', () => {
    const removeSpy = jest.spyOn(component.removeExisting, 'emit');

    component.onRemoveClicked({ kind: 'existing', id: 'E123' });

    expect(removeSpy).toHaveBeenCalledWith('E123');
  });

  it('clearPendingToken effect clears pending, emits pendingChange, and resets search', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    component.selectResultCode(codes[0]);
    expect(component.canApply).toBe(true);

    component.resultCodeSearch = 'something';

    fixture.componentRef.setInput('clearPendingToken', 1);
    fixture.detectChanges();

    expect(component.canApply).toBe(false);
    expect(component.resultCodeSearch).toBe('');

    expect(
      pendingEmitSpy.mock.calls.some(
        ([arg]) => Array.isArray(arg) && arg.length === 0,
      ),
    ).toBe(true);
  });

  it('clearPendingToken does nothing when token is 0', () => {
    const pendingEmitSpy = jest.spyOn(component.pendingChange, 'emit');

    component.selectResultCode(codes[0]);
    expect(component.canApply).toBe(true);

    component.resultCodeSearch = 'something';

    fixture.componentRef.setInput('clearPendingToken', 0);
    fixture.detectChanges();

    expect(component.canApply).toBe(true);
    expect(component.resultCodeSearch).toBe('something');

    expect(
      pendingEmitSpy.mock.calls.some(
        ([arg]) => Array.isArray(arg) && arg.length === 0,
      ),
    ).toBe(false);
  });
});
