import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA, PLATFORM_ID, TransferState } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { jest } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { ApplicationsListCreate } from '@components/applications-list/applications-list-create/applications-list-create.component';
import { ApplicationsListCreateState } from '@components/applications-list/applications-list-create/util/applications-list-create.state';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  ApplicationListCreateDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';

// Reactive-forms warning disabled
let warnSpy: ReturnType<typeof jest.spyOn>;
beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => warnSpy.mockRestore());

const refFacadeStub: Pick<ReferenceDataFacade, 'courtLocations$' | 'cja$'> = {
  courtLocations$: of<CourtLocationGetSummaryDto[]>([
    { name: 'Alpha Court', locationCode: 'A1' } as CourtLocationGetSummaryDto,
    { name: 'Beta Court', locationCode: 'B2' } as CourtLocationGetSummaryDto,
  ]),
  cja$: of<CriminalJusticeAreaGetDto[]>([
    { code: 'C1', description: 'Area One' } as CriminalJusticeAreaGetDto,
    { code: 'C2', description: 'Area Two' } as CriminalJusticeAreaGetDto,
  ]),
};

describe('ApplicationsListCreate', () => {
  let fixture: ComponentFixture<ApplicationsListCreate>;
  let component: ApplicationsListCreate;

  const getState = (c: ApplicationsListCreate): ApplicationsListCreateState =>
    c.vm();

  const flushSignalEffects = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  // service mocks
  const appListsMock = {
    createApplicationList: jest.fn().mockReturnValue(of({ id: 123 })),
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
        { provide: ReferenceDataFacade, useValue: refFacadeStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideProvider(ApplicationListsApi, { useValue: appListsMock })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationsListCreate);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function submit(action: string) {
    const evt = {
      preventDefault: jest.fn(),
      submitter: { value: action } as HTMLButtonElement,
    } as unknown as SubmitEvent;
    component.onSubmit(evt);
    return evt;
  }

  it('calls reference data APIs on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (component as unknown as { state: () => { cja: unknown[] } }).state().cja
        .length,
    ).toBeGreaterThan(0);
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
    expect(getState(component).createInvalid).toBe(true);
    expect(getState(component).errorSummary.length).toBeGreaterThan(0);
    expect(getState(component).errorHint).toBe('There is a problem');
    expect(appListsMock.createApplicationList).not.toHaveBeenCalled();
  });

  it('submits successfully with court payload', async () => {
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

    await flushSignalEffects();

    expect(appListsMock.createApplicationList).toHaveBeenCalledTimes(1);
    const arg = (
      appListsMock.createApplicationList.mock.calls[0][0] as {
        applicationListCreateDto: ApplicationListCreateDto;
      }
    ).applicationListCreateDto;
    expect(arg).toEqual({
      date: '2025-10-02',
      time: '08:05',
      description: 'Morning list',
      status: ApplicationListStatus.OPEN,
      courtLocationCode: 'A1',
    });
    expect(getState(component).createInvalid).toBe(false);
  });

  it('submits successfully with other location + CJA payload', async () => {
    component.form.setValue({
      date: '2025-10-03',
      time: { hours: 14, minutes: 0 },
      description: 'Afternoon list',
      status: 'OPEN',
      court: '',
      location: 'Somewhere',
      cja: '', // start empty, like the real UI
    });

    // mimic user typing + selecting from suggestions
    component.setCjaSearch('C1');
    component.onCjaInputChange();
    component.selectCja({ code: 'C1', description: 'Area One' });

    (
      component as unknown as {
        patch: (p: { cja: { code: string; description: string }[] }) => void;
      }
    ).patch({
      cja: [
        { code: 'C1', description: 'Area One' },
        { code: 'C2', description: 'Area Two' },
      ],
    });

    submit('create');
    await flushSignalEffects();

    expect(appListsMock.createApplicationList).toHaveBeenCalledTimes(1);

    const last = appListsMock.createApplicationList.mock.calls.at(-1);
    expect(last).toBeDefined();

    const arg = (
      last![0] as { applicationListCreateDto: ApplicationListCreateDto }
    ).applicationListCreateDto;

    expect(arg).toEqual({
      date: '2025-10-03',
      time: '14:00',
      description: 'Afternoon list',
      status: ApplicationListStatus.OPEN,
      otherLocationDescription: 'Somewhere',
      cjaCode: 'C1',
    });
  });

  it('handles API error and sets errorHint', async () => {
    appListsMock.createApplicationList.mockReturnValueOnce(
      throwError(
        () => new HttpErrorResponse({ status: 500, statusText: 'boom' }),
      ),
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

    await flushSignalEffects();

    expect(getState(component).createInvalid).toBe(true);
    expect(getState(component).errorHint).toContain('There is a problem');
  });

  it('onCreateErrorClick scrolls and focuses when element exists and no-ops otherwise', () => {
    jest.useFakeTimers();

    // Arrange: element exists
    const el = document.createElement('div');
    el.id = 'target-id';
    el.tabIndex = 0; // makes it focusable and matches selector
    const scrollMock = jest.fn();
    const focusMock = jest.fn();

    // jsdom doesn't implement scrollIntoView; provide it
    (
      el as unknown as { scrollIntoView: (arg?: unknown) => void }
    ).scrollIntoView = scrollMock;
    (el as unknown as { focus: (arg?: unknown) => void }).focus = focusMock;

    document.body.appendChild(el);

    component.onCreateErrorClick({ text: 'Bad field', href: '#target-id' });

    jest.advanceTimersByTime(60);

    expect(scrollMock).toHaveBeenCalled();
    expect(focusMock).toHaveBeenCalled();

    el.remove();
    scrollMock.mockClear();
    focusMock.mockClear();

    component.onCreateErrorClick({ text: 'Bad field', href: '#target-id' });
    jest.advanceTimersByTime(60);
    expect(scrollMock).not.toHaveBeenCalled();
    expect(focusMock).not.toHaveBeenCalled();

    component.onCreateErrorClick({ text: 'Bad field', href: '#' });
    component.onCreateErrorClick({ text: 'Bad field', href: '   ' });
    component.onCreateErrorClick({ text: 'Bad field' });
    jest.advanceTimersByTime(60);
    expect(scrollMock).not.toHaveBeenCalled();
    expect(focusMock).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('uses a 200 character limit on its text input(s)', () => {
    fixture.detectChanges();

    const textInputs = fixture.debugElement.queryAll(
      By.directive(TextInputComponent),
    );

    expect(textInputs.length).toBeGreaterThan(0);

    const with200Limit = textInputs.filter(
      (de) => de.componentInstance.charLimit?.() === 200,
    );

    expect(with200Limit.length).toBeGreaterThan(0);
  });
});
