import { Location } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { UpdateOfficialsComponent } from '@components/applications-list-detail/update-officials/update-officials.component';
import {
  UpdateOfficialsApplication,
  UpdateOfficialsNavState,
} from '@components/applications-list-detail/update-officials/update-officials.types';
import { OfficialType } from '@openapi';

describe('UpdateOfficialsComponent', () => {
  let component: UpdateOfficialsComponent;
  let fixture: ComponentFixture<UpdateOfficialsComponent>;
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

  const routerMock = {
    navigate: jest.fn(),
  };

  const locationMock = {
    getState: jest.fn(() => locationState),
  };

  const activatedRouteMock = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'list-1' }),
    },
  };

  beforeEach(async () => {
    locationState = { updateOfficialsApplications: rows };
    routerMock.navigate.mockReset();
    locationMock.getState.mockClear();

    await TestBed.configureTestingModule({
      imports: [UpdateOfficialsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: locationMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(UpdateOfficialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads selected applications from route state', () => {
    createComponent();

    expect(component.listId).toBe('list-1');
    expect(component.rows).toEqual(rows);
  });

  it('hydrates official form values from route state when returning from confirm', () => {
    locationState = {
      updateOfficialsApplications: rows,
      officialFormValue: {
        mags1FirstName: 'John',
        mags1Surname: 'Smith',
      },
    } as UpdateOfficialsNavState;

    createComponent();

    expect(component.form.controls.mags1FirstName.value).toBe('John');
    expect(component.form.controls.mags1Surname.value).toBe('Smith');
  });

  it('navigates back to the list detail page when no applications are provided', () => {
    locationState = { updateOfficialsApplications: [] };

    createComponent();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/applications-list',
      'list-1',
    ]);
  });

  it('navigates to confirm with selected applications, officials and form state', () => {
    createComponent();

    component.form.patchValue({
      mags1Title: 'mr',
      mags1FirstName: 'John',
      mags1Surname: 'Smith',
      officialTitle: 'mrs',
      officialFirstName: 'Clara',
      officialSurname: 'Jones',
    });

    component.onSaveOfficials();

    expect(routerMock.navigate).toHaveBeenCalledWith(['confirm'], {
      relativeTo: activatedRouteMock,
      state: {
        updateOfficialsApplications: rows,
        officialFormValue: expect.objectContaining({
          mags1FirstName: 'John',
          mags1Surname: 'Smith',
          officialFirstName: 'Clara',
          officialSurname: 'Jones',
        }),
        officials: [
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
        ],
      },
    });
  });

  it('does not post when official validation fails', () => {
    createComponent();

    component.form.patchValue({
      mags1FirstName: 'John',
      mags1Surname: null,
    });

    component.onSaveOfficials();

    expect(routerMock.navigate).not.toHaveBeenCalledWith(
      ['confirm'],
      expect.anything(),
    );
    expect(component.errorSummary()).toEqual([
      {
        id: 'mags1Surname',
        href: '#officials-mags1-surname',
        text: 'Magistrates 1 Last name is required',
      },
    ]);
  });

  it('does not continue when no official is entered', () => {
    createComponent();

    component.onSaveOfficials();

    expect(component.errorSummary()).toEqual([
      {
        id: 'mags1FirstName',
        href: '#officials-mags1-first-name',
        text: 'Enter at least one official',
      },
    ]);
    expect(routerMock.navigate).not.toHaveBeenCalledWith(
      ['confirm'],
      expect.anything(),
    );
  });
});
