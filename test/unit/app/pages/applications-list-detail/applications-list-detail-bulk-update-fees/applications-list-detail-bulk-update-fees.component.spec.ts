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

  it('restores snapshot state including fee metadata and validation errors', () => {
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
          listId: 'list-456',
          selectedEntries: [
            {
              id: 'entry-2',
              applicant: 'Updated Applicant',
              respondent: 'Updated Respondent',
              title: 'Updated Title',
            },
          ],
          feeForm: {
            hasOffsiteFee: true,
            feeStatuses: [
              {
                paymentStatus: 'PAID',
                statusDate: '2026-01-01',
                paymentReference: 'RESTORED-REF',
              },
            ],
          },
          feeMeta: {
            latestStatusDate: '2026-01-01',
            statusDateMinimum: '2025-01-01',
          },
          submitted: true,
          feeErrors: [{ text: 'Fee details are required' }],
        },
      },
      '',
    );

    const fixture = TestBed.createComponent(
      ApplicationsListDetailBulkUpdateFeesComponent,
    );
    const component = fixture.componentInstance;

    component.ngOnInit();

    expect(component.vm().listId).toBe('list-456');
    expect(component.vm().selectedEntries).toEqual([
      {
        id: 'entry-2',
        applicant: 'Updated Applicant',
        respondent: 'Updated Respondent',
        title: 'Updated Title',
      },
    ]);
    expect(component.civilFeeForm.getRawValue()).toMatchObject({
      hasOffsiteFee: true,
      feeStatuses: [
        {
          paymentStatus: 'PAID',
          statusDate: '2026-01-01',
          paymentReference: 'RESTORED-REF',
        },
      ],
    });
    expect(component.feeMeta).toEqual({
      latestStatusDate: '2026-01-01',
      statusDateMinimum: '2025-01-01',
    });
    expect(component.vm().submitted).toBe(true);
    expect(component.vm().feeErrors).toEqual([
      { text: 'Fee details are required' },
    ]);
  });

  it('stores fee errors from child sections', () => {
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

    component.onCivilFeeErrors([{ text: 'Payment reference is invalid' }]);

    expect(component.vm().feeErrors).toEqual([
      { text: 'Payment reference is invalid' },
    ]);
  });

  it('disables the update button until at least one fee status exists', () => {
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

    expect(component.disableUpdateButton()).toBe(true);

    component.onAddFeeDetails({
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-06-03',
      paymentReference: 'ABC123',
    });

    expect(component.disableUpdateButton()).toBe(false);
  });

  it('navigates to confirm with selected entries and fee data when add fees succeeds', () => {
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
    component.onAddFeeDetails({
      feeStatus: PaymentStatus.PAID,
      statusDate: '2026-06-03',
      paymentReference: 'ABC123',
    });

    component.addFees();

    expect(routerNavigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-123', 'bulk-update-fee', 'confirm'],
      {
        state: {
          selectedEntries: [
            {
              id: 'entry-1',
              applicant: 'Applicant',
              respondent: 'Respondent',
              title: 'Title',
            },
          ],
          feeTable: [
            {
              paymentStatus: 'PAID',
              statusDate: '2026-06-03',
              paymentReference: 'ABC123',
            },
          ],
          isOffSiteFee: true,
        },
      },
    );
  });

  it('prevents confirm navigation when child validation returns errors', () => {
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
    Object.defineProperty(component, 'civilFeeSection', {
      value: {
        validateForSubmit: jest.fn(() => [{ text: 'Civil fee is invalid' }]),
      },
    });

    component.addFees();

    expect(component.vm().feeErrors).toEqual([
      { text: 'Civil fee is invalid' },
    ]);
    expect(routerNavigate).not.toHaveBeenCalledWith(
      ['/applications-list', 'list-123', 'bulk-update-fee', 'confirm'],
      expect.anything(),
    );
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
