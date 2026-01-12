import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardApplicants } from '@components/standard-applicants/standard-applicants';

describe('StandardApplicantsComponent', () => {
  let component: StandardApplicants;
  let fixture: ComponentFixture<StandardApplicants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardApplicants],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicants);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
