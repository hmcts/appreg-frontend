import { NO_ERRORS_SCHEMA, PLATFORM_ID, TransferState } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { jest } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { ApplicationsListCreate } from '../../../../../src/app/pages/applications-list-create/applications-list-create';
import { TextInputComponent } from '../../../../../src/app/shared/components/text-input/text-input.component';
import {
  ApplicationListCreateDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '../../../../../src/generated/openapi';

const COURTS: CourtLocationGetSummaryDto[] = [
  { name: 'Alpha Court', locationCode: 'A1' },
  { name: 'Beta Court', locationCode: 'B2' },
];
const CJAS: CriminalJusticeAreaGetDto[] = [
  { code: 'C1', description: 'Area One' },
  { code: 'C2', description: 'Area Two' },
];

// Reactive-forms warning disabled
let warnSpy: ReturnType<typeof jest.spyOn>;
beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => warnSpy.mockRestore());

describe('ApplicationsListCreate', () => {
  let fixture: ComponentFixture<ApplicationsListCreate>;
  let component: ApplicationsListCreate;

  // service mocks
  const appListsMock = {
    createApplicationList: jest.fn().mockReturnValue(of({ id: 123 })),
  };
  const courtsMock = {
    getCourtLocations: jest.fn().mockReturnValue(
      of({
        content: [
          { name: 'Alpha Court', locationCode: 'A1' },
          { name: 'Beta Court', locationCode: 'B2' },
        ],
        pageNumber: 0,
        pageSize: 2,
        totalElements: 2,
        elementsOnPage: 2,
      }),
    ),
  };
  const cjaMock = {
    getCriminalJusticeAreas: jest.fn().mockReturnValue(
      of({
        content: [
          { code: 'C1', description: 'Area One' },
          { code: 'C2', description: 'Area Two' },
        ],
        pageNumber: 0,
        pageSize: 2,
        totalElements: 2,
        elementsOnPage: 2,
      }),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListCreate],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        TransferState,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { nationalCourtHouses: [] } },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideProvider(ApplicationListsApi, { useValue: appListsMock })
      .overrideProvider(CourtLocationsApi, { useValue: courtsMock })
      .overrideProvider(CriminalJusticeAreasApi, { useValue: cjaMock })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationsListCreate);
    component = fixture.componentInstance;
  });

  function submit(action: string) {
    const evt = {
      preventDefault: jest.fn(),
      submitter: { value: action } as HTMLButtonElement,
    } as unknown as SubmitEvent;
    component.onSubmit(evt);
    return evt;
  }

  it('calls reference data APIs on init', () => {
    fixture.detectChanges();
    expect(courtsMock.getCourtLocations).toHaveBeenCalled();
    expect(cjaMock.getCriminalJusticeAreas).toHaveBeenCalled();
  });

  it('prefills suggestion searches from existing form values', () => {
    component.form.controls.court.setValue(' A1 ');
    component.form.controls.cja.setValue(' C1 ');
    component.ngOnInit();
    expect(component.courthouseSearch).toBe(' A1 ');
    expect(component.cjaSearch).toBe(' C1 ');
  });

  it('disables and enables related fields based on values', () => {
    fixture.detectChanges();

    // none -> all enabled
    component.form.controls.court.setValue('');
    component.form.controls.location.setValue('');
    component.form.controls.cja.setValue('');
    expect(component.form.controls.court.disabled).toBe(false);
    expect(component.form.controls.location.disabled).toBe(false);
    expect(component.form.controls.cja.disabled).toBe(false);

    // court set -> others disabled
    component.form.controls.court.setValue('A1');
    expect(component.form.controls.court.disabled).toBe(false);
    expect(component.form.controls.location.disabled).toBe(true);
    expect(component.form.controls.cja.disabled).toBe(true);

    // location set -> court disabled
    component.form.controls.court.setValue('');
    component.form.controls.location.setValue('Somewhere');
    expect(component.form.controls.court.disabled).toBe(true);
    expect(component.form.controls.location.disabled).toBe(false);
    expect(component.form.controls.cja.disabled).toBe(false);

    // cja set -> court disabled
    component.form.controls.location.setValue('');
    component.form.controls.cja.setValue('C1');
    expect(component.form.controls.court.disabled).toBe(true);
    expect(component.form.controls.location.disabled).toBe(false);
    expect(component.form.controls.cja.disabled).toBe(false);
  });

  it('filters courthouses by name or code', () => {
    component.courtLocations = [...COURTS];

    component.courthouseSearch = 'a1';
    component.onCourthouseInputChange();
    expect(component.filteredCourthouses.map((c) => c.locationCode)).toEqual([
      'A1',
    ]);

    component.courthouseSearch = 'beta';
    component.onCourthouseInputChange();
    expect(component.filteredCourthouses.map((c) => c.name)).toEqual([
      'Beta Court',
    ]);

    component.courthouseSearch = '';
    component.onCourthouseInputChange();
    expect(component.filteredCourthouses).toHaveLength(0);
  });

  it('selectCourthouse sets value and clears suggestions', () => {
    const c: CourtLocationGetSummaryDto = { name: 'X', locationCode: 'X1' };
    component.selectCourthouse(c);
    expect(component.courthouseSearch).toBe('X1 - X');
    expect(component.form.controls.court.value).toBe('X1');
    expect(component.filteredCourthouses).toHaveLength(0);
  });

  it('filters and selects CJA', () => {
    component.cja = [...CJAS];

    component.cjaSearch = 'area two';
    component.onCjaInputChange();
    expect(component.filteredCja.map((c) => c.code)).toEqual(['C2']);

    const pick: CriminalJusticeAreaGetDto = {
      code: 'C9',
      description: 'Ninth',
    };
    component.selectCja(pick);
    expect(component.cjaSearch).toBe('C9 - Ninth');
    expect(component.form.controls.cja.value).toBe('C9');
    expect(component.filteredCja).toHaveLength(0);
  });

  it('rejects missing fields on create', () => {
    component.form.reset({
      date: null,
      time: null,
      description: '',
      status: 'choose',
      court: '',
      location: '',
      cja: '',
    });
    submit('create');
    expect(component.createInvalid).toBe(true);
    expect(component.unpopField.length).toBeGreaterThan(0);
    expect(component.errorHint).toBe('There is a problem');
    expect(appListsMock.createApplicationList).not.toHaveBeenCalled();
  });

  it('rejects conflicting court vs location/CJA', () => {
    component.form.setValue({
      date: '2025-10-01',
      time: { hours: 9, minutes: 30 },
      description: 'Desc',
      status: 'OPEN',
      court: 'A1',
      location: 'Somewhere',
      cja: '',
    });
    submit('create');
    expect(component.createInvalid).toBe(true);
    expect(component.errorHint).toBe(
      'You can not have Court and Other Location or CJA filled in',
    );
    expect(appListsMock.createApplicationList).not.toHaveBeenCalled();
  });

  it('submits successfully with court payload', () => {
    component.form.setValue({
      date: '2025-10-02',
      time: { hours: 8, minutes: 5 },
      description: 'Morning list',
      status: 'OPEN',
      court: 'A1',
      location: '',
      cja: '',
    });
    submit('create');
    expect(appListsMock.createApplicationList).toHaveBeenCalledTimes(1);
    const arg = (
      appListsMock.createApplicationList.mock.calls[0][0] as {
        applicationListCreateDto: ApplicationListCreateDto;
      }
    ).applicationListCreateDto;
    expect(arg).toEqual({
      date: '2025-10-02',
      time: '08:05:00',
      description: 'Morning list',
      status: ApplicationListStatus.OPEN,
      courtLocationCode: 'A1',
    });
    expect(component.createDone).toBe(true);
    expect(component.createInvalid).toBe(false);
  });

  it('submits successfully with other location + CJA payload', () => {
    component.form.setValue({
      date: '2025-10-03',
      time: { hours: 14, minutes: 0 },
      description: 'Afternoon list',
      status: 'OPEN',
      court: '',
      location: 'Somewhere',
      cja: 'C1',
    });
    submit('create');
    const arg = (
      appListsMock.createApplicationList.mock.calls.pop()![0] as {
        applicationListCreateDto: ApplicationListCreateDto;
      }
    ).applicationListCreateDto;
    expect(arg).toEqual({
      date: '2025-10-03',
      time: '14:00:00',
      description: 'Afternoon list',
      status: ApplicationListStatus.OPEN,
      otherLocationDescription: 'Somewhere',
      cjaCode: 'C1',
    });
  });

  it('handles API error and sets errorHint', () => {
    appListsMock.createApplicationList.mockReturnValueOnce(
      throwError(() => new Error('fail')),
    );
    component.form.setValue({
      date: '2025-10-04',
      time: { hours: 10, minutes: 10 },
      description: 'X',
      status: 'OPEN',
      court: 'A1',
      location: '',
      cja: '',
    });
    submit('create');
    expect(component.createDone).toBe(false);
    expect(component.createInvalid).toBe(true);
    expect(component.errorHint).toContain('There is a problem');
  });

  it('onDelete stores id', () => {
    type WithId = { _id: number | undefined };
    component.onDelete(42);
    expect((component as unknown as WithId)._id).toBe(42);
  });

  it('focusField scrolls and focuses when element exists and no-ops otherwise', () => {
    jest.useFakeTimers();

    // Arrange: create a REAL element so .matches/.querySelector exist
    const el = document.createElement('div');
    el.id = 'target-id';
    el.tabIndex = -1;
    document.body.appendChild(el);

    const scrollSpy = jest.spyOn(Element.prototype, 'scrollIntoView');
    const focusSpy = jest.spyOn(el, 'focus');

    const preventDefault = jest.fn();
    const ev = { preventDefault } as unknown as Event;

    component.focusField('target-id', ev);
    jest.runOnlyPendingTimers();

    // Assert: preventDefault called, scrolled and focused
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();

    // Now test the "no element" branch: remove the element and try again
    el.remove();
    scrollSpy.mockClear();
    focusSpy.mockClear();

    component.focusField('target-id', ev);
    jest.runOnlyPendingTimers();

    expect(scrollSpy).not.toHaveBeenCalled();
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('uses a 200 character limit on its text input(s)', () => {
    fixture.detectChanges();

    const textInputs = fixture.debugElement.queryAll(
      By.directive(TextInputComponent),
    );

    expect(textInputs.length).toBeGreaterThan(0);

    const with200Limit = textInputs.filter(
      (de) => de.componentInstance.charLimit === 200,
    );

    expect(with200Limit.length).toBeGreaterThan(0);
  });
});
