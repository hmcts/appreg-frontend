import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';

import { ApplicationsListPreview } from '@components/applications-list/applications-list-preview/applications-list-preview.component';
import {
  ApplicationListGetDetailDto,
  ApplicationListGetPrintDto,
  ApplicationListStatus,
  ApplicationListsApi,
} from '@openapi';
import { PdfService } from '@services/pdf.service';

describe('ApplicationsListPreview', () => {
  const listId = '00000000-0000-0000-0000-000000000001';
  let fixture: ComponentFixture<ApplicationsListPreview>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let api: {
    getApplicationList: jest.Mock;
    printApplicationLists: jest.Mock;
  };
  let pdf: { previewContinuousApplicationLists: jest.Mock };
  const list = {
    description: 'Historical applications',
    status: ApplicationListStatus.CLOSED,
  } as ApplicationListGetDetailDto;
  const dtos = [{ entries: [{}] }] as ApplicationListGetPrintDto[];

  const create = (platformId = 'browser') => {
    TestBed.configureTestingModule({
      imports: [ApplicationsListPreview],
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: ApplicationListsApi, useValue: api },
        { provide: PdfService, useValue: pdf },
      ],
    });
    fixture = TestBed.createComponent(ApplicationsListPreview);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
  };

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ id: listId }));
    api = {
      getApplicationList: jest.fn().mockReturnValue(of(list)),
      printApplicationLists: jest.fn().mockReturnValue(of(dtos)),
    };
    pdf = { previewContinuousApplicationLists: jest.fn() };
  });

  it.each([ApplicationListStatus.OPEN, ApplicationListStatus.CLOSED])(
    'loads %s list metadata and report data from the URL without opener state',
    (status) => {
      api.getApplicationList.mockReturnValue(of({ ...list, status }));
      create();
      expect(api.getApplicationList).toHaveBeenCalledWith(
        { listId },
        'body',
        false,
        { transferCache: false },
      );
      expect(api.printApplicationLists).toHaveBeenCalledWith(
        { bulkGetApplicationListEntriesRequestDto: { listIds: [listId] } },
        undefined,
        undefined,
        { transferCache: false },
      );
      expect(pdf.previewContinuousApplicationLists).toHaveBeenCalledWith(
        dtos,
        status === ApplicationListStatus.CLOSED,
        document,
        list.description,
        fixture.nativeElement.querySelector('div'),
      );
      expect(document.title).toBe('Application List - Historical applications');
      expect(
        fixture.nativeElement.querySelector('[role="status"]').textContent,
      ).toBe('');
      expect(
        fixture.nativeElement.querySelector('[role="status"]').hidden,
      ).toBe(true);
    },
  );

  it('keeps loading visible until both responses arrive', () => {
    const response = new Subject<ApplicationListGetPrintDto[]>();
    api.printApplicationLists.mockReturnValue(response);
    create();
    expect(fixture.nativeElement.textContent).toContain('Loading preview…');
    expect(pdf.previewContinuousApplicationLists).not.toHaveBeenCalled();
    response.next(dtos);
    response.complete();
    fixture.detectChanges();
    expect(pdf.previewContinuousApplicationLists).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).not.toContain('Loading preview…');
  });

  it('shows an empty report message and the AL title', () => {
    api.printApplicationLists.mockReturnValue(of([{ entries: [] }]));
    create();
    expect(fixture.nativeElement.textContent).toContain(
      'No entries available to print',
    );
    expect(document.title).toBe('Application List - Historical applications');
    expect(pdf.previewContinuousApplicationLists).not.toHaveBeenCalled();
  });

  it.each(['getApplicationList', 'printApplicationLists'] as const)(
    'handles %s failures without rendering a partial preview',
    (method) => {
      api[method].mockReturnValue(throwError(() => new Error('Unavailable')));
      create();
      expect(fixture.nativeElement.textContent).toContain(
        'Unable to load preview.',
      );
      expect(pdf.previewContinuousApplicationLists).not.toHaveBeenCalled();
    },
  );

  it('handles a missing list ID without making requests', () => {
    params.next(convertToParamMap({}));
    create();
    expect(fixture.nativeElement.textContent).toContain(
      'No application list specified.',
    );
    expect(api.getApplicationList).not.toHaveBeenCalled();
    expect(api.printApplicationLists).not.toHaveBeenCalled();
  });

  it('loads again on refresh without state from the original window', () => {
    create();
    fixture.destroy();
    fixture = TestBed.createComponent(ApplicationsListPreview);
    fixture.detectChanges();
    TestBed.tick();
    expect(api.printApplicationLists).toHaveBeenCalledTimes(2);
    expect(pdf.previewContinuousApplicationLists).toHaveBeenCalledTimes(2);
  });

  it('reloads when the route ID changes and recovers after errors', () => {
    api.printApplicationLists.mockReturnValueOnce(
      throwError(() => new Error('Unavailable')),
    );
    create();
    params.next(
      convertToParamMap({ id: '00000000-0000-0000-0000-000000000002' }),
    );
    fixture.detectChanges();
    expect(api.printApplicationLists).toHaveBeenCalledTimes(2);
    expect(pdf.previewContinuousApplicationLists).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).not.toContain(
      'Unable to load preview.',
    );
  });

  it('cancels requests when the component is destroyed', () => {
    const response = new Subject<ApplicationListGetPrintDto[]>();
    api.printApplicationLists.mockReturnValue(response);
    create();
    fixture.destroy();
    response.next(dtos);
    response.complete();
    expect(pdf.previewContinuousApplicationLists).not.toHaveBeenCalled();
  });

  it('uses a fallback title when the description is blank', () => {
    api.getApplicationList.mockReturnValue(of({ ...list, description: ' ' }));
    api.printApplicationLists.mockReturnValue(of([{ entries: [] }]));
    create();
    expect(document.title).toBe('Application List - Preview print cont');
  });
});
