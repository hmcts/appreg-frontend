import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import {
  ApplicationsListDetailSearchComponent,
  ApplicationsListDetailSearchResult,
} from '@components/applications-list-detail-search/applications-list-detail-search.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  Applicant,
  ApplicationListEntriesApi,
  ApplicationListStatus,
  EntryPage,
} from '@openapi';

describe('ApplicationsListDetailSearchComponent', () => {
  let fixture: ComponentFixture<ApplicationsListDetailSearchComponent>;
  let component: ApplicationsListDetailSearchComponent;

  const entriesApiStub: jest.Mocked<
    Pick<ApplicationListEntriesApi, 'getApplicationListEntries'>
  > = {
    getApplicationListEntries: jest.fn(),
  };

  const emittedResults: ApplicationsListDetailSearchResult[] = [];

  beforeEach(async () => {
    emittedResults.length = 0;
    entriesApiStub.getApplicationListEntries.mockReset();
    entriesApiStub.getApplicationListEntries.mockReturnValue(
      of({
        content: [],
        totalPages: 0,
      } as unknown as EntryPage) as unknown as ReturnType<
        ApplicationListEntriesApi['getApplicationListEntries']
      >,
    );

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetailSearchComponent],
      providers: [
        { provide: ApplicationListEntriesApi, useValue: entriesApiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetailSearchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('listId', 'list-1');
    fixture.componentRef.setInput('pageSize', 25);
    component.searchResult.subscribe((result) => emittedResults.push(result));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits local validation errors and skips the API call', async () => {
    component.form.patchValue({
      sequenceNumber: 'abc',
      respondentPostcode: 'not-a-postcode',
    });

    await component.onSearch();

    expect(entriesApiStub.getApplicationListEntries).not.toHaveBeenCalled();
    expect(component.localErrors()).toEqual<ErrorItem[]>([
      {
        id: 'sequenceNumber',
        href: '#sequence-number',
        text: 'Sequence number must only contain numbers',
      },
      {
        id: 'respondentPostcode',
        href: '#postcode',
        text: 'Postcode must be 8 characters or fewer',
      },
    ]);
    expect(component.errorFor('sequence-number')).toBe(
      'Sequence number must only contain numbers',
    );
    expect(component.errorFor('postcode')).toBe(
      'Postcode must be 8 characters or fewer',
    );
    expect(emittedResults).toEqual([
      {
        rows: [],
        totalPages: 0,
        errors: component.localErrors(),
      },
    ]);
  });

  it('calls the API with the mapped filter and emits mapped rows on success', async () => {
    const respondent: Applicant = {
      organisation: {
        name: 'Respondent Ltd',
        contactDetails: {
          addressLine1: '1 Street',
          addressLine2: null,
          addressLine3: null,
          addressLine4: null,
          addressLine5: null,
          postcode: 'AB1 2CD',
          phone: null,
          mobile: null,
          email: null,
        },
      },
    };

    const page: EntryPage = {
      pageNumber: 0,
      pageSize: 25,
      totalElements: 1,
      totalPages: 3,
      elementsOnPage: 1,
      first: true,
      last: false,
      sort: { orders: [] },
      content: [
        {
          id: 'entry-1',
          sequenceNumber: 12,
          accountNumber: 'ACC-42',
          applicant: {
            organisation: {
              name: 'Applicant Org',
              contactDetails: { addressLine1: '10 Road' },
            },
          },
          respondent,
          applicationTitle: ' Example application ',
          isFeeRequired: false,
          isResulted: true,
          resulted: [{ resultCode: 'GRANTED', title: 'Granted' }],
          status: ApplicationListStatus.OPEN,
        },
      ],
    };

    entriesApiStub.getApplicationListEntries.mockReturnValue(
      of(page) as unknown as ReturnType<
        ApplicationListEntriesApi['getApplicationListEntries']
      >,
    );

    component.form.patchValue({
      sequenceNumber: '12',
      accountReference: ' ACC-42 ',
      applicantName: ' Applicant Org ',
      respondentName: ' Respondent Ltd ',
      respondentPostcode: 'ab1 2cd',
      applicationTitle: ' Example application ',
      feeRequired: 'no',
      resulted: ' granted ',
    });

    await component.onSearch();

    expect(entriesApiStub.getApplicationListEntries).toHaveBeenCalledWith({
      listId: 'list-1',
      filter: {
        sequenceNumber: 12,
        accountReference: 'ACC-42',
        applicantName: 'Applicant Org',
        respondentName: 'Respondent Ltd',
        respondentPostcode: 'AB1 2CD',
        applicationTitle: 'Example application',
        feeRequired: false,
        resulted: 'GRANTED',
      },
      pageNumber: 0,
      pageSize: 25,
      sort: ['sequenceNumber,asc'],
    });
    expect(component.localErrors()).toEqual([]);
    expect(emittedResults).toEqual([
      {
        rows: [
          {
            id: 'entry-1',
            sequenceNumber: 12,
            accountNumber: 'ACC-42',
            applicant: 'Applicant Org',
            respondent: 'Respondent Ltd',
            postCode: 'AB1 2CD',
            title: 'Example application',
            feeReq: 'No',
            resulted: 'GRANTED',
          },
        ],
        totalPages: 3,
        errors: [],
      },
    ]);
  });

  it('parses API validation errors and emits them', async () => {
    entriesApiStub.getApplicationListEntries.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              errors: {
                applicantName: ' Applicant is invalid ',
                respondentPostcode: [' Enter a valid UK postcode '],
              },
            },
          }),
      ) as ReturnType<ApplicationListEntriesApi['getApplicationListEntries']>,
    );

    component.form.patchValue({
      applicantName: 'Applicant',
    });

    await component.onSearch();

    expect(component.localErrors()).toEqual<ErrorItem[]>([
      { id: 'applicantName', text: 'Applicant is invalid' },
      { id: 'respondentPostcode', text: 'Enter a valid UK postcode' },
    ]);
    expect(emittedResults).toEqual([
      {
        rows: [],
        totalPages: 0,
        errors: [
          { id: 'applicantName', text: 'Applicant is invalid' },
          { id: 'respondentPostcode', text: 'Enter a valid UK postcode' },
        ],
      },
    ]);
  });

  it('swallows non-problem API errors without emitting search results', async () => {
    entriesApiStub.getApplicationListEntries.mockReturnValue(
      throwError(() => new Error('boom')) as ReturnType<
        ApplicationListEntriesApi['getApplicationListEntries']
      >,
    );

    component.form.patchValue({
      applicantName: 'Applicant',
    });

    await component.onSearch();

    expect(component.localErrors()).toEqual([]);
    expect(emittedResults).toEqual([]);
  });

  it('clearSearch resets state and reruns the search with an empty filter', async () => {
    component.submitted.set(true);
    component.localErrors.set([{ id: 'x', text: 'Old error' }]);
    component.form.patchValue({
      sequenceNumber: '9',
      applicantName: 'Applicant',
      feeRequired: 'yes',
      resulted: 'cost',
    });

    component.clearSearch();
    await Promise.resolve();

    expect(component.submitted()).toBe(true);
    expect(component.localErrors()).toEqual([]);
    expect(component.form.getRawValue()).toEqual({
      sequenceNumber: '',
      accountReference: '',
      applicantName: '',
      respondentName: '',
      respondentPostcode: '',
      applicationTitle: '',
      feeRequired: '',
      resulted: '',
    });
    expect(entriesApiStub.getApplicationListEntries).toHaveBeenCalledWith({
      listId: 'list-1',
      filter: {
        sequenceNumber: undefined,
        accountReference: undefined,
        applicantName: undefined,
        respondentName: undefined,
        respondentPostcode: undefined,
        applicationTitle: undefined,
        feeRequired: undefined,
        resulted: undefined,
      },
      pageNumber: 0,
      pageSize: 25,
      sort: ['sequenceNumber,asc'],
    });
    expect(emittedResults).toEqual([
      {
        rows: [],
        totalPages: 0,
        errors: [],
      },
    ]);
  });
});
