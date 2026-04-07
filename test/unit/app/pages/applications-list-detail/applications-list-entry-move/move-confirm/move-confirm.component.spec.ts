import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MoveConfirmComponent } from '@components/applications-list-detail/applications-list-entry-move/move-confirm/move-confirm.component';
import { ApplicationListEntriesApi, ApplicationListStatus } from '@openapi';
import { ApplicationListRow } from '@util/types/application-list/types';

describe('MoveConfirmComponent', () => {
  let component: MoveConfirmComponent;
  let fixture: ComponentFixture<MoveConfirmComponent>;
  let router: Router;

  const routerStub = {
    navigate: jest.fn().mockResolvedValue(true),
  };

  const routeStub: {
    snapshot: {
      paramMap: {
        get: () => string | null;
      };
    };
  } = {
    snapshot: {
      paramMap: {
        get: () => '10',
      },
    },
  };

  const targetList: ApplicationListRow = {
    id: '20',
    date: '2025-10-02',
    time: '08:05',
    location: 'Alpha Court',
    description: 'Morning list',
    entries: 0,
    status: ApplicationListStatus.OPEN,
    deletable: true,
    etag: null,
    rowVersion: null,
  };

  const entriesToMove = [
    {
      id: 'entry-1',
      sequenceNumber: '1',
      applicant: 'A Person',
      respondent: 'B Person',
      title: 'Case title',
    },
    {
      id: 'entry-1',
      sequenceNumber: '1',
      applicant: 'A Person',
      respondent: 'B Person',
      title: 'Case title',
    },
  ];

  const locationStub: {
    getState: () => {
      targetList?: ApplicationListRow;
      entriesToMove?: typeof entriesToMove;
    };
  } = {
    getState: () => ({
      targetList,
      entriesToMove,
    }),
  };

  const moveApplicationListEntriesMock = jest.fn();

  const apiStub: Pick<ApplicationListEntriesApi, 'moveApplicationListEntries'> =
    {
      moveApplicationListEntries:
        moveApplicationListEntriesMock as unknown as ApplicationListEntriesApi['moveApplicationListEntries'],
    };

  const createComponent = async ({
    listId = '10',
    navState = { targetList, entriesToMove },
  }: {
    listId?: string | null;
    navState?: {
      targetList?: ApplicationListRow;
      entriesToMove?: typeof entriesToMove;
    };
  } = {}): Promise<void> => {
    routeStub.snapshot.paramMap.get = () => listId;
    locationStub.getState = () => navState;

    fixture = TestBed.createComponent(MoveConfirmComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    moveApplicationListEntriesMock.mockReset();
    moveApplicationListEntriesMock.mockReturnValue(of({}));
    routerStub.navigate.mockReset();
    routerStub.navigate.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [MoveConfirmComponent],
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Location, useValue: locationStub },
        { provide: ApplicationListEntriesApi, useValue: apiStub },
      ],
    }).compileComponents();

    await createComponent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('creates with route and navigation state', () => {
    expect(component).toBeTruthy();
    expect(component.originalListId).toBe('10');
    expect(component.targetList).toEqual(targetList);
    expect(component.entriesToMove).toEqual(entriesToMove);
  });

  it('posts the move request and navigates to the target list on success', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onConfirm();

    expect(moveApplicationListEntriesMock).toHaveBeenCalledWith({
      listId: '10',
      moveEntriesDto: {
        targetListId: '20',
        entryIds: ['entry-1'],
      },
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/applications-list', '20'], {
      queryParams: { moveEntriesSuccessful: true },
    });
  });

  it('deduplicates entry ids before posting the move request', () => {
    component.entriesToMove = [
      ...entriesToMove,
      {
        id: 'entry-2',
        sequenceNumber: '2',
        applicant: 'C Person',
        respondent: 'D Person',
        title: 'Another case',
      },
      {
        id: 'entry-2',
        sequenceNumber: '2',
        applicant: 'C Person',
        respondent: 'D Person',
        title: 'Another case',
      },
    ];

    component.onConfirm();

    const request = moveApplicationListEntriesMock.mock.calls[0]?.[0] as {
      listId: string;
      moveEntriesDto: {
        targetListId: string;
        entryIds: string[];
      };
    };

    expect(request.moveEntriesDto.entryIds).toEqual(['entry-1', 'entry-2']);
    expect(new Set(request.moveEntriesDto.entryIds).size).toBe(
      request.moveEntriesDto.entryIds.length,
    );
  });

  it('navigates back to the source list with an error when the move API fails', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    moveApplicationListEntriesMock.mockReturnValueOnce(
      throwError(
        () => new HttpErrorResponse({ status: 500, statusText: 'boom' }),
      ),
    );

    component.onConfirm();

    expect(navigateSpy).toHaveBeenCalledWith(['/applications-list', '10'], {
      queryParams: {
        move: 'error',
      },
      state: {
        moveError: 'Http failure response for (unknown url): 500 boom',
      },
    });
  });

  it('goes back instead of posting when the move context is incomplete', async () => {
    const goBackSpy = jest.spyOn(MoveConfirmComponent.prototype, 'goBack');

    await createComponent({
      navState: { entriesToMove: [] },
    });

    component.onConfirm();

    expect(moveApplicationListEntriesMock).not.toHaveBeenCalled();
    expect(goBackSpy).toHaveBeenCalled();
  });

  it('redirects back during init when the route id is missing', async () => {
    const navigateSpy = jest
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    await createComponent({ listId: null });

    expect(navigateSpy).toHaveBeenCalledWith(['/applications-list']);
  });

  it('goes back to the move page when a source list id exists', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.goBack();

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/applications-list', '10', 'move'],
      {
        state: {
          entriesToMove,
        },
      },
    );
  });

  it('goes back to the applications list when no source list id exists', async () => {
    const navigateSpy = jest
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    await createComponent({ listId: null });
    navigateSpy.mockClear();

    component.goBack();

    expect(navigateSpy).toHaveBeenCalledWith(['/applications-list']);
  });
});
