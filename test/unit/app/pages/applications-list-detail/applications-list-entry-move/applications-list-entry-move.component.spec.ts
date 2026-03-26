import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';

import { ApplicationsListEntryMoveComponent } from '@components/applications-list-detail/applications-list-entry-move/applications-list-entry-move.component';
import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ApplicationListsApi } from '@openapi';
import { ApplicationListRow } from '@util/types/application-list/types';

describe('ApplicationsListEntryMoveComponent', () => {
  let component: ApplicationsListEntryMoveComponent;
  let fixture: ComponentFixture<ApplicationsListEntryMoveComponent>;
  let router: Router;
  let historyStateSpy: jest.SpyInstance;

  const entriesToMove: ApplicationEntriesResultContext[] = [
    {
      id: 'entry-1',
      sequenceNumber: '1',
      applicant: 'A Applicant',
      respondent: 'R Respondent',
      title: 'Case title',
    },
  ];

  const routeStub: Partial<ActivatedRoute> = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'source-list-id' }),
    } as ActivatedRoute['snapshot'],
  };

  const apiStub: jest.Mocked<Pick<ApplicationListsApi, 'getApplicationLists'>> =
    {
      getApplicationLists: jest.fn().mockReturnValue(of({ content: [] })),
    };

  beforeEach(async () => {
    historyStateSpy = jest
      .spyOn(globalThis.history, 'state', 'get')
      .mockReturnValue({ entriesToMove });

    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryMoveComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: ApplicationListsApi, useValue: apiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryMoveComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  afterEach(() => {
    historyStateSpy?.mockRestore();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to move confirm with selected target list state', () => {
    const navigateSpy = jest
      .spyOn(router, 'navigate')
      .mockResolvedValue(true as never);
    const targetList: ApplicationListRow = {
      id: 'target-list-id',
      date: '2026-03-26',
      time: '10:00',
      location: 'Court 1',
      description: 'Target list',
      entries: 2,
      status: 'OPEN',
      deletable: true,
      etag: null,
      rowVersion: null,
    };

    component.onSelect(targetList);

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/applications-list', 'source-list-id', 'move', 'confirm'],
      {
        state: {
          entriesToMove,
          targetList,
        },
      },
    );
  });
});
