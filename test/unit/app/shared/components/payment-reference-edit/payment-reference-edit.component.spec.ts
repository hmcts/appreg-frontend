import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { PaymentReferenceEditComponent } from '@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component';

describe('PaymentReferenceEditComponent', () => {
  let component: PaymentReferenceEditComponent;
  let fixture: ComponentFixture<PaymentReferenceEditComponent>;

  let routerNavigate: jest.Mock;

  const routeStub: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({}),
      queryParamMap: convertToParamMap({}),
    },
  } as unknown as ActivatedRoute;

  beforeEach(async () => {
    routerNavigate = jest.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [PaymentReferenceEditComponent],
      providers: [
        { provide: Router, useValue: { navigate: routerNavigate } },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();
  });

  function createComponentWithHistoryState(state: Record<string, unknown>) {
    // Ensure ngOnInit reads the state we want
    history.replaceState(state, '');

    fixture = TestBed.createComponent(PaymentReferenceEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  }

  it('should create', () => {
    createComponentWithHistoryState({
      row: { rowId: 'r1', paymentReference: 'REF1' },
    });
    expect(component).toBeTruthy();
  });

  it('ngOnInit navigates back when history.state.row is missing/invalid', () => {
    createComponentWithHistoryState({}); // no row

    expect(routerNavigate).toHaveBeenCalledTimes(1);
    expect(routerNavigate).toHaveBeenCalledWith(['../'], {
      relativeTo: component['route'],
      queryParamsHandling: 'preserve',
    });

    expect(component.row).toBeNull();
  });

  it('ngOnInit sets row and initialises paymentReference from row.paymentReference', () => {
    createComponentWithHistoryState({
      row: { rowId: 'r1', paymentReference: 'ABC123' },
    });

    expect(component.row).toEqual(expect.objectContaining({ rowId: 'r1' }));
    expect(component.paymentReference.value).toBe('ABC123');
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('ngOnInit uses empty string when row.paymentReference is not a string', () => {
    createComponentWithHistoryState({
      row: { rowId: 'r1', paymentReference: 12345 },
    });

    expect(component.paymentReference.value).toBe('');
  });

  it('If payment reference is empty, allow save', () => {
    createComponentWithHistoryState({
      row: { rowId: 'r1', paymentReference: '' },
    });

    expect(component.isPaymentReferenceInvalid()).toBe(false);

    component.save(); // sets submitted=true and touches control

    expect(component.isPaymentReferenceInvalid()).toBe(false);
  });

  it('getPaymentReferenceError returns maxlength message when > 15 chars', () => {
    createComponentWithHistoryState({
      row: { rowId: 'r1', paymentReference: '' },
    });

    component.paymentReference.setValue('1234567890123456'); // 16 chars
    component.paymentReference.markAsTouched();
    component.paymentReference.updateValueAndValidity({ emitEvent: false });

    expect(component.isPaymentReferenceInvalid()).toBe(true);
    expect(component.getPaymentReferenceError()).toBe(
      'Payment reference must be less than or equal to 15 characters',
    );
  });

  it('save does not navigate when control invalid', () => {
    createComponentWithHistoryState({
      row: {
        rowId: 'r1',
        paymentReference:
          'jkfdlafjdksal;fjdskal;fjdskalfdsafdsafjdiosafjdsafjdsaifjdsiafsafdsafdsa',
      },
    });

    component.paymentReference.setValue(
      'jkfdlafjdksal;fjdskal;fjdskalfdsafdsafjdiosafjdsafjdsaifjdsiafsafdsafdsa',
    ); // past 15 char limit
    component.save();

    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('save does not navigate when rowId is missing', () => {
    createComponentWithHistoryState({
      row: { paymentReference: 'REF1' }, // no rowId
    });

    component.save();

    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('save navigates back with paymentRefReturn state when valid', () => {
    createComponentWithHistoryState({
      row: { rowId: 'row-123', paymentReference: 'REF1' },
    });

    component.paymentReference.setValue('NEWREF');
    component.save();

    expect(routerNavigate).toHaveBeenCalledTimes(1);
    expect(routerNavigate).toHaveBeenCalledWith(['../'], {
      relativeTo: component['route'],
      queryParamsHandling: 'preserve',
      state: {
        paymentRefReturn: {
          updatedRowId: 'row-123',
          newPaymentReference: 'NEWREF',
        },
      },
    });
  });

  it('cancel navigates back and sets focusId state', () => {
    createComponentWithHistoryState({
      row: { rowId: 'row-123', paymentReference: 'REF1' },
    });

    component.cancel();

    expect(routerNavigate).toHaveBeenCalledTimes(1);
    expect(routerNavigate).toHaveBeenCalledWith(['../'], {
      relativeTo: component['route'],
      queryParamsHandling: 'preserve',
      state: { focusId: 'civil-fee-section' },
    });
  });
});
