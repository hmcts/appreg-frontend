import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListEntryDeleteComponent } from '@components/applications-list-detail/applications-list-entry-delete/applications-list-entry-delete.component';

describe('ApplicationsListEntryDeleteComponent', () => {
  let component: ApplicationsListEntryDeleteComponent;
  let fixture: ComponentFixture<ApplicationsListEntryDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryDeleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
