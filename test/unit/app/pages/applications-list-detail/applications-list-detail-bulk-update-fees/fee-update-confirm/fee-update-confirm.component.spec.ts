import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FeeUpdateConfirmComponent } from '@components/applications-list-detail/applications-list-detail-bulk-update-fees/fee-update-confirm/fee-update-confirm.component';
import { ApplicationListEntriesApi, FeeStatus } from '@openapi';

describe('FeeUpdateConfirmComponent', () => {
  let component: FeeUpdateConfirmComponent;
  let fixture: ComponentFixture<FeeUpdateConfirmComponent>;

  const routerNavigate = jest.fn().mockResolvedValue(true);
  const bulkUpdateApplicationListEntryFees = jest.fn();
  beforeEach(async () => {
    bulkUpdateApplicationListEntryFees.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [FeeUpdateConfirmComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: jest.fn((key: string) => (key === 'id' ? 'list-1' : null)),
              },
            },
          },
        },
        { provide: Location, useValue: { getState: jest.fn() } },
        { provide: Router, useValue: { navigate: routerNavigate } },
        {
          provide: ApplicationListEntriesApi,
          useValue: { bulkUpdateApplicationListEntryFees },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeeUpdateConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    routerNavigate.mockClear();
    bulkUpdateApplicationListEntryFees.mockClear();
  });

  it('builds a bulk fee payload with deduped entry ids and one feeDetails object', () => {
    component.selectedEntries = [
      {
        id: 'entry-1',
        applicant: 'Applicant',
        respondent: 'Respondent',
        title: 'Title',
      },
      {
        id: 'entry-1',
        applicant: 'Applicant',
        respondent: 'Respondent',
        title: 'Title',
      },
      {
        id: 'entry-2',
        applicant: 'Applicant 2',
        respondent: 'Respondent 2',
        title: 'Title 2',
      },
    ] as never;
    component.feeStatuses = [
      {
        paymentStatus: 'PAID',
        statusDate: '2026-01-01',
        paymentReference: 'REF-1',
      } as FeeStatus,
    ];
    component.isOffSiteFee = true;

    component.onConfirm();

    expect(bulkUpdateApplicationListEntryFees).toHaveBeenCalledWith({
      listId: 'list-1',
      bulkFeesUpdateDto: {
        entryIds: ['entry-1', 'entry-2'],
        feeDetails: [
          {
            paymentStatus: 'PAID',
            statusDate: '2026-01-01',
            paymentReference: 'REF-1',
          },
        ],
        hasOffsiteFee: true,
      },
    });
  });

  it('submits selected entries with only the offsite fee enabled', () => {
    component.selectedEntries = [
      {
        id: 'entry-1',
        applicant: 'Applicant',
        respondent: 'Respondent',
        title: 'Title',
      },
    ] as never;
    component.feeStatuses = [];
    component.isOffSiteFee = true;

    component.onConfirm();

    expect(bulkUpdateApplicationListEntryFees).toHaveBeenCalledWith({
      listId: 'list-1',
      bulkFeesUpdateDto: {
        entryIds: ['entry-1'],
        hasOffsiteFee: true,
      },
    });
  });

  it('goBack persists civil fee statuses in bulk update snapshot state', () => {
    component.selectedEntries = [
      {
        id: 'entry-1',
        applicant: 'Applicant',
        respondent: 'Respondent',
        title: 'Title',
      },
    ] as never;
    component.feeStatuses = [
      {
        paymentStatus: 'PAID',
        statusDate: '2026-01-01',
        paymentReference: 'REF-1',
      } as FeeStatus,
    ];
    component.isOffSiteFee = true;

    component.goBack();

    expect(routerNavigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-1', 'bulk-update-fee'],
      {
        state: {
          entriesToUpdateFee: [
            {
              id: 'entry-1',
              applicant: 'Applicant',
              respondent: 'Respondent',
              title: 'Title',
            },
          ],
          bulkUpdateFeeSnapshot: {
            listId: 'list-1',
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
                  paymentReference: 'REF-1',
                },
              ],
              hasOffsiteFee: true,
            },
          },
        },
      },
    );
  });

  it('renders the civil fee table as read-only content', () => {
    component.selectedEntries = [
      {
        id: 'entry-1',
        applicant: 'Applicant',
        respondent: 'Respondent',
        title: 'Title',
      },
    ] as never;
    component.feeStatuses = [
      {
        paymentStatus: 'PAID',
        statusDate: '2026-01-01',
        paymentReference: 'REF-1',
      } as FeeStatus,
    ];
    component.isOffSiteFee = true;

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Civil fee details');
    expect(host.textContent).toContain('Off site fee applies.');
    expect(host.textContent).toContain('PAID');
    expect(host.textContent).toContain('Jan 1, 2026');
    expect(host.textContent).toContain('REF-1');
  });

  it('goes back to the edit page on init when required navigation state is missing', () => {
    expect(routerNavigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-1', 'bulk-update-fee'],
      {
        state: {
          entriesToUpdateFee: [],
          bulkUpdateFeeSnapshot: {
            listId: 'list-1',
            selectedEntries: [],
            feeForm: {
              feeStatuses: [],
              hasOffsiteFee: false,
            },
          },
        },
      },
    );
  });

  it('navigates back to the list page when goBack is called without a list id', () => {
    component.listId = null;

    component.goBack();

    expect(routerNavigate).toHaveBeenCalledWith(['/applications-list']);
  });

  it('navigates back instead of submitting when confirm is clicked without fee data', () => {
    component.selectedEntries = [] as never;
    component.feeStatuses = [];

    component.onConfirm();

    expect(bulkUpdateApplicationListEntryFees).not.toHaveBeenCalled();
    expect(routerNavigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-1', 'bulk-update-fee'],
      {
        state: {
          entriesToUpdateFee: [],
          bulkUpdateFeeSnapshot: {
            listId: 'list-1',
            selectedEntries: [],
            feeForm: {
              feeStatuses: [],
              hasOffsiteFee: false,
            },
          },
        },
      },
    );
  });

  it('navigates back to the detail page with an error message when the update fails', () => {
    bulkUpdateApplicationListEntryFees.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { detail: 'Fee update failed' },
          }),
      ),
    );
    component.selectedEntries = [
      {
        id: 'entry-1',
        applicant: 'Applicant',
        respondent: 'Respondent',
        title: 'Title',
      },
    ] as never;
    component.feeStatuses = [
      {
        paymentStatus: 'PAID',
        statusDate: '2026-01-01',
        paymentReference: 'REF-1',
      } as FeeStatus,
    ];

    component.onConfirm();

    expect(routerNavigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-1'],
      {
        queryParams: {
          updateFee: 'error',
        },
        state: {
          updateFeeError: 'Fee update failed',
        },
      },
    );
  });
});
