import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  ApplicationsListDetailSearchComponent,
  ApplicationsListDetailSearchResult,
} from '@components/applications-list-detail-search/applications-list-detail-search.component';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetailSearchComponent],
      providers: [
        {
          provide: ApplicationListEntriesApi,
          useValue: entriesApiStub,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetailSearchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('listId', 'list-1');
    fixture.detectChanges();
  });

  afterEach(() => {
    entriesApiStub.getApplicationListEntries.mockReset();
  });

  it('emits a postcode validation error and skips the API call', async () => {
    const results: ApplicationsListDetailSearchResult[] = [];
    component.searchResult.subscribe((result) => results.push(result));

    component.form.controls.respondentPostcode.setValue('not-a-postcode');

    await component.onSearch();

    expect(entriesApiStub.getApplicationListEntries).not.toHaveBeenCalled();
    expect(component.errorFor('postcode')).toBe('Enter a valid UK postcode');
    expect(results).toEqual([
      {
        rows: [],
        totalPages: 0,
        errors: [
          {
            id: 'respondentPostcode',
            href: '#postcode',
            text: 'Enter a valid UK postcode',
          },
        ],
      },
    ]);
  });

  it('emits maxlength validation errors for the new search field validators', async () => {
    const results: ApplicationsListDetailSearchResult[] = [];
    component.searchResult.subscribe((result) => results.push(result));

    component.form.patchValue({
      accountReference: '1'.repeat(21),
      applicantName: 'a'.repeat(301),
      respondentName: 'b'.repeat(301),
      applicationTitle: 'c'.repeat(501),
    });

    await component.onSearch();

    expect(entriesApiStub.getApplicationListEntries).not.toHaveBeenCalled();
    expect(results).toEqual([
      {
        rows: [],
        totalPages: 0,
        errors: [
          {
            id: 'accountReference',
            href: '#account-number',
            text: 'Account number must be 20 characters or fewer',
          },
          {
            id: 'applicantName',
            href: '#applicant',
            text: 'Applicant must be 300 characters or fewer',
          },
          {
            id: 'respondentName',
            href: '#respondent',
            text: 'Respondent must be 300 characters or fewer',
          },
          {
            id: 'applicationTitle',
            href: '#title',
            text: 'Title must be 500 characters or fewer',
          },
        ],
      },
    ]);
  });

  it('emits mapped rows when the search succeeds', async () => {
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
      pageSize: 10,
      totalElements: 1,
      totalPages: 2,
      elementsOnPage: 1,
      content: [
        {
          id: 'entry-1',
          sequenceNumber: 12,
          accountNumber: 'ACC-42',
          applicant: {
            organisation: {
              name: 'Applicant Org',
              contactDetails: { addressLine1: 'Test address line' },
            },
          },
          respondent,
          applicationTitle: 'Example application',
          isFeeRequired: true,
          isResulted: true,
          resulted: [
            {
              resultCode: 'GRANTED',
              title: '',
            },
          ],
          status: ApplicationListStatus.OPEN,
        },
      ],
      sort: { orders: [] },
    };

    entriesApiStub.getApplicationListEntries.mockReturnValue(of(page) as never);

    const results: ApplicationsListDetailSearchResult[] = [];
    component.searchResult.subscribe((result) => results.push(result));

    component.form.patchValue({
      applicantName: 'Applicant Org',
      respondentPostcode: 'ab1 2cd',
      feeRequired: 'yes',
    });

    await component.onSearch();

    expect(entriesApiStub.getApplicationListEntries).toHaveBeenCalledWith({
      listId: 'list-1',
      filter: {
        sequenceNumber: undefined,
        accountReference: undefined,
        applicantName: 'Applicant Org',
        respondentName: undefined,
        respondentPostcode: 'AB1 2CD',
        applicationTitle: undefined,
        feeRequired: true,
        resulted: undefined,
      },
      pageNumber: 0,
      pageSize: 10,
      sort: ['sequenceNumber,asc'],
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      rows: [
        {
          id: 'entry-1',
          sequenceNumber: 12,
          accountNumber: 'ACC-42',
          applicant: 'Applicant Org',
          respondent: 'Respondent Ltd',
          postCode: 'AB1 2CD',
          title: 'Example application',
          feeReq: 'Yes',
          resulted: 'GRANTED',
        },
      ],
      totalPages: 2,
      errors: [],
    });
  });

  it('emits a sequence number validation error and skips the API call', async () => {
    const results: ApplicationsListDetailSearchResult[] = [];
    component.searchResult.subscribe((result) => results.push(result));

    component.form.patchValue({
      sequenceNumber: 'abc',
    });

    await component.onSearch();

    expect(entriesApiStub.getApplicationListEntries).not.toHaveBeenCalled();
    expect(component.errorFor('sequence-number')).toBe(
      'Sequence number must only contain numbers',
    );
    expect(results).toEqual([
      {
        rows: [],
        totalPages: 0,
        errors: [
          {
            id: 'sequenceNumber',
            href: '#sequence-number',
            text: 'Sequence number must only contain numbers',
          },
        ],
      },
    ]);
  });
});
