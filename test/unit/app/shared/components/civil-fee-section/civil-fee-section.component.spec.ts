import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import {
  CivilFeeForm,
  CivilFeeSectionComponent,
} from '@components/civil-fee-section/civil-fee-section.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { TableColumn } from '@components/selectable-sortable-table/selectable-sortable-table.component';
import { FeeStatus } from '@openapi';

jest.mock('@util/civil-fee-utils', () => ({
  buildCivilFeeHeading: jest.fn(() => 'MOCK_HEADING'),
  feeStatusRowId: jest.fn(
    (fs: FeeStatus) => `row-${fs.paymentStatus}-${fs.statusDate}`,
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

  beforeEach(async () => {
    routerNavigate = jest.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [CivilFeeSectionComponent],
      providers: [
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
        rowId: 'row-paid-2025-10-25',
        paymentReference: 'REF1',
        paymentStatus: 'paid',
        statusDateRaw: '2025-10-25',
      },
      {
        rowId: 'row-exempt-2025-01-02',
        paymentReference: '',
        paymentStatus: 'exempt',
        statusDateRaw: '2025-01-02',
      },
    ]);
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

  it('onChangePaymentReference does nothing when paymentReference is empty', () => {
    component.onChangePaymentReference({
      rowId: 'row-1',
      paymentReference: '',
    });

    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('showErrors returns true when parentSubmitted is true', () => {
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
    fixture.componentRef.setInput('parentSubmitted', true);
    fixture.detectChanges();

    const f = component.feeForm().controls;

    expect(f.feeStatuses.errors).toEqual(
      expect.objectContaining({ feeRequired: true }),
    );

    f.feeStatus.setValue('');
    f.feeStatusDate.setValue('');
    f.feeStatus.updateValueAndValidity({ emitEvent: false });
    f.feeStatusDate.updateValueAndValidity({ emitEvent: false });

    expect(f.feeStatus.errors).toEqual(
      expect.objectContaining({ required: true }),
    );
    expect(f.feeStatusDate.errors).toEqual(
      expect.objectContaining({ required: true }),
    );
  });

  it('on parent submit: when a fee row exists, feeStatus/feeStatusDate remain required', () => {
    fixture.componentRef.setInput('feeRequired', true);
    fixture.componentRef.setInput('parentSubmitted', true);
    fixture.detectChanges();

    const f = component.feeForm().controls;

    f.feeStatuses.setValue([
      {
        id: 'ROW-1',
        paymentStatus: 'Paid',
        statusDate: '01/01/2026',
      } as unknown as FeeStatus,
    ]);
    fixture.detectChanges();

    // If the user tries to add another row, they still must supply these
    f.feeStatus.setValue('');
    f.feeStatusDate.setValue('');
    f.feeStatus.updateValueAndValidity({ emitEvent: false });
    f.feeStatusDate.updateValueAndValidity({ emitEvent: false });

    expect(f.feeStatus.errors?.['required']).toBe(true);
    expect(f.feeStatusDate.errors?.['required']).toBe(true);
  });

  it('on parent submit: emits civilFeeErrors for missing fee status and status date when fee is required and no rows exist', () => {
    const emitSpy = jest.spyOn(component.civilFeeErrors, 'emit');

    fixture.componentRef.setInput('feeRequired', true);
    fixture.componentRef.setInput('parentSubmitted', true);
    fixture.detectChanges();

    const lastCall = emitSpy.mock.calls.at(-1) as
      | [ErrorItem[]]
      | undefined;

    const emitted = lastCall?.[0] ?? [];

    expect(emitted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'feeStatus',
          text: 'Select a fee status',
        }),
        expect.objectContaining({
          id: 'feeStatusDate',
          text: 'Enter a status date',
        }),
      ]),
    );
  });
});
