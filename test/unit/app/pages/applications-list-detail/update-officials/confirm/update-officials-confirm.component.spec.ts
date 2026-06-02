import { Location } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UpdateOfficialsConfirmComponent } from '@components/applications-list-detail/update-officials/confirm/update-officials-confirm.component';
import {
  UpdateOfficialsApplication,
  UpdateOfficialsNavState,
} from '@components/applications-list-detail/update-officials/update-officials.types';
import { ApplicationListEntriesApi, Official, OfficialType } from '@openapi';

describe('UpdateOfficialsConfirmComponent', () => {
  let component: UpdateOfficialsConfirmComponent;
  let fixture: ComponentFixture<UpdateOfficialsConfirmComponent>;
  let locationState: UpdateOfficialsNavState;

  const rows: UpdateOfficialsApplication[] = [
    {
      id: 'entry-1',
      sequenceNumber: 1,
      applicant: 'Applicant A',
      respondent: 'Respondent A',
      title: 'Application A',
    },
    {
      id: 'entry-2',
      sequenceNumber: 2,
      applicant: 'Applicant B',
      respondent: 'Respondent B',
      title: 'Application B',
    },
  ];

  const officials: Official[] = [
    {
      type: OfficialType.MAGISTRATE,
      title: 'mr',
      forename: 'John',
      surname: 'Smith',
    },
    {
      type: OfficialType.CLERK,
      title: 'mrs',
      forename: 'Clara',
      surname: 'Jones',
    },
  ];

  const officialFormValue = {
    mags1FirstName: 'John',
    mags1Surname: 'Smith',
    officialFirstName: 'Clara',
    officialSurname: 'Jones',
  } as UpdateOfficialsNavState['officialFormValue'];

  const routerMock = {
    navigate: jest.fn().mockResolvedValue(true),
  };

  const locationMock = {
    getState: jest.fn(() => locationState),
  };

  const entriesApiMock = {
    replaceApplicationListEntryOfficials: jest.fn(),
  };

  const activatedRouteMock = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'list-1' }),
    },
  };

  beforeEach(async () => {
    locationState = {
      updateOfficialsApplications: rows,
      officials,
      officialFormValue,
    };
    routerMock.navigate.mockReset();
    routerMock.navigate.mockResolvedValue(true);
    locationMock.getState.mockClear();
    entriesApiMock.replaceApplicationListEntryOfficials.mockReset();
    entriesApiMock.replaceApplicationListEntryOfficials.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [UpdateOfficialsConfirmComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock },
        { provide: ApplicationListEntriesApi, useValue: entriesApiMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(UpdateOfficialsConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads applications and officials from navigation state', () => {
    createComponent();

    expect(component.listId).toBe('list-1');
    expect(component.rows).toEqual(rows);
    expect(component.officials).toEqual(officials);
    expect(component.officialRows).toEqual([
      { label: 'Magistrate 1', value: 'Mr John Smith' },
      { label: 'Court official', value: 'Mrs Clara Jones' },
    ]);
  });

  it('submits the bulk officials update and navigates back to the detail page', () => {
    createComponent();

    component.onConfirm();

    expect(
      entriesApiMock.replaceApplicationListEntryOfficials,
    ).toHaveBeenCalledWith({
      listId: 'list-1',
      bulkOfficialsUpdateDto: {
        entryIds: ['entry-1', 'entry-2'],
        officials,
      },
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-1'],
      {
        queryParams: { updateOfficialsSuccessful: true },
      },
    );
  });

  it('deduplicates entry ids before submitting', () => {
    locationState = {
      updateOfficialsApplications: [...rows, rows[0]],
      officials,
      officialFormValue,
    };
    createComponent();

    component.onConfirm();

    const request = entriesApiMock.replaceApplicationListEntryOfficials.mock
      .calls[0][0] as {
      bulkOfficialsUpdateDto: { entryIds: string[] };
    };
    expect(request.bulkOfficialsUpdateDto.entryIds).toEqual([
      'entry-1',
      'entry-2',
    ]);
  });

  it('shows an API error when the update fails', () => {
    entriesApiMock.replaceApplicationListEntryOfficials.mockReturnValue(
      throwError(() => ({ detail: 'Officials could not be updated' })),
    );
    createComponent();

    component.onConfirm();

    expect(component.errorSummary()).toEqual([
      { text: 'Officials could not be updated' },
    ]);
  });

  it('goes back to the update officials page with state', () => {
    createComponent();

    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-1', 'update-officials'],
      {
        state: {
          updateOfficialsApplications: rows,
          officialFormValue,
        },
      },
    );
  });

  it('redirects back when confirm state is incomplete', () => {
    locationState = { updateOfficialsApplications: rows };

    createComponent();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/applications-list', 'list-1', 'update-officials'],
      {
        state: {
          updateOfficialsApplications: rows,
          officialFormValue: undefined,
        },
      },
    );
  });
});
