import { formatDate } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Observable, of } from 'rxjs';

import { PaymentReferenceEditComponent } from '@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component';
import { ConfirmationDialogComponent } from '@components/confirmation-dialog/confirmation-dialog.component';

describe('PaymentReferenceEditComponent', () => {
  let component: PaymentReferenceEditComponent;
  let fixture: ComponentFixture<PaymentReferenceEditComponent>;

  let routerNavigate: jest.Mock;
  let currentNavigation: jest.Mock;

  const routeStub: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({}),
      queryParamMap: convertToParamMap({}),
    },
  } as unknown as ActivatedRoute;

  beforeEach(async () => {
    routerNavigate = jest.fn().mockResolvedValue(true);
    currentNavigation = jest.fn().mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [PaymentReferenceEditComponent],
      providers: [
        {
          provide: Router,
          useValue: { navigate: routerNavigate, currentNavigation },
        },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();
  });

  function createComponentWithHistoryState(
    state: Record<string, unknown> | null,
  ) {
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

  it('navigates back when a direct browser visit has no history state', () => {
    createComponentWithHistoryState(null);

    expect(component.row).toBeNull();
    expect(routerNavigate).toHaveBeenCalledWith(['../'], {
      relativeTo: routeStub,
      queryParamsHandling: 'preserve',
    });
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

  it('renders status date using the dateTime pipe format', () => {
    createComponentWithHistoryState({
      row: {
        rowId: 'r1',
        paymentReference: 'REF1',
        statusDateRaw: '2026-01-01',
      },
    });

    const locale = TestBed.inject(LOCALE_ID);
    const expectedDate = formatDate('2026-01-01', 'mediumDate', locale);
    const summaryValues = fixture.nativeElement.querySelectorAll(
      '.govuk-summary-list__value',
    );

    expect(summaryValues[1]?.textContent?.trim()).toBe(expectedDate);
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

  describe.each(['create', 'update'] as const)(
    '%s ALE draft protection',
    (mode) => {
      const returnUrl =
        mode === 'create'
          ? '/applications-list/list-1/create-entry'
          : '/applications-list/list-1/update-entry/entry-1';
      const snapshotKey =
        mode === 'create' ? 'entryCreateSnapshot' : 'entryDetailSnapshot';

      beforeEach(() => {
        createComponentWithHistoryState({
          row: { rowId: 'r1', paymentReference: 'OLD' },
          [snapshotKey]: { form: { notes: 'Unsaved ALE note' } },
          aleDraftProtection: { active: true, returnUrl },
        });
      });

      it.each([false, true])(
        'honours the leave decision %s without losing the snapshot on stay',
        (leave) => {
          const dialog = (fixture.nativeElement as HTMLElement).querySelector(
            'dialog',
          )!;
          const showModal = jest.fn();
          dialog.showModal = showModal;
          dialog.close = jest.fn();
          currentNavigation.mockReturnValue({
            extractedUrl: { toString: () => '/applications' },
            extras: {},
          });
          const decision = jest.fn();
          (component.canLeave() as Observable<boolean>).subscribe(decision);
          expect(showModal).toHaveBeenCalled();
          const label = leave ? 'Leave this page' : 'Stay on this page';
          Array.from(dialog.querySelectorAll('button'))
            .find((button) => button.textContent?.trim() === label)!
            .click();
          expect(decision).toHaveBeenCalledWith(leave);
          expect(history.state[snapshotKey].form.notes).toBe(
            'Unsaved ALE note',
          );
        },
      );

      it.each(['save', 'cancel'] as const)(
        'allows %s only when returning the protected snapshot to its ALE',
        (action) => {
          if (action === 'save') {
            component.paymentReference.setValue('NEW');
          }
          component[action]();
          const state = routerNavigate.mock.calls.at(-1)![1].state;
          expect(state[snapshotKey]).toEqual({
            form: { notes: 'Unsaved ALE note' },
          });
          expect(state.aleDraftProtection).toEqual({ active: true, returnUrl });
          expect(state.aleDraftReturn).toBe(
            action === 'save' ? true : undefined,
          );
          currentNavigation.mockReturnValue({
            trigger: 'imperative',
            extractedUrl: {
              toString: () =>
                `${returnUrl}?from=applications#civil-fee-section`,
            },
            extras: { state },
          });
          expect(component.canLeave()).toBe(true);

          const dialog = fixture.debugElement.query(
            By.directive(ConfirmationDialogComponent),
          ).componentInstance as ConfirmationDialogComponent;
          jest.spyOn(dialog, 'confirm').mockReturnValue(of(false));
          currentNavigation.mockReturnValue({
            extractedUrl: { toString: () => '/applications' },
            extras: { state },
          });
          expect(component.canLeave()).not.toBe(true);
          currentNavigation.mockReturnValue({
            extractedUrl: { toString: () => returnUrl },
            extras: {},
          });
          if (action === 'save') {
            expect(component.canLeave()).not.toBe(true);
          } else {
            expect(component.canLeave()).toBe(true);
          }
        },
      );

      it.each(
        [false, true].flatMap((inherited) =>
          [false, true].flatMap((referenceChanged) =>
            [false, true].map((returning) => ({
              inherited,
              referenceChanged,
              returning,
            })),
          ),
        ),
      )(
        'handles Back/exit: inherited=$inherited, referenceChanged=$referenceChanged, returning=$returning',
        ({ inherited, referenceChanged, returning }) => {
          component.hasUnsavedEntry.set(inherited);
          component.paymentReference.setValue(
            referenceChanged ? 'OLDx' : 'OLD',
          );
          fixture.detectChanges();
          const dialog = fixture.debugElement.query(
            By.directive(ConfirmationDialogComponent),
          ).componentInstance as ConfirmationDialogComponent;
          const confirm = jest
            .spyOn(dialog, 'confirm')
            .mockReturnValue(of(false));
          const navigation = {
            trigger: 'popstate',
            extractedUrl: {
              toString: () => (returning ? returnUrl : '/applications'),
            },
            extras: {} as { state?: Record<string, unknown> },
          };
          currentNavigation.mockReturnValue(navigation);
          // Browser Back has already replaced history.state with the destination's state.
          history.replaceState({ navigationId: 1 }, '');
          const warn = referenceChanged || (inherited && !returning);
          const result = component.canLeave();
          if (warn) {
            const decision = jest.fn();
            (result as Observable<boolean>).subscribe(decision);
            expect(decision).toHaveBeenCalledWith(false);
            expect(confirm).toHaveBeenCalledTimes(1);
            expect(navigation.extras.state).toBeUndefined();
            confirm.mockReturnValue(of(true));
            (component.canLeave() as Observable<boolean>).subscribe();
          } else {
            expect(result).toBe(true);
            expect(confirm).not.toHaveBeenCalled();
          }
          if (returning) {
            expect(navigation.extras.state?.[snapshotKey]).toEqual({
              form: { notes: 'Unsaved ALE note' },
            });
            expect(
              navigation.extras.state?.['paymentRefReturn'],
            ).toBeUndefined();
          } else {
            expect(navigation.extras.state).toBeUndefined();
          }
        },
      );

      it('warns for reference-only edits, stops after reverting, and preserves dirty validation semantics', () => {
        component.hasUnsavedEntry.set(false);
        const unload = (): boolean =>
          window.dispatchEvent(new Event('beforeunload', { cancelable: true }));
        fixture.detectChanges();
        expect(unload()).toBe(true);
        component.paymentReference.setValue('OLDx');
        component.paymentReference.markAsDirty();
        fixture.detectChanges();
        expect(component.hasUnsavedReference()).toBe(true);
        expect(unload()).toBe(false);
        component.paymentReference.setValue('OLD');
        fixture.detectChanges();
        expect(component.paymentReference.dirty).toBe(true);
        expect(component.hasUnsavedReference()).toBe(false);
        expect(component.canLeave()).toBe(true);
        expect(unload()).toBe(true);
      });

      it('warns when Cancel discards a changed reference and preserves the ALE snapshot on confirmation', () => {
        component.paymentReference.setValue('NEW');
        component.cancel();
        const navigation = {
          trigger: 'imperative',
          extractedUrl: { toString: () => returnUrl },
          extras: { state: routerNavigate.mock.calls.at(-1)![1].state },
        };
        currentNavigation.mockReturnValue(navigation);
        const dialog = fixture.debugElement.query(
          By.directive(ConfirmationDialogComponent),
        ).componentInstance as ConfirmationDialogComponent;
        jest.spyOn(dialog, 'confirm').mockReturnValue(of(true));
        const decision = jest.fn();
        (component.canLeave() as Observable<boolean>).subscribe(decision);
        expect(decision).toHaveBeenCalledWith(true);
        expect(navigation.extras.state[snapshotKey]).toEqual({
          form: { notes: 'Unsaved ALE note' },
        });
        expect(navigation.extras.state.paymentRefReturn).toBeUndefined();
      });

      it('warns on reload and removes the listener when destroyed', () => {
        const unload = (): boolean =>
          window.dispatchEvent(new Event('beforeunload', { cancelable: true }));
        expect(unload()).toBe(false);
        fixture.destroy();
        expect(unload()).toBe(true);
      });
    },
  );

  it('does not warn for an unchanged entry or the bulk-update flow', () => {
    createComponentWithHistoryState({
      row: { rowId: 'r1', paymentReference: 'OLD' },
    });
    expect(component.canLeave()).toBe(true);
    expect(
      window.dispatchEvent(new Event('beforeunload', { cancelable: true })),
    ).toBe(true);
    component.cancel();
    expect(
      routerNavigate.mock.calls.at(-1)![1].state.aleDraftReturn,
    ).toBeUndefined();
  });
});
