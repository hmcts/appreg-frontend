import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MoveConfirmComponent } from '@components/applications-list-detail/applications-list-entry-move/move-confirm/move-confirm.component';
import {
  ApplicationListEntriesApi,
  ApplicationListStatus,
} from '@openapi';

describe('MoveConfirmComponent', () => {
  let component: MoveConfirmComponent;
  let fixture: ComponentFixture<MoveConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveConfirmComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '10',
              },
            },
          },
        },
        {
          provide: Location,
          useValue: {
            getState: () => ({
              targetList: {
                id: 20,
                date: '2025-10-02',
                time: '08:05',
                location: 'Alpha Court',
                description: 'Morning list',
                entries: 0,
                status: ApplicationListStatus.OPEN,
              },
              entriesToMove: [
                {
                  id: 'entry-1',
                  sequenceNumber: '1',
                  applicant: 'A Person',
                  respondent: 'B Person',
                  title: 'Case title',
                },
              ],
            }),
          },
        },
        {
          provide: ApplicationListEntriesApi,
          useValue: {
            moveApplicationListEntries: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
