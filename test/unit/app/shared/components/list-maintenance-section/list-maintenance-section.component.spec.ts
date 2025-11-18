import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMaintenanceSectionComponent } from '../../../../../../src/app/shared/components/list-maintenance-section/list-maintenance-section.component';

describe('ListMaintenanceSectionComponent', () => {
  let component: ListMaintenanceSectionComponent;
  let fixture: ComponentFixture<ListMaintenanceSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListMaintenanceSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListMaintenanceSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});