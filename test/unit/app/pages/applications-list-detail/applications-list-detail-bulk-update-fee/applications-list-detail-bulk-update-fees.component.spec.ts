import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { ApplicationsListDetailBulkUpdateFeesComponent } from '@components/applications-list-detail/applications-list-detail-bulk-update-fees/applications-list-detail-bulk-update-fees.component';
import { PaymentStatus } from '@openapi';

describe('ApplicationsListDetailBulkUpdateFeesComponent', () => {
  const routerNavigate = jest.fn().mockResolvedValue(true);

  const buildActivatedRoute = (id: string | null = 'list-123') =>
    ({
      snapshot: {
        paramMap: {
          get: jest.fn((key: string) => (key === 'id' ? id : null)),
        },
      },
    }) as unknown as ActivatedRoute;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApplicationsListDetailBulkUpdateFeesComponent],
      providers: [
        { provide: ActivatedRoute, useValue: buildActivatedRoute() },
        { provide: Router, useValue: { navigate: routerNavigate } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  afterEach(() => {
    routerNavigate.mockClear();
    history.replaceState({}, '');
  });

  it('adds fee details into the civil fee form', () => {
    history.replaceState(
      {
        entriesToUpdateFee: [
          {
            id: 'entry-1',
            applicant: 'Applicant',
            respondent: 'Respondent',
            title: 'Title',
          },
        ],
      },
      '',
    );

    const fixture = TestBed.createComponent(
      ApplicationsListDetailBulkUpdateFeesComponent,
    );
    const component = fixture.componentInstance;

    component.ngOnInit();
    component.onAddFeeDetails({
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-06-03',
      paymentReference: 'ABC123',
    });

    expect(component.civilFeeForm.controls.feeStatuses.value).toEqual([
      {
        paymentStatus: 'PAID',
        statusDate: '2026-06-03',
        paymentReference: 'ABC123',
      },
    ]);
  });

  it('updates the offsite fee control when the checkbox changes', () => {
    history.replaceState(
      {
        entriesToUpdateFee: [
          {
            id: 'entry-1',
            applicant: 'Applicant',
            respondent: 'Respondent',
            title: 'Title',
          },
        ],
      },
      '',
    );

    const fixture = TestBed.createComponent(
      ApplicationsListDetailBulkUpdateFeesComponent,
    );
    const component = fixture.componentInstance;

    component.ngOnInit();
    component.onOffsiteFeeChanged(true);

    expect(component.civilFeeForm.controls.hasOffsiteFee.value).toBe(true);
    expect(component.civilFeeForm.controls.hasOffsiteFee.dirty).toBe(true);
  });

  it('restores payment reference edits from navigation state', () => {
    history.replaceState(
      {
        entriesToUpdateFee: [
          {
            id: 'entry-1',
            applicant: 'Applicant',
            respondent: 'Respondent',
            title: 'Title',
          },
        ],
        bulkUpdateFeeSnapshot: {
          listId: 'list-123',
          selectedEntries: [
            {
              id: 'entry-1',
              applicant: 'Applicant',
              respondent: 'Respondent',
              title: 'Title',
            },
          ],
          feeForm: {
            feeStatuses: [
              {
                paymentStatus: 'PAID',
                statusDate: '2026-01-01',
                paymentReference: 'OLD-REF',
              },
            ],
          },
          submitted: true,
          feeErrors: [],
        },
        paymentRefReturn: {
          updatedRowId: 'PAID|2026-01-01|0',
          newPaymentReference: 'NEW-REF',
        },
      },
      '',
    );

    const fixture = TestBed.createComponent(
      ApplicationsListDetailBulkUpdateFeesComponent,
    );
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect(component.civilFeeForm.controls.feeStatuses.value).toEqual([
      {
        paymentStatus: 'PAID',
        statusDate: '2026-01-01',
        paymentReference: 'NEW-REF',
      },
    ]);
    expect(component.vm().submitted).toBe(true);
  });

  it('navigates away when no selected entries are provided', () => {
    history.replaceState({}, '');

    const fixture = TestBed.createComponent(
      ApplicationsListDetailBulkUpdateFeesComponent,
    );
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect(routerNavigate).toHaveBeenCalledWith(['../'], {
      relativeTo: expect.any(Object),
    });

    fixture.destroy();
  });
});
