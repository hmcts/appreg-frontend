import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import {
  CivilFeeForm,
  CivilFeeSectionComponent,
} from '@components/civil-fee-section/civil-fee-section.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { TableColumn } from '@components/sortable-table/sortable-table.component';
import { FeeStatus } from '@openapi';

jest.mock('@util/civil-fee-utils', () => ({
  buildCivilFeeHeading: jest.fn(() => 'MOCK_HEADING'),
  feeStatusRowId: jest.fn(
    (fs: FeeStatus, index?: number) =>
      `row-${fs.paymentStatus}-${fs.statusDate}-${index ?? 'none'}`,
  ),
}));

function makeFeeForm(): CivilFeeForm {
  return new FormGroup({
    hasOffsiteFee: new FormControl<boolean | null>(null),
    feeStatus: new FormControl<string | null>(null),
    feeStatusDate: new FormControl<string | null>(null),
    paymentRef: new FormControl<string | null>(null),
    feeStatuses: new FormControl<FeeStatus[] | null>(null),
  }) as unknown as CivilFeeForm;
}

describe('CivilFeeSectionComponent', () => {
  let component: CivilFeeSectionComponent;
  let fixture: ComponentFixture<CivilFeeSectionComponent>;

  let routerNavigate: jest.Mock;

  const routeStub: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'EN-1' }),
      queryParamMap: convertToParamMap({}),
    },
  } as unknown as ActivatedRoute;

  const columns: TableColumn[] = [
    { header: 'Status', field: 'paymentStatus', sortable: true },
  ];

  const feeStatusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'exempt', label: 'Exempt' },
  ];

  const attachValidatorsForSubmitAttempt = (): void => {
    (
      component as unknown as {
        attachValidatorsForSubmitAttempt: () => void;
      }
    ).attachValidatorsForSubmitAttempt();
  };

  beforeEach(async () => {
    routerNavigate = jest.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [CivilFeeSectionComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'en-GB' },
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CivilFeeSectionComponent);
    component = fixture.componentInstance;

    // REQUIRED INPUTS: must be set before first detectChanges()
    fixture.componentRef.setInput('feeForm', makeFeeForm());
    fixture.componentRef.setInput('civilFeeColumns', columns);
    fixture.componentRef.setInput('feeStatusOptions', feeStatusOptions);
    fixture.componentRef.setInput('feeMeta', null);
    fixture.componentRef.setInput('feeRequired', true);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.entryId).toBe('EN-1');
  });

  it('feeStatusOptionsWithPlaceholder is disabled when fee is required', () => {
    fixture.componentRef.setInput('feeRequired', true);
    fixture.detectChanges();

    const opts = component.feeStatusOptionsWithPlaceholder();

    expect(opts[0]).toEqual({
      value: '',
      label: 'Select fee status',
      disabled: true,
    });
    expect(opts.slice(1)).toEqual(feeStatusOptions);
  });

  it('feeStatusOptionsWithPlaceholder is NOT disabled when fee is required', () => {
    fixture.componentRef.setInput('feeRequired', false);
    fixture.detectChanges();

    const opts = component.feeStatusOptionsWithPlaceholder();

    expect(opts[0]).toEqual({
      value: '',
      label: 'Select fee status',
      disabled: false,
    });
    expect(opts.slice(1)).toEqual(feeStatusOptions);
  });

  it('offSiteFee reflects hasOffsiteFee control', () => {
    const f = component.feeForm();
    f.controls.hasOffsiteFee.setValue(true);

    expect(component.offSiteFee()).toBe(true);

    f.controls.hasOffsiteFee.setValue(false);
    expect(component.offSiteFee()).toBe(false);

    f.controls.hasOffsiteFee.setValue(null);
    expect(component.offSiteFee()).toBe(false);
  });

  it('onOffsiteFeeChange emits the inverse of current hasOffsiteFee', () => {
    const spy = jest.fn();
    component.offsiteFeeChanged.subscribe(spy);

    const f = component.feeForm();

    f.controls.hasOffsiteFee.setValue(true);
    component.onOffsiteFeeChange();
    expect(spy).toHaveBeenCalledWith(false);

    f.controls.hasOffsiteFee.setValue(false);
    component.onOffsiteFeeChange();
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('onAddFeeDetailsClick lazily attaches validators and emits civilFeeErrors when invalid', () => {
    const errorsSpy = jest.fn();
    const addSpy = jest.fn();

    component.civilFeeErrors.subscribe(errorsSpy);
    component.addFeeDetails.subscribe(addSpy);

    // leave required fields empty -> invalid
    component.onAddFeeDetailsClick();

    // should NOT emit addFeeDetails
    expect(addSpy).not.toHaveBeenCalled();

    // should emit error items
    expect(errorsSpy).toHaveBeenCalled();
    const [errors] = errorsSpy.mock.calls[0] as [ErrorItem[]];

    // At minimum should include required field errors
    expect(errors.some((e) => e.id === 'feeStatus')).toBe(true);
    expect(errors.some((e) => e.id === 'feeStatusDate')).toBe(true);

    // validators should now be present on controls
    const f = component.feeForm().controls;
    expect(f.feeStatus.hasError('required')).toBe(true);
    expect(f.feeStatusDate.hasError('required')).toBe(true);

    // submitted signal set
    expect(component.submitted()).toBe(true);
  });

  it('onAddFeeDetailsClick emits AddFeeDetailsPayload when valid (trims + null paymentReference)', () => {
    const errorsSpy = jest.fn();
    const addSpy = jest.fn();

    component.civilFeeErrors.subscribe(errorsSpy);
    component.addFeeDetails.subscribe(addSpy);

    const f = component.feeForm().controls;

    f.feeStatus.setValue('  paid  ');
    f.feeStatusDate.setValue('  2025-11-01  ');
    f.paymentRef.setValue('   '); // should become null after trim

    component.onAddFeeDetailsClick();

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledWith({
      feeStatus: 'paid',
      statusDate: '2025-11-01',
      paymentReference: null,
    });

    // still emits errors array, but should be empty in valid state
    expect(errorsSpy).toHaveBeenCalled();
    const [errors] = errorsSpy.mock.calls[errorsSpy.mock.calls.length - 1];
    expect(errors).toEqual([]);
  });

  it('onAddFeeDetailsClick blocks when paymentRef exceeds maxLength(15)', () => {
    const addSpy = jest.fn();
    component.addFeeDetails.subscribe(addSpy);

    const f = component.feeForm().controls;

    f.feeStatus.setValue('paid');
    f.feeStatusDate.setValue('2025-11-01');
    f.paymentRef.setValue('1234567890123456'); // 16 chars

    component.onAddFeeDetailsClick();

    expect(addSpy).not.toHaveBeenCalled();
    expect(f.paymentRef.hasError('maxlength')).toBe(true);
  });

  it('when fee is not required, keeps inputs visible but disabled and disables add button', () => {
    fixture.componentRef.setInput('feeRequired', false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('#offSiteFee')).toBeNull();
    expect(host.querySelector('app-select-input')).not.toBeNull();
    expect(host.querySelector('app-date-input')).not.toBeNull();
    expect(host.querySelector('app-text-input')).not.toBeNull();
    expect(
      component.feeForm().controls.feeStatus.disabled &&
        component.feeForm().controls.feeStatusDate.disabled &&
        component.feeForm().controls.paymentRef.disabled,
    ).toBe(true);
    expect(
      (host.querySelector('button.govuk-button') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('when fee is not required, parent submit does not apply civil fee validators', () => {
    fixture.componentRef.setInput('feeRequired', false);
    fixture.detectChanges();

    const f = component.feeForm().controls;
    const emitSpy = jest.spyOn(component.civilFeeErrors, 'emit');

    attachValidatorsForSubmitAttempt();

    f.feeStatus.setValue('');
    f.feeStatusDate.setValue('');
    f.paymentRef.setValue('12345678901234567890');
    f.feeStatuses.setValue([]);
    f.feeStatus.updateValueAndValidity({ emitEvent: false });
    f.feeStatusDate.updateValueAndValidity({ emitEvent: false });
    f.paymentRef.updateValueAndValidity({ emitEvent: false });
    f.feeStatuses.updateValueAndValidity({ emitEvent: false });

    expect(f.feeStatus.errors).toBeNull();
    expect(f.feeStatusDate.errors).toBeNull();
    expect(f.paymentRef.errors).toBeNull();
    expect(f.feeStatuses.errors).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith([]);
  });

  it('isControlInvalid returns true only when invalid and touched/dirty', () => {
    const f = component.feeForm().controls;

    // Attach validators by "submit" (lazy attach)
    component.onAddFeeDetailsClick();

    // invalid + touched => true
    expect(component.isControlInvalid('feeStatus')).toBe(true);

    // make valid => false
    f.feeStatus.setValue('paid');
    f.feeStatus.updateValueAndValidity({ emitEvent: false });
    expect(component.isControlInvalid('feeStatus')).toBe(false);
  });

  it('feeHeadingText uses util (mocked) and returns heading string', () => {
    // We mocked buildCivilFeeHeading -> "MOCK_HEADING"
    expect(component.feeHeadingText()).toBe('MOCK_HEADING');
  });

  it('feeStatusRows maps FeeStatus array into RowLike rows (date formatted in template using DateTimePipe)', () => {
    const f = component.feeForm().controls;

    f.feeStatuses.setValue([
      {
        paymentStatus: 'paid',
        statusDate: '2025-10-25',
        paymentReference: 'REF1',
      } as unknown as FeeStatus,
      {
        paymentStatus: 'exempt',
        statusDate: '2025-01-02',
        paymentReference: null,
      } as unknown as FeeStatus,
    ]);

    const rows = component.feeStatusRows();

    expect(rows).toEqual([
      {
        rowId: 'row-paid-2025-10-25-0',
        paymentReference: 'REF1',
        paymentStatus: 'paid',
        statusDateRaw: '2025-10-25',
        isLast: false,
      },
      {
        rowId: 'row-exempt-2025-01-02-1',
        paymentReference: '',
        paymentStatus: 'exempt',
        statusDateRaw: '2025-01-02',
        isLast: true,
      },
    ]);
  });

  it('renders the Change link only for the last non-DUE fee row', () => {
    fixture.componentRef.setInput('civilFeeColumns', [
      { header: 'Status', field: 'paymentStatus', sortable: true },
    ]);

    component.feeForm().controls.feeStatuses.setValue([
      {
        paymentStatus: 'paid',
        statusDate: '2025-01-09',
        paymentReference: 'REF1',
      } as unknown as FeeStatus,
      {
        paymentStatus: 'exempt',
        statusDate: '2025-01-10',
        paymentReference: 'REF2',
      } as unknown as FeeStatus,
    ]);

    fixture.detectChanges();

    const changeLinks = Array.from(
      fixture.nativeElement.querySelectorAll('a.govuk-link'),
    );

    expect(changeLinks).toHaveLength(1);
    expect(changeLinks[0].textContent).toContain('Change');
    expect(changeLinks[0].textContent).toContain('payment reference REF2');
    expect(fixture.nativeElement.textContent).not.toContain(
      'payment reference REF1',
    );
  });

  it('does not include the Action column when fee is not required', () => {
    fixture.componentRef.setInput('feeRequired', false);
    fixture.detectChanges();

    expect(component.civilFeeColumnsWithChangeLink()).toEqual(columns);
  });

  it('renders formatted fee status date in the table instead of raw ISO text', () => {
    fixture.componentRef.setInput('civilFeeColumns', [
      { header: 'Status date', field: 'statusDateRaw', sortable: true },
    ]);

    component.feeForm().controls.feeStatuses.setValue([
      {
        paymentStatus: 'paid',
        statusDate: '2025-01-09',
        paymentReference: 'REF1',
      } as unknown as FeeStatus,
    ]);

    fixture.detectChanges();

    const firstDateCell = fixture.nativeElement.querySelector(
      'tbody tr th.govuk-table__header',
    ) as HTMLElement | null;

    expect(firstDateCell?.textContent?.trim()).toBe('9 Jan 2025');
    expect(firstDateCell?.textContent).not.toContain('2025-01-09');
  });

  it('onChangePaymentReference navigates when paymentReference exists', () => {
    component.onChangePaymentReference({
      rowId: 'row-1',
      paymentReference: 'REF1',
      paymentStatus: 'paid',
      statusDate: '25/10/2025',
      statusDateRaw: '2025-10-25',
    });

    expect(routerNavigate).toHaveBeenCalledTimes(1);
    const [commands, extras] = routerNavigate.mock.calls[0];

    expect(commands).toEqual(['change-payment-reference']);
    expect(extras).toEqual(
      expect.objectContaining({
        relativeTo: component.route,
        queryParamsHandling: 'preserve',
        state: expect.objectContaining({
          row: expect.objectContaining({ paymentReference: 'REF1' }),
        }),
      }),
    );
  });

  it('onChangePaymentReference does something to allow payment reference to be changed', () => {
    component.onChangePaymentReference({
      rowId: 'row-1',
      paymentReference: '',
    });

    expect(routerNavigate).toHaveBeenCalled();
  });

  it('onChangePaymentReference does nothing if status === DUE', () => {
    component.onChangePaymentReference({
      rowId: 'row-1',
      paymentStatus: 'DUE',
      paymentReference: '',
    });

    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('showErrors returns true when parentSubmitted is true and feeRequired is true', () => {
    fixture.componentRef.setInput('feeRequired', true);
    fixture.componentRef.setInput('parentSubmitted', true);
    fixture.detectChanges();

    expect(component.showErrors()).toBe(true);
  });

  it('showErrors returns true when submitted is true (add fee click)', () => {
    fixture.componentRef.setInput('feeRequired', true);
    fixture.detectChanges();

    component.onAddFeeDetailsClick();

    expect(component.showErrors()).toBe(true);
  });

  it('on parent submit: when fee is required and no rows exist, attaches feeStatuses validator and required validators for feeStatus/feeStatusDate', () => {
    fixture.componentRef.setInput('feeRequired', true);
    fixture.detectChanges();

    attachValidatorsForSubmitAttempt();

    const f = component.feeForm().controls;

    expect(f.feeStatuses.hasError('feeRequired')).toBe(true);

    f.feeStatus.setValue('');
    f.feeStatusDate.setValue('');

    expect(f.feeStatus.hasError('required')).toBe(true);
    expect(f.feeStatusDate.hasError('required')).toBe(true);
  });

  it('on parent submit: when a fee row exists, feeStatus/feeStatusDate remain required', () => {
    const f = component.feeForm().controls;

    f.feeStatuses.setValue([
      {
        id: 'ROW-1',
        paymentStatus: 'Paid',
        statusDate: '01/01/2026',
      } as unknown as FeeStatus,
    ]);

    fixture.componentRef.setInput('feeRequired', true);
    fixture.detectChanges();

    attachValidatorsForSubmitAttempt();

    f.feeStatus.setValue('');
    f.feeStatusDate.setValue('');

    expect(f.feeStatuses.hasError('feeRequired')).toBe(false);
    expect(f.feeStatus.hasError('required')).toBe(false);
    expect(f.feeStatusDate.hasError('required')).toBe(false);
  });

  it('on parent submit: emits civilFeeErrors for missing fee status and status date when fee is required and no rows exist', () => {
    const emitSpy = jest.spyOn(component.civilFeeErrors, 'emit');

    fixture.componentRef.setInput('feeRequired', true);
    fixture.componentRef.setInput('parentSubmitted', true);
    fixture.detectChanges();

    const lastCall = emitSpy.mock.calls.at(-1) as [ErrorItem[]] | undefined;

    const emitted = lastCall?.[0] ?? [];

    expect(emitted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'feeStatus',
          text: 'Select a fee status',
        }),
        expect.objectContaining({
          id: 'feeStatusDate',
          text: 'Enter a valid status date',
        }),
      ]),
    );
  });

  it('validateForSubmit returns current civil fee errors', () => {
    fixture.componentRef.setInput('feeRequired', true);
    fixture.detectChanges();

    const errors = component.validateForSubmit();

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'feeStatus',
          text: 'Select a fee status',
        }),
        expect.objectContaining({
          id: 'feeStatusDate',
          text: 'Enter a valid status date',
        }),
      ]),
    );
  });

  it("onAddFeeDetailsClick blocks when feeStatus is 'DUE' and paymentRef is provided", () => {
    const errorsSpy = jest.fn();
    const addSpy = jest.fn();

    component.civilFeeErrors.subscribe(errorsSpy);
    component.addFeeDetails.subscribe(addSpy);

    const f = component.feeForm().controls;

    f.feeStatus.setValue('DUE');
    f.feeStatusDate.setValue('2025-11-01');
    f.paymentRef.setValue('REF-123');

    component.onAddFeeDetailsClick();

    expect(addSpy).not.toHaveBeenCalled();
    expect(f.paymentRef.hasError('invalidStatus')).toBe(true);

    expect(errorsSpy).toHaveBeenCalled();
    const [errors] = errorsSpy.mock.calls[0] as [ErrorItem[]];
    expect(errors.some((e) => e.id === 'paymentRef')).toBe(true);
  });

  it('does not render separate offsite fee reference text beneath the heading', () => {
    component.feeForm().controls.hasOffsiteFee.setValue(true);
    fixture.componentRef.setInput('feeMeta', {
      feeReference: 'CO7.2',
      feeDescription: 'Main fee description',
      feeAmount: { value: 2500, currency: 'GBP' },
      offsiteFeeReference: 'CO1.1',
      offsiteFeeDescription: 'Offsite fee description',
      offsiteFeeAmount: { value: 3000, currency: 'GBP' },
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const bodyText = host.textContent ?? '';

    expect(bodyText).not.toContain('Off site fee reference: CO1.1');
  });

  it('does not render separate offsite fee reference text when offsite fee is not selected', () => {
    fixture.componentRef.setInput('feeMeta', {
      feeReference: 'CO7.2',
      feeDescription: 'Main fee description',
      feeAmount: { value: 2500, currency: 'GBP' },
      offsiteFeeReference: 'CO1.1',
      offsiteFeeDescription: 'Offsite fee description',
      offsiteFeeAmount: { value: 3000, currency: 'GBP' },
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const bodyText = host.textContent ?? '';

    expect(bodyText).not.toContain('Off site fee reference: CO1.1');
  });
});
