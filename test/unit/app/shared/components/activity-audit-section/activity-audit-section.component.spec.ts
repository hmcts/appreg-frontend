import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityAuditSectionComponent } from '../../../../../../src/app/shared/components/activity-audit-section/activity-audit-section.component';

// TODO: we need form to be passed in

describe('ActivityAuditSectionComponent', () => {
  let component: ActivityAuditSectionComponent;
  let fixture: ComponentFixture<ActivityAuditSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityAuditSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityAuditSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});