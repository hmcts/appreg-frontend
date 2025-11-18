import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkloadSectionComponent } from '../../../../../../src/app/shared/components/workload-section/workload-section.component';

describe('WorkloadSectionComponent', () => {
  let component: WorkloadSectionComponent;
  let fixture: ComponentFixture<WorkloadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkloadSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkloadSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});