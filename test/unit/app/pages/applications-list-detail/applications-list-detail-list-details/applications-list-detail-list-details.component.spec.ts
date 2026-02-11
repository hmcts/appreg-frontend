import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListDetailListDetailsComponent } from '@components/applications-list-detail/applications-list-detail-list-details/applications-list-detail-list-details.component';

describe('ApplicationsListDetailListDetailsComponent', () => {
  let component: ApplicationsListDetailListDetailsComponent;
  let fixture: ComponentFixture<ApplicationsListDetailListDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetailListDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ApplicationsListDetailListDetailsComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
