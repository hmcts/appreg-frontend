import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardApplicantDetailComponent } from './standard-applicant-detail.component';

describe('StandardApplicantDetailComponent', () => {
  let component: StandardApplicantDetailComponent;
  let fixture: ComponentFixture<StandardApplicantDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardApplicantDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StandardApplicantDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
