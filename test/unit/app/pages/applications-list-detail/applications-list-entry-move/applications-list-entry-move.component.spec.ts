import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListEntryMoveComponent } from '../../../../../../src/app/pages/applications-list-detail/applications-list-entry-move/applications-list-entry-move.component';

describe('ApplicationsListEntryMoveComponent', () => {
  let component: ApplicationsListEntryMoveComponent;
  let fixture: ComponentFixture<ApplicationsListEntryMoveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryMoveComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryMoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
