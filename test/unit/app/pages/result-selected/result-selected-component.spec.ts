import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { ResultSelected } from './../../../../../src/app/pages/result-selected/result-selected';

import { Row } from '@components/selectable-sortable-table/selectable-sortable-table.component';

describe('ResultSelectedComponent', () => {
  let component: ResultSelected;
  let fixture: ComponentFixture<ResultSelected>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({
        id: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
      }),
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultSelected],
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultSelected);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should set rows and mixed flag from history.state when present', () => {
    const sampleRows = [
      { id: 'r1', name: 'Alice' },
      { id: 'r2', name: 'Bob' },
    ] as Row[];

    history.replaceState(
      {
        resultingApplications: sampleRows,
        mixedResultedAndUnresultedApplications: true,
      },
      '',
    );

    component.ngOnInit();

    expect(component.listId).toBe('73d0276f-42a3-4150-b2fd-d9b2d56b359c');
    expect(component.rows).toEqual(sampleRows);
    expect(component.mixedResultedAndUnresultedApplications).toBeTruthy();
  });
});
