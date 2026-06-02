import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListDetailBulkUpdateFeesComponent } from '@components/applications-list-detail/applications-list-detail-bulk-update-fees/applications-list-detail-bulk-update-fees.component';

describe('ApplicationsListDetailBulkUpdateFeesComponent', () => {
  let component: ApplicationsListDetailBulkUpdateFeesComponent;
  let fixture: ComponentFixture<ApplicationsListDetailBulkUpdateFeesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetailBulkUpdateFeesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ApplicationsListDetailBulkUpdateFeesComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
