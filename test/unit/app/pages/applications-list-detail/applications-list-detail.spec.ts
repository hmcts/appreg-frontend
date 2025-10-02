import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListDetail } from '../../../../../src/app/pages/applications-list-detail/applications-list-detail';

describe('ApplicationDetailComponent', () => {
  let component: ApplicationsListDetail;
  let fixture: ComponentFixture<ApplicationsListDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
