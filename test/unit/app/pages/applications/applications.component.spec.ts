import { HttpResponse } from '@angular/common/http';
import type { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Applications } from '@components/applications/applications.component';
import { ApplicationsState } from '@components/applications/util/applications.state';
import {
  ApplicationListEntriesApi,
  ApplicationListStatus,
  EntryGetFilterDto,
  EntryGetSummaryDto,
  EntryPage,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';

interface HasLoadQuery {
  loadQuery(): EntryGetFilterDto;
}

function appStateSignal(
  component: Applications,
): WritableSignal<ApplicationsState> {
  return (
    component as unknown as {
      appState: { state: WritableSignal<ApplicationsState> };
    }
  ).appState.state;
}

function makeEntry(
  overrides?: Partial<EntryGetSummaryDto>,
): EntryGetSummaryDto {
  return {
    id: 'row-1',
    applicationTitle: 'Some title',
    isFeeRequired: true,
    isResulted: false,
    status: 'OPEN' as ApplicationListStatus,
    ...overrides,
  };
}

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

  const getEntriesMock: jest.MockedFunction<
    ApplicationListEntriesApi['getEntries']
  > = jest.fn();

  const appListEntriesApiStub: Pick<ApplicationListEntriesApi, 'getEntries'> = {
    getEntries: getEntriesMock,
  };

  beforeEach(async () => {
    getEntriesMock.mockReset();

    // default: empty page response
    getEntriesMock.mockReturnValue(
      of(
        new HttpResponse<EntryPage>({
          body: {
            content: [],
            totalPages: 0,
            number: 0,
          } as unknown as EntryPage,
        }),
      ),
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
      component.form.patchValue({ status: 'open' }); // string is fine
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

  describe('loadQuery', () => {
    it('maps and trims form values into EntryGetFilterDto', () => {
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
        status: 'open',
      });

      const filter = (component as unknown as HasLoadQuery).loadQuery();

      expect(filter).toEqual(
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

      component.form.reset({ date: '   ' });
      const emptyFilter = (component as unknown as HasLoadQuery).loadQuery();
      expect(emptyFilter.date).toBeUndefined();
    });
  });

  describe('loadApplications', () => {
    it('does nothing when already loading', () => {
      getEntriesMock.mockClear();

      appStateSignal(component).update((s) => ({ ...s, isLoading: true }));

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

      appStateSignal(component).update((s) => ({
        ...s,
        searchErrors: [],
        isLoading: false,
      }));

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params, , , options] = getEntriesMock.mock.calls[0];

      expect(params?.pageNumber).toBe(component.vm().currentPage - 1);
      expect(params?.pageSize).toBe(component.vm().pageSize);
      expect(params?.filter).toEqual({});
      expect(options).toEqual(
        expect.objectContaining({
          transferCache: false,
        }),
      );
    });

    it('calls API with correct params and updates rows and pagination on success', () => {
      appStateSignal(component).update((s) => ({
        ...s,
        currentPage: 2,
        pageSize: 25,
        isLoading: false,
      }));

      component.form.patchValue({ applicantOrg: 'Org Ltd' });

      getEntriesMock.mockClear();
      getEntriesMock.mockReturnValueOnce(
        of({
          content: [makeEntry({ id: 'row-1' })],
          totalPages: 5,
          number: 1,
        } as unknown as EntryPage) as unknown as ReturnType<
          ApplicationListEntriesApi['getEntries']
        >,
      );

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      const [params, , , options] = getEntriesMock.mock.calls[0];

      expect(params?.pageNumber).toBe(component.vm().currentPage - 1);
      expect(params?.pageSize).toBe(component.vm().pageSize);
      expect(params?.filter).toEqual(
        expect.objectContaining({
          applicantOrganisation: 'Org Ltd',
        }),
      );
      expect(options).toEqual(
        expect.objectContaining({
          transferCache: false,
        }),
      );

      expect(component.vm().rows.map((r) => r.id)).toEqual(['row-1']);
      expect(component.vm().totalPages).toBe(5);
      expect(component.vm().currentPage).toBe(2);
      expect(component.vm().isLoading).toBe(false);
    });

    it('handles API error by setting searchErrors and clearing loading state', () => {
      component.form.patchValue({ applicantOrg: 'Org Ltd' });

      getEntriesMock.mockClear();
      getEntriesMock.mockReturnValueOnce(throwError(() => new Error('boom')));

      appStateSignal(component).update((s) => ({
        ...s,
        searchErrors: [],
        isLoading: false,
        errorHint: '',
      }));

      component.loadApplications();

      expect(getEntriesMock).toHaveBeenCalledTimes(1);
      expect(component.vm().isLoading).toBe(false);
      expect(component.vm().errorHint).toBe('There is a problem');
      expect(component.vm().searchErrors).toHaveLength(1);
      expect(component.vm().searchErrors[0].text).toContain(
        'There was a problem retrieving the applications',
      );
    });
  });

  describe('pagination', () => {
    it('onPageChange updates currentPage and reloads applications', () => {
      const loadSpy = jest.spyOn(component, 'loadApplications');

      component.onPageChange(3);

      expect(component.vm().currentPage).toBe(3);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });
  });
});
