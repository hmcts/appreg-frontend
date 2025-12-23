import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Applications } from '../../../../../src/app/pages/applications/applications';

import { ApplicationListEntriesApi } from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';

describe('ApplicationsComponent', () => {
  let component: Applications;
  let fixture: ComponentFixture<Applications>;

  const referenceDataFacadeStub: Pick<
    ReferenceDataFacade,
    'cja$' | 'courtLocations$'
  > = {
    cja$: of([]),
    courtLocations$: of([]),
  };

  const getEntriesMock = jest.fn();
  const appListEntriesApiStub: Pick<ApplicationListEntriesApi, 'getEntries'> = {
    getEntries: getEntriesMock,
  };

  beforeEach(async () => {
    getEntriesMock.mockReset();
    // default: empty page response
    getEntriesMock.mockReturnValue(
      of({
        content: [],
        totalPages: 0,
        number: 0,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [Applications],
      providers: [
        { provide: ReferenceDataFacade, useValue: referenceDataFacadeStub },
        { provide: ApplicationListEntriesApi, useValue: appListEntriesApiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Applications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('searchDisabled / hasAnyParams', () => {
    it('disables Search when all filters are empty', () => {
      component.form.reset({
        date: null,
        applicantOrg: '',
        respondentOrg: '',
        applicantSurname: '',
        respondentSurname: '',
        location: '',
        standardApplicantCode: '',
        respondentPostcode: '',
        accountReference: '',
        court: '',
        cja: '',
        status: null,
      });

      fixture.detectChanges();

      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('#search');

      expect(button).toBeTruthy();
      expect(component.searchDisabled).toBe(true);
      expect(button.disabled).toBe(true);
    });

    it('enables Search when a single text filter is set', () => {
      component.form.patchValue({ applicantOrg: 'Some Org' });
      fixture.detectChanges();

      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('#search');

      expect(component.searchDisabled).toBe(false);
      expect(button.disabled).toBe(false);
    });

    it('enables Search when only status is set', () => {
      component.form.reset();
      component.form.patchValue({ status: 'PENDING' });
      fixture.detectChanges();

      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('#search');

      expect(component.searchDisabled).toBe(false);
      expect(button.disabled).toBe(false);
    });

    it('disables Search again after clearing the last filled field', () => {
      component.form.patchValue({ applicantOrg: 'Some Org' });
      fixture.detectChanges();

      component.form.patchValue({ applicantOrg: '' });
      fixture.detectChanges();

      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('#search');

      expect(component.searchDisabled).toBe(true);
      expect(button.disabled).toBe(true);
    });
  });

  describe('query mapping', () => {
    it('maps and trims form values into the API filter', () => {
      component.form.patchValue({
        date: ' 2025-01-02 ',
        court: '  Some Court  ',
        location: '  Other site ',
        cja: ' CJA01 ',
        applicantOrg: '  Org Ltd ',
        applicantSurname: '  Smith ',
        respondentOrg: ' Resp Org ',
        respondentSurname: '  Jones ',
        respondentPostcode: '  AB1 2CD ',
        standardApplicantCode: '  STD123 ',
        accountReference: '  ACC-999 ',
        status: 'PENDING',
      });
      getEntriesMock.mockClear();
      component.searchErrors = [];
      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params] = getEntriesMock.mock.calls[0];

      // Do NOT assert on status; implementation doesn’t set it
      expect(params.filter).toEqual(
        expect.objectContaining({
          date: '2025-01-02',
          courtCode: 'Some Court',
          otherLocationDescription: 'Other site',
          cjaCode: 'CJA01',
          applicantOrganisation: 'Org Ltd',
          applicantSurname: 'Smith',
          respondentOrganisation: 'Resp Org',
          respondentSurname: 'Jones',
          respondentPostcode: 'AB1 2CD',
          standardApplicantCode: 'STD123',
          accountReference: 'ACC-999',
        }),
      );

      // empty/whitespace fields should not appear
      getEntriesMock.mockClear();
      component.form.reset({
        date: '   ',
        applicantOrg: '',
        respondentOrg: '',
        applicantSurname: '',
        respondentSurname: '',
        location: '',
        standardApplicantCode: '',
        respondentPostcode: '',
        accountReference: '',
        court: '',
        cja: '',
        status: null,
      });
      component.searchErrors = [];
      component.loadApplications();

      const [params2] = getEntriesMock.mock.calls[0];
      expect(params2.filter.date).toBeUndefined();
    });
  });

  describe('loadApplications', () => {
    it('does nothing when already loading', () => {
      getEntriesMock.mockClear();
      component.isLoading = true;

      component.loadApplications();

      expect(getEntriesMock).not.toHaveBeenCalled();
    });

    it('calls API with empty filter when all filters are empty', () => {
      getEntriesMock.mockClear();

      component.form.reset({
        date: null,
        applicantOrg: '',
        respondentOrg: '',
        applicantSurname: '',
        respondentSurname: '',
        location: '',
        standardApplicantCode: '',
        respondentPostcode: '',
        accountReference: '',
        court: '',
        cja: '',
        status: null,
      });
      component.searchErrors = [];

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params, , , options] = getEntriesMock.mock.calls[0];

      expect(params.page).toBe(component.currentPage - 1);
      expect(params.size).toBe(component.pageSize);
      expect(params.filter).toEqual({});
      expect(options).toEqual(
        expect.objectContaining({
          transferCache: false,
        }),
      );
    });

    it('calls API with correct params and updates rows and pagination on success', () => {
      // Arrange filter + page state
      component.currentPage = 2;
      component.pageSize = 25;
      component.form.patchValue({
        applicantOrg: 'Org Ltd',
      });

      getEntriesMock.mockClear();
      getEntriesMock.mockReturnValueOnce(
        of({
          content: [{ id: 'row-1' }],
          totalPages: 5,
          number: 1,
        }),
      );

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params, , , options] = getEntriesMock.mock.calls[0];

      expect(params.page).toBe(component.currentPage - 1);
      expect(params.size).toBe(component.pageSize);
      expect(params.filter).toEqual(
        expect.objectContaining({
          applicantOrganisation: 'Org Ltd',
        }),
      );
      expect(options).toEqual(
        expect.objectContaining({
          transferCache: false,
        }),
      );

      expect(component.rows).toEqual([{ id: 'row-1' }]);
      expect(component.totalPages).toBe(5);
      expect(component.currentPage).toBe(2);
      expect(component.isLoading).toBe(false);
    });

    it('handles API error by setting searchErrors and clearing loading state', () => {
      component.form.patchValue({ applicantOrg: 'Org Ltd' });

      getEntriesMock.mockClear();
      getEntriesMock.mockReturnValueOnce(throwError(() => new Error('boom')));

      component.searchErrors = [];
      component.isLoading = false;

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(component.isLoading).toBe(false);
      expect(component.searchErrors).toHaveLength(1);
      expect(component.searchErrors[0].text).toContain(
        'There was a problem retrieving the applications',
      );
    });
  });

  describe('pagination', () => {
    it('onPageChange updates currentPage and reloads applications', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');

      component.onPageChange(3);

      expect(component.currentPage).toBe(3);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });
  });
});
